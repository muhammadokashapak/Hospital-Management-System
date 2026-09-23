import sys
from app.database import SessionLocal, engine, Base
from app import models, auth
from datetime import datetime, date

def seed_saas_multi_tenant():
    db = SessionLocal()
    try:
        # 1. Super Admin Creation
        superadmin_email = "admin@hospital.local"
        superadmin = db.query(models.User).filter(models.User.email == superadmin_email).first()
        
        # Ensure default system hospital exists for platform level
        platform_hosp = db.query(models.Hospital).filter(models.Hospital.id == 1).first()
        if not platform_hosp:
            platform_hosp = models.Hospital(
                name="Platform Central HQ",
                license_key="HQ-PLATFORM-000",
                address="1 Platform Ave, Tech Park",
                phone="+1-800-SAAS-HMS",
                email="support@hospitalcloud.com"
            )
            db.add(platform_hosp)
            db.commit()
            db.refresh(platform_hosp)

        if not superadmin:
            superadmin = models.User(
                hospital_id=platform_hosp.id,
                email=superadmin_email,
                password_hash=auth.get_password_hash("adminPass123"),
                full_name="Platform Super Admin",
                role=models.RoleEnum.SuperAdmin,
                gender=models.GenderEnum.Male
            )
            db.add(superadmin)
            db.commit()
            print("Super Admin created: admin@hospital.local / adminPass123")
        else:
            superadmin.role = models.RoleEnum.SuperAdmin
            db.commit()
            print("Super Admin verified.")

        # 2. Seed 3 Independent Hospitals (Level 2 Multi-Tenant)
        sample_hospitals = [
            {
                "name": "Shifa Hospital",
                "license_key": "LIC-SHIFA-H001",
                "address": "7th Avenue, Blue Area, Islamabad",
                "phone": "+92-51-8463000",
                "email": "contact@shifahospital.com",
                "admin_email": "admin@shifahospital.com",
                "admin_name": "Dr. Tariq Shifa Admin",
                "patients": ["Ali Ahmad", "Fatima Zahra", "Muhammad Usman"],
                "doctors": ["Dr. Khalid Mahmood", "Dr. Ayesha Malik"]
            },
            {
                "name": "City Hospital",
                "license_key": "LIC-CITY-H002",
                "address": "Main Boulevard, Gulberg, Lahore",
                "phone": "+92-42-3571200",
                "email": "info@cityhospital.org",
                "admin_email": "admin@cityhospital.org",
                "admin_name": "City Admin Bilal",
                "patients": ["Sara Khan", "Zainab Bibi", "Hamza Shah"],
                "doctors": ["Dr. Rashid Minhas", "Dr. Sana Ahmed"]
            },
            {
                "name": "Care Hospital",
                "license_key": "LIC-CARE-H003",
                "address": "Clifton Block 5, Karachi",
                "phone": "+92-21-3587410",
                "email": "care@carehospital.pk",
                "admin_email": "admin@carehospital.pk",
                "admin_name": "Care Admin Nadia",
                "patients": ["Omer Farooq", "Kamran Akmal", "Nida Yasir"],
                "doctors": ["Dr. Babar Azam", "Dr. Mahnoor Baloch"]
            }
        ]

        for item in sample_hospitals:
            hosp = db.query(models.Hospital).filter(models.Hospital.license_key == item["license_key"]).first()
            if not hosp:
                hosp = models.Hospital(
                    name=item["name"],
                    license_key=item["license_key"],
                    address=item["address"],
                    phone=item["phone"],
                    email=item["email"]
                )
                db.add(hosp)
                db.commit()
                db.refresh(hosp)
                
                # Subscription
                sub = models.Subscription(hospital_id=hosp.id, plan_name="Enterprise", status="Active")
                db.add(sub)
                db.commit()

            # Create Hospital Admin
            admin_user = db.query(models.User).filter(models.User.email == item["admin_email"]).first()
            if not admin_user:
                admin_user = models.User(
                    hospital_id=hosp.id,
                    email=item["admin_email"],
                    password_hash=auth.get_password_hash("hospitalPass123"),
                    full_name=item["admin_name"],
                    role=models.RoleEnum.Admin,
                    gender=models.GenderEnum.Male
                )
                db.add(admin_user)
                db.commit()
                db.refresh(admin_user)

            # Create Department
            dept = db.query(models.Department).filter(models.Department.hospital_id == hosp.id).first()
            if not dept:
                dept = models.Department(hospital_id=hosp.id, name="General Medicine")
                db.add(dept)
                db.commit()
                db.refresh(dept)

            # Create Doctors
            for d_name in item["doctors"]:
                d_email = f"{d_name.lower().replace(' ', '.').replace('.', '')}@hospital.local"
                d_user = db.query(models.User).filter(models.User.email == d_email).first()
                if not d_user:
                    d_user = models.User(
                        hospital_id=hosp.id,
                        email=d_email,
                        password_hash=auth.get_password_hash("doctorPass123"),
                        full_name=d_name,
                        role=models.RoleEnum.Doctor,
                        gender=models.GenderEnum.Male
                    )
                    db.add(d_user)
                    db.commit()
                    db.refresh(d_user)

                    doc_prof = models.Doctor(
                        hospital_id=hosp.id,
                        user_id=d_user.id,
                        department_id=dept.id,
                        specialization="Internal Medicine",
                        is_available=True
                    )
                    db.add(doc_prof)
                    db.commit()

            # Create Patients for isolated verification
            for idx, p_name in enumerate(item["patients"]):
                p_cnic = f"35202-{abs(hash(p_name))%10000000:07d}-1"
                p_phone = f"+92-300-{hosp.id:02d}00{idx:02d}"
                p_exists = db.query(models.Patient).filter(
                    models.Patient.hospital_id == hosp.id,
                    models.Patient.full_name == p_name
                ).first()
                if not p_exists:
                    patient = models.Patient(
                        hospital_id=hosp.id,
                        full_name=p_name,
                        gender=models.GenderEnum.Male if "Ali" in p_name or "Muhammad" in p_name or "Hamza" in p_name or "Omer" in p_name or "Kamran" in p_name else models.GenderEnum.Female,
                        cnic=p_cnic,
                        phone=p_phone,
                        age=32 + idx*5
                    )
                    db.add(patient)
                    db.commit()

        print("Multi-tenant SaaS sample data successfully seeded!")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_saas_multi_tenant()
