from sqlalchemy.orm import Session
from fastapi import Request
from typing import Optional
import datetime
from . import models

def log_audit_event(
    db: Session,
    hospital_id: int,
    user_id: Optional[int],
    action: str,
    module: str,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
    request: Optional[Request] = None
):
    """
    Utility function to log security-sensitive and transactional actions to audit_logs.
    """
    try:
        client_ip = ip_address
        if request and not client_ip:
            client_ip = request.client.host if request.client else None

        audit_entry = models.AuditLog(
            hospital_id=hospital_id,
            user_id=user_id,
            action=action,
            module=module,
            details=details,
            ip_address=client_ip,
            timestamp=datetime.datetime.utcnow()
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        # Fallback print to prevent audit logging errors from breaking main transaction
        print(f"[AUDIT LOG ERROR] Failed to log action '{action}': {str(e)}")
