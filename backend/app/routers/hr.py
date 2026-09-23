from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from ..database import get_db
from .. import models, schemas
from ..dependencies import get_current_user

router = APIRouter(prefix="/hr", tags=["HR"])

@router.get("/attendance", response_model=List[schemas.AttendanceResponse])
def get_attendance(date_query: date = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not date_query:
        date_query = date.today()
    return db.query(models.Attendance).filter(
        models.Attendance.hospital_id == current_user.hospital_id,
        models.Attendance.login_date == date_query
    ).all()

@router.post("/attendance/mark")
def mark_attendance(user_id: int, status: models.AttendanceStatusEnum, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    att = models.Attendance(hospital_id=current_user.hospital_id, user_id=user_id, status=status, login_date=date.today())
    db.add(att)
    db.commit()
    return {"message": "Attendance marked successfully"}

@router.get("/leave-requests")
def get_leave_requests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.LeaveRequest).filter(models.LeaveRequest.hospital_id == current_user.hospital_id).all()

@router.get("/stats")
def get_hr_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total_staff = db.query(models.User).filter(models.User.hospital_id == current_user.hospital_id).count()
    present_today = db.query(models.Attendance).filter(
        models.Attendance.hospital_id == current_user.hospital_id,
        models.Attendance.login_date == date.today(),
        models.Attendance.status == models.AttendanceStatusEnum.Present
    ).count()
    return {"total_staff": total_staff, "present_today": present_today}
