from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database, dependencies, audit
from ..tenant_middleware import TenantContext

router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)

@router.get("", response_model=List[schemas.PatientResponse])
@router.get("/", response_model=List[schemas.PatientResponse])
def get_all_patients(
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    """
    Returns all patients belonging ONLY to the authenticated user's hospital.
    """
    patients = db.query(models.Patient).filter(
        models.Patient.hospital_id == ctx.hospital_id
    ).all()
    return patients

@router.get("/search", response_model=schemas.PatientResponse)
def search_patient(
    phone: str,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    patient = db.query(models.Patient).filter(
        models.Patient.phone == phone,
        models.Patient.hospital_id == ctx.hospital_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/{patient_id}", response_model=schemas.PatientResponse)
def get_patient_by_id(
    patient_id: int,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    patient = db.query(models.Patient).filter(
        models.Patient.id == patient_id,
        models.Patient.hospital_id == ctx.hospital_id
    ).first()
    
    if not patient:
        audit.log_audit_event(
            db=db,
            hospital_id=ctx.hospital_id,
            user_id=ctx.user_id,
            action="UNAUTHORIZED_PATIENT_ACCESS_ATTEMPT",
            module="PATIENTS",
            details=f"Attempted to access non-tenant patient_id {patient_id}",
            request=request
        )
        raise HTTPException(status_code=404, detail="Patient not found")

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="PATIENT_VIEWED",
        module="PATIENTS",
        details=f"Viewed patient_id {patient.id}",
        request=request
    )
    return patient

@router.post("", response_model=schemas.PatientResponse)
@router.post("/", response_model=schemas.PatientResponse)
def register_patient(
    patient: schemas.PatientCreate,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    db_patient = db.query(models.Patient).filter(
        models.Patient.phone == patient.phone,
        models.Patient.hospital_id == ctx.hospital_id
    ).first()
    if db_patient:
        raise HTTPException(status_code=400, detail="Phone number already registered in this hospital")
        
    if patient.cnic:
        db_cnic = db.query(models.Patient).filter(
            models.Patient.cnic == patient.cnic,
            models.Patient.hospital_id == ctx.hospital_id
        ).first()
        if db_cnic:
            raise HTTPException(status_code=400, detail="CNIC already registered in this hospital")
            
    new_patient = models.Patient(
        hospital_id=ctx.hospital_id,
        phone=patient.phone,
        cnic=patient.cnic,
        full_name=patient.full_name,
        age=patient.age,
        gender=patient.gender,
        emergency_contact=patient.emergency_contact
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="PATIENT_CREATED",
        module="PATIENTS",
        details=f"Created patient_id {new_patient.id} ({new_patient.full_name})",
        request=request
    )

    return new_patient

@router.patch("/{patient_id}", response_model=schemas.PatientResponse)
def update_patient(
    patient_id: int,
    patient_update: schemas.PatientCreate,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    patient = db.query(models.Patient).filter(
        models.Patient.id == patient_id,
        models.Patient.hospital_id == ctx.hospital_id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.full_name = patient_update.full_name
    patient.phone = patient_update.phone
    patient.cnic = patient_update.cnic
    patient.age = patient_update.age
    patient.gender = patient_update.gender
    patient.emergency_contact = patient_update.emergency_contact

    db.commit()
    db.refresh(patient)

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="PATIENT_UPDATED",
        module="PATIENTS",
        details=f"Updated patient_id {patient.id}",
        request=request
    )

    return patient

@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    patient = db.query(models.Patient).filter(
        models.Patient.id == patient_id,
        models.Patient.hospital_id == ctx.hospital_id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db.delete(patient)
    db.commit()

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="PATIENT_DELETED",
        module="PATIENTS",
        details=f"Deleted patient_id {patient_id}",
        request=request
    )

    return {"message": f"Patient {patient_id} deleted successfully"}
