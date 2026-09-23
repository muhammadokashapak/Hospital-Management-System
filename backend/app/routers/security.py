from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from .. import models, dependencies

router = APIRouter(prefix="/security", tags=["Security & Visitor Management"])

@router.get("/passes")
def get_visitor_passes(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    passes = db.query(models.VisitorPass).options(
        joinedload(models.VisitorPass.patient)
    ).filter(models.VisitorPass.hospital_id == current_user.hospital_id).all()
    
    res = []
    for p in passes:
        res.append({
            "id": p.id,
            "visitor_name": p.visitor_name,
            "patient_id": p.patient_id,
            "patient_name": p.patient.full_name if p.patient else f"Patient #{p.patient_id}",
            "pass_number": p.pass_number,
            "status": p.status
        })
    return res

@router.post("/passes")
def issue_visitor_pass(visitor_name: str, patient_id: int, visitor_cnic: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    import random
    pass_num = f"VP-{random.randint(1000,9999)}"
    vp = models.VisitorPass(
        hospital_id=current_user.hospital_id,
        visitor_name=visitor_name,
        patient_id=patient_id,
        visitor_cnic=visitor_cnic,
        pass_number=pass_num
    )
    db.add(vp)
    db.commit()
    db.refresh(vp)
    return vp
