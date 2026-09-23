from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, dependencies

router = APIRouter(prefix="/housekeeping", tags=["Housekeeping & Bed Sync"])

@router.get("/logs")
def get_logs(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    return db.query(models.HousekeepingLog).filter(models.HousekeepingLog.hospital_id == current_user.hospital_id).all()

@router.post("/clean")
def mark_bed_cleaned(ward_bed_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    bed = db.query(models.WardBed).filter(models.WardBed.id == ward_bed_id).first()
    if not bed:
        raise HTTPException(404, "Bed not found")
    
    # Update bed state to available (clean)
    bed.is_occupied = False
    bed.patient_id = None
    
    log = models.HousekeepingLog(
        hospital_id=current_user.hospital_id,
        ward_bed_id=ward_bed_id,
        cleaned_by_id=current_user.id,
        status="Cleaned"
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"message": f"Bed #{bed.bed_number} cleaned and now AVAILABLE in Ward Bed Heatmap!", "log": log.id}
