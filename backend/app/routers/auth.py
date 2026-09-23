from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from .. import models, schemas, database, auth, audit

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db)
):
    email_lower = form_data.username.lower()
    user = db.query(models.User).filter(models.User.email == email_lower).first()
    
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        if user:
            audit.log_audit_event(
                db=db,
                hospital_id=user.hospital_id,
                user_id=user.id,
                action="LOGIN_FAILED",
                module="AUTH",
                details=f"Failed login attempt for email {email_lower}",
                request=request
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role).replace("RoleEnum.", "")
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={
            "sub": user.email,
            "user_id": user.id,
            "hospital_id": user.hospital_id,
            "role": role_str
        },
        expires_delta=access_token_expires
    )

    audit.log_audit_event(
        db=db,
        hospital_id=user.hospital_id,
        user_id=user.id,
        action="LOGIN_SUCCESS",
        module="AUTH",
        details=f"User {user.email} logged in successfully",
        request=request
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/categories")
def get_categories(db: Session = Depends(database.get_db)):
    groups = db.query(models.RotationGroup).all()
    return [{"id": g.id, "name": g.name} for g in groups]

@router.get("/hospitals")
def get_hospitals(db: Session = Depends(database.get_db)):
    hospitals = db.query(models.Hospital).all()
    return [{"id": h.id, "name": h.name, "code": f"H{h.id:03d}"} for h in hospitals]

@router.post("/register")
def register_user(
    request: Request,
    user_data: schemas.UserRegister,
    db: Session = Depends(database.get_db)
):
    user_data.email = user_data.email.lower()
    
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    if user_data.hospital_id:
        hospital = db.query(models.Hospital).filter(models.Hospital.id == user_data.hospital_id).first()
        if not hospital:
            raise HTTPException(status_code=404, detail="Selected hospital tenant does not exist")
    else:
        hospital = db.query(models.Hospital).first()
        if not hospital:
            hospital = models.Hospital(
                name="Main Hospital",
                license_key="DEFAULT-LICENSE-001",
                address="127.0.0.1"
            )
            db.add(hospital)
            db.flush()

    hashed_pwd = auth.get_password_hash(user_data.password)
    
    try:
        new_user = models.User(
            hospital_id=hospital.id,
            email=user_data.email,
            password_hash=hashed_pwd,
            full_name=user_data.full_name,
            role=user_data.role,
            gender=user_data.gender
        )
        
        db.add(new_user)
        db.flush()

        if new_user.role == models.RoleEnum.Doctor:
            first_dept = db.query(models.Department).filter(models.Department.hospital_id == hospital.id).first()
            new_doctor = models.Doctor(
                hospital_id=hospital.id,
                user_id=new_user.id,
                department_id=first_dept.id if first_dept else None,
                specialization="General"
            )
            db.add(new_doctor)

        audit.log_audit_event(
            db=db,
            hospital_id=hospital.id,
            user_id=new_user.id,
            action="USER_REGISTERED",
            module="AUTH",
            details=f"User {new_user.email} registered",
            request=request
        )

        db.commit()
        db.refresh(new_user)
        return {"message": "User registered successfully", "user_id": new_user.id}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

from pydantic import BaseModel
class PasswordResetRequest(BaseModel):
    email: str
    new_password: str

@router.put('/reset-password')
def reset_password(data: PasswordResetRequest, db: Session = Depends(database.get_db)):
    email_lower = data.email.lower()
    user = db.query(models.User).filter(models.User.email == email_lower).first()
    if not user:
        raise HTTPException(status_code=404, detail='Account with this email does not exist')
        
    user.password_hash = auth.get_password_hash(data.new_password)
    db.commit()
    return {'message': 'Password reset successful. You can now log in.'}
