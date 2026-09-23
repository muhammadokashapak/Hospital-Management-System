from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, dependencies

router = APIRouter(prefix="/ambulance", tags=["Ambulance & Dispatch"])

@router.get("/records")
def get_ambulance_records(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    return db.query(models.AmbulanceRecord).filter(models.AmbulanceRecord.hospital_id == current_user.hospital_id).all()

@router.post("/dispatch")
def dispatch_ambulance(vehicle_number: str, pickup_location: str, patient_id: int = None, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    amb = models.AmbulanceRecord(
        hospital_id=current_user.hospital_id,
        vehicle_number=vehicle_number,
        pickup_location=pickup_location,
        patient_id=patient_id,
        driver_user_id=current_user.id,
        status="Dispatched"
    )
    db.add(amb)
    db.commit()
    db.refresh(amb)
    return amb
