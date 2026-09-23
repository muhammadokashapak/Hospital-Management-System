import os
import sys
import random
from datetime import date, datetime, timedelta
import math

# Add the project root to python path to import app correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import (
    Hospital, User, RoleEnum, GenderEnum, Department, Doctor, 
    HouseOfficer, TMOProfile, Inventory, WardBed, RotationGroup,
    Patient, Appointment, Prescription, Vitals, Admission,
    EmergencyCase, ICUAdmission, OTSchedule, LabTest, LabRecord,
    RadiologyOrder, RadiologyReport, BloodStock, Attendance, Invoice,
    MedicalRecord, BloodGroupEnum, TriageCategoryEnum, AdmissionTypeEnum,
    AdmissionStatusEnum, BloodComponentEnum, RadiologyTypeEnum,
    AppointmentStatusEnum, WardTypeEnum, PaymentMethodEnum, InvoiceStatusEnum
)
from app.auth import get_password_hash
from app.scheduler_logic import generate_fair_shifts, generate_rotations

MALE_FIRST = ["Muhammad", "Ahmed", "Ali", "Hassan", "Hussain", "Usman", "Bilal", "Farhan", "Kamran", "Naveed", "Tariq", "Shahid", "Rizwan", "Imran", "Waqar", "Zubair", "Adnan", "Kashif", "Faisal", "Sajjad", "Hamza", "Tahir", "Sajid"]
FEMALE_FIRST = ["Fatima", "Ayesha", "Khadija", "Zainab", "Maryam", "Sana", "Hina", "Nadia", "Bushra", "Rabia", "Samina", "Tahira", "Nasreen", "Uzma", "Saima", "Lubna", "Shazia", "Parveen", "Rukhsar", "Amina", "Sadia", "Huma"]
LAST_NAMES = ["Khan", "Malik", "Ahmed", "Hussain", "Shah", "Butt", "Chaudhry", "Qureshi", "Siddiqui", "Akhtar", "Raza", "Aslam", "Iqbal", "Javed", "Nawaz"]
CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan"]

def r_date(start_year=1950, end_year=2005):
    return date(random.randint(start_year, end_year), random.randint(1, 12), random.randint(1, 28))

def r_phone():
    return f"03{random.randint(0,4)}{random.randint(0,9)}-{random.randint(1000000,9999999)}"

def r_cnic():
    return f"{random.randint(31101,38406)}-{random.randint(1000000,9999999)}-{random.randint(1,9)}"

def gen_name(gender):
    if gender == GenderEnum.Male:
        return f"{random.choice(MALE_FIRST)} {random.choice(LAST_NAMES)}"
    return f"{random.choice(FEMALE_FIRST)} {random.choice(LAST_NAMES)}"

