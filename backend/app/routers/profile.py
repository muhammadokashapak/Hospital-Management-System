from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import database, dependencies, models, auth
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/profile",
    tags=["Profile"]
)

class ProfileUpdate(BaseModel):
    full_name: str
    password: Optional[str] = None # Optional password update

@router.get("/")
def get_profile(current_user: models.User = Depends(dependencies.get_current_user)):
    res = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role).replace("RoleEnum.", ""),
        "gender": current_user.gender
    }
    if current_user.role == models.RoleEnum.TMO and current_user.tmo_profile:
        res["rotation_group_id"] = current_user.tmo_profile.rotation_group_id
        res["rotation_group_name"] = current_user.tmo_profile.rotation_group.name if current_user.tmo_profile.rotation_group else "Unassigned"
    elif current_user.role in [models.RoleEnum.House_Officer, "House Officer", "House_Officer"] and current_user.ho_profile:
        res["rotation_group_id"] = current_user.ho_profile.rotation_group_id
        res["rotation_group_name"] = current_user.ho_profile.rotation_group.name if current_user.ho_profile.rotation_group else "Unassigned"
    elif current_user.role == models.RoleEnum.Doctor and current_user.doctor_profile:
        res["doctor_profile"] = {
            "id": current_user.doctor_profile.id,
            "department_id": current_user.doctor_profile.department_id,
            "department_name": current_user.doctor_profile.department.name if current_user.doctor_profile.department else "General",
            "specialization": current_user.doctor_profile.specialization,
            "pmc_number": current_user.doctor_profile.pmc_number,
            "qualification": current_user.doctor_profile.qualification or "MBBS, FCPS",
            "experience_years": current_user.doctor_profile.experience_years or 10,
            "consultation_fee": current_user.doctor_profile.consultation_fee,
            "room_number": current_user.doctor_profile.room_number or "OPD-1"
        }
    return res

@router.put("/")
def update_profile(
    data: ProfileUpdate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    current_user.full_name = data.full_name
    if data.password:
        if len(data.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        current_user.password_hash = auth.get_password_hash(data.password)
        
    db.commit()
    return {"message": "Profile updated successfully"}
