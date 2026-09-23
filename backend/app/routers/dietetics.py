from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from .. import models, dependencies

router = APIRouter(prefix="/dietetics", tags=["Dietetics & Clinical Nutrition"])

@router.get("/orders")
def get_diet_orders(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    orders = db.query(models.DietOrder).options(
        joinedload(models.DietOrder.patient)
    ).filter(models.DietOrder.hospital_id == current_user.hospital_id).all()
    
    res = []
    for o in orders:
        res.append({
            "id": o.id,
            "patient_id": o.patient_id,
            "patient_name": o.patient.full_name if o.patient else f"Patient #{o.patient_id}",
            "diet_type": o.diet_type,
            "special_instructions": o.special_instructions,
            "status": o.status
        })
    return res

@router.post("/orders")
def create_diet_order(patient_id: int, diet_type: str, special_instructions: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    diet = models.DietOrder(
        hospital_id=current_user.hospital_id,
        patient_id=patient_id,
        diet_type=diet_type,
        special_instructions=special_instructions
    )
    db.add(diet)
    db.commit()
    db.refresh(diet)
    return diet
