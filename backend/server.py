from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import base64
import cv2
import numpy as np
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from twilio.rest import Client
import exifread
from geopy.geocoders import Nominatim
from PIL import Image
import io
import aiohttp

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client_mongo = AsyncIOMotorClient(mongo_url)
db = client_mongo[os.environ['DB_NAME']]

# Twilio setup
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')

if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
else:
    twilio_client = None

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class EmergencyContact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    role: str  # police, ambulance, fire
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    role: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None

class EmergencyContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None

class AnalysisRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_name: str
    severity: str  # normal, mild, severe
    analysis_details: str
    collision_condition: str = ""
    gps_coordinates: Optional[Dict[str, float]] = None
    location_address: Optional[str] = None
    gps_source: str = "auto"  # auto, manual, none
    traffic_info: Optional[Dict] = None
    eta_info: Optional[Dict] = None
    alerts_sent: List[str] = []
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ManualGPSUpdate(BaseModel):
    analysis_id: str
    latitude: float
    longitude: float

class AlertRequest(BaseModel):
    analysis_id: str
    severity: str

# Helper functions
def extract_gps_from_video(video_bytes: bytes) -> Optional[Dict]:
    """Extract GPS coordinates from video metadata or frame EXIF data"""
    try:
        # Save video temporarily to extract first frame
        temp_file = f"/tmp/{uuid.uuid4()}.mp4"
        with open(temp_file, 'wb') as f:
            f.write(video_bytes)
        
        # Extract first frame
        cap = cv2.VideoCapture(temp_file)
        ret, frame = cap.read()
        cap.release()
        
        if ret:
            # Convert frame to JPEG for EXIF reading
            _, buffer = cv2.imencode('.jpg', frame)
            image_bytes = io.BytesIO(buffer.tobytes())
            
            # Try to read EXIF data
            tags = exifread.process_file(image_bytes)
            
            # Look for GPS coordinates
            gps_latitude = tags.get('GPS GPSLatitude')
            gps_latitude_ref = tags.get('GPS GPSLatitudeRef')
            gps_longitude = tags.get('GPS GPSLongitude')
            gps_longitude_ref = tags.get('GPS GPSLongitudeRef')
            
            if gps_latitude and gps_longitude:
                # Convert GPS coordinates to decimal format
                lat = convert_to_degrees(gps_latitude)
                if gps_latitude_ref and str(gps_latitude_ref) == 'S':
                    lat = -lat
                    
                lon = convert_to_degrees(gps_longitude)
                if gps_longitude_ref and str(gps_longitude_ref) == 'W':
                    lon = -lon
                
                os.remove(temp_file)
                return {'latitude': lat, 'longitude': lon}
        
        os.remove(temp_file)
        return None
    except Exception as e:
        logging.warning(f"Could not extract GPS from video: {str(e)}")
        return None

def convert_to_degrees(value):
    """Convert GPS coordinates to degrees in float format"""
    try:
        d = float(value.values[0].num) / float(value.values[0].den)
        m = float(value.values[1].num) / float(value.values[1].den)
        s = float(value.values[2].num) / float(value.values[2].den)
        return d + (m / 60.0) + (s / 3600.0)
    except:
        return 0

def get_address_from_gps(latitude: float, longitude: float) -> Optional[str]:
    """Get human-readable address from GPS coordinates"""
    try:
        geolocator = Nominatim(user_agent="collision_analysis")
        location = geolocator.reverse(f"{latitude}, {longitude}", timeout=5)
        return location.address if location else None
    except Exception as e:
        logging.warning(f"Could not get address from GPS: {str(e)}")
        return None

