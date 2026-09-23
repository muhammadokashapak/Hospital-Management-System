from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from .. import models, schemas, database, auth, dependencies, audit
from ..tenant_middleware import TenantContext

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

class HospitalCreate(BaseModel):
    name: str
    license_key: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class HospitalStatusUpdate(BaseModel):
    status: str

# --- PLATFORM SUPER ADMIN ENDPOINTS ---
@router.get("/hospitals")
def get_all_hospitals(
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    clean_role = str(ctx.role).replace("RoleEnum.", "")
    if clean_role not in ["SuperAdmin", "PlatformSuperAdmin"]:
        raise HTTPException(status_code=403, detail="Platform Super Admin access required")
    hospitals = db.query(models.Hospital).all()
    result = []
    for h in hospitals:
        sub = db.query(models.Subscription).filter(models.Subscription.hospital_id == h.id).first()
        admin_user = db.query(models.User).filter(
            models.User.hospital_id == h.id,
            models.User.role == models.RoleEnum.Admin
        ).first()
        
        admin_email = admin_user.email if admin_user else (h.email if (h.email and "admin" in h.email) else f"admin_{h.name.lower().replace(' ', '')}@hospitalcloud.com")
        result.append({
            "id": h.id,
            "hospital_code": f"H{h.id:03d}",
            "name": h.name,
            "license_key": h.license_key,
            "address": h.address,
            "phone": h.phone,
            "email": h.email,
            "admin_email": admin_email,
            "status": sub.status if sub else "Active",
            "invitation_link": f"/activate-account?hospital_id={h.id}&email={admin_email}"
        })
    return result

@router.post("/hospitals")
def create_hospital(
    data: HospitalCreate,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    clean_role = str(ctx.role).replace("RoleEnum.", "")
    if clean_role not in ["SuperAdmin", "PlatformSuperAdmin"]:
        raise HTTPException(status_code=403, detail="Platform Super Admin access required")

    existing = db.query(models.Hospital).filter(models.Hospital.license_key == data.license_key).first()
    if existing:
        raise HTTPException(status_code=400, detail="License key already exists")

    h = models.Hospital(
        name=data.name,
        license_key=data.license_key,
        address=data.address,
        phone=data.phone,
        email=data.email
    )
    db.add(h)
    db.commit()
    db.refresh(h)

    hospital_code = f"H{h.id:03d}"

    # Initialize default settings and subscription
    setting = models.HospitalSetting(hospital_id=h.id)
    sub = models.Subscription(hospital_id=h.id, status="Active")
    db.add(setting)
    db.add(sub)
    db.commit()

    # Automatically create Hospital Admin account as per architecture requirements
    clean_name = "".join(e for e in data.name.lower() if e.isalnum())
    admin_email = data.email if (data.email and "@" in data.email) else f"admin_{clean_name}@hospitalcloud.com"
    
    # Check if user with this email exists
    admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
    if not admin_user:
        temp_pwd = "AdminSetup123!"
        admin_user = models.User(
            hospital_id=h.id,
            email=admin_email,
            password_hash=auth.get_password_hash(temp_pwd),
            full_name=f"{data.name} Admin",
            role=models.RoleEnum.Admin,
            gender=models.GenderEnum.Male
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    audit.log_audit_event(
        db=db,
        hospital_id=h.id,
        user_id=ctx.user_id,
        action="HOSPITAL_CREATED",
        module="PLATFORM_ADMIN",
        details=f"Created hospital '{h.name}' (Code: {hospital_code}, ID {h.id}) & auto-provisioned Admin ({admin_email})",
        request=request
    )

    return {
        "id": h.id,
        "hospital_code": hospital_code,
        "name": h.name,
        "license_key": h.license_key,
        "address": h.address,
        "phone": h.phone,
        "email": h.email,
        "status": "Active",
        "admin_email": admin_email,
        "invitation_link": f"/activate-account?hospital_id={h.id}&email={admin_email}"
    }

@router.put("/hospitals/{hospital_id}/status")
def update_hospital_status(
    hospital_id: int,
    data: HospitalStatusUpdate,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    clean_role = str(ctx.role).replace("RoleEnum.", "")
    if clean_role not in ["SuperAdmin", "PlatformSuperAdmin"]:
        raise HTTPException(status_code=403, detail="Platform Super Admin access required")

    sub = db.query(models.Subscription).filter(models.Subscription.hospital_id == hospital_id).first()
    if not sub:
        sub = models.Subscription(hospital_id=hospital_id, status=data.status)
        db.add(sub)
    else:
        sub.status = data.status
    db.commit()

    audit.log_audit_event(
        db=db,
        hospital_id=hospital_id,
        user_id=ctx.user_id,
        action="HOSPITAL_STATUS_UPDATED",
        module="PLATFORM_ADMIN",
        details=f"Updated hospital ID {hospital_id} subscription status to {data.status}",
        request=request
    )
    return {"message": f"Hospital status updated to {data.status}", "hospital_id": hospital_id, "status": data.status}


# --- TENANT HOSPITAL ADMIN ENDPOINTS ---
@router.post("/users/", response_model=schemas.UserResponse)
def create_user(
    user: schemas.UserCreate,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        hospital_id=ctx.hospital_id,
        email=user.email,
        password_hash=hashed_password,
        full_name=user.full_name,
        role=user.role,
        gender=user.gender
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="USER_CREATED",
        module="ADMIN",
        details=f"Created user {new_user.email} (Role {new_user.role})",
        request=request
    )

    return new_user

@router.get("/users/", response_model=List[schemas.UserResponse])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    users = db.query(models.User).filter(
        models.User.hospital_id == ctx.hospital_id
    ).offset(skip).limit(limit).all()
    return users

@router.post("/departments/", response_model=schemas.DepartmentResponse)
def create_department(
    department: schemas.DepartmentCreate,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    db_dept = db.query(models.Department).filter(
        models.Department.name == department.name,
        models.Department.hospital_id == ctx.hospital_id
    ).first()
    if db_dept:
        raise HTTPException(status_code=400, detail="Department already exists in this hospital")
    
    new_dept = models.Department(hospital_id=ctx.hospital_id, name=department.name)
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="DEPARTMENT_CREATED",
        module="ADMIN",
        details=f"Created department '{new_dept.name}'",
        request=request
    )

    return new_dept

@router.get("/departments/", response_model=List[schemas.DepartmentResponse])
def read_departments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    departments = db.query(models.Department).filter(
        models.Department.hospital_id == ctx.hospital_id
    ).offset(skip).limit(limit).all()
    return departments

@router.post("/doctors/", response_model=schemas.DoctorResponse)
def create_doctor(
    doctor: schemas.DoctorCreate,
    request: Request,
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    user = db.query(models.User).filter(
        models.User.id == doctor.user_id,
        models.User.hospital_id == ctx.hospital_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this hospital")

    db_doctor = db.query(models.Doctor).filter(
        models.Doctor.user_id == doctor.user_id,
        models.Doctor.hospital_id == ctx.hospital_id
    ).first()
    if db_doctor:
        raise HTTPException(status_code=400, detail="Doctor profile already exists for this user")
        
    new_doctor = models.Doctor(
        hospital_id=ctx.hospital_id,
        user_id=doctor.user_id,
        department_id=doctor.department_id,
        specialization=doctor.specialization,
        is_available=doctor.is_available
    )
    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)

    audit.log_audit_event(
        db=db,
        hospital_id=ctx.hospital_id,
        user_id=ctx.user_id,
        action="DOCTOR_PROFILE_CREATED",
        module="ADMIN",
        details=f"Created doctor profile for user {user.id}",
        request=request
    )

    return new_doctor

@router.get("/stats/")
def get_admin_dashboard_stats(
    db: Session = Depends(database.get_db),
    ctx: TenantContext = Depends(dependencies.get_tenant_context)
):
    hospital_id = ctx.hospital_id
    total_staff = db.query(models.User).filter(models.User.hospital_id == hospital_id).count()
    total_patients = db.query(models.Patient).filter(models.Patient.hospital_id == hospital_id).count()
    total_beds = db.query(models.WardBed).filter(models.WardBed.hospital_id == hospital_id).count()
    occupied_beds = db.query(models.WardBed).filter(
        models.WardBed.hospital_id == hospital_id,
        models.WardBed.is_occupied == True
    ).count()
    active_er = db.query(models.EmergencyCase).filter(
        models.EmergencyCase.hospital_id == hospital_id,
        models.EmergencyCase.status.in_(["Triaged", "Under_Treatment"])
    ).count()
    active_admissions = db.query(models.Admission).filter(
        models.Admission.hospital_id == hospital_id,
        models.Admission.status == models.AdmissionStatusEnum.Admitted
    ).count()

    return {
        "total_staff": total_staff,
        "total_patients": total_patients,
        "total_beds": total_beds,
        "occupied_beds": occupied_beds,
        "active_er_cases": active_er,
        "active_admissions": active_admissions
    }
