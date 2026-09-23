import React from 'react';
import { ShieldCheck, Clock, MapPin, CheckSquare, BellRing } from 'lucide-react';

const DUTY_CONFIGS = {
  Doctor: {
    title: "OPD Consultant Duty Briefing",
    shift: "Morning Shift (08:00 AM - 02:00 PM)",
    station: "OPD Room 104 — Medical Unit II",
    tasks: ["Examine queued OPD patients", "Prescribe e-Medications & Order Labs/Radiology", "Review completed lab test results & verify prescriptions"]
  },
  Radiology_Tech: {
    title: "Radiology & Imaging Duty Briefing",
    shift: "Morning Shift (08:00 AM - 04:00 PM)",
    station: "Radiology Control Room — Scan Suite 2",
    tasks: ["Process incoming X-Ray, CT Scan, MRI & Ultrasound orders from Doctors", "Perform imaging scans", "Upload findings & release radiology reports"]
  },
  LabTech: {
    title: "Laboratory Technician Duty Briefing",
    shift: "Morning Shift (08:00 AM - 04:00 PM)",
    station: "Central Lab — Hematology & Biochemistry Station",
    tasks: ["Receive patient blood & urine samples", "Run automated analyzer tests", "Enter test findings & verify CBC/LFT results"]
  },
  Lab_Tech: {
    title: "Laboratory Technician Duty Briefing",
    shift: "Morning Shift (08:00 AM - 04:00 PM)",
    station: "Central Lab — Hematology & Biochemistry Station",
    tasks: ["Receive patient blood & urine samples", "Run automated analyzer tests", "Enter test findings & verify CBC/LFT results"]
  },
  Pharmacist: {
    title: "Pharmacy Dispensing Duty Briefing",
    shift: "Morning Shift (08:00 AM - 04:00 PM)",
    station: "Main Pharmacy Counter — Counter #3",
    tasks: ["Process incoming e-Prescriptions from OPD & Wards", "Check medicine FEFO stock & dosage", "Dispense medicines & issue receipts"]
  },
  Nurse: {
    title: "Ward Staff Nurse Duty Briefing",
    shift: "Morning Shift (07:00 AM - 03:00 PM)",
    station: "General Medical Ward — Station B",
    tasks: ["Record 4-hourly patient vitals (BP, SpO2, Temp)", "Administer eMAR medication checklist", "Prepare discharge summaries & handle ward transfers"]
  },
  Emergency_Staff: {
    title: "Emergency & Trauma Triage Duty Briefing",
    shift: "Morning Shift (08:00 AM - 04:00 PM)",
    station: "Emergency Triage Desk — Trolley Bay 1",
    tasks: ["Perform ESI Triage Scoring (Red/Yellow/Green)", "Register walk-in & ambulance trauma arrivals", "Execute fast-track transfer to IPD Ward / ICU"]
  },
  ICU_Staff: {
    title: "ICU Critical Care Duty Briefing",
    shift: "Morning Shift (07:00 AM - 03:00 PM)",
    station: "Main ICU Complex — Bed 1 to 20 Monitoring Station",
    tasks: ["Monitor life-support ventilators & ABG flowsheets", "Chart hourly high-acuity critical vitals", "Manage critical patient transfers from ER"]
  },
  Blood_Bank_Staff: {
    title: "Blood Bank & Cross-Match Duty Briefing",
    shift: "Morning Shift (08:00 AM - 04:00 PM)",
    station: "Blood Bank Storage & Testing Unit",
    tasks: ["Monitor 8 Blood Group stocks & critical low alerts", "Perform donor blood unit entry", "Process cross-matching requests for OT & Emergency"]
  },
  OT_Staff: {
    title: "Operation Theatre Scrub Nurse Duty Briefing",
    shift: "Morning Shift (08:00 AM - 03:00 PM)",
    station: "Main Surgery Complex — OT Room 1",
    tasks: ["Review today's surgical schedule board", "Perform pre-op & intra-op safety checklist", "Log start/completion of surgeries and post-op notes"]
  },
  Billing: {
    title: "Billing & Cashier Duty Briefing",
    shift: "Morning Shift (08:00 AM - 04:00 PM)",
    station: "Accounts & Cash Counter #1",
    tasks: ["Generate consolidated patient invoices", "Process cash & card payment settlements", "Manage corporate panel & insurance ledgers"]
  },
  Inventory: {
    title: "Central Store & Inventory Duty Briefing",
    shift: "Morning Shift (08:00 AM - 04:00 PM)",
    station: "Central Supply Store — Aisle 4",
    tasks: ["Monitor medicine & surgical supply quantities", "Review low-stock re-order threshold alerts", "Process stock issue vouchers to hospital departments"]
  },
  HR: {
    title: "HR & Staff Operations Duty Briefing",
    shift: "Day Shift (09:00 AM - 05:00 PM)",
    station: "Human Resource Office — Room 201",
    tasks: ["Monitor daily biometric staff attendance register", "Process staff leave application approvals", "Manage employee roster & credentialing"]
  },
  Receptionist: {
    title: "Front Desk & Reception Duty Briefing",
    shift: "Morning Shift (08:00 AM - 02:00 PM)",
    station: "Main Entrance Information Desk",
    tasks: ["Register new patients & issue MRN numbers", "Generate sequential OPD consultation tokens", "Guide visitors & manage queue display announcements"]
  },
  House_Officer: {
    title: "House Officer Clinical Duty Briefing",
    shift: "Morning Rotation Shift (08:00 AM - 02:00 PM)",
    station: "Inpatient Ward & OPD Clinic",
    tasks: ["Perform daily clinical rounds with Consultant", "Log performed procedures in digital logbook", "Manage ward shift swaps & on-call coverage"]
  },
  TMO: {
    title: "TMO Senior Registrar Duty Briefing",
    shift: "Day Shift (08:00 AM - 04:00 PM)",
    station: "Department of Internal Medicine",
    tasks: ["Supervise House Officers clinical rounds", "Review and counter-sign procedure logbook entries", "Approve shift swaps & manage rotation groups"]
  },
  Admin: {
    title: "Hospital Operations Duty Briefing",
    shift: "Command Center Duty (24/7 Monitoring)",
    station: "Executive Command Center — Admin Suite",
    tasks: ["Monitor 30-Department ERP live metrics & occupancy", "Oversee staff shift planner & hospital SLAs", "Manage system access, tenant settings & audit trails"]
  }
};

