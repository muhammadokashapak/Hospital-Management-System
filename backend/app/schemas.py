from pydantic import BaseModel, Field, field_validator, validator
from typing import Optional, List, Any, Dict
from datetime import datetime, date, time
from .models import (
    RoleEnum, GenderEnum, AppointmentStatusEnum, AdmissionStatusEnum, AdmissionTypeEnum,
    BloodGroupEnum, TriageCategoryEnum, OTStatusEnum, RadiologyTypeEnum, BloodComponentEnum,
    AttendanceStatusEnum, PaymentMethodEnum, WardTypeEnum, ShiftTypeEnum, SwapStatusEnum,
    LeaveStatusEnum, TaskStatusEnum, PrescriptionStatusEnum, LabTestStatusEnum, InvoiceStatusEnum
)
import re

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[RoleEnum] = None


# --- User Schemas ---
class UserRegister(BaseModel):
    hospital_id: Optional[int] = None
    email: str
    password: str
    full_name: str
    role: RoleEnum
    gender: GenderEnum
    department_id: Optional[int] = None
    
    # New Fields
    phone: Optional[str] = None
    cnic: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    designation: Optional[str] = None
    experience_years: Optional[int] = 0
    joining_date: Optional[date] = None

    @field_validator('password')
    def password_length(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserBase(BaseModel):
    email: str
    full_name: str
    role: RoleEnum
    phone: Optional[str] = None
    cnic: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[int] = None

class UserCreate(UserBase):
    password: str
    gender: GenderEnum
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    experience_years: Optional[int] = 0
    joining_date: Optional[date] = None

class UserResponse(UserBase):
    id: int
    gender: GenderEnum
    
    class Config:
        from_attributes = True


# --- Department Schemas ---
class DepartmentBase(BaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: int
    
    class Config:
        from_attributes = True


# --- Doctor Schemas ---
class DoctorShiftBase(BaseModel):
    shift_day: str
    start_time: time
    end_time: time
    room_number: Optional[str] = None

class DoctorShiftCreate(DoctorShiftBase):
    doctor_id: int

class DoctorShiftResponse(DoctorShiftBase):
    id: int
    
    class Config:
        from_attributes = True

class DoctorBase(BaseModel):
    specialization: Optional[str] = None
    is_available: bool = True
    pmc_number: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = 0
    consultation_fee: Optional[float] = 0.0
    room_number: Optional[str] = None

class DoctorCreate(DoctorBase):
    user_id: int
    department_id: int

class DoctorResponse(DoctorBase):
    id: int
    user: UserResponse
    department: Optional[DepartmentResponse] = None
    shifts: List[DoctorShiftResponse] = []
    
    class Config:
        from_attributes = True


# --- Patient Schemas ---
class PatientBase(BaseModel):
    phone: str
    cnic: Optional[str] = None
    full_name: str
    age: Optional[int] = None
    gender: Optional[GenderEnum] = GenderEnum.Other
    emergency_contact: Optional[str] = None
    
    # New Fields
    date_of_birth: Optional[date] = None
    blood_group: Optional[BloodGroupEnum] = BloodGroupEnum.Unknown
    allergies: Optional[str] = None 
    medical_history: Optional[str] = None
    address: Optional[str] = None
    marital_status: Optional[str] = None
    religion: Optional[str] = None
    occupation: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None

class PatientCreate(PatientBase):
    @field_validator('phone')
    def validate_phone(cls, v):
        if not re.match(r'^\d{4}-\d{7}$', v) and not re.match(r'^\d{11}$', v):
            raise ValueError('Invalid phone format (expected 0300-1234567 or 03001234567)')
        return v
        
    @field_validator('cnic')
    def validate_cnic(cls, v):
        if v and not re.match(r'^\d{5}-\d{7}-\d{1}$', v):
            raise ValueError('Invalid CNIC format (expected XXXXX-XXXXXXX-X)')
        return v

class PatientResponse(PatientBase):
    id: int
    
    class Config:
        from_attributes = True


# --- Appointment Schemas ---
class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    prescription: Optional[Dict[str, Any]] = None

class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: Optional[date] = None

class AppointmentUpdateStatus(BaseModel):
    status: AppointmentStatusEnum
    prescription: Optional[Dict[str, Any]] = None

class AppointmentResponse(AppointmentBase):
    id: int
    appointment_date: date
    token_number: int
    status: AppointmentStatusEnum
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None
    
    class Config:
        from_attributes = True


# --- New Schemas (Admissions, Wards, etc.) ---
class WardBedBase(BaseModel):
    ward_name: str
    ward_type: WardTypeEnum
    bed_number: str
    cost_per_day: Optional[float] = 0.0
    is_occupied: bool = False
    patient_id: Optional[int] = None

class WardBedResponse(WardBedBase):
    id: int
    patient: Optional[PatientResponse] = None
    
    class Config:
        from_attributes = True

class AdmissionBase(BaseModel):
    patient_id: int
    admitting_doctor_id: Optional[int] = None
    ward_bed_id: Optional[int] = None
    admission_type: AdmissionTypeEnum
    primary_diagnosis: Optional[str] = None
    secondary_diagnosis: Optional[str] = None
    status: AdmissionStatusEnum = AdmissionStatusEnum.Admitted

class AdmissionCreate(AdmissionBase):
    pass

class AdmissionRequestCreate(BaseModel):
    patient_id: int
    primary_diagnosis: Optional[str] = None
    admission_type: AdmissionTypeEnum = AdmissionTypeEnum.IPD
class AdmissionResponse(AdmissionBase):
    id: int
    admission_date: datetime
    discharge_date: Optional[datetime] = None
    discharge_summary: Optional[str] = None
    condition_at_discharge: Optional[str] = None
    patient: Optional[PatientResponse] = None
    admitting_doctor: Optional[DoctorResponse] = None
    ward_bed: Optional[WardBedResponse] = None

    class Config:
        from_attributes = True


# --- Emergency Schemas ---
class EmergencyCaseBase(BaseModel):
    patient_id: int
    triage_category: TriageCategoryEnum
    mode_of_arrival: Optional[str] = None
    chief_complaint: Optional[str] = None
    attending_doctor_id: Optional[int] = None
    status: str = "Triaged"

class EmergencyCaseCreate(EmergencyCaseBase):
    pass

class EmergencyCaseResponse(EmergencyCaseBase):
    id: int
    arrival_time: datetime
    disposition_time: Optional[datetime] = None
    patient: Optional[PatientResponse] = None
    attending_doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True


# --- ICU Schemas ---
class ICUAdmissionBase(BaseModel):
    admission_id: int
    ventilator_required: bool = False
    ventilator_mode: Optional[str] = None
    admission_score: Optional[float] = None
    daily_notes: Optional[str] = None
    nurse_in_charge_id: Optional[int] = None

class ICUAdmissionCreate(ICUAdmissionBase):
    pass

class ICUAdmissionResponse(ICUAdmissionBase):
    id: int
    admission: Optional[AdmissionResponse] = None

    class Config:
        from_attributes = True


# --- OT Schemas ---
class OTScheduleBase(BaseModel):
    patient_id: int
    admission_id: Optional[int] = None
    primary_surgeon_id: Optional[int] = None
    ot_room: str
    surgery_name: str
    surgery_type: str = "Elective"
    scheduled_datetime: datetime
    status: OTStatusEnum = OTStatusEnum.Scheduled
    pre_op_diagnosis: Optional[str] = None
    anesthesia_type: Optional[str] = None

class OTScheduleCreate(OTScheduleBase):
    pass

class OTScheduleResponse(OTScheduleBase):
    id: int
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    post_op_diagnosis: Optional[str] = None
    ot_notes: Optional[str] = None
    patient: Optional[PatientResponse] = None
    primary_surgeon: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True


# --- Radiology Schemas ---
class RadiologyOrderBase(BaseModel):
    patient_id: int
    ordering_doctor_id: Optional[int] = None
    test_type: RadiologyTypeEnum
    body_part: Optional[str] = None
    clinical_indication: Optional[str] = None
    priority: str = "Routine"
    status: str = "Ordered"

class RadiologyOrderCreate(RadiologyOrderBase):
    pass

class RadiologyOrderResponse(RadiologyOrderBase):
    id: int
    created_at: datetime
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True

class RadiologyReportBase(BaseModel):
    order_id: int
    findings: Optional[str] = None
    impression: Optional[str] = None
    reported_by_id: Optional[int] = None

class RadiologyReportCreate(RadiologyReportBase):
    pass

class RadiologyReportResponse(RadiologyReportBase):
    id: int
    report_date: datetime
    order: Optional[RadiologyOrderResponse] = None

    class Config:
        from_attributes = True


# --- Blood Bank Schemas ---
class BloodStockBase(BaseModel):
    blood_group: BloodGroupEnum
    component: BloodComponentEnum = BloodComponentEnum.Whole_Blood
    units_available: int = 0
    collection_date: Optional[date] = None
    expiry_date: date

class BloodStockCreate(BloodStockBase):
    pass

class BloodStockResponse(BloodStockBase):
    id: int
    
    class Config:
        from_attributes = True


# --- Inventory & Pharmacy Schemas ---
class InventoryBase(BaseModel):
    item_name: str
    category: Optional[str] = None
    supplier: Optional[str] = None
    batch_number: Optional[str] = None
    unit_price: float = 0.0
    quantity: int = 0
    threshold_limit: int = 10
    expiry_date: Optional[date] = None

class InventoryCreate(InventoryBase):
    pass

class InventoryResponse(InventoryBase):
    id: int
    purchase_date: date
    
    class Config:
        from_attributes = True

class PrescriptionBase(BaseModel):
    patient_id: int
    doctor_id: int
    medication: str
    dosage: str
    status: PrescriptionStatusEnum = PrescriptionStatusEnum.Pending

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionResponse(PrescriptionBase):
    id: int
    created_at: datetime
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True


# --- Lab Schemas ---
class LabTestBase(BaseModel):
    patient_id: int
    doctor_id: int
    test_name: str
    result: Optional[str] = None
    status: LabTestStatusEnum = LabTestStatusEnum.Pending

class LabTestCreate(LabTestBase):
    pass

class LabTestResponse(LabTestBase):
    id: int
    created_at: datetime
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None
    
    class Config:
        from_attributes = True


# --- Medical Records Schemas ---
class MedicalRecordBase(BaseModel):
    patient_id: int
    visit_type: str = "OPD"
    doctor_id: Optional[int] = None
    chief_complaint: Optional[str] = None
    history_of_present_illness: Optional[str] = None
    past_medical_history: Optional[str] = None
    examination_findings: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None

class MedicalRecordCreate(MedicalRecordBase):
    pass

class MedicalRecordResponse(MedicalRecordBase):
    id: int
    visit_date: datetime
    patient: Optional[PatientResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True


# --- Billing Schemas ---
class InvoiceBase(BaseModel):
    patient_id: int
    amount: float
    description: str
    invoice_type: str = "Consultation"
    payment_method: Optional[PaymentMethodEnum] = None
    status: InvoiceStatusEnum = InvoiceStatusEnum.Unpaid

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceResponse(InvoiceBase):
    id: int
    payment_date: Optional[datetime] = None
    created_at: datetime
    patient: Optional[PatientResponse] = None

    class Config:
        from_attributes = True


# --- Attendance Schemas ---
class AttendanceBase(BaseModel):
    user_id: Optional[int] = None
    doctor_id: Optional[int] = None
    login_date: Optional[date] = None
    status: AttendanceStatusEnum = AttendanceStatusEnum.Present

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: int
    check_in: datetime
    check_out: Optional[datetime] = None
    user: Optional[UserResponse] = None
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True


# --- HO / TMO Schemas ---
class DutyShiftResponse(BaseModel):
    id: int
    shift_date: date
    shift_type: ShiftTypeEnum
    is_weekend: bool
    points_assigned: float
    # Avoid nested circular reference for now
    
    class Config:
        from_attributes = True

class LeaveRequestResponse(BaseModel):
    id: int
    date_requested: date
    leave_date: date
    reason: str
    status: LeaveStatusEnum
    tmo_comment: Optional[str] = None
    
    class Config:
        from_attributes = True


# --- Nursing / eMAR Schemas ---
class MedicationOrderBase(BaseModel):
    patient_id: int
    prescribing_doctor_id: Optional[int] = None
    verified_by_id: Optional[int] = None
    medication_name: str
    generic_name: Optional[str] = None
    brand_name: Optional[str] = None
    drug_class: Optional[str] = None
    strength: Optional[str] = None
    prescribed_dose: str
    unit: str
    route: str
    frequency: str
    schedule: str
    end_date: Optional[datetime] = None
    clinical_indication: Optional[str] = None
    special_instructions: Optional[str] = None
    status: str = "Active"
    is_prn: bool = False
    prn_criteria: Optional[str] = None
    barcode: Optional[str] = None

class MedicationOrderCreate(MedicationOrderBase):
    pass

class MedicationOrderResponse(MedicationOrderBase):
    id: int
    start_date: datetime
    
    class Config:
        from_attributes = True

class EMARLogBase(BaseModel):
    order_id: int
    schedule_id: Optional[int] = None
    patient_id: int
    status: str = "Given"
    actual_dose: Optional[str] = None
    actual_route: Optional[str] = None
    five_rights_verified: bool = True
    wristband_scanned: bool = True
    med_barcode_scanned: bool = True
    notes: Optional[str] = None

class EMARLogCreate(EMARLogBase):
    pass

class EMARLogResponse(EMARLogBase):
    id: int
    administered_by_nurse_id: Optional[int] = None
    administered_at: datetime
    inventory_deducted: bool
    
    class Config:
        from_attributes = True

class FiveRightsVerifyRequest(BaseModel):
    patient_id: int
    order_id: int
    medication_name: str
    dose: str
    route: str
    scheduled_time: Optional[str] = None
    scanned_wristband: Optional[str] = None
    scanned_barcode: Optional[str] = None

class BarcodeScanRequest(BaseModel):
    scanned_code: str
    scan_type: str # wristband or medication
    expected_id: str

class AllergyOverrideRequest(BaseModel):
    consultant_id: int
    reason: str
    digital_signature: str

class MedicationAdministerRequest(BaseModel):
    schedule_id: int
    actual_dose: str
    actual_route: str
    remarks: Optional[str] = None
    scanned_wristband: Optional[str] = None
    scanned_barcode: Optional[str] = None
    five_rights_confirmed: bool = True
    allergy_override: bool = False
    override_details: Optional[AllergyOverrideRequest] = None

class MissedDoseRequest(BaseModel):
    schedule_id: int
    reason: str
    remarks: Optional[str] = None

class PRNAdministerRequest(BaseModel):
    order_id: int
    patient_id: int
    current_temperature: Optional[float] = None
    clinical_reason: str
    assessment_notes: str
    actual_dose: str
    actual_route: str

class NursingChecklistCreate(BaseModel):
    patient_id: int
    task_name: str
    category: str = "Routine"
    remarks: Optional[str] = None

class NursingChecklistToggleRequest(BaseModel):
    task_id: int
    is_completed: bool
    remarks: Optional[str] = None

class NursingNoteCreate(BaseModel):
    patient_id: int
    shift: str = "Morning Shift"
    patient_condition: Optional[str] = "Stable"
    medication_response: Optional[str] = None
    pain_assessment: Optional[str] = None
    new_symptoms: Optional[str] = None
    escalations_made: Optional[str] = None
    follow_up_required: Optional[str] = None

class PatientAllergyCreate(BaseModel):
    patient_id: int
    allergen: str
    allergy_type: str = "Drug"
    reaction: Optional[str] = None
    severity: str = "Severe"

# --- Requirements 20 - 35 Schemas ---
class PharmacyRequestCreate(BaseModel):
    patient_id: int
    medication_order_id: Optional[int] = None
    ward_name: str
    bed_number: str
    medication_name: str
    strength: Optional[str] = None
    prescribed_dose: str
    required_quantity: int = 1
    urgency_level: str = "Routine"

class PharmacyResponseUpdate(BaseModel):
    request_id: int
    status: str
    collection_time: Optional[str] = None
    remarks: Optional[str] = None

class SubstitutionSuggestRequest(BaseModel):
    pharmacy_request_id: int
    original_medication: str
    suggested_alternative: str
    remarks: Optional[str] = None

class SubstitutionDoctorDecision(BaseModel):
    substitution_id: int
    approved: bool
    remarks: Optional[str] = None

class WardStockTransferRequest(BaseModel):
    sending_ward: str
    receiving_ward: str
    item_name: str
    batch_number: Optional[str] = None
    quantity: int
    reason: str

class ControlledMedicationAdministerRequest(BaseModel):
    patient_id: int
    medication_name: str
    batch_number: str
    quantity_administered: float = 1.0
    witness_nurse_id: int
    prescribing_doctor_id: int
    primary_signature: str
    witness_signature: str

class ControlledShiftCountRequest(BaseModel):
    ward_name: str
    shift_name: str
    medication_name: str
    actual_quantity: int
    remarks: Optional[str] = None

class InfusionStartRequest(BaseModel):
    patient_id: int
    iv_fluid_name: str
    volume_ml: int = 500
    flow_rate_ml_hr: int = 125
    route: str = "Peripheral IV"
    iv_site: Optional[str] = "Right Forearm 18G"
    ordering_doctor_id: Optional[int] = None
    notes: Optional[str] = None

class InfusionMonitoringLogRequest(BaseModel):
    infusion_id: int
    event_type: str # Flow Rate Change, Pause, Site Assessment, Infiltration, Leakage, Blocked Cannula, Cannula Replacement, Completed
    new_flow_rate: Optional[int] = None
    site_condition: Optional[str] = "Clear / No Swelling"
    remarks: Optional[str] = None

class BloodTransfusionStartRequest(BaseModel):
    patient_id: int
    blood_unit_number: str
    blood_group: str
    component: str = "Whole Blood"
    expiry_date: date
    ordering_doctor_id: int
    witness_nurse_id: int
    pre_vitals_bp: str = "120/80"
    pre_vitals_temp: float = 37.0
    pre_vitals_hr: int = 76
    notes: Optional[str] = None

class InventoryAdjustmentRequest(BaseModel):
    ward_inventory_id: int
    adjustment_type: str # Manual Adjustment, Wastage, Expiries, Unexplained Loss
    quantity_changed: int
    reason: str
    supervisor_id: int
    digital_signature: str


# --- Requirements 36 - 50 Schemas ---
class ShiftStartRequest(BaseModel):
    shift_type: str # Morning, Evening, Night
    ward_name: str = "Medicine Ward A"
    charge_nurse_id: Optional[int] = 1

class ShiftEndRequest(BaseModel):
    shift_id: int
    override_reason: Optional[str] = None

class HandoverCreateRequest(BaseModel):
    incoming_nurse_id: int
    shift_type: str
    patient_summary: str
    outstanding_tasks: str
    patient_changes: str
    critical_notes: str
    inventory_narcotic: str
    outgoing_signature: str

class HandoverAcknowledgeRequest(BaseModel):
    handover_id: int
    incoming_signature: str

class ComprehensiveVitalSignCreate(BaseModel):
    patient_id: int
    blood_pressure: str = "120/80"
    pulse_rate: int = 75
    respiratory_rate: int = 18
    temperature: float = 37.0
    spo2: int = 98
    blood_sugar: Optional[float] = 110.0
    pain_score: int = 0
    gcs_score: int = 15
    weight_kg: Optional[float] = 70.0
    height_cm: Optional[float] = 175.0

class FluidBalanceRecordCreate(BaseModel):
    patient_id: int
    shift: str = "Morning Shift"
    iv_fluids_ml: int = 500
    oral_fluids_ml: int = 200
    tube_feeding_ml: int = 0
    blood_products_ml: int = 0
    medications_ml: int = 50
    urine_ml: int = 400
    stool_ml: int = 0
    vomiting_ml: int = 0
    drain_output_ml: int = 0
    blood_loss_ml: int = 0
    dialysis_output_ml: int = 0

class WoundDressingRecordCreate(BaseModel):
    patient_id: int
    wound_type: str = "Surgical Incision"
    location: str = "Abdomen"
    size_cm: str = "5x2 cm"
    stage: str = "Stage 1"
    appearance: str = "Clean / Granulating"
    signs_of_infection: str = "None"
    dressing_type: str = "Sterile Gauze"
    hours_until_next_due: int = 24

class FallRiskAssessmentCreate(BaseModel):
    patient_id: int
    score: int = 45 # Morse Fall Scale
    risk_level: str = "High Risk" # Low Risk, Moderate Risk, High Risk
    interventions: List[str] = ["Bed Rails Up", "Assisted Mobilization", "Non-slip Footwear", "Frequent Monitoring"]

class PressureInjuryPlanCreate(BaseModel):
    patient_id: int
    position_change_interval_hrs: int = 2
    skin_assessment_notes: str = "Sacrum skin intact. No erythema or blanching."
    mattress_type: str = "Alternating Pressure Air Mattress"

class InfectionPreventionLogCreate(BaseModel):
    patient_id: int
    hand_hygiene: bool = True
    ppe_worn: bool = True
    isolation_protocol: bool = False
    sterile_technique: bool = True
    catheter_care: bool = True
    central_line_care: bool = True
    surgical_site_assessed: bool = True

class IncidentReportCreate(BaseModel):
    patient_id: Optional[int] = None
    incident_type: str # Patient Fall, Medication Error, Needle Stick, Equipment Failure, Near Miss, etc.
    severity: str = "Minor" # Minor, Moderate, Severe, Critical
    is_near_miss: bool = False
    description: str
    immediate_actions: str
    witnesses: Optional[str] = "Nurse Ayesha, RN"
    notified_departments: List[str] = ["Quality Assurance", "Risk Management", "Nursing Supervisor"]
    digital_signature: str



