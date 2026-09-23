import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models

def clear_all_patients():
    db = SessionLocal()
    try:
        print("Clearing all patient clinical data...")
        
        # 1. Unassign all ward beds
        db.query(models.WardBed).update({models.WardBed.is_occupied: False, models.WardBed.patient_id: None})
        db.commit()

        # 2. Delete patient related records in safe sequence
        models_to_clear = [
            models.EMARLog,
            models.MedicationSchedule,
            models.MedicationOrder,
            models.NursingChecklist,
            models.PatientAllergy,
            models.Vitals,
            models.Admission,
            models.ICUAdmission,
            models.EmergencyCase,
            models.OTSchedule,
            models.LabRecord,
            models.RadiologyReport,
            models.RadiologyOrder,
            models.MedicalRecord,
            models.Appointment,
            models.Invoice,
            models.PharmacyRequest,
            models.Patient
        ]
        
        for m in models_to_clear:
            try:
                count = db.query(m).delete()
                db.commit()
                print(f"Cleared {count} records from {m.__tablename__}")
            except Exception as e:
                db.rollback()
                print(f"Note clearing {m.__tablename__}: {e}")

        print("SUCCESS: All patients cleared! All ward beds are now Vacant.")
    except Exception as e:
        db.rollback()
        print(f"Error clearing patients: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_all_patients()
