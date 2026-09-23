import sys
from datetime import date
from app.database import SessionLocal
from app import models, auth

def seed_unique_17_hos():
    db = SessionLocal()
    try:
        hospitals = db.query(models.Hospital).all()
        if not hospitals:
            print("No hospitals found.")
            return

        hospital = hospitals[0]
        groups = db.query(models.RotationGroup).filter(models.RotationGroup.hospital_id == hospital.id).all()

        batch_names_map = {
            1: { # Medicine Track
                "males": [
                    "Dr. Adnan Iqbal", "Dr. Muhammad Siddiqui", "Dr. Sajid Aslam", "Dr. Naveed Javed",
                    "Dr. Rizwan Khan", "Dr. Kamran Ahmed", "Dr. Zubair Malik", "Dr. Tariq Khan",
                    "Dr. Hamza Ali", "Dr. Bilal Ahmed", "Dr. Usman Tariq", "Dr. Faisal Mahmood",
                    "Dr. Hassan Raza", "Dr. Shahzaib Khan"
                ],
                "females": ["Dr. Tahira Chaudhry", "Dr. Rukhsar Butt", "Dr. Nadia Malik"]
            },
            2: { # Surgery Track
                "males": [
                    "Dr. Kashif Mehmood", "Dr. Shahbaz Sharif", "Dr. Imran Zia", "Dr. Waleed Ashraf",
                    "Dr. Haris Mahmood", "Dr. Danish Ali", "Dr. Asad Ullah", "Dr. Salman Farooq",
                    "Dr. Arslan Khalid", "Dr. Umair Hassan", "Dr. Zeeshan Haider", "Dr. Moazzam Ali",
                    "Dr. Wajid Khan", "Dr. Adeel Rehan"
                ],
                "females": ["Dr. Ayesha Siddiqa", "Dr. Sana Fatima", "Dr. Maria Zainab"]
            },
            3: { # Pediatrics Track
                "males": [
                    "Dr. Farhan Qureshi", "Dr. Noman Iftikhar", "Dr. Waqas Ahmed", "Dr. Ahsan Raza",
                    "Dr. Samiullah", "Dr. Taimoor Khan", "Dr. Zohaib Ali", "Dr. Shoaib Malik",
                    "Dr. Atif Aslam", "Dr. Raheel Sharif", "Dr. Junaid Jamshed", "Dr. Fahad Mustafa",
                    "Dr. Hamza Sohail", "Dr. Daniyal Zafar"
                ],
                "females": ["Dr. Hira Mani", "Dr. Iqra Aziz", "Dr. Sarah Khan"]
            },
            4: { # Gynecology Track
                "males": [
                    "Dr. Saad Rafique", "Dr. Khurram Shahzad", "Dr. Hammad Mustafa", "Dr. Babar Azam",
                    "Dr. Shaheen Afridi", "Dr. Shadab Khan", "Dr. Haris Rauf", "Dr. Naseem Shah",
                    "Dr. Fakhar Zaman", "Dr. Imam-ul-Haq", "Dr. Mohammad Rizwan", "Dr. Iftikhar Ahmed",
                    "Dr. Sarfaraz Ahmed", "Dr. Shoaib Akhtar"
                ],
                "females": ["Dr. Maryam Nawaz", "Dr. Bakhtawar Bhutto", "Dr. Ayla Malik"]
            },
            5: { # Orthopedics Track
                "males": [
                    "Dr. Sikandar Ali", "Dr. Shoaib Ali Azam", "Dr. M. Tayyab", "Dr. Majid Khan",
                    "Dr. Mujeeb Ur Rehman", "Dr. Aqib Javed", "Dr. Owais Ahmed", "Dr. Shakil Ahmed",
                    "Dr. Salahuddin", "Dr. Kamal Uddin", "Dr. Rashid Minhas", "Dr. Saeed Anwar",
                    "Dr. Ahmed Wali", "Dr. Israr Ahmed"
                ],
                "females": ["Dr. Rabia Basri", "Dr. Bushra Bibi", "Dr. Sadia Imam"]
            },
            6: { # ENT Track
                "males": [
                    "Dr. Asif Ali", "Dr. Wasim Akram", "Dr. Waqar Younis", "Dr. Inzamam-ul-Haq",
                    "Dr. Mushtaq Ahmed", "Dr. Saqlain Mushtaq", "Dr. Abdul Razzaq", "Dr. Azhar Mahmood",
                    "Dr. Yasir Hameed", "Dr. Misbah-ul-Haq", "Dr. Younis Khan", "Dr. Umar Gul",
                    "Dr. Mohammad Amir", "Dr. Mohammad Asif"
                ],
                "females": ["Dr. Reham Khan", "Dr. Fariha Pervez", "Dr. Hadiqa Kiani"]
            }
        }

        for idx, group in enumerate(groups):
            print(f"Processing group: {group.name} (ID: {group.id})")
            
            # Delete existing duty shifts & rotations for clean slate
            existing_hos = db.query(models.HouseOfficer).filter(
                models.HouseOfficer.hospital_id == hospital.id,
                models.HouseOfficer.rotation_group_id == group.id
            ).all()

            if existing_hos:
                ho_ids = [ho.id for ho in existing_hos]
                db.query(models.DutyShift).filter(models.DutyShift.house_officer_id.in_(ho_ids)).delete(synchronize_session=False)
                db.query(models.Rotation).filter(models.Rotation.house_officer_id.in_(ho_ids)).delete(synchronize_session=False)
                db.query(models.HouseOfficer).filter(models.HouseOfficer.id.in_(ho_ids)).delete(synchronize_session=False)

            batch_data = batch_names_map.get(group.id, batch_names_map[1])

            # Create 14 Male HOs
            for i, name in enumerate(batch_data["males"]):
                email = f"ho.m.{group.id}.{i+1}@hospital.com"
                user = db.query(models.User).filter(models.User.email == email).first()
                if not user:
                    user = models.User(
                        hospital_id=hospital.id,
                        email=email,
                        password_hash=auth.get_password_hash("password123"),
                        full_name=name,
                        role=models.RoleEnum.House_Officer,
                        gender=models.GenderEnum.Male
                    )
                    db.add(user)
                    db.flush()
                else:
                    user.full_name = name
                    user.gender = models.GenderEnum.Male
                
                ho = models.HouseOfficer(
                    hospital_id=hospital.id,
                    user_id=user.id,
                    rotation_group_id=group.id,
                    batch_year=2026,
                    start_date=date(2026, 1, 1),
                    end_date=date(2026, 12, 31)
                )
                db.add(ho)

            # Create 3 Female HOs
            for i, name in enumerate(batch_data["females"]):
                email = f"ho.f.{group.id}.{i+1}@hospital.com"
                user = db.query(models.User).filter(models.User.email == email).first()
                if not user:
                    user = models.User(
                        hospital_id=hospital.id,
                        email=email,
                        password_hash=auth.get_password_hash("password123"),
                        full_name=name,
                        role=models.RoleEnum.House_Officer,
                        gender=models.GenderEnum.Female
                    )
                    db.add(user)
                    db.flush()
                else:
                    user.full_name = name
                    user.gender = models.GenderEnum.Female
                
                ho = models.HouseOfficer(
                    hospital_id=hospital.id,
                    user_id=user.id,
                    rotation_group_id=group.id,
                    batch_year=2026,
                    start_date=date(2026, 1, 1),
                    end_date=date(2026, 12, 31)
                )
                db.add(ho)

        db.commit()
        print("Successfully seeded unique 17 HOs for each rotation group!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding unique HOs: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_unique_17_hos()
