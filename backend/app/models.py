from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Date, DateTime, Time, Enum, Text, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, date
from .database import Base
import enum

# --- ENUMS ---
class RoleEnum(str, enum.Enum):
    SuperAdmin = 'SuperAdmin'
    HospitalOwner = 'HospitalOwner'
    Admin = 'Admin'
    Receptionist = 'Receptionist'
    Doctor = 'Doctor'
    TMO = 'TMO'
    House_Officer = 'House Officer'
    Pharmacist = 'Pharmacist'
    Lab_Tech = 'Lab_Tech'
    Nurse = 'Nurse'
    Billing = 'Billing'
    # NEW ROLES
    Radiology_Tech = 'Radiology_Tech'
    HR = 'HR'
    Inventory = 'Inventory'
    Ward_Manager = 'Ward_Manager'
    ICU_Staff = 'ICU_Staff'
    Emergency_Staff = 'Emergency_Staff'
    OT_Staff = 'OT_Staff'
    Blood_Bank_Staff = 'Blood_Bank_Staff'
    Ambulance_Driver = 'Ambulance_Driver'
    Physiotherapist = 'Physiotherapist'
    Dialysis_Staff = 'Dialysis_Staff'
    Dietitian = 'Dietitian'

class GenderEnum(str, enum.Enum):
    Male = 'Male'
    Female = 'Female'
    Other = 'Other'

class AppointmentStatusEnum(str, enum.Enum):
    Waiting = 'Waiting'
    Called = 'Called'
    In_Consultation = 'In-Consultation'
    Completed = 'Completed'
    Cancelled = 'Cancelled'
    No_Show = 'No-Show'
    On_Hold = 'On-Hold'

class RotationStatusEnum(str, enum.Enum):
    Upcoming = 'Upcoming'
    Active = 'Active'
    Completed = 'Completed'

class ShiftTypeEnum(str, enum.Enum):
    Morning = 'Morning'
    Evening = 'Evening'
    Night = 'Night'
    Off = 'Off'

class SwapStatusEnum(str, enum.Enum):
    Pending_Acceptance = 'Pending_Acceptance'
    Pending_Admin = 'Pending_Admin'
    Approved = 'Approved'
    Rejected = 'Rejected'

class LeaveStatusEnum(str, enum.Enum):
    Pending = 'Pending'
    Approved = 'Approved'
    Rejected = 'Rejected'

class TaskStatusEnum(str, enum.Enum):
    Pending = 'Pending'
    In_Progress = 'In_Progress'
    Completed = 'Completed'

class PrescriptionStatusEnum(str, enum.Enum):
    Pending = 'Pending'
    Dispensed = 'Dispensed'

class LabTestStatusEnum(str, enum.Enum):
    Pending = 'Pending'
    Completed = 'Completed'

class InvoiceStatusEnum(str, enum.Enum):
    Unpaid = 'Unpaid'
    Paid = 'Paid'

class FollowUpTypeEnum(str, enum.Enum):
    Re_Consultation = 'Re_Consultation'
    Direct_Pharmacy_Refill = 'Direct_Pharmacy_Refill'

# NEW ENUMS
class AdmissionStatusEnum(str, enum.Enum):
    Pending = 'Pending'
    Admitted = 'Admitted'
    Discharge_Requested = 'Discharge_Requested'
    Discharged = 'Discharged'
    Transferred = 'Transferred'
    LAMA = 'LAMA'
    Expired = 'Expired'

class AdmissionTypeEnum(str, enum.Enum):
    IPD = 'IPD'
    Emergency = 'Emergency'
    ICU = 'ICU'
    OT = 'OT'
    Referral = 'Referral'

class BloodGroupEnum(str, enum.Enum):
    A_pos = 'A+'
    A_neg = 'A-'
    B_pos = 'B+'
    B_neg = 'B-'
    AB_pos = 'AB+'
    AB_neg = 'AB-'
    O_pos = 'O+'
    O_neg = 'O-'
    Unknown = 'Unknown'

class TriageCategoryEnum(str, enum.Enum):
    Red = 'Red'
    Yellow = 'Yellow'
    Green = 'Green'
    Black = 'Black'

class OTStatusEnum(str, enum.Enum):
    Scheduled = 'Scheduled'
    In_Progress = 'In_Progress'
    Completed = 'Completed'
    Cancelled = 'Cancelled'
    Postponed = 'Postponed'

class RadiologyTypeEnum(str, enum.Enum):
    X_Ray = 'X_Ray'
    MRI = 'MRI'
    CT_Scan = 'CT_Scan'
    Ultrasound = 'Ultrasound'
    ECG = 'ECG'
    Echo = 'Echo'
    Mammography = 'Mammography'

class BloodComponentEnum(str, enum.Enum):
    Whole_Blood = 'Whole_Blood'
    Packed_RBCs = 'Packed_RBCs'
    Platelets = 'Platelets'
    FFP = 'FFP'
    Cryoprecipitate = 'Cryoprecipitate'

class AttendanceStatusEnum(str, enum.Enum):
    Present = 'Present'
    Absent = 'Absent'
    Leave = 'Leave'
    Late = 'Late'
    Half_Day = 'Half_Day'
    Holiday = 'Holiday'

class PaymentMethodEnum(str, enum.Enum):
    Cash = 'Cash'
    Card = 'Card'
    Online = 'Online'
    Insurance = 'Insurance'
    Zakat_Fund = 'Zakat_Fund'

class WardTypeEnum(str, enum.Enum):
    General = 'General'
    Semi_Private = 'Semi_Private'
    Private = 'Private'
    ICU = 'ICU'
    CCU = 'CCU'
    NICU = 'NICU'
    Emergency = 'Emergency'
    OT = 'OT'
    Labor = 'Labor'


# --- CORE MODELS ---
class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_key = Column(String, unique=True, index=True, nullable=False)
    address = Column(String)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=True) # Null for global roles
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)

class UserRole(Base):
    __tablename__ = "user_roles"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)

class RolePermission(Base):
    __tablename__ = "role_permissions"
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)

