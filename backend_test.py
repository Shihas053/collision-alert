import requests
import sys
import json
import base64
import io
from datetime import datetime
import os
import cv2
import numpy as np

class CollisionAPITester:
    def __init__(self, base_url="https://auto-incident-deploy.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_contact_ids = []
        self.analysis_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, timeout=30):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        if data and not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, timeout=timeout)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def create_test_video(self):
        """Create a simple test video with collision-like content"""
        try:
            # Create a simple test image that looks like a collision scene
            height, width = 480, 640
            img = np.zeros((height, width, 3), dtype=np.uint8)
            
            # Draw two overlapping rectangles to simulate vehicles in collision
            cv2.rectangle(img, (100, 200), (300, 350), (0, 0, 255), -1)  # Red car
            cv2.rectangle(img, (250, 150), (450, 300), (255, 0, 0), -1)  # Blue car
            
            # Add some text to make it look more realistic
            cv2.putText(img, 'COLLISION SCENE', (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            
            # Create a temporary video file
            temp_video_path = '/tmp/test_collision.mp4'
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(temp_video_path, fourcc, 1.0, (width, height))
            
            # Write the same frame 5 times to create a short video
            for i in range(5):
                out.write(img)
            
            out.release()
            
            return temp_video_path
        except Exception as e:
            print(f"Error creating test video: {e}")
            return None

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_create_contact(self, name, phone, role):
        """Test creating an emergency contact"""
        contact_data = {
            "name": name,
            "phone": phone,
            "role": role
        }
        success, response = self.run_test(
            f"Create Contact - {role}",
            "POST",
            "contacts",
            200,
            data=contact_data
        )
        if success and 'id' in response:
            self.created_contact_ids.append(response['id'])
            return response['id']
        return None

    def test_get_contacts(self):
        """Test retrieving all contacts"""
        return self.run_test("Get Contacts", "GET", "contacts", 200)

    def test_delete_contact(self, contact_id):
        """Test deleting a contact"""
        return self.run_test(
            f"Delete Contact {contact_id}",
            "DELETE",
            f"contacts/{contact_id}",
            200
        )

    def test_video_analysis(self):
        """Test video analysis with OpenAI vision"""
        video_path = self.create_test_video()
        if not video_path:
            print("❌ Could not create test video")
            return False, {}
            
        try:
            with open(video_path, 'rb') as f:
                files = {'file': ('test_collision.mp4', f, 'video/mp4')}
                success, response = self.run_test(
                    "Video Analysis",
                    "POST",
                    "analyze",
                    200,
                    files=files,
                    timeout=60  # Longer timeout for AI analysis
                )
                
            # Clean up
            if os.path.exists(video_path):
                os.remove(video_path)
                
            if success and 'id' in response:
                self.analysis_ids.append(response['id'])
                
            return success, response
        except Exception as e:
            print(f"Error in video analysis test: {e}")
            return False, {}

    def test_send_alerts(self, analysis_id, severity):
        """Test sending alerts for an analysis"""
        alert_data = {
            "analysis_id": analysis_id,
            "severity": severity
        }
        return self.run_test(
            f"Send Alerts - {severity}",
            "POST",
            "send-alerts",
            200,
            data=alert_data
        )

    def test_analysis_history(self):
        """Test retrieving analysis history"""
        return self.run_test("Analysis History", "GET", "analysis-history", 200)

def main():
    print("=" * 60)
    print("🚨 COLLISION ANALYSIS API TESTING SUITE")
    print("=" * 60)
    
    # Setup
    tester = CollisionAPITester()
    
    # Test 1: Root endpoint
    print("\n📍 BASIC CONNECTIVITY TESTS")
    tester.test_root_endpoint()
    
    # Test 2: Emergency Contacts CRUD
    print("\n📞 EMERGENCY CONTACTS TESTS")
    
    # Create test contacts
    police_id = tester.test_create_contact("Officer Johnson", "+1234567890", "police")
    ambulance_id = tester.test_create_contact("Paramedic Smith", "+1987654321", "ambulance")
    fire_id = tester.test_create_contact("Fire Chief Wilson", "+1122334455", "fire")
    
    # Get all contacts
    success, contacts = tester.test_get_contacts()
    if success:
        print(f"📋 Found {len(contacts)} contacts in system")
    
    # Test 3: Video Analysis
    print("\n🎥 VIDEO ANALYSIS TESTS")
    analysis_success, analysis_result = tester.test_video_analysis()
    
    if analysis_success and 'id' in analysis_result:
        print(f"🤖 Analysis Result: {analysis_result.get('severity', 'unknown')} severity")
        print(f"📝 Analysis Details: {analysis_result.get('analysis', 'No details')[:100]}...")
        
        # Test alert sending
        print("\n🚨 ALERT SYSTEM TESTS")
        tester.test_send_alerts(analysis_result['id'], analysis_result['severity'])
    
    # Test 4: Analysis History
    print("\n📊 HISTORY TESTS")
    success, history = tester.test_analysis_history()
    if success:
        print(f"📜 Found {len(history)} analyses in history")
    
    # Cleanup: Delete test contacts
    print("\n🧹 CLEANUP")
    for contact_id in tester.created_contact_ids:
        tester.test_delete_contact(contact_id)
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"📈 Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("⚠️  SOME TESTS FAILED!")
        return 1

if __name__ == "__main__":
    sys.exit(main())