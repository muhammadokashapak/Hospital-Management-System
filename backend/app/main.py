from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, admin, patients, appointments, attendance, doctor, scheduler, swaps, profile, leave_requests, tasks, pharmacy, lab, nurse, billing, opd, admissions, emergency, icu, ot, radiology, blood_bank, hr, inventory_mgmt, accounts, medical_records, cssd, qa, infection_control, biomedical, maintenance, housekeeping, security, ambulance, dietetics, mortuary, files
import os
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone
from sqlalchemy.orm import Session
import sys
from .database import SessionLocal
from . import models
from contextlib import asynccontextmanager

from .tenant_middleware import TenantMiddleware

# Create all tables in the database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Multi-Hospital Management System API", description="Multi-Tenant Cloud and Local Intranet System")

app.add_middleware(TenantMiddleware)

# Configure CORS for local network access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def auto_checkout_doctors():
    db: Session = SessionLocal()
    try:
        # Find all attendances for today where check_out is None
        today = datetime.now(timezone.utc).date()
        open_attendances = db.query(models.Attendance).filter(
            models.Attendance.login_date == today,
            models.Attendance.check_out == None
        ).all()
        
        for att in open_attendances:
            att.check_out = datetime.now(timezone.utc)
            
        db.commit()
    finally:
        db.close()

bg_scheduler = BackgroundScheduler()
# Run everyday at 23:59 (11:59 PM)
bg_scheduler.add_job(auto_checkout_doctors, 'cron', hour=23, minute=59)

@asynccontextmanager
async def lifespan(app: FastAPI):
    bg_scheduler.start()
    yield
    bg_scheduler.shutdown()

app.router.lifespan_context = lifespan

@app.get("/api")
def read_root():
    return {"message": "Welcome to the Hospital Management System API"}

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(patients.router)
app.include_router(appointments.router)
app.include_router(attendance.router)
app.include_router(doctor.router)
app.include_router(scheduler.router)
app.include_router(profile.router)
app.include_router(leave_requests.router)
app.include_router(tasks.router)
app.include_router(swaps.router)
app.include_router(pharmacy.router)
app.include_router(lab.router)
app.include_router(nurse.router)
app.include_router(billing.router)
app.include_router(opd.router)
app.include_router(admissions.router)
app.include_router(emergency.router)
app.include_router(icu.router)
app.include_router(ot.router)
app.include_router(radiology.router)
app.include_router(blood_bank.router)
app.include_router(hr.router)
app.include_router(inventory_mgmt.router)
app.include_router(accounts.router)
app.include_router(medical_records.router)
app.include_router(cssd.router)
app.include_router(qa.router)
app.include_router(infection_control.router)
app.include_router(biomedical.router)
app.include_router(maintenance.router)
app.include_router(housekeeping.router)
app.include_router(security.router)
app.include_router(ambulance.router)
app.include_router(dietetics.router)
app.include_router(mortuary.router)
app.include_router(files.router)
# --- Serve React Frontend ---
# Handle PyInstaller _MEIPASS bundling path
if getattr(sys, 'frozen', False):
    base_dir = sys._MEIPASS
    frontend_dist_path = os.path.join(base_dir, "frontend_dist")
else:
    # Assuming frontend is built to `frontend/dist` and we run `desktop_app.py` from project root
    frontend_dist_path = os.path.join(os.path.dirname(__file__), "../../frontend/dist")

if os.path.exists(frontend_dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        api_prefixes = (
            "auth", "admin", "patients", "appointments", "attendance", "doctor", 
            "scheduler", "profile", "leave_requests", "tasks", "swaps", "pharmacy", 
            "lab", "nurse", "billing", "opd", "admissions", "emergency", "icu", 
            "ot", "radiology", "blood-bank", "hr", "inventory", "accounts", 
            "medical-records", "cssd", "qa", "infection-control", "biomedical", 
            "maintenance", "housekeeping", "security", "ambulance", "dietetics", 
            "mortuary", "openapi.json", "docs"
        )
        if any(full_path.startswith(prefix) for prefix in api_prefixes):
            return HTMLResponse(content='{"detail": "Not Found"}', status_code=404, media_type="application/json")
            
        index_file = os.path.join(frontend_dist_path, "index.html")
        if os.path.exists(index_file):
            with open(index_file, "r") as f:
                return HTMLResponse(content=f.read())
        return {"error": "Frontend build not found."}