class UploadedFile(Base):
    __tablename__ = "uploaded_files"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    uploader_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    original_name = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    mime_type = Column(String, nullable=True)
    file_size_bytes = Column(Integer, default=0)
    resource_type = Column(String, nullable=True) # LabReport, Prescription, PatientDoc
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class HospitalSetting(Base):
    __tablename__ = "hospital_settings"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, unique=True)
    theme_color = Column(String, default="#1e40af")
    currency = Column(String, default="USD")
    timezone = Column(String, default="UTC")
    file_storage_quota_mb = Column(Integer, default=5000)

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_name = Column(String, default="Standard") # Basic, Standard, Enterprise
    status = Column(String, default="Active") # Active, Suspended, Cancelled
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    gender = Column(Enum(GenderEnum), nullable=False)
    
    # New Fields
    phone = Column(String, nullable=True)
    cnic = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    address = Column(Text, nullable=True)
    designation = Column(String, nullable=True) # E.g., Senior Registrar, Ward Nurse
    experience_years = Column(Integer, default=0)
    joining_date = Column(Date, nullable=True)
    employment_status = Column(String, default="Active") # Active, On Leave, Resigned
    shift_preference = Column(String, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    profile_picture_url = Column(String, nullable=True)

    doctor_profile = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    ho_profile = relationship("HouseOfficer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    tmo_profile = relationship("TMOProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    department = relationship("Department")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    
    doctors = relationship("Doctor", back_populates="department")
    rotation_groups = relationship("RotationGroup", secondary="rotation_group_departments", back_populates="departments")

class RotationGroup(Base):
    __tablename__ = "rotation_groups"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)

    departments = relationship("Department", secondary="rotation_group_departments", back_populates="rotation_groups")

class RotationGroupDepartment(Base):
    __tablename__ = "rotation_group_departments"
    rotation_group_id = Column(Integer, ForeignKey("rotation_groups.id", ondelete="CASCADE"), primary_key=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), primary_key=True)


# --- DOCTOR & TRAINING PROFILES ---
class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"))
    specialization = Column(String)
    is_available = Column(Boolean, default=True)
    
    # New Fields
    pmc_number = Column(String, nullable=True)
    qualification = Column(String, nullable=True) # MBBS, FCPS, etc.
    experience_years = Column(Integer, default=0)
    consultation_fee = Column(Float, default=0.0)
    room_number = Column(String, nullable=True)

    user = relationship("User", back_populates="doctor_profile")
    department = relationship("Department", back_populates="doctors")
    shifts = relationship("DoctorShift", back_populates="doctor", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")

class DoctorShift(Base):
    __tablename__ = "doctor_shifts"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    shift_day = Column(String, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room_number = Column(String, nullable=True)

    doctor = relationship("Doctor", back_populates="shifts")

class HouseOfficer(Base):
    __tablename__ = "house_officers"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rotation_group_id = Column(Integer, ForeignKey("rotation_groups.id", ondelete="SET NULL"), nullable=True)
    batch_year = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    user = relationship("User", back_populates="ho_profile")
    rotation_group = relationship("RotationGroup")
    rotations = relationship("Rotation", back_populates="house_officer")
    duty_shifts = relationship("DutyShift", back_populates="house_officer")

class TMOProfile(Base):
    __tablename__ = "tmo_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rotation_group_id = Column(Integer, ForeignKey("rotation_groups.id", ondelete="SET NULL"), nullable=True)
    specialty_program = Column(String, nullable=False)
    supervisor_doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="SET NULL"))
    
    user = relationship("User", back_populates="tmo_profile")
    supervisor = relationship("Doctor")
    logbook_entries = relationship("TMOLogbook", back_populates="tmo")
    rotation_group = relationship("RotationGroup")

class TMOLogbook(Base):
    __tablename__ = "tmo_logbook"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    tmo_id = Column(Integer, ForeignKey("tmo_profiles.id", ondelete="CASCADE"), nullable=False)
    ho_id = Column(Integer, ForeignKey("house_officers.id", ondelete="CASCADE"), nullable=False)
    procedure_name = Column(String, nullable=False)
    date_performed = Column(Date, default=date.today)
    supervisor_approved = Column(Boolean, default=False)
    
    tmo = relationship("TMOProfile", back_populates="logbook_entries")
    house_officer = relationship("HouseOfficer")

