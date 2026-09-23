from app.database import SessionLocal
from app import models, auth

def ensure_tmos():
    db = SessionLocal()
    try:
        hospitals = db.query(models.Hospital).all()
        if not hospitals:
            print("No hospitals found.")
            return

        hospital = hospitals[0]
        groups = db.query(models.RotationGroup).filter(models.RotationGroup.hospital_id == hospital.id).all()

        tmo_configs = [
            ("tmo.medicine@hospital.com", "Dr. TMO Medicine", 1),
            ("tmo.surgery@hospital.com", "Dr. TMO Surgery", 2),
            ("tmo.peds@hospital.com", "Dr. TMO Pediatrics", 3),
            ("tmo.gynae@hospital.com", "Dr. TMO Gynecology", 4),
            ("tmo.ortho@hospital.com", "Dr. TMO Orthopedics", 5),
            ("tmo.ent@hospital.com", "Dr. TMO ENT", 6),
        ]

        for email, name, group_id in tmo_configs:
            user = db.query(models.User).filter(models.User.email == email).first()
            if not user:
                user = models.User(
                    hospital_id=hospital.id,
                    email=email,
                    password_hash=auth.get_password_hash("password123"),
                    full_name=name,
                    role=models.RoleEnum.TMO,
                    gender=models.GenderEnum.Male
                )
                db.add(user)
                db.flush()
            else:
                user.password_hash = auth.get_password_hash("password123")
                user.full_name = name
                user.role = models.RoleEnum.TMO

            # Ensure TMO Profile
            tmo_profile = db.query(models.TMOProfile).filter(models.TMOProfile.user_id == user.id).first()
            if not tmo_profile:
                tmo_profile = models.TMOProfile(
                    hospital_id=hospital.id,
                    user_id=user.id,
                    rotation_group_id=group_id,
                    specialty_program=f"Specialty Track {group_id}"
                )
                db.add(tmo_profile)
            else:
                tmo_profile.rotation_group_id = group_id
                tmo_profile.specialty_program = f"Specialty Track {group_id}"

        db.commit()
        print("Successfully created/updated all 6 TMO accounts with password 'password123'!")
    except Exception as e:
        db.rollback()
        print(f"Error ensuring TMOs: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    ensure_tmos()
