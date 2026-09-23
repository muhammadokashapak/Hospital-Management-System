from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas, dependencies, audit
from ..tenant_middleware import TenantContext

router = APIRouter(prefix="/medical-records", tags=["Medical Records"])

@router.get("", response_model=List[schemas.MedicalRecordResponse])
@router.get("/", response_model=List[schemas.MedicalRecordResponse])
def get_all_medical_records(
    db: Session = Depends(get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    records = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.hospital_id == ctx.hospital_id
    ).order_by(models.MedicalRecord.visit_date.desc()).all()
    return records

@router.post("", response_model=schemas.MedicalRecordResponse)
@router.post("/", response_model=schemas.MedicalRecordResponse)
def create_medical_record(
    record: schemas.MedicalRecordCreate,
    request: Request,
    db: Session = Depends(get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    # Verify patient belongs to current hospital
    patient = db.query(models.Patient).filter(
        models.Patient.id == record.patient_id,
        models.Patient.hospital_id == ctx.hospital_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found in this hospital")

    db_rec = models.MedicalRecord(
        hospital_id=ctx.hospital_id,
        **record.dict()
    )
    db.add(db_rec)
    db.commit()
    db.refresh(db_rec)

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="MEDICAL_RECORD_CREATED",
        module="CLINICAL",
        details=f"Created medical record ID {db_rec.id} for patient {patient.id}",
        request=request
    )

    return db_rec

@router.get("/patient/{patient_id}", response_model=List[schemas.MedicalRecordResponse])
def get_patient_records(
    patient_id: int,
    request: Request,
    db: Session = Depends(get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    # Verify patient belongs to hospital
    patient = db.query(models.Patient).filter(
        models.Patient.id == patient_id,
        models.Patient.hospital_id == ctx.hospital_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found in this hospital")

    records = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.hospital_id == ctx.hospital_id,
        models.MedicalRecord.patient_id == patient_id
    ).order_by(models.MedicalRecord.visit_date.desc()).all()

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="MEDICAL_RECORD_VIEWED",
        module="CLINICAL",
        details=f"Viewed medical records for patient_id {patient_id}",
        request=request
    )

    return records