class Rotation(Base):
    __tablename__ = "rotations"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    house_officer_id = Column(Integer, ForeignKey("house_officers.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(Enum(RotationStatusEnum), default=RotationStatusEnum.Upcoming)

    house_officer = relationship("HouseOfficer", back_populates="rotations")
    department = relationship("Department")

class DutyShift(Base):
    __tablename__ = "duty_shifts"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    house_officer_id = Column(Integer, ForeignKey("house_officers.id", ondelete="CASCADE"), nullable=False)
    shift_date = Column(Date, nullable=False)
    shift_type = Column(Enum(ShiftTypeEnum), nullable=False)
    is_weekend = Column(Boolean, default=False)
    points_assigned = Column(Float, default=0.0)

    house_officer = relationship("HouseOfficer", back_populates="duty_shifts")

class ShiftSwap(Base):
    __tablename__ = "shift_swaps"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    requester_ho_id = Column(Integer, ForeignKey("house_officers.id", ondelete="CASCADE"), nullable=False)
    acceptor_ho_id = Column(Integer, ForeignKey("house_officers.id", ondelete="CASCADE"), nullable=False)
    shift_to_give_id = Column(Integer, ForeignKey("duty_shifts.id", ondelete="CASCADE"), nullable=False)
    shift_to_take_id = Column(Integer, ForeignKey("duty_shifts.id", ondelete="CASCADE"), nullable=True)
    status = Column(Enum(SwapStatusEnum), default=SwapStatusEnum.Pending_Acceptance)
    
    requester = relationship("HouseOfficer", foreign_keys=[requester_ho_id])
    acceptor = relationship("HouseOfficer", foreign_keys=[acceptor_ho_id])
    shift_to_give = relationship("DutyShift", foreign_keys=[shift_to_give_id])
    shift_to_take = relationship("DutyShift", foreign_keys=[shift_to_take_id])

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    house_officer_id = Column(Integer, ForeignKey("house_officers.id", ondelete="CASCADE"), nullable=False)
    date_requested = Column(Date, default=date.today)
    leave_date = Column(Date, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(Enum(LeaveStatusEnum), default=LeaveStatusEnum.Pending)
    tmo_comment = Column(String, nullable=True)
    
    house_officer = relationship("HouseOfficer")

class HOTask(Base):
    __tablename__ = "ho_tasks"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    tmo_id = Column(Integer, ForeignKey("tmo_profiles.id", ondelete="CASCADE"), nullable=False)
    ho_id = Column(Integer, ForeignKey("house_officers.id", ondelete="CASCADE"), nullable=False)
    task_title = Column(String, nullable=False)
    task_description = Column(String, nullable=True)
    status = Column(Enum(TaskStatusEnum), default=TaskStatusEnum.Pending)
    created_at = Column(DateTime, default=datetime.utcnow)

    tmo = relationship("TMOProfile")
    house_officer = relationship("HouseOfficer")


# --- PATIENT & CLINICAL ---
class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    cnic = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(Enum(GenderEnum))
    emergency_contact = Column(String)
    
    # New Fields
    date_of_birth = Column(Date, nullable=True)
    blood_group = Column(Enum(BloodGroupEnum), default=BloodGroupEnum.Unknown)
    allergies = Column(Text, nullable=True) # JSON serialized
    medical_history = Column(Text, nullable=True) # JSON serialized
    address = Column(Text, nullable=True)
    marital_status = Column(String, nullable=True)
    religion = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    guardian_name = Column(String, nullable=True)
    guardian_phone = Column(String, nullable=True)
    
    appointments = relationship("Appointment", back_populates="patient")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    appointment_date = Column(Date, default=date.today)
    token_number = Column(Integer, nullable=False)
    status = Column(Enum(AppointmentStatusEnum), default=AppointmentStatusEnum.Waiting)
    prescription = Column(JSON, nullable=True) 
    
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    lab_orders = relationship("LabRecord", back_populates="appointment")


class Prescription(Base):
    __tablename__ = "prescriptions"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    medication = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    status = Column(Enum(PrescriptionStatusEnum), default=PrescriptionStatusEnum.Pending)
    follow_up_days = Column(Integer, nullable=True)
    follow_up_type = Column(String, default="Re_Consultation")
    follow_up_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient")
    doctor = relationship("Doctor")

class FollowUpRecord(Base):
    __tablename__ = "follow_up_records"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    
    follow_up_days = Column(Integer, nullable=False, default=7)
    follow_up_date = Column(Date, nullable=True)
    follow_up_type = Column(Enum(FollowUpTypeEnum), default=FollowUpTypeEnum.Re_Consultation)
    notes = Column(Text, nullable=True)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    doctor = relationship("Doctor")
    appointment = relationship("Appointment")

class Vitals(Base):
    __tablename__ = "vitals"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    blood_pressure = Column(String, nullable=True)
    temperature = Column(Float, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    spo2 = Column(Integer, nullable=True)
    respiratory_rate = Column(Integer, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    recorded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    patient = relationship("Patient")
    recorded_by = relationship("User")

# --- WARD & ADMISSIONS (NEW) ---
class WardBed(Base):
    __tablename__ = "ward_beds"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    ward_name = Column(String, nullable=False)
    ward_type = Column(Enum(WardTypeEnum), default=WardTypeEnum.General)
    bed_number = Column(String, nullable=False)
    is_occupied = Column(Boolean, default=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)
    cost_per_day = Column(Float, default=0.0)
    
    patient = relationship("Patient")
    department = relationship("Department")

class Admission(Base):
    __tablename__ = "admissions"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    admitting_doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    ward_bed_id = Column(Integer, ForeignKey("ward_beds.id", ondelete="SET NULL"), nullable=True)
    admission_type = Column(Enum(AdmissionTypeEnum), default=AdmissionTypeEnum.IPD)
    admission_date = Column(DateTime, default=datetime.utcnow)
    discharge_date = Column(DateTime, nullable=True)
    primary_diagnosis = Column(String, nullable=True)
    secondary_diagnosis = Column(String, nullable=True)
    status = Column(Enum(AdmissionStatusEnum), default=AdmissionStatusEnum.Admitted)
    discharge_summary = Column(Text, nullable=True)
    discharge_doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    condition_at_discharge = Column(String, nullable=True)

    patient = relationship("Patient")
    admitting_doctor = relationship("Doctor", foreign_keys=[admitting_doctor_id])
    discharge_doctor = relationship("Doctor", foreign_keys=[discharge_doctor_id])
    ward_bed = relationship("WardBed")


# --- EMERGENCY (NEW) ---
class EmergencyCase(Base):
    __tablename__ = "emergency_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    triage_category = Column(Enum(TriageCategoryEnum), nullable=False)
    arrival_time = Column(DateTime, default=datetime.utcnow)
    mode_of_arrival = Column(String, nullable=True)
    chief_complaint = Column(String, nullable=True)
    attending_doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="Triaged") # Triaged, Under_Treatment, Admitted, Discharged
    disposition_time = Column(DateTime, nullable=True)
    
    patient = relationship("Patient")
    attending_doctor = relationship("Doctor")

class AmbulanceRecord(Base):
    __tablename__ = "ambulance_records"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    vehicle_number = Column(String, nullable=False)
    driver_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    dispatch_time = Column(DateTime, default=datetime.utcnow)
    arrival_time = Column(DateTime, nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)
    pickup_location = Column(String, nullable=True)
    status = Column(String, default="Dispatched") # Available, Dispatched, Returning
    
    driver = relationship("User")
    patient = relationship("Patient")

# --- ICU (NEW) ---
class ICUAdmission(Base):
    __tablename__ = "icu_admissions"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    admission_id = Column(Integer, ForeignKey("admissions.id", ondelete="CASCADE"), nullable=False)
    ventilator_required = Column(Boolean, default=False)
    ventilator_mode = Column(String, nullable=True)
    admission_score = Column(Float, nullable=True) # APACHE/SOFA
    daily_notes = Column(Text, nullable=True)
    nurse_in_charge_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    admission = relationship("Admission")
    nurse = relationship("User")

# --- OPERATION THEATRE (NEW) ---
class OTSchedule(Base):
    __tablename__ = "ot_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    admission_id = Column(Integer, ForeignKey("admissions.id", ondelete="SET NULL"), nullable=True)
    primary_surgeon_id = Column(Integer, ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    ot_room = Column(String, nullable=False)
    surgery_name = Column(String, nullable=False)
    surgery_type = Column(String, default="Elective") # Elective / Emergency
    scheduled_datetime = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    status = Column(Enum(OTStatusEnum), default=OTStatusEnum.Scheduled)
    pre_op_diagnosis = Column(String, nullable=True)
    post_op_diagnosis = Column(String, nullable=True)
    anesthesia_type = Column(String, nullable=True)
    ot_notes = Column(Text, nullable=True)
    
    patient = relationship("Patient")
    primary_surgeon = relationship("Doctor")

# --- RADIOLOGY & LAB ---
class LabRecord(Base):
    __tablename__ = "lab_records"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=True)
    test_name = Column(String, nullable=False)
    status = Column(String, default="Pending") # Pending, Processing, Completed
    results_text = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient")
    appointment = relationship("Appointment", back_populates="lab_orders")

class LabTest(Base):
    # This was in the original file, keeping it for compatibility
    __tablename__ = "lab_tests"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    test_name = Column(String, nullable=False)
    result = Column(String, nullable=True)
    status = Column(Enum(LabTestStatusEnum), default=LabTestStatusEnum.Pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient")
    doctor = relationship("Doctor")

class RadiologyOrder(Base):
    __tablename__ = "radiology_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    ordering_doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    test_type = Column(Enum(RadiologyTypeEnum), nullable=False)
    body_part = Column(String, nullable=True)
    clinical_indication = Column(String, nullable=True)
    priority = Column(String, default="Routine")
    status = Column(String, default="Ordered") # Ordered, Scheduled, In_Progress, Completed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient")
    doctor = relationship("Doctor")

class RadiologyReport(Base):
    __tablename__ = "radiology_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("radiology_orders.id", ondelete="CASCADE"), nullable=False)
    findings = Column(Text, nullable=True)
    impression = Column(Text, nullable=True)
    reported_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    report_date = Column(DateTime, default=datetime.utcnow)
    
    order = relationship("RadiologyOrder")

# --- BLOOD BANK (NEW) ---
class BloodStock(Base):
    __tablename__ = "blood_stock"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    blood_group = Column(Enum(BloodGroupEnum), nullable=False)
    component = Column(Enum(BloodComponentEnum), default=BloodComponentEnum.Whole_Blood)
    units_available = Column(Integer, default=0)
    collection_date = Column(Date, default=date.today)
    expiry_date = Column(Date, nullable=False)

# --- HR & ATTENDANCE ---
class Attendance(Base):
    # This was the old one used only for Doctors. Let's rename it to EmployeeAttendance for everyone.
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=True) # Kept for backward compatibility
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    login_date = Column(Date, default=date.today)
    check_in = Column(DateTime, default=datetime.utcnow)
    check_out = Column(DateTime, nullable=True)
    status = Column(Enum(AttendanceStatusEnum), default=AttendanceStatusEnum.Present)
    
    doctor = relationship("Doctor", back_populates="attendances")
    user = relationship("User")

# --- INVENTORY & PHARMACY ---
class Inventory(Base):
    __tablename__ = "inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String, nullable=False)
    category = Column(String, nullable=True) # Medicine, Surgical, Disposable
    supplier = Column(String, nullable=True)
    batch_number = Column(String, nullable=True)
    unit_price = Column(Float, default=0.0)
    quantity = Column(Integer, default=0)
    threshold_limit = Column(Integer, default=10)
    expiry_date = Column(Date, nullable=True)
    purchase_date = Column(Date, default=date.today)

# --- BILLING ---
class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    invoice_type = Column(String, default="Consultation") # Consultation, Lab, Pharmacy, Admission
    payment_method = Column(Enum(PaymentMethodEnum), nullable=True)
    payment_date = Column(DateTime, nullable=True)
    status = Column(Enum(InvoiceStatusEnum), default=InvoiceStatusEnum.Unpaid)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient")

# --- MEDICAL RECORDS (NEW) ---
class MedicalRecord(Base):
    __tablename__ = "medical_records"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    visit_type = Column(String, default="OPD") # OPD, IPD, Emergency
    visit_date = Column(DateTime, default=datetime.utcnow)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="SET NULL"), nullable=True)
    chief_complaint = Column(Text, nullable=True)
    history_of_present_illness = Column(Text, nullable=True)
    past_medical_history = Column(Text, nullable=True)
    examination_findings = Column(Text, nullable=True)
    diagnosis = Column(String, nullable=True)
    treatment_plan = Column(Text, nullable=True)
    
    patient = relationship("Patient")
    doctor = relationship("Doctor")

# --- NEW 30-DEPARTMENT ENTERPRISE MODELS ---

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False) # E.g., CREATE_PATIENT, DISPENSE_MED, VERIFY_LAB
    module = Column(String, nullable=False) # E.g., Pharmacy, Admissions, System
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class CSSDBatch(Base):
    __tablename__ = "cssd_batches"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    batch_number = Column(String, nullable=False)
    autoclave_number = Column(String, default="Autoclave-1")
    temperature_celsius = Column(Float, default=134.0)
    pressure_bar = Column(Float, default=2.1)
    cycle_time_minutes = Column(Integer, default=30)
    biological_indicator_pass = Column(Boolean, default=True)
    status = Column(String, default="Passed") # Passed, In_Progress, Failed
    operator_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LedgerExpense(Base):
    __tablename__ = "ledger_expenses"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False) # Medical Supplies, Utility, Payroll, Maintenance
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    vendor_name = Column(String, nullable=True)
    payment_status = Column(String, default="Paid") # Paid, Pending, Overdue
    entry_date = Column(Date, default=date.today)

