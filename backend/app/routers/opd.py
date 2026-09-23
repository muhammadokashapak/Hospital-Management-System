from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, datetime, timedelta
from pydantic import BaseModel

from ..database import get_db
from .. import models, schemas
from ..dependencies import get_current_user

router = APIRouter(prefix="/opd", tags=["OPD"])

@router.get("/schedule")
def get_opd_schedule(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    shifts = db.query(models.DoctorShift).all()
    return shifts

@router.get("/waiting-area")
def get_waiting_area(doctor_id: int = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.Appointment).options(joinedload(models.Appointment.patient)).filter(
        models.Appointment.appointment_date == date.today(),
        models.Appointment.status.in_([
            models.AppointmentStatusEnum.Waiting, 
            models.AppointmentStatusEnum.Called, 
            models.AppointmentStatusEnum.In_Consultation
        ])
    )
    if doctor_id:
        q = q.filter(models.Appointment.doctor_id == doctor_id)
        
    appts = q.order_by(models.Appointment.token_number.asc()).all()
    res = []
    for a in appts:
        res.append({
            "id": a.id,
            "patient_id": a.patient_id,
            "doctor_id": a.doctor_id,
            "token_number": a.token_number,
            "appointment_date": str(a.appointment_date),
            "status": a.status,
            "patient": {
                "id": a.patient.id,
                "full_name": a.patient.full_name,
                "age": a.patient.age,
                "gender": a.patient.gender,
                "phone": a.patient.phone
            } if a.patient else None
        })
    return res

@router.get("/stats")
def get_opd_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total = db.query(models.Appointment).filter(models.Appointment.appointment_date == date.today()).count()
    waiting = db.query(models.Appointment).filter(
        models.Appointment.appointment_date == date.today(),
        models.Appointment.status == models.AppointmentStatusEnum.Waiting
    ).count()
    completed = db.query(models.Appointment).filter(
        models.Appointment.appointment_date == date.today(),
        models.Appointment.status == models.AppointmentStatusEnum.Completed
    ).count()
    return {"total_today": total, "waiting": waiting, "completed": completed}

class FollowUpCreate(BaseModel):
    appointment_id: Optional[int] = None
    patient_id: int
    follow_up_days: int
    follow_up_type: str = "Re_Consultation" # 'Re_Consultation' or 'Direct_Pharmacy_Refill'
    notes: Optional[str] = None

class ConsultationSubmission(BaseModel):
    appointment_id: int
    patient_id: int
    notes: Optional[str] = None
    medications: Optional[List[dict]] = []
    lab_tests: Optional[List[dict]] = []
    radiology_orders: Optional[List[dict]] = []
    follow_up_days: Optional[int] = None
    follow_up_type: Optional[str] = "Re_Consultation"
    follow_up_notes: Optional[str] = None

@router.post("/followup/create")
def create_followup(
    data: FollowUpCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    doc_id = doc.id if doc else 1

    fut_enum = models.FollowUpTypeEnum.Re_Consultation
    if data.follow_up_type == "Direct_Pharmacy_Refill":
        fut_enum = models.FollowUpTypeEnum.Direct_Pharmacy_Refill

    calc_date = date.today() + timedelta(days=data.follow_up_days)

    f_record = models.FollowUpRecord(
        hospital_id=current_user.hospital_id,
        patient_id=data.patient_id,
        doctor_id=doc_id,
        appointment_id=data.appointment_id,
        follow_up_days=data.follow_up_days,
        follow_up_date=calc_date,
        follow_up_type=fut_enum,
        notes=data.notes,
        status="Active"
    )
    db.add(f_record)
    
    # Also update any pending prescriptions for this patient with follow-up info
    pending_prescs = db.query(models.Prescription).filter(
        models.Prescription.patient_id == data.patient_id,
        models.Prescription.status == models.PrescriptionStatusEnum.Pending
    ).all()
    for p in pending_prescs:
        p.follow_up_days = data.follow_up_days
        p.follow_up_type = data.follow_up_type
        p.follow_up_notes = data.notes

    db.commit()
    db.refresh(f_record)
    return {
        "message": f"Follow-up configured for {data.follow_up_days} days ({data.follow_up_type})",
        "id": f_record.id,
        "follow_up_date": str(calc_date)
    }

@router.post("/consultation/submit")
def submit_consultation(
    data: ConsultationSubmission, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    if not doc:
        appt = db.query(models.Appointment).filter(models.Appointment.id == data.appointment_id).first()
        doc_id = appt.doctor_id if appt else 1
    else:
        doc_id = doc.id

    # 1. Smart Classification between Pathology Lab Tests & Radiology Imaging Scans
    radiology_keywords = ["xray", "x-ray", "ct", "mri", "ultrasound", "usg", "scan", "doppler", "mammogram", "radiology", "cxr", "echo"]

    if data.lab_tests:
        for item in data.lab_tests:
            test_name = item.get("test") if isinstance(item, dict) else str(item)
            if test_name and test_name.strip():
                clean_test = test_name.strip()
                t_lower = clean_test.lower()

                # Check if this order is a Radiology / Imaging Scan
                is_radiology = any(kw in t_lower for kw in radiology_keywords)

                if is_radiology:
                    r_enum = models.RadiologyTypeEnum.X_Ray
                    if "mri" in t_lower: r_enum = models.RadiologyTypeEnum.MRI
                    elif "ct" in t_lower: r_enum = models.RadiologyTypeEnum.CT_Scan
                    elif "ultra" in t_lower or "usg" in t_lower: r_enum = models.RadiologyTypeEnum.Ultrasound

                    new_rad = models.RadiologyOrder(
                        hospital_id=current_user.hospital_id,
                        patient_id=data.patient_id,
                        ordering_doctor_id=doc_id,
                        test_type=r_enum,
                        body_part=clean_test,
                        clinical_indication=f"OPD Order: {clean_test}",
                        status="Ordered"
                    )
                    db.add(new_rad)
                else:
                    new_lab = models.LabTest(
                        hospital_id=current_user.hospital_id,
                        patient_id=data.patient_id,
                        doctor_id=doc_id,
                        test_name=clean_test,
                        status=models.LabTestStatusEnum.Pending
                    )
                    db.add(new_lab)

    # 2. Save explicit Radiology Orders
    if data.radiology_orders:
        for item in data.radiology_orders:
            scan_type = item.get("scan_type") if isinstance(item, dict) else "X_Ray"
            notes = item.get("notes") if isinstance(item, dict) else "OPD Order"
            r_enum = models.RadiologyTypeEnum.X_Ray
            if "MRI" in scan_type.upper(): r_enum = models.RadiologyTypeEnum.MRI
            elif "CT" in scan_type.upper(): r_enum = models.RadiologyTypeEnum.CT_Scan
            elif "ULTRA" in scan_type.upper(): r_enum = models.RadiologyTypeEnum.Ultrasound

            new_rad = models.RadiologyOrder(
                hospital_id=current_user.hospital_id,
                patient_id=data.patient_id,
                ordering_doctor_id=doc_id,
                test_type=r_enum,
                clinical_indication=notes,
                status="Ordered"
            )
            db.add(new_rad)

    # 3. Save Medications for Pharmacy & Nurse eMAR
    if data.medications:
        from .nurse import auto_schedule_times, parse_schedule_datetime
        import random
        for item in data.medications:
            med_name = item.get("med") if isinstance(item, dict) else ""
            dosage = item.get("dose") if isinstance(item, dict) else ""
            if med_name and med_name.strip():
                # 3a. Save for Pharmacy with Follow-Up Refill Strategy
                new_presc = models.Prescription(
                    hospital_id=current_user.hospital_id,
                    patient_id=data.patient_id,
                    doctor_id=doc_id,
                    medication=med_name.strip(),
                    dosage=dosage.strip() if dosage else "As directed",
                    status=models.PrescriptionStatusEnum.Pending,
                    follow_up_days=data.follow_up_days,
                    follow_up_type=data.follow_up_type or "Re_Consultation",
                    follow_up_notes=data.follow_up_notes
                )
                db.add(new_presc)

                # 3b. Create MedicationOrder for Nurse eMAR
                m_order = models.MedicationOrder(
                    hospital_id=current_user.hospital_id,
                    patient_id=data.patient_id,
                    prescribing_doctor_id=doc_id,
                    medication_name=med_name.strip(),
                    prescribed_dose=dosage.strip() if dosage else "Standard Dose",
                    unit="mg",
                    route="Oral",
                    frequency="BD",
                    schedule="08:00 AM, 08:00 PM",
                    start_date=datetime.now(),
                    end_date=datetime.now() + timedelta(days=5),
                    clinical_indication="Doctor Prescribed Order",
                    special_instructions="Administer per doctor instructions",
                    is_prn=False,
                    barcode=f"MED-{data.patient_id}-{random.randint(100,999)}",
                    status="Active"
                )
                db.add(m_order)
                db.commit()
                db.refresh(m_order)

                times = auto_schedule_times("BD")
                today = date.today()
                for t_str in times:
                    sched_dt = parse_schedule_datetime(t_str, today)
                    sched = models.MedicationSchedule(
                        hospital_id=current_user.hospital_id,
                        order_id=m_order.id,
                        patient_id=data.patient_id,
                        scheduled_time=sched_dt,
                        status="Pending Administration"
                    )
                    db.add(sched)

    # 4. Save Follow-Up Record if configured
    if data.follow_up_days:
        fut_enum = models.FollowUpTypeEnum.Re_Consultation
        if data.follow_up_type == "Direct_Pharmacy_Refill":
            fut_enum = models.FollowUpTypeEnum.Direct_Pharmacy_Refill

        calc_date = date.today() + timedelta(days=data.follow_up_days)
        f_record = models.FollowUpRecord(
            hospital_id=current_user.hospital_id,
            patient_id=data.patient_id,
            doctor_id=doc_id,
            appointment_id=data.appointment_id,
            follow_up_days=data.follow_up_days,
            follow_up_date=calc_date,
            follow_up_type=fut_enum,
            notes=data.follow_up_notes or data.notes,
            status="Active"
        )
        db.add(f_record)

    # 5. Mark appointment as completed
    appt = db.query(models.Appointment).filter(models.Appointment.id == data.appointment_id).first()
    if appt:
        appt.status = models.AppointmentStatusEnum.Completed

    db.commit()
    return {"message": "Consultation submitted successfully. Orders & Follow-Up Strategy sent live!"}

@router.get("/completed-consultations")
def get_completed_consultations(
    doctor_id: int = None,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    q = db.query(models.Appointment).options(
        joinedload(models.Appointment.patient),
        joinedload(models.Appointment.doctor).joinedload(models.Doctor.user)
    ).filter(
        models.Appointment.hospital_id == current_user.hospital_id,
        models.Appointment.status == models.AppointmentStatusEnum.Completed
    )
    if doctor_id:
        q = q.filter(models.Appointment.doctor_id == doctor_id)
        
    appts = q.order_by(models.Appointment.id.desc()).all()
    res = []
    for a in appts:
        labs = db.query(models.LabTest).filter(models.LabTest.patient_id == a.patient_id).all()
        prescs = db.query(models.Prescription).filter(models.Prescription.patient_id == a.patient_id).all()
        rads = db.query(models.RadiologyOrder).filter(models.RadiologyOrder.patient_id == a.patient_id).all()
        
        res.append({
            "id": a.id,
            "patient_id": a.patient_id,
            "doctor_id": a.doctor_id,
            "doctor_name": a.doctor.user.full_name if a.doctor and a.doctor.user else "Dr. OPD",
            "token_number": a.token_number,
            "appointment_date": str(a.appointment_date),
            "status": a.status,
            "patient": {
                "id": a.patient.id,
                "full_name": a.patient.full_name,
                "age": a.patient.age,
                "gender": a.patient.gender,
                "phone": a.patient.phone
            } if a.patient else None,
            "lab_orders": [{
                "id": l.id,
                "test_name": l.test_name,
                "status": l.status,
                "result": l.result
            } for l in labs],
            "pharmacy_orders": [{
                "id": p.id,
                "medication": p.medication,
                "dosage": p.dosage,
                "status": p.status
            } for p in prescs],
            "radiology_orders": [{
                "id": r.id,
                "scan_type": str(r.test_type),
                "status": r.status
            } for r in rads]
        })
    return res

@router.get("/patient/{patient_id}/live_orders")
def get_patient_live_orders(
    patient_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    labs = db.query(models.LabTest).filter(models.LabTest.patient_id == patient_id).order_by(models.LabTest.id.desc()).limit(10).all()
    prescs = db.query(models.Prescription).filter(models.Prescription.patient_id == patient_id).order_by(models.Prescription.id.desc()).limit(10).all()
    rads = db.query(models.RadiologyOrder).filter(models.RadiologyOrder.patient_id == patient_id).order_by(models.RadiologyOrder.id.desc()).limit(10).all()

    return {
        "lab_orders": [{
            "id": l.id,
            "test_name": l.test_name,
            "status": l.status,
            "result": l.result,
            "created_at": str(l.created_at)
        } for l in labs],
        "pharmacy_orders": [{
            "id": p.id,
            "medication": p.medication,
            "dosage": p.dosage,
            "status": p.status,
            "created_at": str(p.created_at)
        } for p in prescs],
        "radiology_orders": [{
            "id": r.id,
            "scan_type": str(r.test_type),
            "status": r.status,
            "created_at": str(r.created_at)
        } for r in rads]
    }
