from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, dependencies

router = APIRouter(prefix="/cssd", tags=["CSSD"])

@router.get("/batches")
def get_cssd_batches(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    return db.query(models.CSSDBatch).filter(models.CSSDBatch.hospital_id == current_user.hospital_id).all()

@router.post("/batches")
def create_cssd_batch(batch_number: str, autoclave_number: str = "Autoclave-1", db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    new_batch = models.CSSDBatch(
        hospital_id=current_user.hospital_id,
        batch_number=batch_number,
        autoclave_number=autoclave_number,
        operator_id=current_user.id,
        status="Passed"
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    return new_batch

@router.get("/stats")
def get_cssd_stats(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    batches = db.query(models.CSSDBatch).filter(models.CSSDBatch.hospital_id == current_user.hospital_id).all()
    passed = sum(1 for b in batches if b.status == "Passed")
    return {"total_batches": len(batches), "passed_batches": passed}
