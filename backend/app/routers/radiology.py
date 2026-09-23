from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from ..database import get_db
from .. import models, schemas
from ..dependencies import get_current_user

router = APIRouter(prefix="/radiology", tags=["Radiology"])

@router.post("/orders")
def create_radiology_order(order: schemas.RadiologyOrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    db_order = models.RadiologyOrder(hospital_id=hospital_id, ordering_doctor_id=current_user.id, **order.dict())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.get("/orders")
def get_radiology_orders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    orders = db.query(models.RadiologyOrder).options(
        joinedload(models.RadiologyOrder.patient)
    ).filter(models.RadiologyOrder.hospital_id == current_user.hospital_id).all()
    
    res = []
    for o in orders:
        res.append({
            "id": o.id,
            "hospital_id": o.hospital_id,
            "patient_id": o.patient_id,
            "patient_name": o.patient.full_name if o.patient else f"Patient #{o.patient_id}",
            "scan_type": getattr(o, "scan_type", None) or getattr(o, "test_type", None) or "X_Ray",
            "clinical_notes": getattr(o, "clinical_notes", None) or getattr(o, "clinical_indication", None) or "Routine Scan",
            "status": o.status
        })
    return res

@router.post("/reports")
def submit_report(report: schemas.RadiologyReportCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    order = db.query(models.RadiologyOrder).filter(models.RadiologyOrder.id == report.order_id).first()
    if not order: raise HTTPException(404, "Order not found")
    
    report_dict = report.dict()
    if not report_dict.get("impression"):
        report_dict["impression"] = report_dict.get("findings") or "Scan completed."
        
    db_report = models.RadiologyReport(hospital_id=current_user.hospital_id, reported_by_id=current_user.id, **report_dict)
    db.add(db_report)
    
    order.status = "Completed"
    db.commit()
    db.refresh(db_report)
    return db_report

from pydantic import BaseModel
from typing import Optional

class RadiologyStatusUpdate(BaseModel):
    status: str
    findings: Optional[str] = None

@router.put("/orders/{order_id}/status")
def update_radiology_order_status(order_id: int, data: RadiologyStatusUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    order = db.query(models.RadiologyOrder).filter(models.RadiologyOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Radiology order not found")
    
    order.status = data.status
    if data.findings and data.findings.strip():
        db_report = models.RadiologyReport(
            hospital_id=current_user.hospital_id,
            order_id=order.id,
            reported_by_id=current_user.id,
            findings=data.findings.strip(),
            impression=data.findings.strip()
        )
        db.add(db_report)
        
    db.commit()
    return {"message": f"Radiology order #{order_id} status updated to {data.status}", "status": data.status}

@router.get("/stats")
def get_radiology_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    orders = db.query(models.RadiologyOrder).filter(models.RadiologyOrder.created_at >= today_start).all()
    completed = sum(1 for o in orders if o.status == "Completed")
    in_progress = sum(1 for o in orders if o.status == "In Progress")
    pending = len(orders) - completed - in_progress
    return {"total_today": len(orders), "completed": completed, "in_progress": in_progress, "pending": pending}
