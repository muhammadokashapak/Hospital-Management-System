import React, { useState, useEffect, useCallback } from 'react';
import { 
    Users, Activity, BedDouble, AlertCircle, Building2, 
    Stethoscope, Clock, ShieldCheck, PieChart as PieChartIcon, ArrowRight,
    Search, RefreshCw, LayoutDashboard, Siren, HeartPulse, ScanLine,
    CreditCard, Droplets, Scissors, Package, UsersRound, Flame,
    Landmark, ShieldAlert, Biohazard, Wrench, Hammer, Sparkles,
    Utensils, Cross, Ambulance, Shield, CheckCircle2, ChevronRight, Pill
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import toast from 'react-hot-toast';

const DEPARTMENTS_DATA = [
  { id: 'er', name: 'Emergency ER & Trauma', category: 'Clinical', path: '/emergency', icon: <Siren className="w-5 h-5 text-red-600" />, desc: 'Red/Yellow/Green Triage Board & Patient Disposition' },
  { id: 'icu', name: 'ICU Critical Care', category: 'Clinical', path: '/icu', icon: <HeartPulse className="w-5 h-5 text-pink-600" />, desc: 'Life-support monitoring & ventilator flowsheets' },
  { id: 'opd', name: 'OPD Doctor Consultation', category: 'Clinical', path: '/doctor', icon: <Stethoscope className="w-5 h-5 text-blue-600" />, desc: 'Doctor token queue, e-prescribing & SOAP notes' },
  { id: 'ipd', name: 'IPD Ward & Admissions', category: 'Clinical', path: '/admissions', icon: <Building2 className="w-5 h-5 text-indigo-600" />, desc: 'Ward bed heatmap allocation & discharge summaries' },
  { id: 'nurse', name: 'Nurse Station & eMAR', category: 'Clinical', path: '/nurse', icon: <Activity className="w-5 h-5 text-emerald-600" />, desc: 'Timed eMAR drug administration & vitals charting' },
  { id: 'ot', name: 'Operation Theatre', category: 'Clinical', path: '/ot', icon: <Scissors className="w-5 h-5 text-purple-600" />, desc: 'Surgical Gantt scheduler, safety checklist & post-op notes' },
  { id: 'mrd', name: 'Medical Records (MRD)', category: 'Clinical', path: '/checked-patients', icon: <ShieldCheck className="w-5 h-5 text-blue-600" />, desc: 'Centralized EMR archive, visit timeline & coding' },
  { id: 'rec', name: 'Reception & Front Desk', category: 'Clinical', path: '/reception', icon: <Users className="w-5 h-5 text-blue-600" />, desc: 'Patient registration & token slip generation' },

  { id: 'rad', name: 'Radiology RIS / PACS', category: 'Diagnostics', path: '/radiology', icon: <ScanLine className="w-5 h-5 text-sky-600" />, desc: 'X-Ray, CT, MRI, Ultrasound orders & scan reports' },
  { id: 'lab', name: 'Laboratory LIS', category: 'Diagnostics', path: '/lab', icon: <Activity className="w-5 h-5 text-teal-600" />, desc: 'Test worklists, analyzer data & pathology verification' },
  { id: 'pharm', name: 'Pharmacy & FEFO Stock', category: 'Diagnostics', path: '/pharmacist', icon: <Pill className="w-5 h-5 text-emerald-600" />, desc: 'e-Prescription queue dispensing & expiry alerts' },
  { id: 'blood', name: 'Blood Bank', category: 'Diagnostics', path: '/blood-bank', icon: <Droplets className="w-5 h-5 text-rose-600" />, desc: '8 Blood Group stock gauges & cross-matching for OT' },

  { id: 'hr', name: 'HR & Staff Attendance', category: 'Operations', path: '/hr', icon: <UsersRound className="w-5 h-5 text-blue-600" />, desc: 'Biometric attendance register & leave approvals' },
  { id: 'roster', name: 'Shift Planner (HO Rota)', category: 'Operations', path: '/admin/scheduler', icon: <Clock className="w-5 h-5 text-indigo-600" />, desc: 'Automated 14-day shift generator & swap engine' },
  { id: 'tmo', name: 'TMO Operations', category: 'Operations', path: '/tmo', icon: <Stethoscope className="w-5 h-5 text-purple-600" />, desc: 'Trainee logbook verification & supervisor sign-offs' },
  { id: 'ho', name: 'House Officer Workspace', category: 'Operations', path: '/ho', icon: <Activity className="w-5 h-5 text-blue-600" />, desc: 'Clinical rotation schedule & shift swap requests' },
  { id: 'queue', name: 'Public OPD Queue TV', category: 'Operations', path: '/queue', icon: <PieChartIcon className="w-5 h-5 text-amber-600" />, desc: 'Waiting room public display for token calling' },
  { id: 'sec', name: 'Security & Visitors', category: 'Operations', path: '/security', icon: <Shield className="w-5 h-5 text-slate-700" />, desc: 'Visitor pass generator & access badge logging' },

  { id: 'bill', name: 'Billing & Cashier POS', category: 'Finance', path: '/billing', icon: <CreditCard className="w-5 h-5 text-emerald-600" />, desc: 'Consolidated invoices & payment settlements' },
  { id: 'acc', name: 'Accounts Ledger', category: 'Finance', path: '/accounts', icon: <Landmark className="w-5 h-5 text-emerald-600" />, desc: 'Expense ledgers, vendor payables & profit/loss' },
  { id: 'inv', name: 'Inventory & Store', category: 'Finance', path: '/inventory', icon: <Package className="w-5 h-5 text-blue-600" />, desc: 'Re-order threshold alerts & stock issue vouchers' },
  { id: 'cssd', name: 'CSSD Sterilization', category: 'Finance', path: '/cssd', icon: <Flame className="w-5 h-5 text-orange-600" />, desc: 'Autoclave cycle temp/pressure & biological test logs' },

  { id: 'qa', name: 'Quality Assurance', category: 'Support', path: '/qa', icon: <ShieldAlert className="w-5 h-5 text-purple-600" />, desc: 'Incident ticket reporting & SLA compliance scorecards' },
  { id: 'inf', name: 'Infection Control', category: 'Support', path: '/infection-control', icon: <Biohazard className="w-5 h-5 text-rose-600" />, desc: 'HAI surveillance & isolation room allocation map' },
  { id: 'bio', name: 'Biomedical Engineering', category: 'Support', path: '/biomedical', icon: <Wrench className="w-5 h-5 text-indigo-600" />, desc: 'Equipment PPM calendar & breakdown tickets' },
  { id: 'maint', name: 'Facilities Maintenance', category: 'Support', path: '/maintenance', icon: <Hammer className="w-5 h-5 text-amber-600" />, desc: 'Building work orders (HVAC, Plumbing, Electrical)' },
  { id: 'hk', name: 'Housekeeping Sync', category: 'Support', path: '/housekeeping', icon: <Sparkles className="w-5 h-5 text-teal-600" />, desc: 'Terminal bed cleaning & real-time IPD heatmap sync' },
  { id: 'amb', name: 'Ambulance Dispatch', category: 'Support', path: '/ambulance', icon: <Ambulance className="w-5 h-5 text-red-600" />, desc: 'Emergency fleet status & GPS dispatch logs' },
  { id: 'diet', name: 'Dietetics & Nutrition', category: 'Support', path: '/dietetics', icon: <Utensils className="w-5 h-5 text-emerald-600" />, desc: 'Therapeutic diet orders & kitchen meal sheets' },
  { id: 'mort', name: 'Mortuary Management', category: 'Support', path: '/mortuary', icon: <Cross className="w-5 h-5 text-slate-700" />, desc: 'Chamber capacity grid & death certificate release' }
];

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All'); // 'All', 'Clinical', 'Diagnostics', 'Operations', 'Finance', 'Support'
    const [searchQuery, setSearchQuery] = useState('');

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/admin/stats/`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) {
            console.error("Error fetching admin stats:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const filteredDepartments = DEPARTMENTS_DATA.filter(dept => {
        const matchesTab = activeTab === 'All' || dept.category === activeTab;
        const matchesSearch = !searchQuery || dept.name.toLowerCase().includes(searchQuery.toLowerCase()) || dept.desc.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <RefreshCw className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    const occPercent = stats?.total_beds > 0 ? Math.round((stats.occupied_beds / stats.total_beds) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-6 font-sans">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-blue-500/40">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 size={12} /> System Online • All 30 Modules Integrated
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Executive Command Center</h1>
                    <p className="text-blue-100 text-xs sm:text-sm font-medium mt-1">Real-time monitoring of all 30 hospital departments, bed occupancy, and staff operations.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link to="/admin/scheduler" className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-2">
                        <Clock size={14} /> Shift Planner
                    </Link>
                    <button onClick={fetchStats} className="bg-blue-800/80 text-white hover:bg-blue-800 border border-blue-400/40 px-4 py-2.5 rounded-xl font-black text-xs transition-all shadow-sm flex items-center gap-2">
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Staff</span>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={16} /></div>
                        </div>
                        <p className="text-3xl font-black text-slate-900">{stats.total_staff}</p>
                        <p className="text-[10px] font-bold text-blue-600 mt-1">Active Accounts</p>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patients</span>
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Activity size={16} /></div>
                        </div>
                        <p className="text-3xl font-black text-slate-900">{stats.total_patients}</p>
                        <p className="text-[10px] font-bold text-emerald-600 mt-1">Registered EMRs</p>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bed Occupancy</span>
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><BedDouble size={16} /></div>
                        </div>
                        <p className="text-3xl font-black text-slate-900">{stats.occupied_beds} <span className="text-sm font-bold text-slate-400">/ {stats.total_beds}</span></p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${occPercent}%` }} />
                        </div>
                    </div>

                    <div className="bg-white border border-red-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Active ER Cases</span>
                            <div className="p-2 bg-red-50 text-red-600 rounded-xl"><Siren size={16} /></div>
                        </div>
                        <p className="text-3xl font-black text-red-600">{stats.active_er_cases}</p>
                        <p className="text-[10px] font-bold text-red-500 mt-1">Triage Priority</p>
                    </div>

                    <div className="bg-white border border-amber-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all col-span-2 md:col-span-1">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">IPD Inpatients</span>
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Building2 size={16} /></div>
                        </div>
                        <p className="text-3xl font-black text-amber-600">{stats.active_admissions}</p>
                        <p className="text-[10px] font-bold text-amber-500 mt-1">Admitted Patients</p>
                    </div>
                </div>
            )}

            {/* Department Hub Search & Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Category Tabs */}
                <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                    {['All', 'Clinical', 'Diagnostics', 'Operations', 'Finance', 'Support'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                                activeTab === tab 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {tab} {tab === 'All' ? '(30)' : ''}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search departments..."
                        className="w-full border border-slate-300 rounded-xl pl-9 pr-4 py-1.5 text-xs font-medium focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            {/* 30-Department Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDepartments.map(dept => (
                    <Link
                        key={dept.id}
                        to={dept.path}
                        className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl group-hover:scale-110 transition-transform">
                                    {dept.icon}
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-full">
                                    {dept.category}
                                </span>
                            </div>

                            <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                                {dept.name}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                                {dept.desc}
                            </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active & Connected
                            </span>
                            <span className="text-xs font-black text-blue-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Open Portal <ChevronRight size={14} />
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
