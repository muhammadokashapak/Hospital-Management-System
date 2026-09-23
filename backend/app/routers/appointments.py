from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from typing import List, Optional
from .. import models, schemas, database, dependencies, audit
from ..tenant_middleware import TenantContext

router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"]
)

@router.get("", response_model=List[schemas.AppointmentResponse])
@router.get("/", response_model=List[schemas.AppointmentResponse])
def get_all_appointments(
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    appointments = db.query(models.Appointment).filter(
        models.Appointment.hospital_id == ctx.hospital_id
    ).order_by(models.Appointment.id.desc()).all()
    return appointments

@router.get("/doctors", response_model=List[schemas.DoctorResponse])
def get_hospital_doctors(
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    doctors = db.query(models.Doctor).filter(
        models.Doctor.hospital_id == ctx.hospital_id
    ).all()
    return doctors

@router.post("", response_model=schemas.AppointmentResponse)
@router.post("/", response_model=schemas.AppointmentResponse)
def book_appointment(
    appointment: schemas.AppointmentCreate,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    # Verify patient belongs strictly to current user's hospital
    patient = db.query(models.Patient).filter(
        models.Patient.id == appointment.patient_id,
        models.Patient.hospital_id == ctx.hospital_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found in this hospital")
        
    # Verify doctor belongs strictly to current user's hospital
    doctor = db.query(models.Doctor).filter(
        models.Doctor.id == appointment.doctor_id,
        models.Doctor.hospital_id == ctx.hospital_id
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found in this hospital")
        
    today = date.today()
    max_token = db.query(func.coalesce(func.max(models.Appointment.token_number), 0)).filter(
        models.Appointment.hospital_id == ctx.hospital_id,
        models.Appointment.appointment_date == today
    ).scalar()
    
    next_token = (max_token or 0) + 1
    
    new_appointment = models.Appointment(
        hospital_id=ctx.hospital_id,
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
        appointment_date=today,
        token_number=next_token,
        status=models.AppointmentStatusEnum.Waiting
    )
    
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="APPOINTMENT_CREATED",
        module="APPOINTMENTS",
        details=f"Appointment ID {new_appointment.id} token #{next_token} created for patient {patient.id}",
        request=request
    )
    
    return new_appointment

@router.get("/queue/{doctor_id}", response_model=List[schemas.AppointmentResponse])
def get_doctor_queue(
    doctor_id: int,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    # Verify doctor belongs to hospital
    doctor = db.query(models.Doctor).filter(
        models.Doctor.id == doctor_id,
        models.Doctor.hospital_id == ctx.hospital_id
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found in this hospital")

    today = date.today()
    appointments = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor_id,
        models.Appointment.hospital_id == ctx.hospital_id,
        models.Appointment.appointment_date == today,
        models.Appointment.status.in_([
            models.AppointmentStatusEnum.Waiting, 
            models.AppointmentStatusEnum.On_Hold,
            models.AppointmentStatusEnum.Called
        ])
    ).order_by(models.Appointment.token_number.asc()).all()
    
    return appointments

@router.get("/live_queue")
def get_live_queue(
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    today = date.today()
    doctors = db.query(models.Doctor).filter(models.Doctor.hospital_id == ctx.hospital_id).all()
    
    live_data = []
    for doc in doctors:
        doc_name = doc.user.full_name if doc.user else f"Doctor #{doc.id}"
        dept_name = doc.department.name if doc.department else "General OPD"
        
        current_apt = db.query(models.Appointment).filter(
            models.Appointment.doctor_id == doc.id,
            models.Appointment.hospital_id == ctx.hospital_id,
            models.Appointment.appointment_date == today,
            models.Appointment.status.in_([
                models.AppointmentStatusEnum.In_Consultation,
                models.AppointmentStatusEnum.Called
            ])
        ).first()

        if not current_apt:
            current_apt = db.query(models.Appointment).filter(
                models.Appointment.doctor_id == doc.id,
                models.Appointment.hospital_id == ctx.hospital_id,
                models.Appointment.appointment_date == today,
                models.Appointment.status == models.AppointmentStatusEnum.Waiting
            ).order_by(models.Appointment.token_number.asc()).first()

        next_apt = db.query(models.Appointment).filter(
            models.Appointment.doctor_id == doc.id,
            models.Appointment.hospital_id == ctx.hospital_id,
            models.Appointment.appointment_date == today,
            models.Appointment.status == models.AppointmentStatusEnum.Waiting,
            models.Appointment.id != (current_apt.id if current_apt else 0)
        ).order_by(models.Appointment.token_number.asc()).first()
        
        current_token = f"#{current_apt.token_number}" if current_apt else "--"
        next_token = f"#{next_apt.token_number}" if next_apt else "--"
        patient_name = current_apt.patient.full_name if (current_apt and current_apt.patient) else "No Active Patient"

        live_data.append({
            "doctor": f"{doc_name} ({dept_name})",
            "room": doc.room_number or f"OPD Desk {doc.id}",
            "current": current_token,
            "next": next_token,
            "patient_name": patient_name
        })
            
    return live_data

@router.patch("/{appointment_id}/status")
def update_appointment_status(
    appointment_id: int,
    status_str: str,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    appointment = db.query(models.Appointment).filter(
        models.Appointment.id == appointment_id,
        models.Appointment.hospital_id == ctx.hospital_id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = status_str
    db.commit()

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="APPOINTMENT_STATUS_UPDATED",
        module="APPOINTMENTS",
        details=f"Appointment ID {appointment_id} status updated to {status_str}",
        request=request
    )

    return {"message": "Appointment status updated", "status": status_str}
