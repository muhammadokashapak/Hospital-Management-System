# 🏥 MediPulse — Enterprise Multi-Tenant Hospital & Clinical ERP System (SaaS)

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android%20Mobile-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-PostgreSQL%20%2F%20SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlalchemy.org)
[![Multi-Tenant](https://img.shields.io/badge/Architecture-Multi--Tenant%20SaaS-blueviolet?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Muhammad%20Okasha-blueviolet?style=for-the-badge)](https://github.com/muhammadokashapak)

<p align="center">
  <strong>End-to-End Clinical Enterprise Resource Planning (ERP) Platform with 35+ Specialized Medical Modules, Strict Tenant Isolation & Multi-Platform Web/Mobile Support</strong>
</p>

[📖 Overview](#-overview) •
[🏛️ System Architecture](#-system-architecture) •
[🌟 35+ Clinical Modules](#-35-specialized-clinical--operational-modules) •
[👥 Demo Accounts](#-demo-accounts--credentials) •
[📂 Directory Structure](#-directory-structure) •
[🚀 Quickstart](#-quickstart--deployment) •
[👨‍💻 Author](#-author--connect)

---

</div>

## 📖 Overview

Modern hospital operations span complex interconnected ecosystems: triage queues, inpatient bed occupancy, dynamic duty shift rosters, surgical suites, sterile services, electronic prescriptions, and insurance billing.

**MediPulse** is an enterprise-grade, multi-tenant **Hospital Management & Clinical ERP SaaS Platform** built with **FastAPI**, **SQLAlchemy**, and **React 18** (with native Android support via **Capacitor**). Engineered with **strict tenant data isolation**, it enables healthcare networks to manage multiple hospital branches, clinics, and diagnostic centers under a unified, HIPAA-compliant operating architecture.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client Experience Layer
        WEB[React 18 Web Portal - Vite & Tailwind CSS]
        MOB[Native Android App via Capacitor Bridge]
    end

    subgraph Security & Tenant Middleware
        GATE[FastAPI REST Gateway]
        AUTH[JWT Role-Based Access Control]
        TENANT[Tenant Isolation Middleware: Cross-Branch Data Guard]
    end

    subgraph Clinical & Operational Engines
        R1[OPD, Triage & Queue Router]
        R2[Admissions, Wards & Bed Occupancy]
        R3[Emergency Department & Trauma Triage]
        R4[ICU, Ventilator & Vitals Tracking]
        R5[Operation Theatre (OT) Scheduling]
        R6[Pharmacy, Formulary & Expiry Watcher]
        R7[Laboratory Information System (LIS)]
        R8[Revenue Cycle Management & Billing]
    end

    subgraph Persistence Layer
        DB[(SQLAlchemy ORM - PostgreSQL / SQLite3)]
        SCHED[APScheduler Background Shift Worker]
    end

    WEB --> GATE
    MOB --> GATE
    GATE --> AUTH
    AUTH --> TENANT
    TENANT --> R1 & R2 & R3 & R4 & R5 & R6 & R7 & R8
    R1 & R2 & R3 & R4 & R5 & R6 & R7 & R8 --> DB
    SCHED --> DB
```

---

## 🌟 35+ Specialized Clinical & Operational Modules

### 1. Clinical Departments
- **OPD & Token Triage:** Rapid patient check-in, vital signs recording, queue estimation, and specialist doctor dispatch.
- **Inpatient Admissions:** Real-time general ward, private room, and isolation bed allocation matrix.
- **Emergency Department (ED):** Standardized Manchester triage scoring (Red, Yellow, Green), resuscitation logging, and rapid referral.
- **ICU & Critical Care:** Continuous arterial blood gas (ABG) tracking, ventilator parameters, and nurse telemetry logs.
- **Operation Theatre (OT):** Surgical scheduling, anesthesia pre-op checklists, and recovery ward handovers.
- **TMO & House Officer (HO) Logbook:** Clinical duty logging, procedural sign-offs, and consultant case approvals.

### 2. Diagnostics, Ancillary & Facilities
- **Laboratory Information System (LIS):** Test order entry, barcode sample matching, and verified PDF report generation.
- **Radiology (RIS):** X-Ray, CT, MRI, Ultrasound appointments, and PACS viewer integration links.
- **Blood Bank Services:** Donor screening, ABO/Rh typing, component tracking (PRBC, Platelets, FFP), and crossmatch logs.
- **CSSD (Sterilization):** Autoclave batch tracking, surgical tray assembly, and biological spore test logging.
- **Pharmacy & Formulary:** Drug dispensing, interaction alerts, minimum threshold re-ordering, and expiry quarantine.
- **Biomedical Engineering:** Medical device maintenance schedules, breakdown ticketing, and calibration compliance.
- **Facility Support:** Ambulance dispatch with GPS integration, dietetics meal planning, mortuary cold-storage tracking, and security visitor logs.

---

## 👥 Demo Accounts & Credentials

The seed database is pre-configured with comprehensive demo personas for evaluation:

| Department / Role | Demo Email | Access Level |
|---|---|---|
| **System Super Admin** | `admin@hospital.local` | Complete governance, branch creation, audit logs |
| **Consultant Doctor** | `doctor@hospital.local` | OPD triage, inpatient ward rounds, clinical orders |
| **Nurse Supervisor** | `nurse@hospital.local` | Vital signs, bed occupancy, medication charts |
| **TMO Resident** | `tmo_surgery@hospital.local` | Procedural logbooks, duty rotations, case reviews |
| **Pharmacist** | `pharmacist@hospital.local` | Drug dispensing, stock replenishment, inventory |
| **Lab Technician** | `lab@hospital.local` | Diagnostic analysis, specimen receipt, report publishing |
| **Receptionist** | `reception@hospital.local` | Patient intake, appointments, token issuing |
| **Billing Specialist**| `billing@hospital.local` | Invoices, insurance claims, discharge clearances |

*(Default password for demo accounts: `adminPass123` / `doctorPass123` / `nursePass123`)*

---

## 📂 Directory Structure

```
Hospital/
│
├── backend/                   # FastAPI high-performance Python backend
│   ├── app/
│   │   ├── routers/           # 35+ specialized department micro-routers
│   │   ├── models.py          # SQLAlchemy database models & relational schema
│   │   ├── schemas.py         # Pydantic validation & response schemas
│   │   ├── tenant_middleware.py # Tenant isolation & multi-branch guard
│   │   └── main.py            # FastAPI application bootstrap
│   ├── seed_multi_tenant_saas.py # Automated database seeder
│   └── requirements.txt
├── frontend/                  # React 18 / Tailwind CSS client application
│   ├── src/
│   │   ├── pages/             # 35+ specialized role dashboards
│   │   ├── components/        # Layout, duty rosters, patient queue banners
│   │   └── App.jsx
│   ├── android/               # Native Android Capacitor project
│   └── package.json
└── README.md                  # VIP Master Architecture Documentation
```

---

## 🚀 Quickstart & Deployment

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # Linux/macOS: source venv/bin/activate

pip install -r requirements.txt
python seed_multi_tenant_saas.py
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger documentation: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` to explore the MediPulse ERP platform.

---

## 👨‍💻 Author & Connect

**Muhammad Okasha**  
*Healthcare Software Architect & Full-Stack Specialist*  
- **GitHub:** [@muhammadokashapak](https://github.com/muhammadokashapak)
- **Repository:** [Hospital-Management-System](https://github.com/muhammadokashapak/Hospital-Management-System)

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
