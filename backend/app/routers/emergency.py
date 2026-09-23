from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from ..dependencies import get_current_user

router = APIRouter(prefix="/emergency", tags=["Emergency"])

@router.post("/", response_model=schemas.EmergencyCaseResponse)
def register_emergency(case: schemas.EmergencyCaseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    db_case = models.EmergencyCase(hospital_id=hospital_id, **case.dict())
    db.add(db_case)
    db.commit()
    db.refresh(db_case)
    return db_case

@router.get("/")
def get_emergency_cases(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cases = db.query(models.EmergencyCase).options(
        joinedload(models.EmergencyCase.patient)
    ).filter(
        models.EmergencyCase.hospital_id == current_user.hospital_id,
        models.EmergencyCase.status.in_(["Triaged", "Under_Treatment"])
    ).all()
    
    res = []
    for c in cases:
        res.append({
            "id": c.id,
            "hospital_id": c.hospital_id,
            "patient_id": c.patient_id,
            "patient_name": c.patient.full_name if c.patient else f"Patient #{c.patient_id}",
            "patient_gender": c.patient.gender if c.patient else "N/A",
            "patient_age": c.patient.age if c.patient else "N/A",
            "patient_phone": c.patient.phone if c.patient else "",
            "triage_category": c.triage_category,
            "arrival_time": str(c.arrival_time),
            "arrival_mode": c.mode_of_arrival or "Walk-in",
            "chief_complaint": c.chief_complaint,
            "status": c.status
        })
    return res

@router.put("/{id}/update")
def update_emergency_status(id: int, status: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    case = db.query(models.EmergencyCase).filter(models.EmergencyCase.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    case.status = status
    if status in ["Discharged", "Admitted", "Referred", "Expired"]:
        case.disposition_time = datetime.utcnow()
        
    # Automatic IPD Admission Sync if Emergency Doctor selects "Admitted"
    if status == "Admitted":
        existing_adm = db.query(models.Admission).filter(
            models.Admission.patient_id == case.patient_id,
            models.Admission.hospital_id == current_user.hospital_id,
            models.Admission.status.in_([models.AdmissionStatusEnum.Pending, models.AdmissionStatusEnum.Admitted])
        ).first()
        if not existing_adm:
            new_adm = models.Admission(
                hospital_id=current_user.hospital_id,
                patient_id=case.patient_id,
                primary_diagnosis=f"Emergency ER: {case.chief_complaint or 'Acute Care'}",
                admission_type=models.AdmissionTypeEnum.Emergency,
                status=models.AdmissionStatusEnum.Pending
            )
            db.add(new_adm)
            
    db.commit()
    db.refresh(case)
    return {"message": f"Case updated to {status}", "status": status}

@router.get("/stats")
def get_emergency_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    cases = db.query(models.EmergencyCase).filter(models.EmergencyCase.arrival_time >= today_start).all()
    
    red = sum(1 for c in cases if c.triage_category == models.TriageCategoryEnum.Red)
    yellow = sum(1 for c in cases if c.triage_category == models.TriageCategoryEnum.Yellow)
    green = sum(1 for c in cases if c.triage_category == models.TriageCategoryEnum.Green)
    
    return {"total_today": len(cases), "red": red, "yellow": yellow, "green": green}
