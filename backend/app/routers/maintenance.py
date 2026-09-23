from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, dependencies

router = APIRouter(prefix="/maintenance", tags=["Facilities Maintenance"])

@router.get("/orders")
def get_work_orders(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    return db.query(models.FacilityWorkOrder).filter(models.FacilityWorkOrder.hospital_id == current_user.hospital_id).all()

@router.post("/orders")
def create_work_order(category: str, location: str, description: str, priority: str = "Medium", db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    wo = models.FacilityWorkOrder(
        hospital_id=current_user.hospital_id,
        category=category,
        location=location,
        description=description,
        priority=priority
    )
    db.add(wo)
    db.commit()
    db.refresh(wo)
    return wo
