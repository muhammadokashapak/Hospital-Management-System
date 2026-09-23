from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, datetime, timezone
from .. import models, schemas, database, dependencies

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"],
    dependencies=[Depends(dependencies.get_current_active_doctor)]
)

@router.post("/check-in")
def silent_check_in(db: Session = Depends(database.get_db), current_user: models.User = Depends(dependencies.get_current_active_doctor)):
    # Get doctor profile
    doctor = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
        
    today = date.today()
    
    # Check if attendance already exists for today
    existing_attendance = db.query(models.Attendance).filter(
        models.Attendance.doctor_id == doctor.id,
        models.Attendance.login_date == today
    ).first()
    
    if existing_attendance:
        return {"message": "Already checked in today", "check_in_time": existing_attendance.check_in}
        
    # Create new attendance record
    new_attendance = models.Attendance(
        hospital_id=current_user.hospital_id,
        doctor_id=doctor.id,
        login_date=date.today(),
        check_in=datetime.now(timezone.utc)
    )
    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)
    
    return {"message": "Checked in successfully", "check_in_time": new_attendance.check_in}
