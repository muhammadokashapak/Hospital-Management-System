from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from .. import database, dependencies, models
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/swaps",
    tags=["Shift Swaps"],
    dependencies=[Depends(dependencies.get_current_user)]
)

class SwapCreate(BaseModel):
    acceptor_ho_id: int
    shift_to_give_id: int
    shift_to_take_id: Optional[int] = None

@router.post("/request")
def request_swap(
    swap_data: SwapCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """HO requests a shift swap."""
    ho_profile = db.query(models.HouseOfficer).filter(models.HouseOfficer.user_id == current_user.id).first()
    if not ho_profile:
        raise HTTPException(status_code=403, detail="Only House Officers can request swaps")

    new_swap = models.ShiftSwap(
        hospital_id=current_user.hospital_id,
        requester_ho_id=ho_profile.id,
        acceptor_ho_id=swap_data.acceptor_ho_id,
        shift_to_give_id=swap_data.shift_to_give_id,
        shift_to_take_id=swap_data.shift_to_take_id,
        status=models.SwapStatusEnum.Pending_Acceptance
    )
    db.add(new_swap)
    db.commit()
    db.refresh(new_swap)
    return new_swap

@router.put("/{swap_id}/accept")
def accept_swap(
    swap_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """Target HO accepts the swap, sending it to Admin for review."""
    swap = db.query(models.ShiftSwap).filter(
        models.ShiftSwap.id == swap_id,
        models.ShiftSwap.hospital_id == current_user.hospital_id
    ).first()
    
    if not swap:
        raise HTTPException(status_code=404, detail="Swap request not found")
        
    ho_profile = db.query(models.HouseOfficer).filter(models.HouseOfficer.user_id == current_user.id).first()
    if not ho_profile or swap.acceptor_ho_id != ho_profile.id:
        raise HTTPException(status_code=403, detail="You can only accept swaps directed to you")

    swap.status = models.SwapStatusEnum.Pending_Admin
    db.commit()
    return {"message": "Swap accepted, waiting for admin approval", "swap_id": swap.id}

@router.put("/{swap_id}/admin-approve")
def admin_approve_swap(
    swap_id: int,
    db: Session = Depends(database.get_db),
    current_admin: models.User = Depends(dependencies.get_current_active_admin)
):
    """Admin reviews and approves swap. Enforces gender and workload constraints."""
    swap = db.query(models.ShiftSwap).filter(
        models.ShiftSwap.id == swap_id,
        models.ShiftSwap.hospital_id == current_admin.hospital_id
    ).first()
    
    if not swap or swap.status != models.SwapStatusEnum.Pending_Admin:
        raise HTTPException(status_code=400, detail="Swap must be Pending_Admin to approve")

    shift_giving = db.query(models.DutyShift).filter(models.DutyShift.id == swap.shift_to_give_id, models.DutyShift.hospital_id == current_admin.hospital_id).first()
    shift_taking = db.query(models.DutyShift).filter(models.DutyShift.id == swap.shift_to_take_id, models.DutyShift.hospital_id == current_admin.hospital_id).first() if swap.shift_to_take_id else None

    # Fetch HO profiles
    requester = db.query(models.HouseOfficer).filter(models.HouseOfficer.id == swap.requester_ho_id).first()
    acceptor = db.query(models.HouseOfficer).filter(models.HouseOfficer.id == swap.acceptor_ho_id).first()
    
    if not shift_giving or not requester or not acceptor:
        raise HTTPException(status_code=404, detail="Shift or HO not found")
    
    # Validation Logic for Acceptor taking requester's shift
    if acceptor.user.gender == models.GenderEnum.Female:
        if shift_giving.shift_type == models.ShiftTypeEnum.Night or shift_giving.is_weekend:
            swap.status = models.SwapStatusEnum.Rejected
            db.commit()
            raise HTTPException(status_code=400, detail="Rejected: Female HOs cannot take Night/Sunday shifts.")
            
    # Post-Night Off Validation (Simplified: Check if Acceptor had a night shift the day before)
    prev_day = shift_giving.shift_date - timedelta(days=1)
    prev_shift = db.query(models.DutyShift).filter(
        models.DutyShift.house_officer_id == acceptor.id,
        models.DutyShift.shift_date == prev_day
    ).first()
    
    if prev_shift and prev_shift.shift_type == models.ShiftTypeEnum.Night:
        swap.status = models.SwapStatusEnum.Rejected
        db.commit()
        raise HTTPException(status_code=400, detail="Rejected: Acceptor is on Post-Night Off.")

    # Execute Swap
    shift_giving.house_officer_id = acceptor.id
    if shift_taking:
        shift_taking.house_officer_id = requester.id

    swap.status = models.SwapStatusEnum.Approved
    db.commit()
    
    return {"message": "Swap Approved and applied successfully", "status": swap.status}
