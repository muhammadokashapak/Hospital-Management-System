import os
import sys

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app import models

def clear_queues():
    print("Clearing all patient queues, appointments, admissions, orders, and freeing ward beds...")
    db = SessionLocal()
    try:
        # Delete appointments/queue
        db.query(models.Appointment).delete()
        
        # Delete admissions
        db.query(models.Admission).delete()
        
        # Delete prescriptions
        db.query(models.Prescription).delete()
        
        # Delete lab tests and records if present
        if hasattr(models, 'LabRecord'):
            db.query(models.LabRecord).delete()
        if hasattr(models, 'LabTest'):
            db.query(models.LabTest).delete()
        if hasattr(models, 'Vitals'):
            db.query(models.Vitals).delete()
            
        # Free all Ward Beds
        beds = db.query(models.WardBed).all()
        for bed in beds:
            bed.is_occupied = False
            bed.patient_id = None
            
        db.commit()
        print("SUCCESS: All patient queues, OPD waiting lists, admissions, and ward beds cleared to 0!")
    except Exception as e:
        print(f"Error clearing queues: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_queues()
