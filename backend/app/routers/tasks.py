from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import database, dependencies, models
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(
    prefix="/tasks",
    tags=["TMO-HO Tasks"]
)

class TaskCreate(BaseModel):
    ho_id: int
    task_title: str
    task_description: Optional[str] = None

class TaskStatusUpdate(BaseModel):
    status: models.TaskStatusEnum

@router.post("/")
def create_task(
    data: TaskCreate,
    db: Session = Depends(database.get_db),
    current_tmo: models.User = Depends(dependencies.get_current_tmo)
):
    """
    TMO assigns a task to a House Officer in their rotation group.
    """
    ho = db.query(models.HouseOfficer).filter(
        models.HouseOfficer.id == data.ho_id,
        models.HouseOfficer.hospital_id == current_tmo.hospital_id
    ).first()
    
    if not ho:
        raise HTTPException(status_code=404, detail="House Officer not found.")
        
    if ho.rotation_group_id != current_tmo.tmo_profile.rotation_group_id:
        raise HTTPException(status_code=403, detail="You can only assign tasks to HOs within your rotation group track.")
        
    task = models.HOTask(
        hospital_id=current_tmo.hospital_id,
        tmo_id=current_tmo.tmo_profile.id,
        ho_id=data.ho_id,
        task_title=data.task_title,
        task_description=data.task_description,
        status=models.TaskStatusEnum.Pending
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"message": "Task assigned successfully.", "task_id": task.id}

@router.get("/my_tasks")
def get_my_tasks(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Fetch all tasks assigned to the logged-in House Officer.
    """
    if current_user.role != models.RoleEnum.House_Officer:
        raise HTTPException(status_code=403, detail="Only House Officers can access their task feed.")
        
    tasks = db.query(models.HOTask).filter(
        models.HOTask.ho_id == current_user.ho_profile.id,
        models.HOTask.hospital_id == current_user.hospital_id
    ).order_by(models.HOTask.created_at.desc()).all()
    
    return [
        {
            "id": t.id,
            "tmo_name": t.tmo.user.full_name,
            "task_title": t.task_title,
            "task_description": t.task_description,
            "status": t.status,
            "created_at": t.created_at
        } for t in tasks
    ]

@router.get("/tmo_assigned")
def get_tmo_assigned_tasks(
    db: Session = Depends(database.get_db),
    current_tmo: models.User = Depends(dependencies.get_current_tmo)
):
    """
    Fetch all tasks assigned by the logged-in TMO.
    """
    tasks = db.query(models.HOTask).filter(
        models.HOTask.tmo_id == current_tmo.tmo_profile.id,
        models.HOTask.hospital_id == current_tmo.hospital_id
    ).order_by(models.HOTask.created_at.desc()).all()
    
    return [
        {
            "id": t.id,
            "ho_name": t.house_officer.user.full_name,
            "task_title": t.task_title,
            "task_description": t.task_description,
            "status": t.status,
            "created_at": t.created_at
        } for t in tasks
    ]

@router.put("/{task_id}/status")
def update_task_status(
    task_id: int,
    data: TaskStatusUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    House Officer updates the progress of an assigned task.
    """
    if current_user.role != models.RoleEnum.House_Officer:
        raise HTTPException(status_code=403, detail="Only HOs can update task status.")
        
    task = db.query(models.HOTask).filter(
        models.HOTask.id == task_id,
        models.HOTask.ho_id == current_user.ho_profile.id,
        models.HOTask.hospital_id == current_user.hospital_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
        
    task.status = data.status
    db.commit()
    return {"message": "Task status updated successfully."}

@router.get("/group_hos")
def get_group_house_officers(
    db: Session = Depends(database.get_db),
    current_tmo: models.User = Depends(dependencies.get_current_tmo)
):
    """
    Fetch all House Officers registered in the same Rotation Group as the logged-in TMO.
    """
    tmo_group_id = current_tmo.tmo_profile.rotation_group_id
    if not tmo_group_id:
        return []
        
    hos = db.query(models.HouseOfficer).filter(
        models.HouseOfficer.rotation_group_id == tmo_group_id,
        models.HouseOfficer.hospital_id == current_tmo.hospital_id
    ).all()
    
    return [
        {
            "id": h.id,
            "full_name": h.user.full_name,
            "email": h.user.email,
            "gender": h.user.gender,
            "batch_year": h.batch_year
        } for h in hos
    ]

class LogbookCreate(BaseModel):
    procedure_name: str

@router.post("/logbook")
def submit_logbook(
    data: LogbookCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    House Officer submits a procedure to their TMO for approval.
    """
    if current_user.role != models.RoleEnum.House_Officer:
        raise HTTPException(status_code=403, detail="Only House Officers can submit logbook entries.")
        
    ho = current_user.ho_profile
    if not ho or not ho.rotation_group_id:
        raise HTTPException(status_code=400, detail="HO profile not found or not assigned to a rotation group.")
        
    # Find TMO assigned to the same rotation group
    tmo = db.query(models.TMOProfile).filter(models.TMOProfile.rotation_group_id == ho.rotation_group_id).first()
    if not tmo:
        raise HTTPException(status_code=400, detail="No TMO assigned to your rotation group.")
        
    entry = models.TMOLogbook(
        hospital_id=current_user.hospital_id,
        tmo_id=tmo.id,
        ho_id=ho.id,
        procedure_name=data.procedure_name,
        supervisor_approved=False
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"message": "Logbook entry submitted.", "entry_id": entry.id}

@router.get("/logbook/my_entries")
def get_my_logbook(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    """
    Get all logbook entries submitted by this HO.
    """
    if current_user.role != models.RoleEnum.House_Officer:
        raise HTTPException(status_code=403, detail="Only HOs can query their own logbook.")
        
    if not current_user.ho_profile:
        return []
        
    entries = db.query(models.TMOLogbook).filter(
        models.TMOLogbook.hospital_id == current_user.hospital_id,
        models.TMOLogbook.ho_id == current_user.ho_profile.id
    ).all()
    
    return [
        {
            "id": e.id,
            "procedure_name": e.procedure_name,
            "date_performed": e.date_performed,
            "supervisor_approved": e.supervisor_approved,
            "tmo_name": e.tmo.user.full_name if e.tmo else "N/A"
        } for e in entries
    ]

@router.get("/logbook/inbox")
def get_logbook_inbox(
    db: Session = Depends(database.get_db),
    current_tmo: models.User = Depends(dependencies.get_current_tmo)
):
    """
    Get all logbook entries waiting for this TMO's approval.
    """
    entries = db.query(models.TMOLogbook).filter(
        models.TMOLogbook.tmo_id == current_tmo.tmo_profile.id,
        models.TMOLogbook.hospital_id == current_tmo.hospital_id
    ).all()
    
    return [
        {
            "id": e.id,
            "procedure_name": e.procedure_name,
            "date_performed": e.date_performed,
            "supervisor_approved": e.supervisor_approved
        } for e in entries
    ]

@router.put("/logbook/{entry_id}/approve")
def approve_logbook_entry(
    entry_id: int,
    db: Session = Depends(database.get_db),
    current_tmo: models.User = Depends(dependencies.get_current_tmo)
):
    """
    TMO approves a logbook entry.
    """
    entry = db.query(models.TMOLogbook).filter(
        models.TMOLogbook.id == entry_id,
        models.TMOLogbook.tmo_id == current_tmo.tmo_profile.id,
        models.TMOLogbook.hospital_id == current_tmo.hospital_id
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="Logbook entry not found.")
        
    entry.supervisor_approved = True
    db.commit()
    return {"message": "Procedure log approved successfully."}
