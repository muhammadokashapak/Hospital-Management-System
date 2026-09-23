from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from ..dependencies import get_current_user

router = APIRouter(prefix="/ot", tags=["OT"])

@router.post("/schedule")
def schedule_surgery(sched: schemas.OTScheduleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    db_sched = models.OTSchedule(hospital_id=hospital_id, **sched.dict())
    db.add(db_sched)
    db.commit()
    db.refresh(db_sched)
    return db_sched

@router.get("/schedule")
def get_ot_schedule(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    surgeries = db.query(models.OTSchedule).options(
        joinedload(models.OTSchedule.patient)
    ).filter(
        models.OTSchedule.hospital_id == current_user.hospital_id
    ).order_by(models.OTSchedule.scheduled_datetime.asc()).all()

    res = []
    for s in surgeries:
        res.append({
            "id": s.id,
            "patient_id": s.patient_id,
            "patient_name": s.patient.full_name if s.patient else f"Patient #{s.patient_id}",
            "procedure_name": getattr(s, "procedure_name", None) or getattr(s, "surgery_name", None) or "Surgical Procedure",
            "scheduled_datetime": str(s.scheduled_datetime),
            "ot_room": s.ot_room,
            "status": s.status
        })
    return res

@router.put("/{id}/start")
def start_surgery(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sched = db.query(models.OTSchedule).filter(models.OTSchedule.id == id).first()
    if not sched: raise HTTPException(404, "Not found")
    sched.status = models.OTStatusEnum.In_Progress
    sched.actual_start = datetime.utcnow()
    db.commit()
    return {"message": "Surgery started"}

@router.put("/{id}/complete")
def complete_surgery(id: int, notes: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sched = db.query(models.OTSchedule).filter(models.OTSchedule.id == id).first()
    if not sched: raise HTTPException(404, "Not found")
    sched.status = models.OTStatusEnum.Completed
    sched.actual_end = datetime.utcnow()
    sched.ot_notes = notes
    db.commit()
    return {"message": "Surgery completed"}

@router.get("/stats")
def get_ot_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    surgeries = db.query(models.OTSchedule).filter(models.OTSchedule.scheduled_datetime >= today_start).all()
    completed = sum(1 for s in surgeries if s.status == models.OTStatusEnum.Completed)
    return {"total_today": len(surgeries), "completed": completed, "pending": len(surgeries) - completed}
