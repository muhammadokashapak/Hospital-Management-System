from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import sys
import shutil

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hospital_db.sqlite3")

# PyInstaller bundle persistence check
if getattr(sys, 'frozen', False) and DATABASE_URL.startswith("sqlite"):
    app_data = os.path.join(os.environ.get("APPDATA", os.path.expanduser("~")), "HospitalERP")
    os.makedirs(app_data, exist_ok=True)
    db_path = os.path.join(app_data, "hospital_db.sqlite3")
    if not os.path.exists(db_path):
        bundled_db = os.path.join(sys._MEIPASS, "hospital_db.sqlite3")
        if os.path.exists(bundled_db):
            shutil.copy2(bundled_db, db_path)
        else:
            open(db_path, 'a').close()
    DATABASE_URL = f"sqlite:///{db_path}"

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=10, max_overflow=20)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def set_tenant_session(db, hospital_id: int):
    """
    Sets PostgreSQL session setting for Row Level Security (RLS) policies.
    """
    if engine.dialect.name == "postgresql":
        db.execute(text("SET LOCAL app.current_tenant = :tenant_id"), {"tenant_id": int(hospital_id)})
