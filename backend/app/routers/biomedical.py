from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, dependencies

router = APIRouter(prefix="/biomedical", tags=["Biomedical Engineering"])

@router.get("/assets")
def get_assets(db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    return db.query(models.BiomedicalAsset).filter(models.BiomedicalAsset.hospital_id == current_user.hospital_id).all()

@router.post("/assets")
def add_asset(asset_name: str, department_name: str, model_number: str = None, db: Session = Depends(get_db), current_user: models.User = Depends(dependencies.get_current_user)):
    asset = models.BiomedicalAsset(
        hospital_id=current_user.hospital_id,
        asset_name=asset_name,
        department_name=department_name,
        model_number=model_number
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset
