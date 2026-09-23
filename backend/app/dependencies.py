from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session
from typing import List, Optional
from . import database, models, auth
from .tenant_middleware import TenantContext

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_tenant_context(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(database.get_db)
) -> TenantContext:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = auth.decode_access_token(token)
    if not payload:
        raise credentials_exception

    user_id = payload.get("user_id")
    hospital_id = payload.get("hospital_id")
    role = payload.get("role")
    permissions = payload.get("permissions", [])

    if user_id is None or hospital_id is None or role is None:
        raise credentials_exception

    # Verify user exists in database and belongs to the specified hospital
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.hospital_id == hospital_id
    ).first()

    if not user:
        raise credentials_exception

    clean_role = str(role).replace("RoleEnum.", "")
    ctx = TenantContext(
        user_id=int(user_id),
        hospital_id=int(hospital_id),
        role=clean_role,
        permissions=permissions
    )

    # Set DB RLS session if PostgreSQL
    database.set_tenant_session(db, ctx.hospital_id)

    # Attach to request state
    request.state.tenant_context = ctx
    return ctx

def get_current_user(
    ctx: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(database.get_db)
) -> models.User:
    user = db.query(models.User).filter(
        models.User.id == ctx.user_id,
        models.User.hospital_id == ctx.hospital_id
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found in tenant context")
    return user

def get_current_active_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    role_str = str(current_user.role)
    if role_str not in ["Admin", "HospitalOwner", "RoleEnum.Admin", "SuperAdmin", "PlatformSuperAdmin"]:
        raise HTTPException(status_code=403, detail="Admin permissions required")
    return current_user

def get_current_active_doctor(current_user: models.User = Depends(get_current_user)) -> models.User:
    role_str = str(current_user.role)
    if role_str not in ["Doctor", "Admin", "HospitalOwner", "RoleEnum.Doctor"]:
        raise HTTPException(status_code=403, detail="Doctor permissions required")
    return current_user

def get_current_active_receptionist(current_user: models.User = Depends(get_current_user)) -> models.User:
    role_str = str(current_user.role)
    if role_str not in ["Receptionist", "Admin", "HospitalOwner", "RoleEnum.Receptionist"]:
        raise HTTPException(status_code=403, detail="Receptionist permissions required")
    return current_user

def get_current_tmo(current_user: models.User = Depends(get_current_user)) -> models.User:
    role_str = str(current_user.role)
    if role_str not in ["TMO", "Admin", "HospitalOwner", "RoleEnum.TMO"]:
        raise HTTPException(status_code=403, detail="TMO permissions required")
    return current_user

def get_current_nurse(current_user: models.User = Depends(get_current_user)) -> models.User:
    role_str = str(current_user.role)
    if role_str not in ["Nurse", "Admin", "HospitalOwner", "RoleEnum.Nurse"]:
        raise HTTPException(status_code=403, detail="Nurse permissions required")
    return current_user

def get_current_pharmacist(current_user: models.User = Depends(get_current_user)) -> models.User:
    role_str = str(current_user.role)
    if role_str not in ["Pharmacist", "Admin", "HospitalOwner", "RoleEnum.Pharmacist"]:
        raise HTTPException(status_code=403, detail="Pharmacist permissions required")
    return current_user

def get_current_lab_tech(current_user: models.User = Depends(get_current_user)) -> models.User:
    role_str = str(current_user.role)
    if role_str not in ["Lab_Tech", "LabStaff", "Admin", "HospitalOwner", "RoleEnum.Lab_Tech"]:
        raise HTTPException(status_code=403, detail="Lab Tech permissions required")
    return current_user

get_current_lab_staff = get_current_lab_tech

def get_current_billing_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    role_str = str(current_user.role)
    if role_str not in ["Billing", "Accountant", "Admin", "HospitalOwner", "RoleEnum.Billing"]:
        raise HTTPException(status_code=403, detail="Billing permissions required")
    return current_user

get_current_accountant = get_current_billing_user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        role_str = str(current_user.role)
        if role_str not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden for role '{role_str}'"
            )
        return current_user
    return role_checker
