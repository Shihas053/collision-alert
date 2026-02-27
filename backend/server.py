from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EmergencyContactCreate(BaseModel):
    name: str
    phone: str
    role: str

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
    alerts_sent: List[str] = []
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AlertRequest(BaseModel):
    analysis_id: str
    severity: str

# Helper functions
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
            system_message="You are an expert collision analysis AI. Analyze vehicle collision videos and classify them into three categories: NORMAL (minor contact, no visible damage), MILD (moderate impact, some visible damage, low-speed collision), or SEVERE (high-speed collision, significant damage, potential injuries). Provide brief analysis."
        ).with_model("openai", "gpt-5.2")
        
        image_content = ImageContent(image_base64=frame_base64)
        
        user_message = UserMessage(
            text="Analyze this collision scene. Classify the severity as NORMAL, MILD, or SEVERE. Then provide a brief 2-3 sentence analysis explaining your classification. Format your response as: SEVERITY: [classification]\nANALYSIS: [your analysis]",
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse response
        lines = response.strip().split('\n')
        severity = "unknown"
        analysis = response
        
        for line in lines:
            if line.startswith('SEVERITY:'):
                severity_text = line.replace('SEVERITY:', '').strip().lower()
                if 'normal' in severity_text:
                    severity = 'normal'
                elif 'mild' in severity_text:
                    severity = 'mild'
                elif 'severe' in severity_text:
                    severity = 'severe'
            elif line.startswith('ANALYSIS:'):
                analysis = line.replace('ANALYSIS:', '').strip()
        
        return {
            'severity': severity,
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
        
        # Extract frame
        frame_base64 = extract_frame_from_video(video_bytes)
        
        # Analyze with AI
        analysis_result = await analyze_collision(frame_base64)
        
        # Save to database
        record = AnalysisRecord(
            video_name=file.filename,
            severity=analysis_result['severity'],
            analysis_details=analysis_result['analysis']
        )
        
        doc = record.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        doc['created_at'] = doc.get('created_at', doc['timestamp'])
        
        await db.analyses.insert_one(doc)
        
        # Automatically send alerts based on severity
        severity = analysis_result['severity'].lower()
        contacts = await db.contacts.find({}, {"_id": 0}).to_list(100)
        
        alerts_sent = []
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
                message = f"COLLISION ALERT - {severity.upper()} severity detected. Location: {file.filename}. Contact: {contact['name']} ({contact['role']}). Immediate response required."
                success = await send_sms_alert(contact['phone'], message)
                if success:
                    alerts_sent.append(f"{contact['name']} ({contact['role']})")
        
        # Update analysis record with alerts sent
        await db.analyses.update_one(
            {'id': record.id},
            {'$set': {'alerts_sent': alerts_sent}}
        )
        
        return {
            'id': record.id,
            'severity': record.severity,
            'analysis': analysis_result['analysis'],
            'video_name': file.filename,
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