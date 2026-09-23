from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, dependencies

router = APIRouter(prefix="/mortuary", tags=["Mortuary Management"])

@router.get("/records")
def get_mortuary_records(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    return db.query(models.MortuaryRecord).filter(models.MortuaryRecord.hospital_id == current_user.hospital_id).all()

@router.post("/records")
def register_deceased(deceased_name: str, chamber_number: str, cause_of_death: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    rec = models.MortuaryRecord(
        hospital_id=current_user.hospital_id,
        deceased_name=deceased_name,
        chamber_number=chamber_number,
        cause_of_death=cause_of_death
    )
    db.add(rec)
    db.commit()
    db.refresh(rec)
    return rec
