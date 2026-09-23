from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, database, dependencies
from pydantic import BaseModel
from typing import Optional

class LabTestCreate(BaseModel):
    patient_id: int
    test_name: str

class LabResultSubmit(BaseModel):
    result: str

router = APIRouter(
    prefix="/lab",
    tags=["Lab"],
    dependencies=[Depends(dependencies.get_current_user)]
)

@router.get("/orders")
def get_lab_orders(patient_id: Optional[int] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    query = db.query(models.LabTest).filter(
        models.LabTest.hospital_id == current_user.hospital_id
    )
    if patient_id:
        query = query.filter(models.LabTest.patient_id == patient_id)
        
    orders = query.order_by(models.LabTest.id.desc()).all()
    
    res = []
    for o in orders:
        res.append({
            "id": o.id,
            "test_name": o.test_name,
            "patient_id": o.patient_id,
            "patient_name": o.patient.full_name,
            "doctor_name": o.doctor.user.full_name,
            "status": o.status,
            "result": o.result,
            "created_at": o.created_at
        })
    return res

@router.post("/{id}/results")
def submit_result(id: int, data: LabResultSubmit, db: Session = Depends(database.get_db), current_user: models.User = Depends(dependencies.get_current_lab_tech)):
    order = db.query(models.LabTest).filter(
        models.LabTest.id == id,
        models.LabTest.hospital_id == current_user.hospital_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Lab order not found")
        
    order.result = data.result
    order.status = models.LabTestStatusEnum.Completed
    db.commit()
    return {"message": "Result submitted successfully"}

@router.post("/orders")
def create_lab_order(data: LabTestCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    doc = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=403, detail="Only doctors can order tests")
        
    new_order = models.LabTest(
        hospital_id=current_user.hospital_id,
        patient_id=data.patient_id,
        doctor_id=doc.id,
        test_name=data.test_name
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order