class QAIncident(Base):
    __tablename__ = "qa_incidents"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    department_name = Column(String, nullable=False)
    severity = Column(String, default="Low") # Low, Medium, High, Critical
    description = Column(Text, nullable=False)
    reported_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="Open") # Open, Under_Review, Resolved
    reported_at = Column(DateTime, default=datetime.utcnow)

class InfectionReport(Base):
    __tablename__ = "infection_reports"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    infection_type = Column(String, nullable=False) # E.g., SSI, CLABSI, CAUTI, VAP
    isolation_required = Column(Boolean, default=False)
    organism_detected = Column(String, nullable=True)
    status = Column(String, default="Active") # Active, Cleared
    reported_at = Column(DateTime, default=datetime.utcnow)
    
    patient = relationship("Patient")

class BiomedicalAsset(Base):
    __tablename__ = "biomedical_assets"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    asset_name = Column(String, nullable=False)
    model_number = Column(String, nullable=True)
    department_name = Column(String, nullable=False)
    last_ppm_date = Column(Date, nullable=True)
    next_ppm_date = Column(Date, nullable=True)
    status = Column(String, default="Operational") # Operational, Under_Maintenance, Breakdown

class FacilityWorkOrder(Base):
    __tablename__ = "facility_work_orders"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False) # Plumbing, Electrical, HVAC, Carpentry
    location = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String, default="Medium") # Low, Medium, High, Urgent
    status = Column(String, default="Pending") # Pending, In_Progress, Completed
    created_at = Column(DateTime, default=datetime.utcnow)

