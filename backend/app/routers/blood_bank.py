from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..dependencies import get_current_user

router = APIRouter(prefix="/blood-bank", tags=["Blood Bank"])

@router.get("/inventory", response_model=List[schemas.BloodStockResponse])
def get_blood_inventory(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.BloodStock).filter(models.BloodStock.hospital_id == current_user.hospital_id).all()

@router.post("/stock", response_model=schemas.BloodStockResponse)
def add_blood_stock(stock: schemas.BloodStockCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    # Check if stock entry already exists for this group & component
    existing = db.query(models.BloodStock).filter(
        models.BloodStock.hospital_id == hospital_id,
        models.BloodStock.blood_group == stock.blood_group,
        models.BloodStock.component == stock.component
    ).first()
    
    if existing:
        existing.units_available += stock.units_available
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_stock = models.BloodStock(hospital_id=hospital_id, **stock.dict())
        db.add(new_stock)
        db.commit()
        db.refresh(new_stock)
        return new_stock

@router.post("/issue")
def issue_blood(blood_group: str, component: str, units: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    stock = db.query(models.BloodStock).filter(
        models.BloodStock.hospital_id == current_user.hospital_id,
        models.BloodStock.blood_group == blood_group,
        models.BloodStock.component == component
    ).first()
    
    if not stock or stock.units_available < units:
        raise HTTPException(400, "Insufficient blood stock")
        
    stock.units_available -= units
    db.commit()
    return {"message": f"Successfully issued {units} units of {blood_group} {component}"}

@router.get("/stats")
def get_blood_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    stock = db.query(models.BloodStock).filter(models.BloodStock.hospital_id == current_user.hospital_id).all()
    total_units = sum(s.units_available for s in stock)
    critical = sum(1 for s in stock if s.units_available < 5)
    return {"total_units": total_units, "critical_groups": critical}
