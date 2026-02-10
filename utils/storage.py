
import json
import os
from datetime import datetime
from pathlib import Path

DATA_DIR = Path("data")
COMPLAINTS_FILE = DATA_DIR / "complaints.json"

def init_storage():
    """Initialize storage directory and file"""
    DATA_DIR.mkdir(exist_ok=True)
    if not COMPLAINTS_FILE.exists():
        COMPLAINTS_FILE.write_text("[]")

def load_complaints():
    """Load all complaints from JSON file"""
    init_storage()
    try:
        with open(COMPLAINTS_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return []

def save_complaint(complaint_id, analysis, image_b64, description, location):
    """Save new complaint"""
    complaints = load_complaints()
    
    new_complaint = {
        "id": complaint_id,
        "timestamp": datetime.now().isoformat(),
        "image": image_b64,
        "description": description,
        "location": location,
        "analysis": analysis,
        "status": "Submitted",
        "timeline": [
            {
                "stage": "Submitted",
                "timestamp": datetime.now().isoformat(),
                "officer": None,
                "action": "Complaint received and analyzed by AI"
            }
        ]
    }
    
    complaints.append(new_complaint)
    
    with open(COMPLAINTS_FILE, 'w') as f:
        json.dump(complaints, f, indent=2)
    
    return complaint_id

def get_complaint_by_id(complaint_id):
    """Retrieve specific complaint"""
    complaints = load_complaints()
    for c in complaints:
        if c['id'] == complaint_id:
            return c
    return None

def update_complaint_status(complaint_id, action, officer_notes, officer_name="Admin"):
    """Update complaint status (officer action)"""
    complaints = load_complaints()
    
    for c in complaints:
        if c['id'] == complaint_id:
            c['timeline'].append({
                "stage": action,
                "timestamp": datetime.now().isoformat(),
                "officer": officer_name,
                "action": officer_notes
            })
            
            if action == "Mark Resolved":
                c['status'] = "Resolved"
            elif action == "Assign to Team":
                c['status'] = "Assigned"
            elif action == "Forward to Department":
                c['status'] = "Forwarded"
            else:
                c['status'] = "Under Review"
            break
    
    with open(COMPLAINTS_FILE, 'w') as f:
        json.dump(complaints, f, indent=2)
