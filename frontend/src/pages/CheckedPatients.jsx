import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    CheckCircle2, Search, Calendar, User, Clock, FileText, Pill, TestTube, 
    RefreshCw, Loader2, Stethoscope, ChevronRight, Activity, Eye, X, AlertCircle, ShieldCheck, Ticket
} from 'lucide-react';
import { API_URL } from '../config';
import { toast } from 'react-hot-toast';

export default function CheckedPatients() {
    const [searchParams] = useSearchParams();
    const filterParam = searchParams.get('filter');

    const [patients, setPatients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All'); // 'All', 'Pending', 'Verified'
    const [selectedPatient, setSelectedPatient] = useState(null);

    useEffect(() => {
        if (filterParam === 'pending') setActiveTab('Pending');
        else if (filterParam === 'verified') setActiveTab('Verified');
        else if (filterParam === 'all') setActiveTab('All');
    }, [filterParam]);

    const fetchCompletedConsultations = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/opd/completed-consultations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPatients(data);
            } else {
                toast.error('Failed to load checked patients history.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Server error loading records.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompletedConsultations();
    }, []);

    // Filter patients by name/token search & tab verification status
    const filteredPatients = (patients || []).filter(item => {
        const matchesSearch = (item?.patient?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item?.token_number?.toString() || '').includes(searchQuery) ||
            (item?.patient_id?.toString() || '').includes(searchQuery);

        const labOrders = item?.lab_orders || [];
        const hasPendingLabs = labOrders.some(l => l?.status !== 'Completed');

        if (!matchesSearch) return false;
        if (activeTab === 'Pending') return hasPendingLabs;
        if (activeTab === 'Verified') return !hasPendingLabs && labOrders.length > 0;
        return true;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 font-sans">
            
            {/* Top Light Blue Header Banner */}
            <div className="bg-blue-600 p-6 rounded-2xl border border-blue-700 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-md shrink-0">
                        {activeTab === 'Pending' ? <AlertCircle size={30} className="text-amber-600" /> : activeTab === 'Verified' ? <ShieldCheck size={30} className="text-emerald-600" /> : <CheckCircle2 size={30} className="text-blue-600" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-white tracking-tight">
                                {activeTab === 'Pending' ? 'Pending Test Verifications' :
                                 activeTab === 'Verified' ? 'Completed & Verified Test Records' :
                                 'All Checked Patients History'}
                            </h1>
                            <span className="bg-white text-blue-700 border border-blue-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase shadow-xs">
                                {activeTab === 'Pending' ? 'Pending Results' : activeTab === 'Verified' ? 'Verified Reports' : 'OPD Archive'}
                            </span>
                        </div>
                        <p className="text-xs font-semibold text-blue-100 mt-1">
                            {activeTab === 'Pending' ? 'Showing patients with unreported or in-progress lab and radiology test results.' :
                             activeTab === 'Verified' ? 'Showing patients whose lab reports and prescriptions are 100% verified and completed.' :
                             'Search past checked patients by name, review diagnosis notes, and track test result verification status.'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-blue-700/60 border border-blue-500/50 px-4 py-2 rounded-xl flex items-center gap-3 shadow-inner text-white">
                        <User size={18} className="text-blue-200" />
                        <div>
                            <p className="text-[10px] font-black text-blue-200 uppercase tracking-wider">Total Patients</p>
                            <p className="text-sm font-black text-white">{filteredPatients.length} Records</p>
                        </div>
                    </div>

                    <button 
                        onClick={fetchCompletedConsultations}
                        className="bg-white hover:bg-blue-50 text-blue-700 font-black p-2.5 rounded-xl border border-blue-200 transition-all shadow-md flex items-center gap-2 text-xs"
                        title="Sync Records"
                    >
                        <RefreshCw size={16} /> Sync Records
                    </button>
                </div>
            </div>

            {/* LIVE PATIENT SEARCH BAR */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
                    <input 
                        type="text"
                        placeholder="🔍 Search patient by name (e.g. Okasha, Fatima)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                    />
                </div>
            </div>

            {/* Main Patient History Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white border border-slate-200 rounded-2xl text-slate-500 gap-3 shadow-md">
                    <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
                    <p className="text-xs font-extrabold text-slate-600">Loading patient history records...</p>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-md">
                    <CheckCircle2 size={48} className="text-slate-300" />
                    <h3 className="text-lg font-black text-slate-800">No Patients Found in This View</h3>
                    <p className="text-xs text-slate-500 max-w-sm">No patient records match the selected category or search term.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.map(item => {
                        const labOrders = item?.lab_orders || [];
                        const pharmacyOrders = item?.pharmacy_orders || [];
                        const pendingLabsList = labOrders.filter(l => l?.status !== 'Completed');
                        const hasPendingLabs = pendingLabsList.length > 0;

                        return (
                            <div key={item.id} className={`bg-white border rounded-2xl p-6 shadow-md hover:shadow-xl flex flex-col justify-between space-y-5 transition-all duration-300 overflow-hidden ${
                                hasPendingLabs ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200/90 hover:border-blue-500'
                            }`}>
                                <div className="space-y-4">
                                    
                                    {/* Patient Header */}
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="w-11 h-11 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 font-black shadow-xs">
                                                <User size={20} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-base font-black text-slate-900 leading-snug break-normal [word-break:normal]">
                                                    {item.patient?.full_name || `Patient #${item.patient_id}`}
                                                </h3>
                                                <p className="text-[11px] font-bold text-slate-500 mt-1 flex flex-wrap items-center gap-1.5 leading-tight">
                                                    <span>{item.patient?.gender || 'N/A'}</span>
                                                    <span className="text-slate-300">•</span>
                                                    <span>{item.patient?.age ? `${item.patient.age} Yrs` : 'Age N/A'}</span>
                                                    {item.appointment_date && (
                                                        <>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="text-blue-600 font-extrabold">{item.appointment_date}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black whitespace-nowrap shrink-0 shadow-md shadow-blue-500/20 tracking-wider">
                                            <Ticket size={12} className="text-blue-200" />
                                            <span>TOKEN #{item.token_number}</span>
                                        </div>
                                    </div>

                                    {/* Verification Status Banner */}
                                    <div>
                                        {hasPendingLabs ? (
                                            <div className="bg-amber-50/80 border border-amber-200/90 p-3.5 rounded-xl space-y-1.5">
                                                <span className="inline-flex items-center gap-1.5 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                                                    <AlertCircle size={13} className="text-amber-600" /> Unreported / Pending Tests ({pendingLabsList.length})
                                                </span>
                                                <div className="space-y-1">
                                                    {pendingLabsList.map((pl, pIdx) => (
                                                        <p key={pIdx} className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                                            {pl.test_name} <span className="text-[10px] text-amber-700 italic">({pl.status})</span>
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : labOrders.length > 0 ? (
                                            <div className="bg-emerald-50/90 border border-emerald-200/90 p-3.5 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs font-extrabold shadow-xs">
                                                <ShieldCheck size={17} className="text-emerald-600 shrink-0" /> All Lab Reports Verified & Completed
                                            </div>
                                        ) : (
                                            <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-xl text-slate-600 text-xs font-bold">
                                                No Lab Tests Requested
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-slate-200/80" />

                                    {/* Order Summary Info */}
                                    <div className="space-y-1.5 text-xs font-semibold">
                                        <p className="text-slate-600">
                                            Consultant Doctor: <strong className="text-slate-900 font-extrabold">{item.doctor_name || 'Dr. OPD'}</strong>
                                        </p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-600">
                                            <p>
                                                Prescriptions: <strong className="text-blue-600 font-extrabold">{pharmacyOrders.length} {pharmacyOrders.length === 1 ? 'Item' : 'Items'}</strong>
                                            </p>
                                            <span className="text-slate-300">•</span>
                                            <p>
                                                Lab Tests: <strong className="text-indigo-600 font-extrabold">{labOrders.length} {labOrders.length === 1 ? 'Test' : 'Tests'}</strong>
                                            </p>
                                        </div>
                                    </div>

                                </div>

                                {/* View Full Patient History Button */}
                                <button
                                    onClick={() => setSelectedPatient(item)}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl border border-blue-700/50 transition-all text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-[0.99] uppercase tracking-wider"
                                >
                                    <Eye size={16} /> View Full Medical Record
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* FULL MEDICAL RECORD MODAL POPUP */}
            {selectedPatient && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 text-slate-900">
                        
                        {/* Modal Header */}
                        <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center font-black shadow-md">
                                    <CheckCircle2 size={22} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white">{selectedPatient.patient?.full_name}</h3>
                                    <p className="text-xs text-blue-100 font-semibold">Token #{selectedPatient.token_number} • {selectedPatient.patient?.gender} • {selectedPatient.patient?.age} Yrs</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedPatient(null)} className="text-blue-100 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 bg-slate-50">
                            
                            {/* Prescriptions Section */}
                            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-2">
                                    <Pill size={16} /> Prescribed Medications ({(selectedPatient.pharmacy_orders || []).length})
                                </h4>
                                {(selectedPatient.pharmacy_orders || []).length === 0 ? (
                                    <p className="text-xs text-slate-500">No medications prescribed.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedPatient.pharmacy_orders.map(p => (
                                            <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                                                <span className="font-bold text-slate-900">{p.medication} ({p.dosage})</span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                                    p.status === 'Dispensed' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                                                }`}>
                                                    {p.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Lab Orders Section */}
                            <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-2">
                                    <TestTube size={16} /> Laboratory & Diagnostic Orders ({(selectedPatient.lab_orders || []).length})
                                </h4>
                                {(selectedPatient.lab_orders || []).length === 0 ? (
                                    <p className="text-xs text-slate-500">No lab investigations ordered.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedPatient.lab_orders.map(l => (
                                            <div key={l.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                                                <div>
                                                    <span className="font-bold text-slate-900">{l.test_name}</span>
                                                    {l.result && <p className="text-[10px] text-blue-700 font-bold mt-0.5">Result: {l.result}</p>}
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                                    l.status === 'Completed' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                                                }`}>
                                                    {l.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all border border-slate-300"
                            >
                                Close Record
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
