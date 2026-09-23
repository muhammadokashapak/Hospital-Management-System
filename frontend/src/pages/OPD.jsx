import React, { useState, useEffect, useCallback } from 'react';
import { 
    User, Activity, Clock, FileText, Plus, Trash2,
    Pill, TestTube, BedDouble, AlertTriangle, CheckCircle2,
    Calendar, Search, Loader2, Save, LogOut, RefreshCw, Stethoscope, ChevronRight, X
} from 'lucide-react';
import { API_URL } from '../config';
import { toast } from 'react-hot-toast';

export default function OPD() {
    const [queue, setQueue] = useState([]);
    const [activePatient, setActivePatient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('clinical'); // 'clinical', 'prescriptions', 'labs'
    
    // Consultation State
    const [chiefComplaint, setChiefComplaint] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [clinicalNotes, setClinicalNotes] = useState('');
    
    const [prescription, setPrescription] = useState([
        { med: '', form: 'Tablet', dose: '1-0-1 (BD)', duration: '5 Days' }
    ]);
    const [labTests, setLabTests] = useState([
        { test: '', priority: 'Routine' }
    ]);
    
    const [isSaving, setIsSaving] = useState(false);

    // Follow-Up Modal State
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [followUpDays, setFollowUpDays] = useState(7);
    const [customDays, setCustomDays] = useState('');
    const [followUpType, setFollowUpType] = useState('Re_Consultation'); // 'Re_Consultation' or 'Direct_Pharmacy_Refill'
    const [followUpNotes, setFollowUpNotes] = useState('');
    const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);

    // Live Orders State
    const [patientLiveOrders, setPatientLiveOrders] = useState({ lab_orders: [], pharmacy_orders: [] });

    const fetchLiveOrders = async (patientId) => {
        if (!patientId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/opd/patient/${patientId}/live_orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPatientLiveOrders({
                    lab_orders: Array.isArray(data?.lab_orders) ? data.lab_orders : [],
                    pharmacy_orders: Array.isArray(data?.pharmacy_orders) ? data.pharmacy_orders : []
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectPatient = (patient) => {
        setActivePatient(patient);
        setActiveTab('clinical');
        setChiefComplaint('');
        setDiagnosis('');
        setClinicalNotes('');
        setFollowUpDays(7);
        setCustomDays('');
        setFollowUpType('Re_Consultation');
        setFollowUpNotes('');
        setPrescription([
            { med: '', form: 'Tablet', dose: '1-0-1 (BD)', duration: '5 Days' }
        ]);
        setLabTests([{ test: '', priority: 'Routine' }]);
        setPatientLiveOrders({ lab_orders: [], pharmacy_orders: [] });
        fetchLiveOrders(patient?.patient_id);
    };

    const fetchQueue = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/opd/waiting-area`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQueue(data);
                if (!activePatient && data.length > 0) {
                    handleSelectPatient(data[0]);
                }
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load live OPD queue.');
        } finally {
            setIsLoading(false);
        }
    }, [activePatient]);

    useEffect(() => {
        fetchQueue();
    }, []);

    const handleAddMedication = () => setPrescription([...prescription, { med: '', form: 'Tablet', dose: '1-0-1 (BD)', duration: '5 Days' }]);
    const handleRemoveMedication = (index) => {
        if (prescription.length > 1) {
            setPrescription(prescription.filter((_, i) => i !== index));
        } else {
            setPrescription([{ med: '', form: 'Tablet', dose: '1-0-1 (BD)', duration: '5 Days' }]);
        }
    };

    const handleAddLab = () => setLabTests([...labTests, { test: '', priority: 'Routine' }]);
    const handleRemoveLab = (index) => {
        if (labTests.length > 1) {
            setLabTests(labTests.filter((_, i) => i !== index));
        } else {
            setLabTests([{ test: '', priority: 'Routine' }]);
        }
    };

    const handlePrescriptionChange = (index, field, value) => {
        const updated = [...prescription];
        updated[index][field] = value;
        setPrescription(updated);
    };

    const handleLabChange = (index, field, value) => {
        const updated = [...labTests];
        updated[index][field] = value;
        setLabTests(updated);
    };

    const handleCompleteConsultation = async () => {
        if (!activePatient) return;
        setIsSaving(true);

        const validMeds = prescription.filter(p => p.med && p.med.trim() !== '');
        const validLabs = labTests.filter(l => l.test && l.test.trim() !== '');

        let loadingMsg = 'Saving consultation record...';
        if (validMeds.length > 0 && validLabs.length > 0) {
            loadingMsg = 'Submitting consultation & sending orders to Pharmacy & Lab...';
        } else if (validMeds.length > 0) {
            loadingMsg = 'Submitting consultation & sending prescription to Pharmacy...';
        } else if (validLabs.length > 0) {
            loadingMsg = 'Submitting consultation & sending test orders to Laboratory...';
        }

        const loadingToast = toast.loading(loadingMsg);
        
        try {
            const token = localStorage.getItem('token');
            const formattedNotes = `Chief Complaint: ${chiefComplaint || 'N/A'}\nDiagnosis: ${diagnosis || 'N/A'}\nNotes: ${clinicalNotes || 'N/A'}`;
            
            const res = await fetch(`${API_URL}/opd/consultation/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    appointment_id: activePatient.id,
                    patient_id: activePatient.patient_id,
                    notes: formattedNotes,
                    medications: validMeds.map(p => ({
                        med: `${p.form} ${p.med}`,
                        dose: `${p.dose} (${p.duration})`
                    })),
                    lab_tests: validLabs.map(l => ({
                        test: `${l.test} [${l.priority}]`
                    })),
                    follow_up_days: customDays ? parseInt(customDays) : followUpDays,
                    follow_up_type: followUpType,
                    follow_up_notes: followUpNotes
                })
            });

            if (res.ok) {
                let successMsg = 'Consultation saved & completed successfully!';
                if (validMeds.length > 0 && validLabs.length > 0) {
                    successMsg = 'Consultation completed! Orders & Follow-up strategy sent live.';
                } else if (validMeds.length > 0) {
                    successMsg = 'Consultation completed! Prescription with Follow-Up Refill strategy sent live.';
                } else if (validLabs.length > 0) {
                    successMsg = 'Consultation completed! Diagnostic test orders sent live.';
                }

                toast.success(successMsg, { id: loadingToast });
                setActivePatient(null);
                setChiefComplaint('');
                setDiagnosis('');
                setPrescription([{ med: '', form: 'Tablet', dose: '1-0-1 (BD)', duration: '5 Days' }]);
                setLabTests([{ test: '', priority: 'Routine' }]);
                fetchQueue();
            } else {
                toast.error('Failed to submit consultation.', { id: loadingToast });
            }
        } catch (err) {
            toast.error('Server error submitting consultation.', { id: loadingToast });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFollowUp = () => {
        if (!activePatient) {
            toast.error('Select a patient first to configure follow-up.');
            return;
        }
        setShowFollowUpModal(true);
    };

    const handleSaveFollowUpModal = async () => {
        if (!activePatient) return;
        const daysToSet = customDays ? parseInt(customDays) : followUpDays;
        if (!daysToSet || daysToSet <= 0) {
            toast.error('Please specify valid follow-up days');
            return;
        }

        setIsSavingFollowUp(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/opd/followup/create`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    appointment_id: activePatient.id,
                    patient_id: activePatient.patient_id,
                    follow_up_days: daysToSet,
                    follow_up_type: followUpType,
                    notes: followUpNotes
                })
            });

            if (res.ok) {
                const typeText = followUpType === 'Direct_Pharmacy_Refill' ? 'Direct Pharmacy Refill Allowed' : 'Re-Consultation Required';
                toast.success(`Follow-up saved: ${daysToSet} Days (${typeText})`, { icon: '📅' });
                setShowFollowUpModal(false);
            } else {
                toast.error('Failed to save follow-up');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error connecting to server');
        } finally {
            setIsSavingFollowUp(false);
        }
    };

    const handleAdmit = async () => {
        if (!activePatient) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admissions/request`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patient_id: activePatient.patient_id,
                    primary_diagnosis: diagnosis || chiefComplaint || 'Pending evaluation',
                    admission_type: 'IPD'
                })
            });
            if (res.ok) {
                toast.success('Patient transfer request sent to Ward Nurse.', { icon: '🛏️' });
            } else {
                const data = await res.json();
                toast.error(data.detail || 'Failed to send admission request.');
            }
        } catch (err) {
            console.error(err);
            toast.error('An error occurred.');
        }
    };

    const handleICUTransfer = async () => {
        if (!activePatient) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admissions/request`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patient_id: activePatient.patient_id,
                    primary_diagnosis: diagnosis || chiefComplaint || 'Critical evaluation needed',
                    admission_type: 'ICU'
                })
            });
            if (res.ok) {
                toast.success('Critical ICU Transfer Request sent to ICU Ward & Nurse.', { icon: '🚨' });
            } else {
                toast.error('Failed to send ICU transfer request.');
            }
        } catch (err) {
            console.error(err);
            toast.error('An error occurred.');
        }
    };

    const handleERTransfer = () => {
        toast.error('Code Red: Patient transferred to Emergency (A&E).', { icon: '🚑' });
    };

    const filteredQueue = queue.filter(item => 
        (item.patient?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.token_number?.toString() || '').includes(searchQuery)
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 font-sans">
            
            {/* Enterprise Top Navigation Header */}
            <div className="bg-blue-600 p-5 rounded-2xl border border-blue-700 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-blue-700 border border-blue-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
                        <Stethoscope size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            OPD Clinical Consultation Workspace
                        </h1>
                        <p className="text-xs font-semibold text-blue-100 mt-0.5">Examine OPD patients, record diagnosis, prescribe medications, and order lab investigations.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-blue-700/80 border border-blue-500/70 px-4 py-2 rounded-xl flex items-center gap-3 shadow-inner text-white">
                        <Clock size={18} className="text-amber-300" />
                        <div>
                            <p className="text-[10px] font-extrabold text-blue-200 uppercase tracking-wider">Queue Waiting</p>
                            <p className="text-sm font-black text-white">{queue.length} Patients</p>
                        </div>
                    </div>
                    <button 
                        onClick={fetchQueue}
                        className="bg-white hover:bg-blue-50 text-blue-700 p-2.5 rounded-xl border border-blue-200 transition-colors shadow-md"
                        title="Refresh Queue"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                   {/* LEFT SIDEBAR: Live Queue List (3.5 cols) */}
                <div className="lg:col-span-4 xl:col-span-3 bg-white border border-slate-200 rounded-2xl flex flex-col h-[calc(100vh-170px)] min-h-[640px] overflow-hidden shadow-lg">
                    <div className="p-4 border-b border-blue-500/30 bg-blue-600 text-white space-y-3">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-black text-white flex items-center gap-2">
                                <Clock size={16} className="text-amber-300" /> Patient Queue
                            </h2>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-blue-200" size={16} />
                            <input 
                                type="text"
                                placeholder="Search by name or token #"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-blue-700/60 border border-blue-500/50 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white placeholder-blue-200 focus:outline-none focus:bg-blue-700"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar bg-slate-50">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                                <Loader2 className="animate-spin w-7 h-7 text-blue-600" />
                                <span className="text-xs font-bold">Loading OPD Queue...</span>
                            </div>
                        ) : filteredQueue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center p-6 space-y-2">
                                <CheckCircle2 className="w-12 h-12 text-slate-300" />
                                <p className="text-sm font-bold text-slate-700">Queue is Clear</p>
                                <p className="text-xs text-slate-500">No waiting patients in OPD for your department.</p>
                            </div>
                        ) : (
                            filteredQueue.map((item) => {
                                const isSelected = activePatient?.id === item.id;
                                return (
                                    <div 
                                        key={item.id}
                                        onClick={() => handleSelectPatient(item)}
                                        className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                                            isSelected 
                                            ? 'bg-blue-600 border-blue-700 text-white shadow-md' 
                                            : 'bg-white border-slate-200 hover:bg-blue-50/60 text-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${
                                                isSelected 
                                                ? 'bg-blue-700 text-white border-blue-400' 
                                                : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                #{item.token_number}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-black text-xs leading-tight break-normal [word-break:normal] ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                                    {item.patient?.full_name || `Patient #${item.patient_id}`}
                                                </h3>
                                                <p className={`text-[11px] font-semibold mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                                    {item.patient?.gender || 'N/A'} • {item.patient?.age ? `${item.patient.age} yrs` : 'Age N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT MAIN WORKSPACE: Active Patient Consultation (8.5 cols) */}
                <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
                    {activePatient ? (
                        <>
                            {/* Patient Profile Header Card */}
                            <div className="bg-blue-600 border border-blue-700 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 text-white">
                                {/* Left: Avatar + Details */}
                                <div className="flex items-center gap-5 shrink-0">
                                    <div className="w-16 h-16 bg-blue-700 border border-blue-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
                                        <User size={34} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-xl font-black text-white tracking-tight leading-snug break-normal [word-break:normal]">{activePatient.patient?.full_name}</h2>
                                            <span className="bg-white text-blue-700 border border-blue-200 text-xs font-black px-3 py-1 rounded-xl shadow-xs whitespace-nowrap shrink-0">
                                                TOKEN #{activePatient.token_number}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-blue-100">
                                            <span>Age: <strong className="text-white">{activePatient.patient?.age || 'N/A'} Yrs</strong></span>
                                            <span>•</span>
                                            <span>Gender: <strong className="text-white">{activePatient.patient?.gender || 'N/A'}</strong></span>
                                            {activePatient.patient?.phone && (
                                                <>
                                                    <span>•</span>
                                                    <span>📞 {activePatient.patient.phone}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Right: Patient Action Buttons (2 Rows Layout) */}
                                <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto">
                                    <button 
                                        onClick={handleFollowUp} 
                                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-md transition-all"
                                    >
                                        <Calendar size={15} /> Follow Up
                                    </button>

                                    <button 
                                        onClick={handleAdmit} 
                                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-md transition-all"
                                    >
                                        <BedDouble size={15} /> Admit Patient
                                    </button>

                                    <button 
                                        onClick={handleICUTransfer} 
                                        className="col-span-2 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-md transition-all"
                                    >
                                        <Activity size={15} /> ICU Transfer
                                    </button>
                                </div>
                            </div>

                            {/* Live Orders Status Feed (If active) */}
                            {(patientLiveOrders?.lab_orders?.length > 0 || patientLiveOrders?.pharmacy_orders?.length > 0) && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-lg space-y-3">
                                    <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                        <Activity size={15} className="text-blue-600" />
                                        Live Orders & Results Status Feed
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Pharmacy Feed */}
                                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                            <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 mb-2.5">
                                                <Pill size={15} className="text-emerald-600" /> Pharmacy Orders
                                            </p>
                                            {(patientLiveOrders?.pharmacy_orders || []).length === 0 ? (
                                                <p className="text-xs text-slate-500">No active pharmacy orders.</p>
                                            ) : (
                                                <div className="space-y-2 max-h-28 overflow-y-auto">
                                                    {(patientLiveOrders?.pharmacy_orders || []).map(p => (
                                                        <div key={p.id} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                                                            <span className="font-semibold text-slate-900">{p.medication} ({p.dosage})</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                                                p.status === 'Dispensed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                                                            }`}>
                                                                {p.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Lab Feed */}
                                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                            <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 mb-2.5">
                                                <TestTube size={15} className="text-blue-600" /> Lab Test Results
                                            </p>
                                            {(patientLiveOrders?.lab_orders || []).length === 0 ? (
                                                <p className="text-xs text-slate-500">No active lab test orders.</p>
                                            ) : (
                                                <div className="space-y-2 max-h-28 overflow-y-auto">
                                                    {(patientLiveOrders?.lab_orders || []).map(l => (
                                                        <div key={l.id} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                                                            <div>
                                                                <span className="font-semibold text-slate-900">{l.test_name}</span>
                                                                {l.result && <p className="text-[10px] text-blue-700 font-bold mt-0.5">Result: {l.result}</p>}
                                                            </div>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                                                l.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                                                            }`}>
                                                                {l.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SEGMENTED TAB NAVIGATION BAR */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-md">
                                <button
                                    onClick={() => setActiveTab('clinical')}
                                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                                        activeTab === 'clinical' 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <FileText size={16} /> 1. Clinical Diagnosis & Examination Notes
                                </button>
                                
                                <button
                                    onClick={() => setActiveTab('prescriptions')}
                                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                                        activeTab === 'prescriptions' 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <Pill size={16} /> 2. Prescribe Medications
                                </button>
                                
                                <button
                                    onClick={() => setActiveTab('labs')}
                                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                                        activeTab === 'labs' 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <TestTube size={16} /> 3. Order Lab Investigations
                                </button>
                            </div>

                            {/* TAB 1: CLINICAL DIAGNOSIS & EXAMINATION NOTES */}
                            {activeTab === 'clinical' && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg space-y-4 flex flex-col justify-between animate-in fade-in duration-200 text-slate-900">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                                            <FileText size={18} className="text-blue-600" />
                                            <h3 className="font-black text-sm text-slate-900">1. Clinical Diagnosis & Examination Notes</h3>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Chief Complaint (CC)</label>
                                                    <input 
                                                        type="text"
                                                        placeholder="Enter Chief Complaint (e.g. Fever for 2 days, cough)"
                                                        value={chiefComplaint}
                                                        onChange={(e) => setChiefComplaint(e.target.value)}
                                                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Primary Clinical Diagnosis</label>
                                                    <input 
                                                        type="text"
                                                        placeholder="Enter Diagnosis (e.g. Acute Pharyngitis / Viral Fever)"
                                                        value={diagnosis}
                                                        onChange={(e) => setDiagnosis(e.target.value)}
                                                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-xs"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">Detailed Examination & Advice Notes</label>
                                                <textarea
                                                    className="w-full h-28 min-h-[110px] bg-white border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 resize-none shadow-xs leading-relaxed"
                                                    placeholder="Enter physical examination findings, treatment plan, patient instructions, and follow-up advice..."
                                                    value={clinicalNotes}
                                                    onChange={(e) => setClinicalNotes(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('prescriptions')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
                                        >
                                            Proceed to Prescriptions <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: PRESCRIBE MEDICATIONS */}
                            {activeTab === 'prescriptions' && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg space-y-5 flex flex-col justify-between animate-in fade-in duration-200">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                            <h4 className="text-sm font-extrabold text-slate-900 tracking-wider flex items-center gap-2">
                                                <Pill size={18} className="text-emerald-600" /> 2. Prescribe Medications
                                            </h4>
                                            <button 
                                                onClick={handleAddMedication}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1 transition-colors shadow-md"
                                            >
                                                <Plus size={16} /> Add Medication Row
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {prescription.map((rx, idx) => (
                                                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                                    <div className="grid grid-cols-12 gap-2.5 items-center">
                                                        
                                                        {/* Form */}
                                                        <div className="col-span-2">
                                                            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Form</label>
                                                            <select
                                                                value={rx.form}
                                                                onChange={(e) => handlePrescriptionChange(idx, 'form', e.target.value)}
                                                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                                                            >
                                                                <option value="Tablet">Tab</option>
                                                                <option value="Capsule">Cap</option>
                                                                <option value="Syrup">Syr</option>
                                                                <option value="Injection">Inj</option>
                                                            </select>
                                                        </div>

                                                        {/* Med Name */}
                                                        <div className="col-span-6">
                                                            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Medicine Name & Strength *</label>
                                                            <input 
                                                                type="text"
                                                                placeholder="Medicine Name (e.g. Panadol 500mg)"
                                                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                                                                value={rx.med}
                                                                onChange={(e) => handlePrescriptionChange(idx, 'med', e.target.value)}
                                                            />
                                                        </div>

                                                        {/* Dose */}
                                                        <div className="col-span-3">
                                                            <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Dose (Freq)</label>
                                                            <select
                                                                value={rx.dose}
                                                                onChange={(e) => handlePrescriptionChange(idx, 'dose', e.target.value)}
                                                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                                                            >
                                                                <option value="1-0-1 (BD)">1-0-1 (BD)</option>
                                                                <option value="1-1-1 (TDS)">1-1-1 (TDS)</option>
                                                                <option value="1-0-0">1-0-0 (Morn)</option>
                                                                <option value="0-0-1">0-0-1 (Night)</option>
                                                                <option value="SOS">SOS</option>
                                                            </select>
                                                        </div>

                                                        {/* Trash */}
                                                        <div className="col-span-1 flex justify-end pt-4">
                                                            <button
                                                                onClick={() => handleRemoveMedication(idx)}
                                                                className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                                                title="Remove medication"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('labs')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2"
                                        >
                                            Proceed to Lab Orders <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: ORDER LAB INVESTIGATIONS */}
                            {activeTab === 'labs' && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg space-y-5 flex flex-col justify-between animate-in fade-in duration-200">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                            <div>
                                                <h4 className="text-sm font-extrabold text-slate-900 tracking-wider flex items-center gap-2">
                                                    <TestTube size={18} className="text-blue-600" /> 3. Order Diagnostic Investigations (Pathology & Radiology)
                                                </h4>
                                                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                                    💡 Smart Auto-Routing: Pathology tests (CBC, LFT) send to Lab. Scans (X-Ray, CT, MRI, Ultrasound) route to Radiology Dept.
                                                </p>
                                            </div>
                                            <button 
                                                onClick={handleAddLab}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1 transition-colors shadow-md shrink-0"
                                            >
                                                <Plus size={16} /> Add Diagnostic Test
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {labTests.map((lab, idx) => (
                                                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-3 items-center">
                                                    <div className="col-span-7">
                                                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Diagnostic Test Name *</label>
                                                        <input 
                                                            type="text"
                                                            placeholder="Test Name (e.g. CBC / X-Ray Chest / LFT)"
                                                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                                                            value={lab.test}
                                                            onChange={(e) => handleLabChange(idx, 'test', e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="col-span-4">
                                                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase mb-1">Priority</label>
                                                        <select
                                                            value={lab.priority}
                                                            onChange={(e) => handleLabChange(idx, 'priority', e.target.value)}
                                                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-900"
                                                        >
                                                            <option value="Routine">Routine</option>
                                                            <option value="Urgent">Urgent</option>
                                                            <option value="STAT">STAT (Emergency)</option>
                                                        </select>
                                                    </div>

                                                    <div className="col-span-1 flex justify-end pt-4">
                                                        <button
                                                            onClick={() => handleRemoveLab(idx)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                                            title="Remove test"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Primary Consultation Completion Footer */}
                            <div className="flex justify-end pt-2">
                                <button 
                                    onClick={handleCompleteConsultation}
                                    disabled={isSaving}
                                    className="w-full md:w-auto flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-base px-10 py-4 rounded-2xl shadow-lg transition-all"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    Finalize Consultation & Dispatch Orders
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-12 text-center shadow-lg min-h-[540px]">
                            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-5 border border-blue-200 text-blue-600 shadow-md">
                                <Stethoscope size={42} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">Select a Patient for OPD Consultation</h2>
                            <p className="text-slate-500 mt-2 text-xs max-w-md font-semibold">Choose a patient from the live token queue on the left to write clinical diagnosis notes, prescribe medicines, and order lab tests.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* DOCTOR FOLLOW-UP CONFIGURATION MODAL */}
            {showFollowUpModal && activePatient && (
                <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-6 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
                                    <Calendar size={24} className="text-emerald-300" />
                                </div>
                                <div>
                                    <h3 className="font-black text-lg text-white leading-tight">Configure Patient Follow-Up</h3>
                                    <p className="text-xs text-emerald-100 font-semibold mt-0.5">
                                        Patient: <span className="font-bold text-white">{activePatient.patient?.full_name}</span> (Token #{activePatient.token_number})
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowFollowUpModal(false)}
                                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6 text-slate-900">
                            {/* SECTION 1: DURATION SELECTION */}
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                                    1. Follow-Up Duration (Kitne din ka follow-up hoga) *
                                </label>
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    {[7, 14, 30].map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => { setFollowUpDays(d); setCustomDays(''); }}
                                            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                                                followUpDays === d && !customDays
                                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-102'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {d === 30 ? '1 Month' : `${d} Days`}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => { setFollowUpDays(0); setCustomDays('21'); }}
                                        className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                                            customDays || (followUpDays !== 7 && followUpDays !== 14 && followUpDays !== 30)
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-102'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        Custom
                                    </button>
                                </div>

                                {(customDays || (followUpDays !== 7 && followUpDays !== 14 && followUpDays !== 30)) && (
                                    <div className="mt-2">
                                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Enter Custom Days:</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="365"
                                            placeholder="e.g. 21"
                                            value={customDays}
                                            onChange={(e) => setCustomDays(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* SECTION 2: FOLLOW-UP TYPE / STRATEGY */}
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                                    2. Patient Deal Strategy (Dobara Checkup ya Direct Refill) *
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Option A: Re-Consultation */}
                                    <div 
                                        onClick={() => setFollowUpType('Re_Consultation')}
                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                            followUpType === 'Re_Consultation'
                                            ? 'bg-blue-50/80 border-blue-600 text-blue-900 shadow-md'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                                                <Stethoscope size={20} />
                                            </div>
                                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                followUpType === 'Re_Consultation' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                                            }`}>
                                                {followUpType === 'Re_Consultation' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                            </span>
                                        </div>
                                        <h4 className="font-extrabold text-xs">🩺 OPD Re-Consultation</h4>
                                        <p className="text-[10px] text-slate-500 font-semibold mt-1">
                                            Patient must return to Doctor OPD for checkup before next medication refill.
                                        </p>
                                    </div>

                                    {/* Option B: Direct Pharmacy Refill */}
                                    <div 
                                        onClick={() => setFollowUpType('Direct_Pharmacy_Refill')}
                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                                            followUpType === 'Direct_Pharmacy_Refill'
                                            ? 'bg-emerald-50/80 border-emerald-600 text-emerald-900 shadow-md'
                                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                                                <Pill size={20} />
                                            </div>
                                            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                followUpType === 'Direct_Pharmacy_Refill' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                                            }`}>
                                                {followUpType === 'Direct_Pharmacy_Refill' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                            </span>
                                        </div>
                                        <h4 className="font-extrabold text-xs">💊 Direct Pharmacy Refill</h4>
                                        <p className="text-[10px] text-slate-500 font-semibold mt-1">
                                            Patient can directly collect medication refill from Pharmacy without Doctor checkup.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: NOTES FOR PHARMACY & PATIENT */}
                            <div>
                                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                                    3. Doctor Instructions for Pharmacist & Patient
                                </label>
                                <textarea
                                    value={followUpNotes}
                                    onChange={(e) => setFollowUpNotes(e.target.value)}
                                    placeholder="Enter instructions for Pharmacist (e.g. Check BP at pharmacy, or Refill BP medication for 14 days if asymptomatic)..."
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 h-20 resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowFollowUpModal(false)}
                                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveFollowUpModal}
                                disabled={isSavingFollowUp}
                                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-2"
                            >
                                {isSavingFollowUp && <Loader2 size={16} className="animate-spin" />}
                                Confirm & Save Follow-Up
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