export default function StaffDutyBriefingBanner() {
  const role = localStorage.getItem('role') || 'Admin';
  const name = localStorage.getItem('name') || 'Staff Member';
  
  const config = DUTY_CONFIGS[role] || {
    title: `${role} Hospital Duty Briefing`,
    shift: "Assigned Shift (Active Duty)",
    station: "Hospital Operational Unit",
    tasks: ["Perform designated departmental duties", "Maintain operational accuracy", "Report incidents to Supervisor"]
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-lg border border-blue-500/50 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck size={12} /> Live Duty On-Call
            </span>
            <span className="text-blue-100 text-xs font-bold">{config.station}</span>
          </div>
          <h2 className="text-xl font-black text-white">{config.title}</h2>
          <p className="text-xs text-blue-100 font-medium mt-1 flex items-center gap-1">
            Logged in as: <strong className="text-white font-black">{name}</strong> ({role})
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 text-xs space-y-1 self-stretch md:self-auto min-w-[240px]">
          <div className="flex items-center justify-between text-blue-100 font-bold">
            <span className="flex items-center gap-1"><Clock size={12} /> Shift:</span>
            <span className="text-white font-black">{config.shift.split(' (')[0]}</span>
          </div>
          <div className="flex items-center justify-between text-blue-100 font-bold">
            <span className="flex items-center gap-1"><MapPin size={12} /> Station:</span>
            <span className="text-white font-black truncate max-w-[140px]">{config.station.split(' — ')[0]}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-1 md:grid-cols-3 gap-2">
        {config.tasks.map((task, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-blue-50 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
            <CheckSquare size={14} className="text-emerald-300 shrink-0" />
            <span className="truncate">{task}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
