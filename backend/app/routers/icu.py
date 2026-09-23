from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..dependencies import get_current_user

router = APIRouter(prefix="/icu", tags=["ICU"])

@router.post("/admit", response_model=schemas.ICUAdmissionResponse)
def admit_to_icu(adm: schemas.ICUAdmissionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    db_icu = models.ICUAdmission(hospital_id=hospital_id, **adm.dict())
    db.add(db_icu)
    db.commit()
    db.refresh(db_icu)
    return db_icu

@router.get("/", response_model=List[schemas.ICUAdmissionResponse])
def get_icu_patients(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.ICUAdmission).join(models.Admission).filter(
        models.ICUAdmission.hospital_id == current_user.hospital_id,
        models.Admission.status == models.AdmissionStatusEnum.Admitted
    ).all()

@router.get("/stats")
def get_icu_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    active = db.query(models.ICUAdmission).join(models.Admission).filter(
        models.Admission.status == models.AdmissionStatusEnum.Admitted
    ).count()
    vents = db.query(models.ICUAdmission).join(models.Admission).filter(
        models.Admission.status == models.AdmissionStatusEnum.Admitted,
        models.ICUAdmission.ventilator_required == True
    ).count()
    
    icu_beds = db.query(models.WardBed).filter(models.WardBed.ward_type == models.WardTypeEnum.ICU).count()
    occupancy = (active / icu_beds * 100) if icu_beds > 0 else 0
    
    return {"active_patients": active, "ventilator_usage": vents, "total_icu_beds": icu_beds, "occupancy_percent": round(occupancy, 1)}
