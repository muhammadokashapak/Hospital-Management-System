from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from .. import models, dependencies

router = APIRouter(prefix="/infection-control", tags=["Infection Control"])

@router.get("/reports")
def get_reports(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    reports = db.query(models.InfectionReport).options(
        joinedload(models.InfectionReport.patient)
    ).filter(models.InfectionReport.hospital_id == current_user.hospital_id).all()
    
    res = []
    for r in reports:
        res.append({
            "id": r.id,
            "patient_id": r.patient_id,
            "patient_name": r.patient.full_name if r.patient else f"Patient #{r.patient_id}",
            "infection_type": r.infection_type,
            "isolation_required": r.isolation_required,
            "organism_detected": r.organism_detected,
            "status": r.status
        })
    return res

@router.post("/reports")
def add_report(patient_id: int, infection_type: str, isolation_required: bool = False, organism_detected: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    rep = models.InfectionReport(
        hospital_id=current_user.hospital_id,
        patient_id=patient_id,
        infection_type=infection_type,
        isolation_required=isolation_required,
        organism_detected=organism_detected
    )
    db.add(rep)
    db.commit()
    db.refresh(rep)
    return rep
