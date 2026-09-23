from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, database, dependencies
from pydantic import BaseModel

class PrescriptionCreate(BaseModel):
    patient_id: int
    medication: str
    dosage: str

router = APIRouter(
    prefix="/pharmacy",
    tags=["Pharmacy"],
    dependencies=[Depends(dependencies.get_current_user)]
)

@router.get("/prescriptions")
def get_prescriptions(db: Session = Depends(database.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    prescriptions = db.query(models.Prescription).filter(
        models.Prescription.hospital_id == current_user.hospital_id
    ).order_by(models.Prescription.id.desc()).all()
    
    return [{
        "id": p.id,
        "medication": p.medication,
        "dosage": p.dosage,
        "status": p.status,
        "follow_up_days": p.follow_up_days,
        "follow_up_type": p.follow_up_type,
        "follow_up_notes": p.follow_up_notes,
        "created_at": p.created_at,
        "patient": {"full_name": p.patient.full_name, "id": p.patient_id} if p.patient else None,
        "doctor": {"user": {"full_name": p.doctor.user.full_name}} if p.doctor else None
    } for p in prescriptions]

@router.post("/prescriptions/{id}/dispense")
def dispense_prescription(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(dependencies.get_current_pharmacist)):
    presc = db.query(models.Prescription).filter(
        models.Prescription.id == id,
        models.Prescription.hospital_id == current_user.hospital_id
    ).first()
    
    if not presc:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    presc.status = models.PrescriptionStatusEnum.Dispensed
    db.commit()
    return {"message": "Dispensed successfully"}

@router.post("/prescriptions")
def create_prescription(data: PrescriptionCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    # Data should have patient_id, medication, dosage
    doc = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=403, detail="Only doctors can prescribe")
        
    new_presc = models.Prescription(
        hospital_id=current_user.hospital_id,
        patient_id=data.patient_id,
        doctor_id=doc.id,
        medication=data.medication,
        dosage=data.dosage
    )
    db.add(new_presc)
    db.commit()
    db.refresh(new_presc)
    return new_presc
