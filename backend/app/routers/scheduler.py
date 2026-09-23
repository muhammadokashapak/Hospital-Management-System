from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from .. import database, dependencies, models
from ..scheduler_logic import generate_fair_shifts, generate_rotations

router = APIRouter(
    prefix="/scheduler",
    tags=["HO Scheduler"]
)

@router.post("/generate_shifts")
def generate_schedule(
    rotation_group_id: int,
    start_date: date, 
    days: int = 30,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Generates a fair, points-based shift schedule for House Officers.
    Authorized for Admins or TMOs in charge of the batch.
    """
    if current_user.role == models.RoleEnum.TMO:
        if not current_user.tmo_profile or current_user.tmo_profile.rotation_group_id != rotation_group_id:
            raise HTTPException(status_code=403, detail="You are not authorized to schedule shifts for this rotation group.")
    elif current_user.role != models.RoleEnum.Admin:
        raise HTTPException(status_code=403, detail="Only Admins and TMOs can generate schedules.")
        
    try:
        result = generate_fair_shifts(db, hospital_id=current_user.hospital_id, rotation_group_id=rotation_group_id, start_date=start_date, days=days)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate_rotations")
def generate_block_rotations(
    rotation_group_id: int,
    start_date: date,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Generates a 3-month block rotation sequence mapping HOs to departments within their assigned track.
    Authorized for Admins or TMOs in charge of the batch.
    """
    if current_user.role == models.RoleEnum.TMO:
        if not current_user.tmo_profile or current_user.tmo_profile.rotation_group_id != rotation_group_id:
            raise HTTPException(status_code=403, detail="You are not authorized to generate rotations for this rotation group.")
    elif current_user.role != models.RoleEnum.Admin:
        raise HTTPException(status_code=403, detail="Only Admins and TMOs can generate rotations.")
        
    try:
        result = generate_rotations(db, hospital_id=current_user.hospital_id, rotation_group_id=rotation_group_id, start_date=start_date)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/shifts")
def get_shifts(
    start_date: date,
    end_date: date,
    group_id: int = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user) # Anyone authenticated can view
):
    """
    Fetches the generated shifts for visualization in the planner grid.
    Admins can use this to monitor all tracks or specific groups.
    """
    # Restrict data to the user's hospital tenant
    query = db.query(models.DutyShift).join(models.HouseOfficer).join(models.User).filter(
        models.DutyShift.hospital_id == current_user.hospital_id,
        models.DutyShift.shift_date >= start_date,
        models.DutyShift.shift_date <= end_date
    )
    if group_id:
        query = query.filter(models.HouseOfficer.rotation_group_id == group_id)
        
    shifts = query.all()
    
    # Format for frontend grid
    result = []
    for shift in shifts:
        result.append({
            "id": shift.id,
            "house_officer_id": shift.house_officer_id,
            "ho_name": shift.house_officer.user.full_name,
            "gender": shift.house_officer.user.gender,
            "date": shift.shift_date,
            "type": shift.shift_type,
            "points": shift.points_assigned
        })
    return result

@router.get("/my_shifts")
def get_my_shifts(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Fetches the logged-in HO's upcoming shifts.
    """
    if current_user.role not in [models.RoleEnum.House_Officer, "House Officer", "House_Officer"]:
        raise HTTPException(status_code=403, detail="Not an HO.")
    
    ho = db.query(models.HouseOfficer).filter(models.HouseOfficer.user_id == current_user.id).first()
    if not ho:
        return []
        
    shifts = db.query(models.DutyShift).filter(
        models.DutyShift.house_officer_id == ho.id
    ).order_by(models.DutyShift.shift_date.asc()).limit(14).all()
    
    return [{"id": s.id, "date": s.shift_date, "type": s.shift_type} for s in shifts]