async def get_traffic_info(latitude: float, longitude: float) -> Optional[Dict]:
    """Get real-time traffic information for location using OpenStreetMap"""
    try:
        # Use Overpass API to get nearby roads and traffic info
        overpass_url = "https://overpass-api.de/api/interpreter"
        
        # Query for roads within 100m radius
        query = f"""
        [out:json];
        (
          way["highway"](around:100,{latitude},{longitude});
        );
        out body;
        >;
        out skel qt;
        """
        
        async with aiohttp.ClientSession() as session:
            async with session.post(overpass_url, data={"data": query}, timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if data.get('elements'):
                        roads = [elem for elem in data['elements'] if elem.get('type') == 'way']
                        
                        traffic_info = {
                            "nearby_roads": len(roads),
                            "road_types": [],
                            "status": "Data retrieved",
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }
                        
                        # Extract road types
                        for road in roads[:5]:  # Limit to 5 roads
                            tags = road.get('tags', {})
                            road_type = tags.get('highway', 'unknown')
                            road_name = tags.get('name', 'Unnamed')
                            traffic_info["road_types"].append({
                                "name": road_name,
                                "type": road_type,
                                "max_speed": tags.get('maxspeed', 'N/A')
                            })
                        
                        return traffic_info
        
        return {
            "status": "No traffic data available",
            "nearby_roads": 0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logging.warning(f"Could not fetch traffic info: {str(e)}")
        return {
            "status": "Traffic data unavailable",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

async def calculate_eta(from_lat: float, from_lon: float, to_lat: float, to_lon: float, service_type: str = "car") -> Optional[Dict]:
    """Calculate ETA from emergency responder location to collision site using OSRM"""
    try:
        # OSRM routing API (free, open-source)
        osrm_url = f"https://router.project-osrm.org/route/v1/driving/{from_lon},{from_lat};{to_lon},{to_lat}"
        
        params = {
            "overview": "false",
            "steps": "false"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(osrm_url, params=params, timeout=aiohttp.ClientTimeout(total=5)) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if data.get('code') == 'Ok' and data.get('routes'):
                        route = data['routes'][0]
                        
                        distance_km = route['distance'] / 1000  # Convert meters to km
                        duration_sec = route['duration']
                        duration_min = int(duration_sec / 60)
                        
                        # Add emergency vehicle speed bonus (typically 1.3-1.5x faster)
                        emergency_duration_min = int(duration_min / 1.4)
                        
                        return {
                            "distance_km": round(distance_km, 2),
                            "duration_minutes": duration_min,
                            "emergency_duration_minutes": emergency_duration_min,
                            "status": "calculated",
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }
        
        return {
            "status": "Route not found",
            "distance_km": None,
            "duration_minutes": None,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logging.warning(f"Could not calculate ETA: {str(e)}")
        return {
            "status": "ETA calculation unavailable",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

async def calculate_all_etas(collision_lat: float, collision_lon: float, contacts: List[Dict]) -> Dict:
    """Calculate ETAs for all emergency contacts with location data"""
    eta_results = {}
    
    for contact in contacts:
        if contact.get('latitude') and contact.get('longitude'):
            eta_data = await calculate_eta(
                contact['latitude'],
                contact['longitude'],
                collision_lat,
                collision_lon
            )
            
            eta_results[contact['id']] = {
                "contact_name": contact['name'],
                "role": contact['role'],
                "eta_minutes": eta_data.get('emergency_duration_minutes', eta_data.get('duration_minutes')),
                "distance_km": eta_data.get('distance_km'),
                "status": eta_data.get('status')
            }
    
    return eta_results

def extract_frame_from_video(video_bytes: bytes) -> str:
    """Extract a frame from video and convert to base64"""
    try:
        nparr = np.frombuffer(video_bytes, np.uint8)
        temp_file = f"/tmp/{uuid.uuid4()}.mp4"
        with open(temp_file, 'wb') as f:
            f.write(video_bytes)
        
        cap = cv2.VideoCapture(temp_file)
        
        # Get middle frame
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        middle_frame = total_frames // 2
        cap.set(cv2.CAP_PROP_POS_FRAMES, middle_frame)
        
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            # Fallback to first frame
            cap = cv2.VideoCapture(temp_file)
            ret, frame = cap.read()
            cap.release()
        
        os.remove(temp_file)
        
        if ret:
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')
            return frame_base64
        else:
            raise Exception("Could not extract frame from video")
    except Exception as e:
        logging.error(f"Error extracting frame: {str(e)}")
        raise

async def analyze_collision(frame_base64: str) -> dict:
    """Analyze collision severity using OpenAI vision"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY', '')
        if not api_key:
            raise Exception("EMERGENT_LLM_KEY not found")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message="You are an expert collision analysis AI. Analyze vehicle collision videos and classify them into three categories: NORMAL (minor contact, no visible damage), MILD (moderate impact, some visible damage, low-speed collision), or SEVERE (high-speed collision, significant damage, potential injuries). Provide detailed collision condition analysis."
        ).with_model("openai", "gpt-5.2")
        
        image_content = ImageContent(image_base64=frame_base64)
        
        user_message = UserMessage(
            text="Analyze this collision scene. Provide:\n1. SEVERITY: Classify as NORMAL, MILD, or SEVERE\n2. CONDITION: Detailed description of the collision (vehicle damage, impact point, estimated speed, visible injuries, environmental factors)\n3. ANALYSIS: Brief 2-3 sentence summary\n\nFormat your response as:\nSEVERITY: [classification]\nCONDITION: [detailed condition]\nANALYSIS: [summary]",
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse response
        lines = response.strip().split('\n')
        severity = "unknown"
        condition = ""
        analysis = response
        
        for i, line in enumerate(lines):
            if line.startswith('SEVERITY:'):
                severity_text = line.replace('SEVERITY:', '').strip().lower()
                if 'normal' in severity_text:
                    severity = 'normal'
                elif 'mild' in severity_text:
                    severity = 'mild'
                elif 'severe' in severity_text:
                    severity = 'severe'
            elif line.startswith('CONDITION:'):
                # Get condition (may span multiple lines)
                condition = line.replace('CONDITION:', '').strip()
                # Check next lines if they don't start with ANALYSIS
                for j in range(i+1, len(lines)):
                    if not lines[j].startswith('ANALYSIS:'):
                        condition += " " + lines[j].strip()
                    else:
                        break
            elif line.startswith('ANALYSIS:'):
                analysis = line.replace('ANALYSIS:', '').strip()
        
        return {
            'severity': severity,
            'condition': condition or analysis,
            'analysis': analysis,
            'raw_response': response
        }
    except Exception as e:
        logging.error(f"Error in collision analysis: {str(e)}")
        raise

async def send_sms_alert(phone: str, message: str) -> bool:
    """Send SMS alert via Twilio"""
    try:
        if not twilio_client or not TWILIO_PHONE_NUMBER:
            logging.warning("Twilio not configured, skipping SMS")
            return False
        
        message_obj = twilio_client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=phone
        )
        logging.info(f"SMS sent to {phone}: {message_obj.sid}")
        return True
    except Exception as e:
        logging.error(f"Error sending SMS to {phone}: {str(e)}")
        return False

# Routes
@api_router.get("/")
async def root():
    return {"message": "Collision Analysis API"}

@api_router.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    """Analyze uploaded video for collision severity"""
    try:
        video_bytes = await file.read()
        
        # Extract GPS coordinates from video
        gps_data = extract_gps_from_video(video_bytes)
        location_address = None
        traffic_info = None
        gps_source = "none"
        
        if gps_data:
            logging.info(f"GPS found: {gps_data}")
            gps_source = "auto"
            # Get human-readable address
            location_address = get_address_from_gps(
                gps_data['latitude'], 
                gps_data['longitude']
            )
            # Get traffic information
            traffic_info = await get_traffic_info(
                gps_data['latitude'],
                gps_data['longitude']
            )
        
        # Extract frame
        frame_base64 = extract_frame_from_video(video_bytes)
        
        # Analyze with AI
        analysis_result = await analyze_collision(frame_base64)
        
        # Save to database
        record = AnalysisRecord(
            video_name=file.filename,
            severity=analysis_result['severity'],
            analysis_details=analysis_result['analysis'],
            collision_condition=analysis_result['condition'],
            gps_coordinates=gps_data,
            location_address=location_address,
            gps_source=gps_source,
            traffic_info=traffic_info
        )
        
        doc = record.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        doc['created_at'] = doc.get('created_at', doc['timestamp'])
        
        await db.analyses.insert_one(doc)
        
        # Automatically send alerts based on severity
        severity = analysis_result['severity'].lower()
        contacts = await db.contacts.find({}, {"_id": 0}).to_list(100)
        
        # Calculate ETAs if GPS is available
        eta_info = None
        if gps_data:
            eta_info = await calculate_all_etas(
                gps_data['latitude'],
                gps_data['longitude'],
                contacts
            )
        
        alerts_sent = []
        roles_to_alert = []
        
        if severity == 'normal':
            roles_to_alert = ['police']
        elif severity == 'mild':
            roles_to_alert = ['police', 'ambulance']
        elif severity == 'severe':
            roles_to_alert = ['police', 'ambulance', 'fire']
        
        # Build SMS message with GPS and condition
        gps_text = ""
        if gps_data:
            gps_text = f"\nGPS: {gps_data['latitude']:.6f}, {gps_data['longitude']:.6f}"
            if location_address:
                gps_text += f"\nLocation: {location_address}"
            if traffic_info and traffic_info.get('nearby_roads', 0) > 0:
                gps_text += f"\nTraffic: {traffic_info['nearby_roads']} nearby roads detected"
        else:
            gps_text = "\nGPS: Not available (manual override available)"
        
        condition_text = f"\nCondition: {analysis_result['condition'][:150]}"
        
        # Send SMS to appropriate contacts
        for contact in contacts:
            if contact['role'] in roles_to_alert:
                message = f"🚨 COLLISION ALERT - {severity.upper()}\n"
                message += f"Video: {file.filename}"
                message += gps_text
                
                # Add ETA if available
                if eta_info and contact['id'] in eta_info:
                    eta_data = eta_info[contact['id']]
                    if eta_data.get('eta_minutes'):
                        message += f"\n⏱️ ETA: {eta_data['eta_minutes']} min ({eta_data.get('distance_km', 0):.1f} km)"
                
                message += condition_text
                message += f"\nContact: {contact['name']} ({contact['role']})"
                message += "\n⚠️ IMMEDIATE RESPONSE REQUIRED"
                
                success = await send_sms_alert(contact['phone'], message)
                if success:
                    alerts_sent.append(f"{contact['name']} ({contact['role']})")
        
        # Update analysis record with alerts sent and ETA
        await db.analyses.update_one(
            {'id': record.id},
            {'$set': {'alerts_sent': alerts_sent, 'eta_info': eta_info}}
        )
        
        return {
            'id': record.id,
            'severity': record.severity,
            'analysis': analysis_result['analysis'],
            'condition': analysis_result['condition'],
            'video_name': file.filename,
            'gps_coordinates': gps_data,
            'location_address': location_address,
            'gps_source': gps_source,
            'traffic_info': traffic_info,
            'timestamp': record.timestamp.isoformat(),
            'alerts_sent': alerts_sent
        }
    except Exception as e:
        logging.error(f"Error analyzing video: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/send-alerts")
async def send_alerts(request: AlertRequest):
    """Send alerts based on severity"""
    try:
        severity = request.severity.lower()
        
        # Get contacts
        contacts = await db.contacts.find({}, {"_id": 0}).to_list(100)
        
        alerts_sent = []
        
        # Determine which contacts to alert
        roles_to_alert = []
        if severity == 'normal':
            roles_to_alert = ['police']
        elif severity == 'mild':
            roles_to_alert = ['police', 'ambulance']
        elif severity == 'severe':
            roles_to_alert = ['police', 'ambulance', 'fire']
        
        # Send SMS to appropriate contacts
        for contact in contacts:
            if contact['role'] in roles_to_alert:
                message = f"COLLISION ALERT - {severity.upper()} severity detected. Contact: {contact['name']} ({contact['role']}). Immediate response required."
                success = await send_sms_alert(contact['phone'], message)
                if success:
                    alerts_sent.append(f"{contact['name']} ({contact['role']})")
        
        # Update analysis record
        await db.analyses.update_one(
            {'id': request.analysis_id},
            {'$set': {'alerts_sent': alerts_sent}}
        )
        
        return {
            'success': True,
            'alerts_sent': alerts_sent,
            'severity': severity
        }
    except Exception as e:
        logging.error(f"Error sending alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/update-gps")
async def update_gps_manually(request: ManualGPSUpdate):
    """Manually update GPS coordinates for an analysis"""
    try:
        # Get address from coordinates
        location_address = get_address_from_gps(request.latitude, request.longitude)
        
        # Get traffic info
        traffic_info = await get_traffic_info(request.latitude, request.longitude)
        
        # Update analysis record
        update_data = {
            'gps_coordinates': {
                'latitude': request.latitude,
                'longitude': request.longitude
            },
            'location_address': location_address,
            'gps_source': 'manual',
            'traffic_info': traffic_info
        }
        
        result = await db.analyses.update_one(
            {'id': request.analysis_id},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        return {
            'success': True,
            'gps_coordinates': update_data['gps_coordinates'],
            'location_address': location_address,
            'traffic_info': traffic_info,
            'message': 'GPS updated successfully'
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error updating GPS: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Contact CRUD
@api_router.post("/contacts", response_model=EmergencyContact)
async def create_contact(contact: EmergencyContactCreate):
    contact_obj = EmergencyContact(**contact.model_dump())
    doc = contact_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contacts.insert_one(doc)
    return contact_obj

@api_router.get("/contacts", response_model=List[EmergencyContact])
async def get_contacts():
    contacts = await db.contacts.find({}, {"_id": 0}).to_list(100)
    for contact in contacts:
        if isinstance(contact.get('created_at'), str):
            contact['created_at'] = datetime.fromisoformat(contact['created_at'])
    return contacts

@api_router.put("/contacts/{contact_id}")
async def update_contact(contact_id: str, contact: EmergencyContactUpdate):
    update_data = {k: v for k, v in contact.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.contacts.update_one({'id': contact_id}, {'$set': update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"success": True}

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    result = await db.contacts.delete_one({'id': contact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"success": True}

@api_router.get("/analysis-history", response_model=List[AnalysisRecord])
async def get_analysis_history():
    analyses = await db.analyses.find({}, {"_id": 0}).sort('timestamp', -1).to_list(100)
    for analysis in analyses:
        if isinstance(analysis.get('timestamp'), str):
            analysis['timestamp'] = datetime.fromisoformat(analysis['timestamp'])
    return analyses

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client_mongo.close()