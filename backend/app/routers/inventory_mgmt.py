from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..dependencies import get_current_user

router = APIRouter(prefix="/inventory-mgmt", tags=["Inventory Management"])

@router.get("/", response_model=List[schemas.InventoryResponse])
def get_inventory(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Inventory).filter(models.Inventory.hospital_id == current_user.hospital_id).all()

@router.post("/", response_model=schemas.InventoryResponse)
def add_item(item: schemas.InventoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    hospital_id = current_user.hospital_id
    db_item = models.Inventory(hospital_id=hospital_id, **item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{id}/consume")
def consume_item(id: int, quantity: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    item = db.query(models.Inventory).filter(models.Inventory.id == id).first()
    if not item: raise HTTPException(404, "Item not found")
    if item.quantity < quantity: raise HTTPException(400, "Insufficient stock")
    item.quantity -= quantity
    db.commit()
    return {"message": "Stock consumed successfully", "remaining": item.quantity}

@router.get("/stats")
def get_inventory_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    items = db.query(models.Inventory).filter(models.Inventory.hospital_id == current_user.hospital_id).all()
    total_value = sum(i.quantity * i.unit_price for i in items)
    low_stock = sum(1 for i in items if i.quantity <= i.threshold_limit)
    return {"total_items": len(items), "low_stock_items": low_stock, "total_value": total_value}
