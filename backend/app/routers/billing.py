from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, database, dependencies, audit
from ..tenant_middleware import TenantContext
from pydantic import BaseModel
import datetime

class InvoiceCreate(BaseModel):
    patient_id: int
    amount: float
    description: str
    invoice_type: Optional[str] = "Consultation"

class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_method: Optional[str] = "Cash"

router = APIRouter(
    prefix="/billing",
    tags=["Billing"]
)

@router.get("/invoices")
def get_invoices(
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    invoices = db.query(models.Invoice).filter(
        models.Invoice.hospital_id == ctx.hospital_id
    ).order_by(models.Invoice.id.desc()).all()
    
    res = []
    for i in invoices:
        res.append({
            "id": i.id,
            "patient_name": i.patient.full_name if i.patient else "Unknown",
            "patient_id": i.patient_id,
            "amount": i.amount,
            "description": i.description,
            "status": str(i.status),
            "created_at": i.created_at
        })
    return res

@router.get("/invoices/{invoice_id}")
def get_invoice_by_id(
    invoice_id: int,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == invoice_id,
        models.Invoice.hospital_id == ctx.hospital_id
    ).first()
    
    if not invoice:
        audit.log_audit_event(
            db=db,
            hospital_id=ctx.hospital_id,
            user_id=ctx.user_id,
            action="UNAUTHORIZED_INVOICE_ACCESS",
            module="BILLING",
            details=f"Attempted to access non-tenant invoice_id {invoice_id}",
            request=request
        )
        raise HTTPException(status_code=404, detail="Invoice not found")

    return {
        "id": invoice.id,
        "patient_name": invoice.patient.full_name if invoice.patient else "Unknown",
        "patient_id": invoice.patient_id,
        "amount": invoice.amount,
        "description": invoice.description,
        "status": str(invoice.status),
        "created_at": invoice.created_at
    }

@router.post("/invoices")
def create_invoice(
    data: InvoiceCreate,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    # Verify patient belongs to current hospital
    patient = db.query(models.Patient).filter(
        models.Patient.id == data.patient_id,
        models.Patient.hospital_id == ctx.hospital_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found in this hospital")

    new_invoice = models.Invoice(
        hospital_id=ctx.hospital_id,
        patient_id=data.patient_id,
        amount=data.amount,
        description=data.description,
        invoice_type=data.invoice_type
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="INVOICE_CREATED",
        module="BILLING",
        details=f"Created invoice ID {new_invoice.id} (${data.amount}) for patient {patient.id}",
        request=request
    )

    return new_invoice

@router.post("/{id}/pay")
@router.post("/payments")
def record_payment(
    id: Optional[int] = None,
    payment_data: Optional[PaymentCreate] = None,
    request: Request = None,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    target_id = id or (payment_data.invoice_id if payment_data else None)
    if not target_id:
        raise HTTPException(status_code=400, detail="Missing invoice_id")

    invoice = db.query(models.Invoice).filter(
        models.Invoice.id == target_id,
        models.Invoice.hospital_id == ctx.hospital_id
    ).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    invoice.status = models.InvoiceStatusEnum.Paid
    invoice.payment_date = datetime.datetime.utcnow()
    db.commit()

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="PAYMENT_RECORDED",
        module="BILLING",
        details=f"Payment recorded for invoice ID {invoice.id}",
        request=request
    )

    return {"message": "Invoice paid successfully", "invoice_id": invoice.id}
