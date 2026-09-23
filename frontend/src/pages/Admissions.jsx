import React, { useState, useEffect, useCallback } from 'react';
import { BedDouble, Users, ArrowRightLeft, Building2, Search, CheckCircle2, Clock, AlertTriangle, X, User, Activity, RefreshCw, Loader2, ShieldCheck, Plus, Trash2, Pill, FileCheck } from 'lucide-react';
import { API_URL } from '../config';
import { toast } from 'react-hot-toast';

export default function Admissions() {
    const [beds, setBeds] = useState([]);
    const [admissions, setAdmissions] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [filter, setFilter] = useState('All');
    const [activeTab, setActiveTab] = useState('Pending Requests'); // 'Pending Requests', 'Beds', 'Active Admissions'
    const [isLoading, setIsLoading] = useState(true);
    
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedBedId, setSelectedBedId] = useState('');
    const [isApproving, setIsApproving] = useState(false);

    // Doctor Prescribing State
    const [prescribingAdmission, setPrescribingAdmission] = useState(null);
    const [medList, setMedList] = useState([{ medication_name: '', prescribed_dose: '', route: 'Oral', frequency: 'BD', special_instructions: '' }]);
    const [taskList, setTaskList] = useState(['Check Vitals & SpO2 q4h', 'Strict Fluid I/O Balance']);
    const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
    const [isPrescribing, setIsPrescribing] = useState(false);
    
    const fetchBeds = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/admissions/available-beds`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBeds(data);
                if (data.length > 0 && !selectedBedId) {
                    setSelectedBedId(data[0].id);
                }
            }
        } catch (err) { console.error(err); }
    }, [selectedBedId]);

    const fetchAdmissions = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/admissions/?status=Admitted`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAdmissions(data);
            }
        } catch (err) { console.error(err); }
    }, []);

    const fetchPendingRequests = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/admissions/?status=Pending`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPendingRequests(data);
            }
        } catch (err) { console.error(err); }
    }, []);

    const refreshAll = useCallback(async () => {
        setIsLoading(true);
        await Promise.all([fetchBeds(), fetchAdmissions(), fetchPendingRequests()]);
        setIsLoading(false);
    }, [fetchBeds, fetchAdmissions, fetchPendingRequests]);

    useEffect(() => {
        refreshAll();
    }, []);

    const handleApproveRequest = async (e) => {
        e.preventDefault();
        if (!selectedBedId) {
            toast.error("Please select an available bed.");
            return;
        }
        setIsApproving(true);
        const loadingToast = toast.loading("Assigning ward bed & admitting patient...");
        try {
            const res = await fetch(`${API_URL}/admissions/${selectedRequest.id}/approve?ward_bed_id=${selectedBedId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                toast.success("Patient Admitted & Ward Bed Assigned!", { id: loadingToast });
                setSelectedRequest(null);
                setSelectedBedId('');
                refreshAll();
                setActiveTab('Active Admissions');
            } else {
                const err = await res.json();
                toast.error(err.detail || "Failed to approve request", { id: loadingToast });
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred", { id: loadingToast });
        } finally {
            setIsApproving(false);
        }
    };

    const wardTypes = ['All', 'General', 'ICU', 'NICU', 'Private', 'Emergency'];
    const userRole = localStorage.getItem('role') || '';
    const userName = localStorage.getItem('name') || 'Staff Member';
    const nurseWardName = beds.length > 0 ? beds[0].ward_name : (admissions.length > 0 ? admissions[0].ward_name : 'Your Assigned');

    return (
        <div className="max-w-7xl mx-auto space-y-6 font-sans">
            
            {/* Dedicated Prominent Nurse Ward Banner */}
            {userRole === 'Nurse' && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 rounded-2xl border border-emerald-500 shadow-lg text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white text-emerald-700 rounded-xl flex items-center justify-center font-black shadow-md shrink-0 text-2xl">
                            👩‍⚕️
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight">
                                You are a Nurse in <span className="underline decoration-wavy decoration-emerald-300">{nurseWardName}</span>!
                            </h2>
                            <p className="text-xs font-semibold text-emerald-100 mt-0.5">
                                Welcome, {userName}. This portal is scoped strictly to your ward. Only your ward's bed census, admitted inpatients, and doctor prescriptions are displayed below.
                            </p>
                        </div>
                    </div>
                    <div className="bg-emerald-800/60 border border-emerald-400/40 px-4 py-2 rounded-xl text-xs font-black shrink-0 shadow-inner flex items-center gap-1.5">
                        <Activity size={14} className="text-emerald-300" /> 🎯 Ward-Scoped Access
                    </div>
                </div>
            )}

            {/* Enterprise Top Light Blue Header Banner */}
            <div className="bg-blue-600 p-6 rounded-2xl border border-blue-700 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-md shrink-0 font-black">
                        <Building2 size={30} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-white tracking-tight">IPD Admissions & Bed Allocation</h1>
                            <span className="bg-white text-blue-700 border border-blue-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-xs">Inpatient Portal</span>
                        </div>
                        <p className="text-xs font-semibold text-blue-100 mt-1">Manage doctor OPD admission referrals, allocate available ward beds, and monitor inpatient census.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-blue-700/60 border border-blue-500/50 px-4 py-2 rounded-xl flex items-center gap-3 shadow-inner text-white">
                        <BedDouble size={18} className="text-blue-200" />
                        <div>
                            <p className="text-[10px] font-black text-blue-200 uppercase tracking-wider">Vacant Beds</p>
                            <p className="text-sm font-black text-white">{beds.length} Available</p>
                        </div>
                    </div>

                    <div className="bg-blue-700/60 border border-blue-500/50 px-4 py-2 rounded-xl flex items-center gap-3 shadow-inner text-white">
                        <AlertTriangle size={18} className="text-amber-300" />
                        <div>
                            <p className="text-[10px] font-black text-blue-200 uppercase tracking-wider">Pending Referrals</p>
                            <p className="text-sm font-black text-amber-300">{pendingRequests.length} Waiting</p>
                        </div>
                    </div>

                    <button 
                        onClick={refreshAll}
                        className="bg-white hover:bg-blue-50 text-blue-700 font-black p-2.5 rounded-xl border border-blue-200 transition-all shadow-md flex items-center gap-2 text-xs"
                        title="Sync Admissions"
                    >
                        <RefreshCw size={16} /> Sync Data
                    </button>
                </div>
            </div>

            {/* TAB NAVIGATION BAR */}
            <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-md">
                <button
                    onClick={() => setActiveTab('Pending Requests')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2.5 ${
                        activeTab === 'Pending Requests' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                    <AlertTriangle size={16} /> 1. Doctor Admission Referrals ({pendingRequests.length})
                </button>

                <button
                    onClick={() => setActiveTab('Beds')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2.5 ${
                        activeTab === 'Beds' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                    <BedDouble size={16} /> 2. Ward Bed Availability Matrix ({beds.length})
                </button>
                
                <button
                    onClick={() => setActiveTab('Active Admissions')}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2.5 ${
                        activeTab === 'Active Admissions' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                    <Users size={16} /> 3. Currently Admitted Inpatients ({admissions.length})
                </button>
            </div>

            {/* TAB 1: PENDING REFERRALS CARDS GRID */}
            {activeTab === 'Pending Requests' && (
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-2xl text-slate-500 gap-3 shadow-md">
                            <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
                            <p className="text-xs font-extrabold text-slate-600">Loading incoming doctor admission referrals...</p>
                        </div>
                    ) : pendingRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-md">
                            <CheckCircle2 size={44} className="text-emerald-500" />
                            <h3 className="text-lg font-black text-slate-800">No Pending Admission Requests</h3>
                            <p className="text-xs text-slate-500 max-w-sm">All OPD doctor admission referrals have been processed and allocated ward beds.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="bg-white border border-amber-300 rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-4 hover:border-amber-500 transition-all">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-600 shrink-0 font-black">
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900">{req.patient_name || req.patient?.full_name || `Patient #${req.patient_id}`}</h3>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs font-bold text-slate-600">
                                                            {req.patient_gender || req.patient?.gender || 'N/A'} • {req.patient_age || req.patient?.age ? `${req.patient_age || req.patient?.age} Yrs` : 'Age N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                                                Pending Bed
                                            </span>
                                        </div>

                                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                                            <p className="font-semibold text-slate-600">
                                                Referred By: <strong className="text-slate-900">{req.doctor_name || req.admitting_doctor?.user?.full_name || 'OPD Doctor'}</strong>
                                            </p>
                                            <p className="font-semibold text-slate-600">
                                                Diagnosis: <span className="text-blue-700 italic font-bold">"{req.primary_diagnosis || 'Pending Evaluation'}"</span>
                                            </p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setSelectedRequest(req)}
                                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
                                    >
                                        <BedDouble size={16} /> Assign Ward Bed & Admit
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: WARD BEDS AVAILABILITY MATRIX */}
            {activeTab === 'Beds' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-6 text-slate-900">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                        <div>
                            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <BedDouble className="text-blue-600" size={20} /> Ward Bed Availability Filter
                            </h2>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">Filter vacant ward beds by clinical unit and ward tier.</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {wardTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilter(type)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all ${
                                        filter === type 
                                        ? 'bg-blue-600 text-white border-blue-700 shadow-md' 
                                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {beds.filter(b => filter === 'All' || b.ward_type === filter).length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <BedDouble size={40} className="mx-auto text-slate-300 mb-2" />
                            <p className="font-bold text-sm text-slate-600">No available beds in this ward category.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {beds.filter(b => filter === 'All' || b.ward_type === filter).map(bed => (
                                <div key={bed.id} className="bg-emerald-50/50 border border-emerald-300 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500 transition-all shadow-xs">
                                    <BedDouble size={26} className="text-emerald-600" />
                                    <span className="font-black text-sm text-slate-900">Bed #{bed.bed_number}</span>
                                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full uppercase border border-emerald-300">
                                        {bed.ward_type || 'Ward'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: CURRENTLY ADMITTED INPATIENTS TABLE */}
            {activeTab === 'Active Admissions' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-4 text-slate-900">
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
                        <Users className="text-blue-600" size={20} /> Currently Admitted Inpatients census ({admissions.length})
                    </h2>

                    {admissions.length === 0 ? (
                        <p className="text-xs text-slate-500 py-8 text-center">No inpatients currently admitted in hospital ward beds.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[850px]">
                                <thead>
                                    <tr className="text-slate-500 text-xs uppercase font-extrabold border-b border-slate-200">
                                        <th className="pb-3">Patient Info</th>
                                        <th className="pb-3">Ward & Bed</th>
                                        <th className="pb-3">Admitting Doctor</th>
                                        <th className="pb-3">Diagnosis</th>
                                        <th className="pb-3">Active Prescriptions / Orders</th>
                                        <th className="pb-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-xs font-semibold">
                                    {admissions.map(adm => (
                                        <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3.5">
                                                <p className="font-black text-slate-900 text-sm">{adm.patient_name || adm.patient?.full_name || `Patient #${adm.patient_id}`}</p>
                                                <p className="text-[11px] text-slate-500 mt-0.5">{adm.patient_gender || 'N/A'} • {adm.patient_age ? `${adm.patient_age} Yrs` : 'Age N/A'}</p>
                                            </td>
                                            <td className="py-3.5">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                                                    <BedDouble size={14} /> Bed #{adm.bed_number || 'N/A'} ({adm.ward_name || 'Ward'})
                                                </span>
                                            </td>
                                            <td className="py-3.5 text-slate-700">{adm.doctor_name || 'OPD Doctor'}</td>
                                            <td className="py-3.5 text-slate-500 italic">"{adm.primary_diagnosis || 'Evaluation pending'}"</td>
                                            <td className="py-3.5">
                                                {adm.active_prescriptions && adm.active_prescriptions.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {adm.active_prescriptions.map((med, idx) => (
                                                            <div key={idx} className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                                                                <Activity size={12} className="text-emerald-600 shrink-0" />
                                                                <span>{med}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic text-xs font-normal">No active doctor orders</span>
                                                )}
                                            </td>
                                            <td className="py-3.5">
                                                <button
                                                    onClick={() => {
                                                        setPrescribingAdmission(adm);
                                                        setPrimaryDiagnosis(adm.primary_diagnosis || '');
                                                    }}
                                                    className="text-blue-600 font-bold underline hover:text-blue-800 text-xs"
                                                >
                                                    Prescribe
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* INTERACTIVE ASSIGN BED MODAL POPUP */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
                            <h3 className="text-base font-black text-white flex items-center gap-2">
                                <BedDouble size={20} /> Assign Bed & Finalize Admission
                            </h3>
                            <button onClick={() => setSelectedRequest(null)} className="text-blue-100 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleApproveRequest} className="p-6 space-y-4">
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                                <p className="font-black text-slate-900 text-sm">{selectedRequest.patient_name || selectedRequest.patient?.full_name}</p>
                                <p className="text-blue-700 font-bold">Diagnosis: "{selectedRequest.primary_diagnosis || 'Pending'}"</p>
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2">Select Available Ward Bed *</label>
                                {beds.length === 0 ? (
                                    <p className="text-xs text-rose-700 font-bold bg-rose-50 p-3 rounded-xl border border-rose-200">No vacant beds available in hospital inventory!</p>
                                ) : (
                                    <select
                                        value={selectedBedId}
                                        onChange={(e) => setSelectedBedId(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                                    >
                                        {beds.map(b => (
                                            <option key={b.id} value={b.id}>
                                                Bed #{b.bed_number} - {b.ward_type || 'General Ward'}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedRequest(null)}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isApproving || beds.length === 0}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck size={16} />}
                                    Confirm Admission
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* DOCTOR PRESCRIBE INPATIENT ORDERS & NURSING PROTOCOLS MODAL */}
            {prescribingAdmission && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-base font-black text-white flex items-center gap-2">
                                    <Pill size={20} /> Prescribe Ward Orders & Nursing Protocols
                                </h3>
                                <p className="text-xs text-blue-100 font-bold mt-0.5">
                                    Patient: {prescribingAdmission.patient_name || prescribingAdmission.patient?.full_name} • Bed #{prescribingAdmission.bed_number}
                                </p>
                            </div>
                            <button onClick={() => setPrescribingAdmission(null)} className="text-blue-100 hover:text-white p-1 rounded-lg cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handlePrescribeOrders} className="p-6 overflow-y-auto space-y-5 flex-1">
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">Primary Diagnosis *</label>
                                <input 
                                    type="text" 
                                    value={primaryDiagnosis} 
                                    onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                                    placeholder="e.g. Type II Diabetes Mellitus, Pneumonia, Severe Hypertension"
                                />
                            </div>

                            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Pill size={16} className="text-blue-600" /> 1. Ward Medication Orders (Nurse eMAR)
                                    </h4>
                                    <button 
                                        type="button"
                                        onClick={() => setMedList([...medList, { medication_name: '', prescribed_dose: '1g', route: 'Oral', frequency: 'BD', special_instructions: '' }])}
                                        className="text-blue-600 hover:text-blue-800 text-xs font-black flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus size={14} /> Add Medication
                                    </button>
                                </div>

                                {medList.map((med, idx) => (
                                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                                        <div className="grid grid-cols-12 gap-2">
                                            <div className="col-span-5">
                                                <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Medicine Name *</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. Insulin Regular / Ceftriaxone" 
                                                    value={med.medication_name}
                                                    onChange={(e) => {
                                                        const copy = [...medList];
                                                        copy[idx].medication_name = e.target.value;
                                                        setMedList(copy);
                                                    }}
                                                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Dose / Strength</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. 10 Units / 1g" 
                                                    value={med.prescribed_dose}
                                                    onChange={(e) => {
                                                        const copy = [...medList];
                                                        copy[idx].prescribed_dose = e.target.value;
                                                        setMedList(copy);
                                                    }}
                                                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Route</label>
                                                <select
                                                    value={med.route}
                                                    onChange={(e) => {
                                                        const copy = [...medList];
                                                        copy[idx].route = e.target.value;
                                                        setMedList(copy);
                                                    }}
                                                    className="w-full border border-slate-300 rounded-lg px-1.5 py-1.5 text-xs font-bold text-slate-900"
                                                >
                                                    <option value="Subcutaneous">SC</option>
                                                    <option value="IV Infusion">IV</option>
                                                    <option value="Oral">Oral</option>
                                                    <option value="IM">IM</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Frequency</label>
                                                <select
                                                    value={med.frequency}
                                                    onChange={(e) => {
                                                        const copy = [...medList];
                                                        copy[idx].frequency = e.target.value;
                                                        setMedList(copy);
                                                    }}
                                                    className="w-full border border-slate-300 rounded-lg px-1 py-1.5 text-xs font-bold text-slate-900"
                                                >
                                                    <option value="BD">BD (2x)</option>
                                                    <option value="TDS">TDS (3x)</option>
                                                    <option value="Before Breakfast">Morn</option>
                                                    <option value="OD">OD (1x)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-extrabold text-amber-700 uppercase">Special Precautions / Doctor Instructions for Nurse</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Check Capillary Blood Glucose before dose. Hold if SBP < 100." 
                                                value={med.special_instructions}
                                                onChange={(e) => {
                                                    const copy = [...medList];
                                                    copy[idx].special_instructions = e.target.value;
                                                    setMedList(copy);
                                                }}
                                                className="w-full border border-amber-300 bg-amber-50/50 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-900"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileCheck size={16} className="text-teal-600" /> 2. Doctor Care Protocols & Nurse Checklist
                                    </h4>
                                    <button 
                                        type="button"
                                        onClick={() => setTaskList([...taskList, ''])}
                                        className="text-teal-600 hover:text-teal-800 text-xs font-black flex items-center gap-1 cursor-pointer"
                                    >
                                        <Plus size={14} /> Add Care Task
                                    </button>
                                </div>

                                {taskList.map((task, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <input 
                                            type="text"
                                            placeholder="e.g. Check Vitals & SpO2 q4h / Keep head elevated 30° / Strict I/O Chart"
                                            value={task}
                                            onChange={(e) => {
                                                const copy = [...taskList];
                                                copy[idx] = e.target.value;
                                                setTaskList(copy);
                                            }}
                                            className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
                                        />
                                        {taskList.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => setTaskList(taskList.filter((_, i) => i !== idx))}
                                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPrescribingAdmission(null)}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 text-xs cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPrescribing}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isPrescribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck size={16} />}
                                    Dispatch Orders to Nurse eMAR
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