class HousekeepingLog(Base):
    __tablename__ = "housekeeping_logs"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    ward_bed_id = Column(Integer, ForeignKey("ward_beds.id", ondelete="CASCADE"), nullable=False)
    task_type = Column(String, default="Terminal Cleaning") # Terminal Cleaning, Routine Sanitize
    status = Column(String, default="Cleaned") # Cleaned, In_Progress, Pending
    cleaned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    ward_bed = relationship("WardBed")

class VisitorPass(Base):
    __tablename__ = "visitor_passes"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    visitor_name = Column(String, nullable=False)
    visitor_cnic = Column(String, nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    pass_number = Column(String, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Active") # Active, Checked_Out

    patient = relationship("Patient")

class DietOrder(Base):
    __tablename__ = "diet_orders"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    diet_type = Column(String, nullable=False) # Diabetic, Renal, Soft, High Protein, Liquid
    special_instructions = Column(Text, nullable=True)
    status = Column(String, default="Active") # Active, Discontinued
    ordered_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")

class MortuaryRecord(Base):
    __tablename__ = "mortuary_records"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    deceased_name = Column(String, nullable=False)
    chamber_number = Column(String, nullable=False)
    date_of_death = Column(DateTime, default=datetime.utcnow)
    cause_of_death = Column(String, nullable=True)
    death_certificate_issued = Column(Boolean, default=False)
    status = Column(String, default="In_Mortuary") # In_Mortuary, Released


class MedicationOrder(Base):
    __tablename__ = "medication_orders"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    prescribing_doctor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    medication_name = Column(String, nullable=False)
    generic_name = Column(String, nullable=True)
    brand_name = Column(String, nullable=True)
    drug_class = Column(String, nullable=True)
    strength = Column(String, nullable=True)
    prescribed_dose = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    route = Column(String, nullable=False)
    frequency = Column(String, nullable=False) # e.g. BD, TDS, QID, OD, PRN
    schedule = Column(String, nullable=False) # e.g. "08:00 AM, 08:00 PM"
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    clinical_indication = Column(String, nullable=True)
    special_instructions = Column(Text, nullable=True)
    status = Column(String, default="Active") # Active, Discontinued, Completed
    is_prn = Column(Boolean, default=False)
    prn_criteria = Column(String, nullable=True) # e.g. "Fever above 38°C"
    barcode = Column(String, nullable=True)

    patient = relationship("Patient")
    prescribing_doctor = relationship("User", foreign_keys=[prescribing_doctor_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    emar_logs = relationship("EMARLog", back_populates="order", cascade="all, delete-orphan")
    schedules = relationship("MedicationSchedule", back_populates="order", cascade="all, delete-orphan")


class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("medication_orders.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    status = Column(String, default="Pending Administration") # Pending Administration, Completed, Missed, Held
    administered_at = Column(DateTime, nullable=True)
    administered_by_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actual_dose = Column(String, nullable=True)
    actual_route = Column(String, nullable=True)
    missed_reason = Column(String, nullable=True)
    missed_remarks = Column(Text, nullable=True)
    delay_status = Column(String, default="On Time") # On Time, Late Administration, Critical Delay
    delay_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("MedicationOrder", back_populates="schedules")
    patient = relationship("Patient")
    administered_by_nurse = relationship("User", foreign_keys=[administered_by_nurse_id])


class EMARLog(Base):
    __tablename__ = "emar_logs"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("medication_orders.id", ondelete="CASCADE"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("medication_schedules.id", ondelete="SET NULL"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    administered_by_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    administered_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Given") # Given, Missed, Refused
    actual_dose = Column(String, nullable=True)
    actual_route = Column(String, nullable=True)
    five_rights_verified = Column(Boolean, default=True)
    wristband_scanned = Column(Boolean, default=True)
    med_barcode_scanned = Column(Boolean, default=True)
    allergy_override = Column(Boolean, default=False)
    override_consultant_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    override_reason = Column(Text, nullable=True)
    digital_signature = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    device_id = Column(String, default="NURSING-TERMINAL-01")
    inventory_deducted = Column(Boolean, default=False)

    order = relationship("MedicationOrder", back_populates="emar_logs")
    patient = relationship("Patient")
    administered_by_nurse = relationship("User", foreign_keys=[administered_by_nurse_id])
    override_consultant = relationship("User", foreign_keys=[override_consultant_id])


class PatientAllergy(Base):
    __tablename__ = "patient_allergies"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    allergen = Column(String, nullable=False) # e.g. Penicillin, Sulfa, Aspirin
    allergy_type = Column(String, default="Drug") # Drug, Food, Environmental
    reaction = Column(String, nullable=True) # Rash, Anaphylaxis, Bronchospasm
    severity = Column(String, default="Severe") # Mild, Moderate, Severe
    documented_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")


class NursingChecklist(Base):
    __tablename__ = "nursing_checklists"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    task_name = Column(String, nullable=False) # e.g. Insulin Given, IV Antibiotic Given, Foley Catheter Care
    category = Column(String, default="Routine") # Medication, Procedure, Vitals, Care
    is_completed = Column(Boolean, default=False)
    completed_by_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    remarks = Column(Text, nullable=True)

    patient = relationship("Patient")
    completed_by_nurse = relationship("User", foreign_keys=[completed_by_nurse_id])


class NursingNote(Base):
    __tablename__ = "nursing_notes"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    shift = Column(String, default="Morning Shift") # Morning, Evening, Night
    patient_condition = Column(String, nullable=True) # Stable, Critical, Fair
    medication_response = Column(Text, nullable=True)
    pain_assessment = Column(String, nullable=True) # 0/10 to 10/10
    new_symptoms = Column(Text, nullable=True)
    escalations_made = Column(Text, nullable=True)
    follow_up_required = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    nurse = relationship("User", foreign_keys=[nurse_id])


# --- 20, 21, 22, 23: PHARMACY WORKFLOW & SHORTAGE REQUESTS ---
class PharmacyRequest(Base):
    __tablename__ = "pharmacy_requests"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    medication_order_id = Column(Integer, ForeignKey("medication_orders.id", ondelete="SET NULL"), nullable=True)
    ward_name = Column(String, nullable=False)
    bed_number = Column(String, nullable=False)
    medication_name = Column(String, nullable=False)
    strength = Column(String, nullable=True)
    prescribed_dose = Column(String, nullable=False)
    required_quantity = Column(Integer, default=1)
    urgency_level = Column(String, default="Routine") # Routine, Urgent, Emergency
    status = Column(String, default="Pending Pharmacy Verification") 
    # Pending Pharmacy Verification, Reserved, Ready for Collection, In Transit, Delivered to Ward, Out of Stock, Alternative Suggested, Cancelled
    prescribing_doctor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    requested_by_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    pharmacy_officer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    collection_time = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient")
    prescribing_doctor = relationship("User", foreign_keys=[prescribing_doctor_id])
    requested_by_nurse = relationship("User", foreign_keys=[requested_by_nurse_id])
    pharmacy_officer = relationship("User", foreign_keys=[pharmacy_officer_id])
    order = relationship("MedicationOrder")
    substitutions = relationship("MedicationSubstitution", back_populates="request", cascade="all, delete-orphan")


class MedicationSubstitution(Base):
    __tablename__ = "medication_substitutions"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    pharmacy_request_id = Column(Integer, ForeignKey("pharmacy_requests.id", ondelete="CASCADE"), nullable=False)
    original_medication = Column(String, nullable=False)
    suggested_alternative = Column(String, nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="Pending Doctor Approval") # Pending Doctor Approval, Approved, Rejected
    approval_time = Column(DateTime, nullable=True)
    pharmacy_officer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    request = relationship("PharmacyRequest", back_populates="substitutions")
    doctor = relationship("User", foreign_keys=[doctor_id])
    pharmacy_officer = relationship("User", foreign_keys=[pharmacy_officer_id])


# --- 24, 25, 26, 27: WARD INVENTORY & FEFO BATCH TRACKING ---
class WardInventory(Base):
    __tablename__ = "ward_inventories"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    ward_name = Column(String, nullable=False) # e.g. Medicine Ward A, ICU, Emergency
    item_name = Column(String, nullable=False)
    category = Column(String, default="Medicine") # Medicine, Surgical, Disposable, Narcotics
    current_stock = Column(Integer, default=0)
    reserved_stock = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)

    batches = relationship("MedicationBatch", back_populates="ward_inventory", cascade="all, delete-orphan")


class MedicationBatch(Base):
    __tablename__ = "medication_batches"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    ward_inventory_id = Column(Integer, ForeignKey("ward_inventories.id", ondelete="CASCADE"), nullable=False)
    batch_number = Column(String, nullable=False)
    mfg_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=False)
    supplier = Column(String, nullable=True)
    quantity_available = Column(Integer, default=0)
    is_narcotic = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    ward_inventory = relationship("WardInventory", back_populates="batches")


# --- 28: WARD STOCK TRANSFERS ---
class WardStockTransfer(Base):
    __tablename__ = "ward_stock_transfers"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    sending_ward = Column(String, nullable=False)
    receiving_ward = Column(String, nullable=False)
    item_name = Column(String, nullable=False)
    batch_number = Column(String, nullable=True)
    quantity = Column(Integer, nullable=False)
    reason = Column(String, nullable=True)
    approved_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    requested_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="Completed")
    created_at = Column(DateTime, default=datetime.utcnow)

    approved_by = relationship("User", foreign_keys=[approved_by_id])
    requested_by = relationship("User", foreign_keys=[requested_by_id])


# --- 29, 30: CONTROLLED MEDICATION (NARCOTICS REGISTER & SHIFT COUNT) ---
class ControlledMedicationLog(Base):
    __tablename__ = "controlled_medication_logs"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    medication_name = Column(String, nullable=False) # e.g. Morphine, Fentanyl, Pethidine
    batch_number = Column(String, nullable=False)
    quantity_issued = Column(Float, default=1.0)
    quantity_administered = Column(Float, default=1.0)
    quantity_remaining = Column(Float, default=0.0)
    primary_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    witness_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    prescribing_doctor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    primary_signature = Column(String, nullable=True)
    witness_signature = Column(String, nullable=True)
    administered_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    primary_nurse = relationship("User", foreign_keys=[primary_nurse_id])
    witness_nurse = relationship("User", foreign_keys=[witness_nurse_id])
    prescribing_doctor = relationship("User", foreign_keys=[prescribing_doctor_id])


class ControlledMedicationShiftCount(Base):
    __tablename__ = "controlled_shift_counts"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    ward_name = Column(String, nullable=False)
    shift_name = Column(String, nullable=False) # Morning, Evening, Night
    medication_name = Column(String, nullable=False)
    expected_quantity = Column(Integer, nullable=False)
    actual_quantity = Column(Integer, nullable=False)
    discrepancy_count = Column(Integer, default=0)
    has_discrepancy = Column(Boolean, default=False)
    counted_by_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    charge_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    remarks = Column(Text, nullable=True)
    status = Column(String, default="Balanced") # Balanced, Discrepancy Under Investigation
    created_at = Column(DateTime, default=datetime.utcnow)

    counted_by_nurse = relationship("User", foreign_keys=[counted_by_nurse_id])
    charge_nurse = relationship("User", foreign_keys=[charge_nurse_id])


# --- 31, 32, 33: INFUSION & IV DRIP MANAGEMENT & MONITORING ---
class InfusionRecord(Base):
    __tablename__ = "infusion_records"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    iv_fluid_name = Column(String, nullable=False) # e.g. Normal Saline 0.9%, Ringer's Lactate
    volume_ml = Column(Integer, default=500)
    start_time = Column(DateTime, default=datetime.utcnow)
    expected_finish_time = Column(DateTime, nullable=False)
    flow_rate_ml_hr = Column(Integer, default=125)
    route = Column(String, default="Peripheral IV")
    iv_site = Column(String, default="Right Forearm 18G")
    administering_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ordering_doctor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="Running") # Running, Paused, Completed, Infiltration Reported, Blocked
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    administering_nurse = relationship("User", foreign_keys=[administering_nurse_id])
    ordering_doctor = relationship("User", foreign_keys=[ordering_doctor_id])
    monitoring_logs = relationship("InfusionMonitoringLog", back_populates="infusion", cascade="all, delete-orphan")


class InfusionMonitoringLog(Base):
    __tablename__ = "infusion_monitoring_logs"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    infusion_id = Column(Integer, ForeignKey("infusion_records.id", ondelete="CASCADE"), nullable=False)
    nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String, nullable=False) # Flow Rate Change, Pause, Site Assessment, Infiltration, Leakage, Blocked Cannula, Cannula Replacement, Completed
    new_flow_rate = Column(Integer, nullable=True)
    site_condition = Column(String, default="Clear / No Swelling")
    remarks = Column(Text, nullable=True)
    logged_at = Column(DateTime, default=datetime.utcnow)

    infusion = relationship("InfusionRecord", back_populates="monitoring_logs")
    nurse = relationship("User", foreign_keys=[nurse_id])


# --- 34: BLOOD PRODUCT ADMINISTRATION ---
class BloodTransfusionRecord(Base):
    __tablename__ = "blood_transfusion_records"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    blood_unit_number = Column(String, nullable=False) # e.g. WB-2026-8801
    blood_group = Column(String, nullable=False)
    component = Column(String, default="Whole Blood") # Whole Blood, PRBC, FFP, Platelets
    donor_id = Column(String, nullable=True)
    crossmatch_status = Column(String, default="Compatible")
    consent_verified = Column(Boolean, default=True)
    expiry_date = Column(Date, nullable=False)
    ordering_doctor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    primary_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    witness_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    pre_vitals_bp = Column(String, nullable=True)
    pre_vitals_temp = Column(Float, nullable=True)
    pre_vitals_hr = Column(Integer, nullable=True)
    start_time = Column(DateTime, default=datetime.utcnow)
    completion_time = Column(DateTime, nullable=True)
    status = Column(String, default="In Progress") # In Progress, Completed, Reaction Alert
    post_vitals_temp = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    ordering_doctor = relationship("User", foreign_keys=[ordering_doctor_id])
    primary_nurse = relationship("User", foreign_keys=[primary_nurse_id])
    witness_nurse = relationship("User", foreign_keys=[witness_nurse_id])


# --- 35: INVENTORY SECURITY & MANUAL ADJUSTMENT LOGS ---
class InventoryAdjustmentLog(Base):
    __tablename__ = "inventory_adjustment_logs"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    ward_inventory_id = Column(Integer, ForeignKey("ward_inventories.id", ondelete="CASCADE"), nullable=False)
    adjustment_type = Column(String, nullable=False) # Manual Adjustment, Wastage, Expiries, Unexplained Loss
    quantity_changed = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    supervisor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    digital_signature = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    ward_inventory = relationship("WardInventory")
    supervisor = relationship("User", foreign_keys=[supervisor_id])


# --- 36 & 37: SHIFT MANAGEMENT & DIGITAL SHIFT HANDOVER ---
class NursingShiftLog(Base):
    __tablename__ = "nursing_shift_logs"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    nurse_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    shift_type = Column(String, nullable=False) # Morning, Evening, Night
    ward_name = Column(String, nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, default="Active") # Active, Handover Pending, Shift Closed
    charge_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    total_pending_tasks = Column(Integer, default=0)
    total_completed_tasks = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    nurse = relationship("User", foreign_keys=[nurse_id])
    charge_nurse = relationship("User", foreign_keys=[charge_nurse_id])


class ShiftHandoverReport(Base):
    __tablename__ = "shift_handover_reports"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    outgoing_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    incoming_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ward_name = Column(String, nullable=False)
    shift_type = Column(String, nullable=False)
    patient_summary_json = Column(Text, nullable=True)
    outstanding_tasks_json = Column(Text, nullable=True)
    patient_changes_json = Column(Text, nullable=True)
    critical_notes_json = Column(Text, nullable=True)
    inventory_narcotic_json = Column(Text, nullable=True)
    outgoing_signature = Column(String, nullable=False)
    incoming_signature = Column(String, nullable=True)
    status = Column(String, default="Draft") # Draft, Acknowledged
    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)

    outgoing_nurse = relationship("User", foreign_keys=[outgoing_nurse_id])
    incoming_nurse = relationship("User", foreign_keys=[incoming_nurse_id])


# --- 38 & 39: VITAL SIGNS MONITORING & EARLY WARNING SCORE (EWS) ---
class VitalSign(Base):
    __tablename__ = "vital_signs"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    recorded_by_nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    blood_pressure = Column(String, nullable=True) # e.g. 120/80
    systolic = Column(Integer, nullable=True)
    diastolic = Column(Integer, nullable=True)
    pulse_rate = Column(Integer, nullable=True) # bpm
    respiratory_rate = Column(Integer, nullable=True) # breaths/min
    temperature = Column(Float, nullable=True) # °C
    spo2 = Column(Integer, nullable=True) # %
    blood_sugar = Column(Float, nullable=True) # mg/dL
    pain_score = Column(Integer, default=0) # 0-10
    gcs_score = Column(Integer, default=15) # 3-15
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)
    ews_score = Column(Integer, default=0)
    ews_category = Column(String, default="Low Risk") # Low Risk, Medium Risk, High Risk / Deteriorating
    recorded_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    recorded_by_nurse = relationship("User", foreign_keys=[recorded_by_nurse_id])


