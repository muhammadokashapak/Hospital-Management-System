import os
import sys

# Add the project root to python path to import app correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import Hospital, RotationGroup, Department, WardBed, Inventory

def reset_db():
    print("Dropping and recreating all tables to wipe out users...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Creating City Central Hospital...")
        h1 = Hospital(name="City Central Hospital", license_key="CCH-2026-X89", address="Downtown")
        db.add(h1)
        db.commit()
        db.refresh(h1)

        print("Seeding Departments & Rotation Groups...")
        # Tracks
        tracks = {
            "Surgery Track": ["General Surgery", "Orthopedics", "Urology", "Plastic Surgery"],
            "Medicine Track": ["Internal Medicine", "Cardiology", "Neurology", "Pulmonology", "Dermatology", "Psychiatry"],
            "Pediatrics Track": ["Pediatrics"],
            "OBGYN Track": ["OBGYN"],
            "Allied Medicine": ["Gastroenterology", "Nephrology"],
            "Allied Surgery": ["Neurosurgery", "Pediatric Surgery"],
            "Radiology": ["Radiology"],
            "Anesthesia": ["Anesthesia"],
            "Pathology": ["Pathology"],
            "ENT": ["ENT"],
            "Ophthalmology": ["Ophthalmology"]
        }

        rg_objects = {}
        for track_name in tracks.keys():
            rg = RotationGroup(hospital_id=h1.id, name=track_name)
            db.add(rg)
            rg_objects[track_name] = rg
        db.commit()

        # Departments
        dept_objects = {}
        for track_name, dept_names in tracks.items():
            for d_name in dept_names:
                if d_name not in dept_objects:
                    d = Department(hospital_id=h1.id, name=d_name)
                    db.add(d)
                    dept_objects[d_name] = d
        db.commit()

        # Map Departments to Tracks
        for track_name, dept_names in tracks.items():
            rg = rg_objects[track_name]
            for d_name in dept_names:
                rg.departments.append(dept_objects[d_name])
        db.commit()

        print("Seeding Inventory & Wards...")
        inv1 = Inventory(hospital_id=h1.id, item_name="Paracetamol 500mg", quantity=500, threshold_limit=100)
        cardiology_dept = dept_objects.get("Cardiology", list(dept_objects.values())[0])
        bed1 = WardBed(hospital_id=h1.id, department_id=cardiology_dept.id, ward_name="Cardiology ICU", bed_number="Bed-01", is_occupied=False)
        db.add_all([inv1, bed1])
        db.commit()

        print("DB Reset Complete! All users have been deleted. Core infrastructure ready.")

    except Exception as e:
        print(f"Error resetting DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_db()