def seed_db():
    print("Dropping and recreating all tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. HOSPITAL
        print("Seeding Hospital...")
        h = Hospital(name="Jinnah Teaching Hospital", license_key="JTH-2026-PAK", address="Lahore, Pakistan", phone="042-99231400", email="info@jinnahhospital.edu.pk")
        db.add(h)
        db.commit()
        db.refresh(h)
        
        shared_pwd = get_password_hash("Password123")
        
        # 2. DEPARTMENTS
        print("Seeding Departments...")
        dept_names = ["Medicine", "General Surgery", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "ENT", "Gynecology & Obstetrics", "Dermatology", "Psychiatry", "Pulmonology", "Oncology", "Nephrology", "Gastroenterology", "Urology", "Ophthalmology", "Emergency Medicine", "Anesthesiology", "Radiology", "Pathology", "ICU"]
        depts = []
        for d in dept_names:
            dept = Department(hospital_id=h.id, name=d)
            db.add(dept)
            depts.append(dept)
        db.commit()
        
        # 3. ROTATION GROUPS
        print("Seeding Rotation Groups...")
        tracks = ["Medicine Track", "Surgery Track", "Pediatrics Track", "Gynecology Track", "Orthopedics Track", "ENT Track"]
        rgs = []
        for t in tracks:
            rg = RotationGroup(hospital_id=h.id, name=t)
            db.add(rg)
            rgs.append(rg)
        db.commit()
        
        # Map depts to rotation groups (simplistic mapping for demo)
        for i, rg in enumerate(rgs):
            rg.departments.append(depts[i % len(depts)])
            rg.departments.append(depts[(i+1) % len(depts)])
        db.commit()

        # 4. STAFF
        print("Seeding Staff (Users)...")
        users = []
        
        # Admin
        admin = User(hospital_id=h.id, email="admin@jth.pk", password_hash=shared_pwd, full_name="Super Admin", role=RoleEnum.Admin, gender=GenderEnum.Male, designation="System Administrator")
        db.add(admin)
        users.append(admin)
        
        # Doctors (40)
        doctors = []
        for i in range(40):
            gender = random.choice([GenderEnum.Male, GenderEnum.Female])
            u = User(hospital_id=h.id, email=f"doc{i+1}@jth.pk", password_hash=shared_pwd, full_name=f"Dr. {gen_name(gender)}", role=RoleEnum.Doctor, gender=gender, designation="Consultant", phone=r_phone(), department_id=depts[i % len(depts)].id)
            db.add(u)
            users.append(u)
        db.commit()
        
        for u in [u for u in users if u.role == RoleEnum.Doctor]:
            d = Doctor(hospital_id=h.id, user_id=u.id, department_id=u.department_id, specialization=u.department.name, pmc_number=f"PMC-{random.randint(10000,99999)}", consultation_fee=random.choice([1500, 2000, 2500, 3000]))
            db.add(d)
            doctors.append(d)
        db.commit()
        
        # House Officers (126)
        print("Seeding 126 House Officers...")
        hos = []
        for rg_idx, rg in enumerate(rgs):
            males = 12 if rg_idx % 2 == 0 else 10
            females = 21 - males
            
            for m in range(males):
                u = User(hospital_id=h.id, email=f"ho_{rg_idx}_m{m}@jth.pk", password_hash=shared_pwd, full_name=f"Dr. {gen_name(GenderEnum.Male)}", role=RoleEnum.House_Officer, gender=GenderEnum.Male, designation="House Officer")
                db.add(u)
                db.flush()
                ho = HouseOfficer(hospital_id=h.id, user_id=u.id, rotation_group_id=rg.id, batch_year=2026, start_date=date.today(), end_date=date.today()+timedelta(days=365))
                db.add(ho)
                hos.append(ho)
                
            for f in range(females):
                u = User(hospital_id=h.id, email=f"ho_{rg_idx}_f{f}@jth.pk", password_hash=shared_pwd, full_name=f"Dr. {gen_name(GenderEnum.Female)}", role=RoleEnum.House_Officer, gender=GenderEnum.Female, designation="House Officer")
                db.add(u)
                db.flush()
                ho = HouseOfficer(hospital_id=h.id, user_id=u.id, rotation_group_id=rg.id, batch_year=2026, start_date=date.today(), end_date=date.today()+timedelta(days=365))
                db.add(ho)
                hos.append(ho)
        db.commit()
        
        # Nurses & Dedicated Shifts
        print("Seeding Nurses & Other Staff...")
        
        # Give every department a dedicated team of nurses
        shifts = ['Morning', 'Evening', 'Night']
        for dept in depts:
            is_critical = dept.name in ["ICU", "Emergency Medicine"]
            nurse_role = RoleEnum.ICU_Staff if dept.name == "ICU" else (RoleEnum.Emergency_Staff if dept.name == "Emergency Medicine" else RoleEnum.Nurse)
            
            # 6 nurses per department (2 per shift)
            for i in range(6):
                shift = shifts[i % 3]
                u = User(
                    hospital_id=h.id, 
                    email=f"nurse_{dept.name.lower().replace(' ', '_').replace('&', 'and')}_{i+1}@jth.pk", 
                    password_hash=shared_pwd, 
                    full_name=gen_name(GenderEnum.Female), 
                    role=nurse_role, 
                    gender=GenderEnum.Female, 
                    designation="Critical Care Nurse" if is_critical else "Staff Nurse", 
                    department_id=dept.id,
                    shift_preference=shift # Permanent Shift
                )
                db.add(u)
            
        # Other roles (excluding the ones handled above)
        role_counts = {
            RoleEnum.Lab_Tech: 25, RoleEnum.Pharmacist: 10, RoleEnum.Receptionist: 15, RoleEnum.Billing: 5,
            RoleEnum.Radiology_Tech: 15, RoleEnum.HR: 4, RoleEnum.Inventory: 5, RoleEnum.OT_Staff: 12, 
            RoleEnum.Blood_Bank_Staff: 4, RoleEnum.Ambulance_Driver: 4, RoleEnum.Physiotherapist: 4, 
            RoleEnum.Dialysis_Staff: 4
        }
        for role, count in role_counts.items():
            for i in range(count):
                g = random.choice([GenderEnum.Male, GenderEnum.Female])
                if role == RoleEnum.Ambulance_Driver: g = GenderEnum.Male
                u = User(hospital_id=h.id, email=f"{role.name.lower()}{i+1}@jth.pk", password_hash=shared_pwd, full_name=gen_name(g), role=role, gender=g, designation=role.value)
                db.add(u)
        db.commit()

        # 5. WARD BEDS (20 Per Department)
        print("Seeding Ward Beds...")
        beds = []
        for dept in depts:
            ward_type = WardTypeEnum.General
            if dept.name == "ICU":
                ward_type = WardTypeEnum.ICU
            elif dept.name == "Emergency Medicine":
                ward_type = WardTypeEnum.Emergency
            elif dept.name == "Pediatrics":
                ward_type = WardTypeEnum.NICU
                
            for b in range(20): # Exactly 20 beds per department
                bed = WardBed(
                    hospital_id=h.id, 
                    department_id=dept.id,
                    ward_name=f"{dept.name} Ward", 
                    ward_type=ward_type, 
                    bed_number=f"B-{b+1}", 
                    cost_per_day=random.choice([1000, 2000, 5000])
                )
                db.add(bed)
                beds.append(bed)
        db.commit()

        # 6. PATIENTS (800)
        print("Seeding 800 Patients...")
        patients = []
        for i in range(800):
            g = random.choice([GenderEnum.Male, GenderEnum.Female])
            p = Patient(
                hospital_id=h.id, phone=r_phone(), cnic=r_cnic(), full_name=gen_name(g), age=random.randint(1, 90),
                gender=g, date_of_birth=r_date(), blood_group=random.choice(list(BloodGroupEnum)),
                address=f"House {random.randint(1,999)}, {random.choice(CITIES)}", emergency_contact=r_phone()
            )
            db.add(p)
            patients.append(p)
        db.commit()

        # 7. APPOINTMENTS & MEDICAL RECORDS
        print("Seeding Appointments & Records...")
        now = datetime.now()
        for p in patients[:500]: # 500 patients have appointments
            doc = random.choice(doctors)
            appt = Appointment(hospital_id=h.id, patient_id=p.id, doctor_id=doc.id, appointment_date=now.date(), token_number=random.randint(1, 50), status=AppointmentStatusEnum.Completed)
            db.add(appt)
            
            mr = MedicalRecord(hospital_id=h.id, patient_id=p.id, doctor_id=doc.id, visit_type="OPD", chief_complaint="Fever and cough", diagnosis="Viral URI")
            db.add(mr)
            
            inv = Invoice(hospital_id=h.id, patient_id=p.id, amount=doc.consultation_fee, description=f"Consultation - {doc.specialization}", invoice_type="Consultation", status=InvoiceStatusEnum.Paid)
            db.add(inv)
        db.commit()

        # 8. ADMISSIONS (100)
        print("Seeding Admissions...")
        for i in range(100):
            p = patients[500+i]
            bed = beds[i]
            doc = random.choice(doctors)
            bed.is_occupied = True
            bed.patient_id = p.id
            adm = Admission(hospital_id=h.id, patient_id=p.id, admitting_doctor_id=doc.id, ward_bed_id=bed.id, admission_type=AdmissionTypeEnum.IPD, primary_diagnosis="Pneumonia", status=AdmissionStatusEnum.Admitted)
            db.add(adm)
        db.commit()

        # 9. INVENTORY (300)
        print("Seeding Inventory...")
        meds = ["Paracetamol", "Ibuprofen", "Amoxicillin", "Ciprofloxacin", "Metformin", "Aspirin", "Omeprazole", "Amlodipine"]
        for m in meds:
            inv = Inventory(hospital_id=h.id, item_name=f"{m} 500mg", category="Medicine", unit_price=random.randint(50, 500), quantity=random.randint(100, 1000), expiry_date=date.today()+timedelta(days=365))
            db.add(inv)
        db.commit()
        
        # 10. BLOOD BANK
        print("Seeding Blood Bank...")
        for bg in BloodGroupEnum:
            if bg != BloodGroupEnum.Unknown:
                bs = BloodStock(hospital_id=h.id, blood_group=bg, units_available=random.randint(5, 30), expiry_date=date.today()+timedelta(days=30))
                db.add(bs)
        db.commit()

        # 11. HO SCHEDULER
        print("Generating Fair Shifts for 126 HOs...")
        for rg in rgs:
            generate_fair_shifts(db, h.id, rg.id, date.today(), days=30)
            
        print("Mega Seed Complete!")

    except Exception as e:
        print(f"Error seeding DB: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