# --- 41: INTAKE & OUTPUT (FLUID BALANCE) ---
class FluidBalanceRecord(Base):
    __tablename__ = "fluid_balance_records"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    shift = Column(String, default="Morning Shift")
    iv_fluids_ml = Column(Integer, default=0)
    oral_fluids_ml = Column(Integer, default=0)
    tube_feeding_ml = Column(Integer, default=0)
    blood_products_ml = Column(Integer, default=0)
    medications_ml = Column(Integer, default=0)
    total_intake_ml = Column(Integer, default=0)
    urine_ml = Column(Integer, default=0)
    stool_ml = Column(Integer, default=0)
    vomiting_ml = Column(Integer, default=0)
    drain_output_ml = Column(Integer, default=0)
    blood_loss_ml = Column(Integer, default=0)
    dialysis_output_ml = Column(Integer, default=0)
    total_output_ml = Column(Integer, default=0)
    net_balance_ml = Column(Integer, default=0)
    is_abnormal = Column(Boolean, default=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    nurse = relationship("User", foreign_keys=[nurse_id])


# --- 42: WOUND & DRESSING MANAGEMENT ---
class WoundDressingRecord(Base):
    __tablename__ = "wound_dressing_records"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    wound_type = Column(String, nullable=False) # e.g. Surgical Incision, Pressure Ulcer, Burn, Abrasion
    location = Column(String, nullable=False) # Sacrum, Right Heel, Abdomen
    size_cm = Column(String, nullable=True) # 4x3 cm
    stage = Column(String, default="Stage 1") # Stage 1 to 4, Unstageable
    appearance = Column(String, default="Clean / Granulating")
    signs_of_infection = Column(String, default="None") # Erythema, Purulent Exudate, Odor
    dressing_type = Column(String, default="Sterile Gauze & Honey Dressing")
    dressing_date = Column(DateTime, default=datetime.utcnow)
    next_dressing_due = Column(DateTime, nullable=False)
    is_due = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    nurse = relationship("User", foreign_keys=[nurse_id])


# --- 43: FALL RISK MANAGEMENT ---
class FallRiskAssessment(Base):
    __tablename__ = "fall_risk_assessments"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    score = Column(Integer, default=0)
    risk_level = Column(String, default="Low Risk") # Low Risk, Moderate Risk, High Risk
    interventions_json = Column(Text, nullable=True)
    assessed_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    nurse = relationship("User", foreign_keys=[nurse_id])


# --- 44: PRESSURE INJURY PREVENTION PLAN ---
class PressureInjuryPlan(Base):
    __tablename__ = "pressure_injury_plans"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    position_change_interval_hrs = Column(Integer, default=2)
    last_position_change = Column(DateTime, default=datetime.utcnow)
    next_position_due = Column(DateTime, nullable=False)
    skin_assessment_notes = Column(Text, nullable=True)
    mattress_type = Column(String, default="Alternating Pressure Air Mattress")
    missed_alerts_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    nurse = relationship("User", foreign_keys=[nurse_id])


# --- 45: INFECTION PREVENTION CHECKLIST ---
class InfectionPreventionLog(Base):
    __tablename__ = "infection_prevention_logs"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    nurse_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    hand_hygiene = Column(Boolean, default=True)
    ppe_worn = Column(Boolean, default=True)
    isolation_protocol = Column(Boolean, default=False)
    sterile_technique = Column(Boolean, default=True)
    catheter_care = Column(Boolean, default=True)
    central_line_care = Column(Boolean, default=True)
    surgical_site_assessed = Column(Boolean, default=True)
    logged_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    nurse = relationship("User", foreign_keys=[nurse_id])


# --- 46, 47, 48: INCIDENT & NEAR MISS REPORTING ---
class ClinicalIncidentReport(Base):
    __tablename__ = "clinical_incident_reports"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="SET NULL"), nullable=True)
    reported_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    incident_type = Column(String, nullable=False) # Patient Fall, Medication Error, Needle Stick, Near Miss, Equipment Failure
    severity = Column(String, default="Minor") # Minor, Moderate, Severe, Critical
    is_near_miss = Column(Boolean, default=False)
    description = Column(Text, nullable=False)
    immediate_actions = Column(Text, nullable=True)
    witnesses = Column(String, nullable=True)
    notified_departments_json = Column(Text, nullable=True)
    digital_signature = Column(String, nullable=False)
    status = Column(String, default="Reported") # Reported, Under QA Review, Closed
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    reported_by = relationship("User", foreign_keys=[reported_by_id])


