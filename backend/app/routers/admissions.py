from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from ..dependencies import get_current_user

router = APIRouter(prefix="/admissions", tags=["Admissions"])

@router.post("/request", response_model=schemas.AdmissionResponse)
def create_admission_request(request: schemas.AdmissionRequestCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    
    # Check if a pending request already exists
    existing = db.query(models.Admission).filter(
        models.Admission.patient_id == request.patient_id,
        models.Admission.status == models.AdmissionStatusEnum.Pending,
        models.Admission.hospital_id == hospital_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A pending admission request already exists for this patient")
        
    db_adm = models.Admission(
        hospital_id=hospital_id, 
        patient_id=request.patient_id,
        primary_diagnosis=request.primary_diagnosis,
        status=models.AdmissionStatusEnum.Pending,
        admission_type=models.AdmissionTypeEnum.IPD,
        admitting_doctor_id=current_user.doctor_profile.id if hasattr(current_user, 'doctor_profile') and current_user.doctor_profile else None
    )
    db.add(db_adm)
    db.commit()
    db.refresh(db_adm)
    return db_adm

@router.post("/{id}/approve", response_model=schemas.AdmissionResponse)
def approve_admission(id: int, ward_bed_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    adm = db.query(models.Admission).filter(models.Admission.id == id, models.Admission.hospital_id == current_user.hospital_id).first()
    if not adm or adm.status != models.AdmissionStatusEnum.Pending:
        raise HTTPException(status_code=404, detail="Pending admission request not found")
        
    bed = db.query(models.WardBed).filter(models.WardBed.id == ward_bed_id, models.WardBed.hospital_id == current_user.hospital_id).first()
    if not bed or bed.is_occupied:
        raise HTTPException(status_code=400, detail="Bed is not available")
        
    if current_user.department_id and bed.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Cannot assign a bed outside of your assigned department")
        
    adm.ward_bed_id = bed.id
    adm.status = models.AdmissionStatusEnum.Admitted
    adm.admission_date = datetime.utcnow()
    
    bed.is_occupied = True
    bed.patient_id = adm.patient_id
    
    db.commit()
    db.refresh(adm)
    return adm

@router.post("/", response_model=schemas.AdmissionResponse)
def admit_patient(admission: schemas.AdmissionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    
    # Check bed availability
    bed = db.query(models.WardBed).filter(models.WardBed.id == admission.ward_bed_id, models.WardBed.hospital_id == hospital_id).first()
    if bed and bed.is_occupied:
        raise HTTPException(status_code=400, detail="Bed is already occupied")
        
    if bed and current_user.department_id and bed.department_id != current_user.department_id:
        raise HTTPException(status_code=403, detail="Cannot assign a bed outside of your assigned department")
        
    db_adm = models.Admission(hospital_id=hospital_id, **admission.dict())
    db.add(db_adm)
    
    if bed:
        bed.is_occupied = True
        bed.patient_id = admission.patient_id
        
    db.commit()
    db.refresh(db_adm)
    return db_adm

from sqlalchemy.orm import joinedload

@router.get("/")
def get_admissions(status: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.Admission).options(
        joinedload(models.Admission.patient),
        joinedload(models.Admission.admitting_doctor).joinedload(models.Doctor.user),
        joinedload(models.Admission.ward_bed)
    ).filter(models.Admission.hospital_id == current_user.hospital_id)
    
    if status:
        q = q.filter(models.Admission.status == status)
        
    if current_user.department_id and status != 'Pending':
        q = q.join(models.WardBed, models.Admission.ward_bed_id == models.WardBed.id).filter(models.WardBed.department_id == current_user.department_id)
        
    admissions = q.order_by(models.Admission.id.desc()).all()
    res = []
    for a in admissions:
        active_meds = []
        if a.patient_id and a.status == models.AdmissionStatusEnum.Admitted:
            meds = db.query(models.MedicationOrder).filter(
                models.MedicationOrder.patient_id == a.patient_id,
                models.MedicationOrder.status == "Active"
            ).all()
            for m in meds:
                active_meds.append(f"{m.medication_name} ({m.prescribed_dose} {m.route} {m.frequency})")

        res.append({
            "id": a.id,
            "patient_id": a.patient_id,
            "patient_name": a.patient.full_name if a.patient else f"Patient #{a.patient_id}",
            "patient_phone": a.patient.phone if a.patient else None,
            "patient_gender": a.patient.gender if a.patient else None,
            "patient_age": a.patient.age if a.patient else None,
            "doctor_name": a.admitting_doctor.user.full_name if (a.admitting_doctor and a.admitting_doctor.user) else "OPD Doctor",
            "primary_diagnosis": a.primary_diagnosis or "OPD Referral",
            "status": a.status,
            "admission_date": str(a.admission_date),
            "ward_bed_id": a.ward_bed_id,
            "ward_name": a.ward_bed.ward_name if a.ward_bed else None,
            "bed_number": a.ward_bed.bed_number if a.ward_bed else None,
            "active_prescriptions": active_meds
        })
    return res

@router.get("/all-beds")
def get_all_beds(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    beds = db.query(models.WardBed).options(joinedload(models.WardBed.patient)).filter(
        models.WardBed.hospital_id == current_user.hospital_id
    ).order_by(models.WardBed.ward_name.asc(), models.WardBed.bed_number.asc()).all()
    
    res = []
    for b in beds:
        res.append({
            "id": b.id,
            "ward_name": b.ward_name,
            "ward_type": b.ward_type,
            "bed_number": b.bed_number,
            "is_occupied": b.is_occupied,
            "cost_per_day": b.cost_per_day,
            "patient_id": b.patient_id,
            "patient_name": b.patient.full_name if b.patient else None
        })
    return res

@router.get("/available-beds")
def get_available_beds(department_id: int = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.WardBed).filter(
        models.WardBed.hospital_id == current_user.hospital_id,
        models.WardBed.is_occupied == False
    )
    
    if department_id:
        q = q.filter(models.WardBed.department_id == department_id)
    elif current_user.department_id:
        q = q.filter(models.WardBed.department_id == current_user.department_id)
        
    beds = q.order_by(models.WardBed.ward_name.asc(), models.WardBed.bed_number.asc()).all()
    
    return [{
        "id": b.id,
        "ward_name": b.ward_name,
        "ward_type": b.ward_type,
        "bed_number": b.bed_number,
        "cost_per_day": b.cost_per_day
    } for b in beds]

@router.post("/{id}/request-discharge")
def request_discharge(id: int, summary: str = "Discharge recommended by doctor", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    adm = db.query(models.Admission).filter(models.Admission.id == id, models.Admission.hospital_id == current_user.hospital_id).first()
    if not adm:
        raise HTTPException(status_code=404, detail="Admission record not found")
        
    adm.status = models.AdmissionStatusEnum.Discharge_Requested
    adm.discharge_summary = summary
    db.commit()
    return {"message": "Discharge request sent to Ward Nurse portal!"}

@router.post("/{id}/complete-discharge")
def complete_discharge(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    adm = db.query(models.Admission).filter(models.Admission.id == id, models.Admission.hospital_id == current_user.hospital_id).first()
    if not adm:
        raise HTTPException(status_code=404, detail="Admission record not found")
        
    adm.status = models.AdmissionStatusEnum.Discharged
    adm.discharge_date = datetime.utcnow()
    
    if adm.ward_bed_id:
        bed = db.query(models.WardBed).filter(models.WardBed.id == adm.ward_bed_id).first()
        if bed:
            bed.is_occupied = False
            bed.patient_id = None
            
    db.commit()
    return {"message": "Patient discharged successfully and bed is now available!"}

@router.get("/stats")
def get_admission_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    active = db.query(models.Admission).filter(models.Admission.status == models.AdmissionStatusEnum.Admitted).count()
    available_beds = db.query(models.WardBed).filter(models.WardBed.is_occupied == False).count()
    total_beds = db.query(models.WardBed).count()
    occupancy = (total_beds - available_beds) / total_beds * 100 if total_beds > 0 else 0
    return {"active_admissions": active, "available_beds": available_beds, "occupancy_percent": round(occupancy, 1)}

from pydantic import BaseModel
from typing import Optional, List
from datetime import date, timedelta
from .nurse import auto_schedule_times, parse_schedule_datetime

class InpatientMedicationOrder(BaseModel):
    medication_name: str
    prescribed_dose: str
    route: Optional[str] = "Oral"
    frequency: Optional[str] = "BD"
    special_instructions: Optional[str] = "Monitor vitals per doctor protocol."

class InpatientPrescriptionSubmission(BaseModel):
    medications: List[InpatientMedicationOrder] = []
    nursing_tasks: List[str] = []
    primary_diagnosis: Optional[str] = None

@router.post("/{id}/prescribe-orders")
def prescribe_inpatient_orders(id: int, data: InpatientPrescriptionSubmission, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    adm = db.query(models.Admission).filter(models.Admission.id == id, models.Admission.hospital_id == current_user.hospital_id).first()
    if not adm:
        raise HTTPException(status_code=404, detail="Admission record not found")
        
    doc_profile = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    doc_id = doc_profile.id if doc_profile else (adm.admitting_doctor_id or 1)

    if data.primary_diagnosis:
        adm.primary_diagnosis = data.primary_diagnosis

    created_orders = []
    import random
    for med in data.medications:
        if med.medication_name and med.medication_name.strip():
            m_order = models.MedicationOrder(
                hospital_id=current_user.hospital_id,
                patient_id=adm.patient_id,
                prescribing_doctor_id=doc_id,
                medication_name=med.medication_name.strip(),
                prescribed_dose=med.prescribed_dose.strip() if med.prescribed_dose else "Standard Dose",
                unit="mg",
                route=med.route or "Oral",
                frequency=med.frequency or "BD",
                schedule="08:00 AM, 08:00 PM",
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=7),
                clinical_indication=data.primary_diagnosis or "IPD Doctor Prescribed Order",
                special_instructions=med.special_instructions or "Administer per doctor protocol.",
                is_prn=False,
                barcode=f"MED-{adm.patient_id}-{random.randint(100,999)}",
                status="Active"
            )
            db.add(m_order)
            db.commit()
            db.refresh(m_order)

            times = auto_schedule_times(med.frequency or "BD")
            today = date.today()
            for t_str in times:
                sched_dt = parse_schedule_datetime(t_str, today)
                sched = models.MedicationSchedule(
                    hospital_id=current_user.hospital_id,
                    order_id=m_order.id,
                    patient_id=adm.patient_id,
                    scheduled_time=sched_dt,
                    status="Pending Administration"
                )
                db.add(sched)
            db.commit()
            created_orders.append(m_order.medication_name)

    for task in data.nursing_tasks:
        if task and task.strip():
            chk = models.NursingChecklist(
                hospital_id=current_user.hospital_id,
                patient_id=adm.patient_id,
                task_name=task.strip(),
                category="Doctor Protocol",
                is_completed=False
            )
            db.add(chk)
    db.commit()

    return {
        "message": f"Inpatient orders & nursing protocols dispatched live for Patient #{adm.patient_id}!",
        "prescribed_medications": created_orders,
        "nursing_tasks": data.nursing_tasks
    }
