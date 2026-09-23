from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, dependencies

router = APIRouter(prefix="/qa", tags=["Quality Assurance"])

@router.get("/incidents")
def get_incidents(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    return db.query(models.QAIncident).filter(models.QAIncident.hospital_id == current_user.hospital_id).all()

@router.post("/incidents")
def report_incident(title: str, department_name: str, description: str, severity: str = "Low", db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    inc = models.QAIncident(
        hospital_id=current_user.hospital_id,
        title=title,
        department_name=department_name,
        description=description,
        severity=severity,
        reported_by_id=current_user.id
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return inc