# --- 49: CLINICAL ESCALATION LOGS ---
class ClinicalEscalationLog(Base):
    __tablename__ = "clinical_escalation_logs"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    trigger_type = Column(String, nullable=False) # Critical Vitals EWS, Missed Medication, Infusion Overdue, Deteriorating Patient
    level = Column(String, nullable=False) # Level 1: Nurse, Level 2: Charge Nurse, Level 3: TMO, Level 4: Consultant
    target_role = Column(String, nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    message = Column(Text, nullable=False)
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")
    target_user = relationship("User", foreign_keys=[target_user_id])


# --- 58: INTERNAL NOTIFICATIONS & COMMUNICATION SYSTEM ---
class InternalNotification(Base):
    __tablename__ = "internal_notifications"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String, default="General") # Doctor Order, Pharmacy Delivery, Lab Result, Radiology, Critical Alert, Emergency Code, Shift Change, Inventory Alert
    priority = Column(String, default="Normal") # Normal, High, Critical
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


# --- 56 & 59: QUALITY AUDIT LOGS ---
class QualityAuditLog(Base):
    __tablename__ = "quality_audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    auditor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    module_audited = Column(String, nullable=False) # Hand Hygiene, eMAR, Shift Handover, Controlled Drugs, Documentation
    compliance_score = Column(Float, default=100.0)
    findings = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    auditor = relationship("User", foreign_keys=[auditor_id])




