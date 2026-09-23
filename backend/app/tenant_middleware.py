from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional, List
import jwt
from . import auth

class TenantContext:
    def __init__(self, user_id: int, hospital_id: int, role: str, permissions: Optional[List[str]] = None):
        self.user_id = user_id
        self.hospital_id = hospital_id
        self.role = role
        self.permissions = permissions or []

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "hospital_id": self.hospital_id,
            "role": self.role,
            "permissions": self.permissions
        }

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        auth_header = request.headers.get("Authorization")
        request.state.tenant_context = None

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
                hospital_id = payload.get("hospital_id")
                user_id = payload.get("user_id")
                role = payload.get("role")
                permissions = payload.get("permissions", [])

                if hospital_id is not None and user_id is not None:
                    request.state.tenant_context = TenantContext(
                        user_id=int(user_id),
                        hospital_id=int(hospital_id),
                        role=str(role),
                        permissions=permissions
                    )
            except Exception:
                pass

        response = await call_next(request)
        return response
