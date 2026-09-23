import pytest
import os
import tempfile
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app import models, auth

# Setup test database
TEST_DB_FILE = tempfile.NamedTemporaryFile(suffix=".db", delete=False).name
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_FILE}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # Create Hospital A (City Hospital) & Hospital B (Al-Shifa Hospital)
    h_a = models.Hospital(id=1, name="City Hospital", license_key="LIC-HOSP-A", address="Location A")
    h_b = models.Hospital(id=2, name="Al-Shifa Hospital", license_key="LIC-HOSP-B", address="Location B")
    db.add_all([h_a, h_b])
    db.commit()

    # Create Users for Hospital A and Hospital B
    pwd_hash = auth.get_password_hash("Password123!")
    
    user_a = models.User(
        id=101,
        hospital_id=1,
        email="admin@cityhospital.com",
        password_hash=pwd_hash,
        full_name="Admin City",
        role=models.RoleEnum.Admin,
        gender=models.GenderEnum.Male
    )
    user_b = models.User(
        id=201,
        hospital_id=2,
        email="admin@alshifa.com",
        password_hash=pwd_hash,
        full_name="Admin Al-Shifa",
        role=models.RoleEnum.Admin,
        gender=models.GenderEnum.Female
    )
    db.add_all([user_a, user_b])
    db.commit()

    # Create Doctors
    doc_a = models.Doctor(id=10, hospital_id=1, user_id=101, specialization="Cardiology")
    doc_b = models.Doctor(id=20, hospital_id=2, user_id=201, specialization="Neurology")
    db.add_all([doc_a, doc_b])
    db.commit()

    # Create Patients
    pat_a = models.Patient(id=1001, hospital_id=1, full_name="Patient A", phone="03001111111", cnic="11111-1111111-1", age=30, gender=models.GenderEnum.Male)
    pat_b = models.Patient(id=2002, hospital_id=2, full_name="Patient B", phone="03002222222", cnic="22222-2222222-2", age=40, gender=models.GenderEnum.Female)
    db.add_all([pat_a, pat_b])
    db.commit()

    # Create Invoices
    inv_a = models.Invoice(id=501, hospital_id=1, patient_id=1001, amount=100.0, description="Consultation A")
    inv_b = models.Invoice(id=502, hospital_id=2, patient_id=2002, amount=200.0, description="Consultation B")
    db.add_all([inv_a, inv_b])
    db.commit()

    # Create Files
    file_a = models.UploadedFile(id=901, hospital_id=1, original_name="lab_a.pdf", storage_path="/tmp/lab_a.pdf")
    file_b = models.UploadedFile(id=902, hospital_id=2, original_name="lab_b.pdf", storage_path="/tmp/lab_b.pdf")
    db.add_all([file_a, file_b])
    db.commit()

    db.close()
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    try:
        if os.path.exists(TEST_DB_FILE):
            os.remove(TEST_DB_FILE)
    except Exception:
        pass

client = TestClient(app)

def get_auth_header(email: str, user_id: int, hospital_id: int, role: str = "Admin"):
    token = auth.create_access_token(data={
        "sub": email,
        "user_id": user_id,
        "hospital_id": hospital_id,
        "role": role
    })
    return {"Authorization": f"Bearer {token}"}

# --- TEST CASES ---

def test_hospital_a_can_view_own_patient():
    headers = get_auth_header("admin@cityhospital.com", 101, 1)
    res = client.get("/patients/1001", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == 1001
    assert data["full_name"] == "Patient A"

def test_hospital_a_cannot_view_hospital_b_patient():
    headers = get_auth_header("admin@cityhospital.com", 101, 1)
    res = client.get("/patients/2002", headers=headers)
    assert res.status_code == 404

def test_hospital_a_cannot_update_hospital_b_patient():
    headers = get_auth_header("admin@cityhospital.com", 101, 1)
    update_data = {
        "full_name": "Hacked Patient B",
        "phone": "03009999999",
        "cnic": "99999-9999999-9",
        "age": 30,
        "gender": "Male",
        "emergency_contact": "999"
    }
    res = client.patch("/patients/2002", json=update_data, headers=headers)
    assert res.status_code == 404

def test_hospital_a_cannot_delete_hospital_b_patient():
    headers = get_auth_header("admin@cityhospital.com", 101, 1)
    res = client.delete("/patients/2002", headers=headers)
    assert res.status_code == 404

def test_hospital_a_search_returns_only_own_patients():
    headers = get_auth_header("admin@cityhospital.com", 101, 1)
    res = client.get("/patients/search?phone=03002222222", headers=headers)
    assert res.status_code == 404

    res_a = client.get("/patients/search?phone=03001111111", headers=headers)
    assert res_a.status_code == 200
    assert res_a.json()["id"] == 1001

def test_hospital_a_cannot_create_appointment_for_hospital_b_patient():
    headers = get_auth_header("admin@cityhospital.com", 101, 1)
    apt_data = {
        "patient_id": 2002,
        "doctor_id": 10
    }
    res = client.post("/appointments/", json=apt_data, headers=headers)
    assert res.status_code == 404

def test_hospital_a_cannot_view_hospital_b_invoice():
    headers = get_auth_header("admin@cityhospital.com", 101, 1)
    res = client.get("/billing/invoices/502", headers=headers)
    assert res.status_code == 404

def test_hospital_a_cannot_download_hospital_b_file():
    headers = get_auth_header("admin@cityhospital.com", 101, 1)
    res = client.get("/files/download/902", headers=headers)
    assert res.status_code == 404

def test_unauthorized_cross_tenant_access_creates_audit_log():
    headers = get_auth_header("admin@cityhospital.com", 101, 1)
    client.get("/patients/2002", headers=headers)

    db = TestingSessionLocal()
    audit_entry = db.query(models.AuditLog).filter(
        models.AuditLog.hospital_id == 1,
        models.AuditLog.action == "UNAUTHORIZED_PATIENT_ACCESS_ATTEMPT"
    ).first()
    assert audit_entry is not None
    db.close()
