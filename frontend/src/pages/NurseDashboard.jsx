import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { 
    BedDouble, RefreshCw, Search, CheckCircle2, Activity, 
    HeartPulse, Pill, FileText, ChevronRight, X, ShieldAlert,
    TrendingUp, Droplet, FileCheck, Award, User, Clock, AlertCircle, Sparkles
} from 'lucide-react';
import StaffDutyBriefingBanner from '../components/StaffDutyBriefingBanner';

export default function NurseDashboard() {
  // Data states
  const [summaryData, setSummaryData] = useState(null);
  const [wardBeds, setWardBeds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Selected Patient Modal Popup & Workspace State
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedBedInfo, setSelectedBedInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('care_plan'); // 'care_plan' | 'emar' | 'vitals'

  // Patient Clinical Data States
  const [emarData, setEmarData] = useState(null);
  const [checklistData, setChecklistData] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [loadingEmar, setLoadingEmar] = useState(false);

  // Global Feedback Alert Banner
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');

  // Simple Vitals Modal State
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [vitalsData, setVitalsData] = useState({
    blood_pressure: '120/80', pulse_rate: 75, respiratory_rate: 18,
    temperature: 37.0, spo2: 98
  });

  const fetchNursePortalData = useCallback(async () => {
    try {
      setLoading(true);
      const summaryRes = await fetchWithAuth('/nurse/dashboard-summary');
      if (summaryRes.ok) setSummaryData(await summaryRes.json());

      const bedsRes = await fetchWithAuth('/nurse/ward-beds');
      if (bedsRes.ok) {
        const bedsJson = await bedsRes.json();
        setWardBeds(bedsJson.beds || []);
      }
    } catch (err) {
      console.error("Error fetching nurse portal data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNursePortalData();
  }, [fetchNursePortalData]);

  const fetchPatientWorkspace = async (patientId) => {
    setLoadingEmar(true);
    try {
      const numericId = typeof patientId === 'number' ? patientId : parseInt(String(patientId).replace(/\D/g, '')) || 1;
      
      const emarRes = await fetchWithAuth(`/nurse/emar/patient/${numericId}`);
      if (emarRes.ok) setEmarData(await emarRes.json());

      const vitRes = await fetchWithAuth(`/nurse/vitals/patient/${numericId}`);
      if (vitRes.ok) setVitalsHistory(await vitRes.json());

      const checklistRes = await fetchWithAuth(`/nurse/checklist/patient/${numericId}`);
      if (checklistRes.ok) setChecklistData(await checklistRes.json());
    } catch (err) {
      console.error("Error fetching patient workspace:", err);
    } finally {
      setLoadingEmar(false);
    }
  };

  // Open Simple Clean Patient Modal Popup
  const handleOpenPatient = async (bedObj, bedIndex) => {
    const numericId = bedObj?.patient_id || (typeof bedIndex === 'number' ? bedIndex + 1 : 1);
    setSelectedPatientId(numericId);
    setSelectedBedInfo(bedObj || { bed: `Bed ${numericId}`, name: `Patient #${numericId}`, mrn: `MRN-${1000 + numericId}`, dx: 'Under Clinical Care' });
    setActiveTab('care_plan');
    await fetchPatientWorkspace(numericId);
  };

  const handleToggleChecklist = async (taskId, currentStatus) => {
    try {
      const res = await fetchWithAuth('/nurse/checklist/toggle', {
        method: 'POST',
        body: JSON.stringify({
          task_id: taskId,
          is_completed: !currentStatus,
          remarks: 'Completed per nursing protocol'
        })
      });
      if (res.ok) {
        setMsg('✓ Task updated successfully.');
        setMsgType('success');
        await fetchPatientWorkspace(selectedPatientId);
      }
    } catch (err) {
      console.error("Error toggling checklist:", err);
    }
    setTimeout(() => setMsg(''), 2500);
  };

  const handleQuickAdminister = async (orderId, scheduleId) => {
    try {
      setMsg('Recording medication administration...');
      setMsgType('info');
      const res = await fetchWithAuth('/nurse/emar/administer', {
        method: 'POST',
        body: JSON.stringify({
          order_id: orderId,
          schedule_id: scheduleId || null,
          actual_dose: 'Standard Dose',
          actual_route: 'Oral / IV',
          remarks: 'Administered cleanly per Five Rights protocol.',
          five_rights_confirmed: true
        })
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setMsg(`✅ ${data.message || 'Medication successfully administered.'}`);
        setMsgType('success');
        await fetchPatientWorkspace(selectedPatientId);
      } else {
        setMsg(`⚠️ ${data.message || 'Could not administer dose.'}`);
        setMsgType('error');
      }
    } catch (err) {
      setMsg('❌ Error recording dose.');
      setMsgType('error');
    }
    setTimeout(() => setMsg(''), 3500);
  };

  const handleSaveVitals = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/nurse/vitals/comprehensive', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: selectedPatientId,
          blood_pressure: vitalsData.blood_pressure,
          pulse_rate: parseInt(vitalsData.pulse_rate),
          respiratory_rate: parseInt(vitalsData.respiratory_rate),
          temperature: parseFloat(vitalsData.temperature),
          spo2: parseInt(vitalsData.spo2)
        })
      });
      if (res.ok) {
        setMsg('✅ Vitals recorded successfully.');
        setMsgType('success');
        setShowVitalsForm(false);
        await fetchPatientWorkspace(selectedPatientId);
      }
    } catch (err) {
      setMsg('❌ Error saving vitals.');
      setMsgType('error');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const filteredBeds = wardBeds.filter(bed => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        bed.name.toLowerCase().includes(q) ||
        bed.mrn.toLowerCase().includes(q) ||
        bed.bed.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans">
      <StaffDutyBriefingBanner />

      {/* 1. ULTRA-PREMIUM GRADIENT HEADER */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 p-8 rounded-3xl border border-emerald-600/50 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-3 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-300" /> Ward Nursing Station
            </span>
            <span className="bg-white/10 text-white font-extrabold text-[11px] px-3 py-1 rounded-full border border-white/20 backdrop-blur-xs flex items-center gap-1.5">
              <Clock size={12} className="text-emerald-200" /> Active Shift
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">eMAR & Patient Bed Monitor</h1>
            <p className="text-xs text-emerald-100 font-medium mt-1 max-w-xl">
              Real-time inpatient care tracking. Click on any active bed card below to administer doctor prescribed medications, log vital signs, and complete nursing protocols.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 w-full md:w-auto justify-end">
          <button 
            onClick={fetchNursePortalData}
            className="px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-900 font-black rounded-2xl text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-emerald-600" : "text-emerald-600"} /> 
            <span>Sync Ward Census</span>
          </button>
        </div>
      </div>

      {/* Notification Message */}
      {msg && (
        <div className={`p-4 rounded-2xl font-bold text-xs border shadow-md flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
          msgType === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : msgType === 'error' ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-blue-50 border-blue-300 text-blue-900'
        }`}>
          {msgType === 'success' ? <CheckCircle2 className="text-emerald-600 shrink-0" size={18} /> : <AlertCircle className="text-blue-600 shrink-0" size={18} />}
          <span>{msg}</span>
        </div>
      )}

      {/* 2. MODERN BEDS GRID SECTION */}
      <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <BedDouble size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Ward Bed Census Matrix</h2>
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Showing {filteredBeds.length} allocated and vacant beds in your assigned clinical unit.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search patient name, MRN or bed..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 bg-slate-50/70 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all focus:outline-none shadow-inner"
            />
          </div>
        </div>

        {/* Clean Modern Bed Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredBeds.map((bed, idx) => {
            const isEmpty = bed.is_empty || bed.name === "Vacant Bed" || bed.status === "Empty Bed";
            return (
              <div 
                key={idx}
                onClick={() => {
                  if (isEmpty) {
                    setMsg(`💡 ${bed.bed} is currently vacant and ready for new IPD admissions.`);
                    setMsgType('info');
                    setTimeout(() => setMsg(''), 3000);
                  } else {
                    handleOpenPatient(bed, idx);
                  }
                }}
                className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3.5 relative overflow-hidden group ${
                  isEmpty 
                    ? 'bg-slate-50/80 border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/50' 
                    : 'bg-white border-slate-200/90 hover:border-emerald-500 hover:shadow-xl hover:-translate-y-0.5 shadow-xs'
                }`}
              >
                {/* Status bar accent at top */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 transition-all ${isEmpty ? 'bg-slate-200' : 'bg-emerald-500 group-hover:bg-emerald-600'}`} />

                <div className="flex justify-between items-center pt-1">
                  <span className={`font-black text-xs px-3 py-1 rounded-xl border shadow-2xs ${
                    isEmpty ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-emerald-50 text-emerald-900 border-emerald-200 font-extrabold'
                  }`}>
                    {bed.bed}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {!isEmpty && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isEmpty ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isEmpty ? 'Vacant' : 'Admitted'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className={`font-black text-sm truncate ${isEmpty ? 'text-slate-400 font-bold' : 'text-slate-900 group-hover:text-emerald-700 transition-colors'}`}>
                    {bed.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">{isEmpty ? 'No Patient Assigned' : `${bed.mrn} • ${bed.age}`}</p>
                  <div className={`text-[11px] font-bold p-2 rounded-xl mt-2 truncate ${isEmpty ? 'bg-slate-100/60 text-slate-400 italic' : 'bg-slate-50 text-slate-800 border border-slate-100'}`}>
                    {isEmpty ? 'Ready for occupancy' : `Dx: ${bed.dx}`}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
                  <span className={`text-[11px] ${isEmpty ? 'text-slate-400' : 'text-emerald-700 font-extrabold flex items-center gap-1'}`}>
                    {isEmpty ? 'Vacant Bed' : <>💊 {bed.meds || 'Active Orders'}</>}
                  </span>
                  <span className={`flex items-center text-[11px] font-black transition-transform group-hover:translate-x-1 ${isEmpty ? 'text-slate-400' : 'text-emerald-600'}`}>
                    {isEmpty ? 'Status' : 'Open eMAR'} <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. PREMIUM EHR PATIENT WORKSPACE MODAL */}
      {/* ==================================================================== */}
      {selectedPatientId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
            
            {/* Sleek Dark Header */}
            <div className="bg-slate-900 p-6 text-white flex justify-between items-start sm:items-center gap-4 shrink-0 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-emerald-600/20 to-transparent pointer-events-none"></div>
              
              <div className="space-y-1.5 z-10">
                <div className="flex items-center gap-2.5">
                  <span className="bg-emerald-500 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1.5">
                    <BedDouble size={14} /> {selectedBedInfo?.bed || `Bed ${selectedPatientId}`}
                  </span>
                  <span className="bg-slate-800 text-emerald-300 border border-slate-700 px-2.5 py-0.5 rounded-lg text-xs font-black">
                    {selectedBedInfo?.mrn}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">{selectedBedInfo?.name}</h2>
                <p className="text-xs text-slate-300 font-medium">Primary Diagnosis: <strong className="text-emerald-300 font-bold">{selectedBedInfo?.dx}</strong></p>
              </div>

              <button 
                onClick={() => setSelectedPatientId(null)} 
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-2xl transition-all cursor-pointer z-10"
              >
                <X size={24} />
              </button>
            </div>

            {/* Documented Allergy Alert banner */}
            {emarData?.patient_header?.allergies?.length > 0 && (
              <div className="bg-rose-50 text-rose-950 px-6 py-3 flex items-center gap-2.5 text-xs font-black shrink-0 border-b border-rose-200">
                <ShieldAlert size={18} className="text-rose-600 shrink-0 animate-bounce" />
                <span className="uppercase tracking-wider text-rose-700">Critical Allergies:</span>
                <div className="flex flex-wrap gap-1.5">
                  {emarData.patient_header.allergies.map((a, i) => (
                    <span key={i} className="bg-rose-200/80 text-rose-950 px-2.5 py-0.5 rounded-lg text-[11px] font-black border border-rose-300 shadow-2xs">
                      {a.allergen} ({a.reaction})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modern Tab Navigation */}
            <div className="bg-slate-100/80 border-b border-slate-200 px-6 pt-3 flex gap-2 shrink-0 text-xs font-extrabold overflow-x-auto">
              <button 
                onClick={() => setActiveTab('care_plan')}
                className={`px-5 py-3 rounded-t-2xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'care_plan' ? 'bg-white text-emerald-900 font-black border-t-2 border-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <FileCheck size={16} className={activeTab === 'care_plan' ? 'text-emerald-600' : 'text-slate-400'} /> 
                <span>Today's eMAR & Nursing Care</span>
              </button>
              <button 
                onClick={() => setActiveTab('emar')}
                className={`px-5 py-3 rounded-t-2xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'emar' ? 'bg-white text-emerald-900 font-black border-t-2 border-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Pill size={16} className={activeTab === 'emar' ? 'text-emerald-600' : 'text-slate-400'} /> 
                <span>All Prescriptions ({emarData?.medication_orders?.length || 0})</span>
              </button>
              <button 
                onClick={() => setActiveTab('vitals')}
                className={`px-5 py-3 rounded-t-2xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'vitals' ? 'bg-white text-emerald-900 font-black border-t-2 border-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <HeartPulse size={16} className={activeTab === 'vitals' ? 'text-emerald-600' : 'text-slate-400'} /> 
                <span>Vital Signs Log ({vitalsHistory.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            {loadingEmar ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-xs font-bold gap-3 bg-slate-50/50">
                <RefreshCw className="animate-spin text-emerald-600 w-8 h-8" />
                <span>Loading electronic medication & care records...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/60 space-y-6">

                {/* TAB 1: TODAY'S CARE & MEDICATIONS */}
                {activeTab === 'care_plan' && (
                  <div className="space-y-6">

                    {/* Medications Section */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                          <Pill size={18} className="text-emerald-600" /> Scheduled Medications (eMAR)
                        </h4>
                        <span className="text-[11px] font-bold text-slate-500">Five Rights Verification Required</span>
                      </div>

                      <div className="space-y-3">
                        {(!emarData?.medication_orders || emarData.medication_orders.length === 0) ? (
                          <p className="text-xs text-slate-400 italic py-4 text-center">No active medication orders scheduled for this patient.</p>
                        ) : (
                          emarData.medication_orders.map((ord, idx) => {
                            const hasStock = ord.in_stock !== false;
                            return (
                              <div key={idx} className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-all">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black text-slate-900 text-sm">{ord.medication_name}</span>
                                    <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-md">
                                      {ord.prescribed_dose}
                                    </span>
                                    {/* Inventory Stock Indicator */}
                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                                      hasStock ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'
                                    }`}>
                                      {hasStock ? '🟢 In Ward Stock' : '🔴 Out of Stock in Ward'}
                                    </span>
                                  </div>
                                  
                                  <p className="text-xs text-slate-600 font-semibold">
                                    Route: <strong className="text-slate-800">{ord.route}</strong> • Frequency: <strong className="text-slate-800">{ord.frequency}</strong>
                                  </p>

                                  {/* Doctor Precautions & Instructions */}
                                  <p className="text-[11px] text-amber-700 font-bold bg-amber-50/90 border border-amber-200 px-2.5 py-1 rounded-lg w-fit mt-1">
                                    ⚠️ Doctor's Instructions: {ord.special_instructions || "Monitor vitals before administration."}
                                  </p>

                                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                    Prescribed by: <strong className="text-slate-600">{ord.prescribing_doctor || 'Attending Consultant'}</strong>
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {hasStock ? (
                                    <button 
                                      onClick={() => handleQuickAdminister(ord.order_id, ord.schedules?.[0]?.schedule_id)}
                                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs transition-all shadow-sm hover:shadow-md active:scale-95 cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                                    >
                                      <CheckCircle2 size={16} /> Administer Dose
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={async () => {
                                        try {
                                          const res = await fetchWithAuth('/nurse/request-pharmacy-stock', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              order_id: ord.order_id,
                                              medication_name: ord.medication_name,
                                              patient_id: selectedPatient.patient_id
                                            })
                                          });
                                          if (res.ok) {
                                            toast.success(`Stock Request for ${ord.medication_name} sent to Pharmacy & TMO!`);
                                          }
                                        } catch (e) {
                                          toast.error('Network error requesting stock');
                                        }
                                      }}
                                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                                    >
                                      ⚠️ Request Stock (Pharmacy & TMO)
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Nursing Checklist Section */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                          <FileCheck size={18} className="text-teal-600" /> Nursing Care Checklist & Protocols
                        </h4>
                        <span className="text-[11px] font-bold text-slate-500">Click task to toggle status</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {checklistData.map((task) => (
                          <div 
                            key={task.id} 
                            onClick={() => handleToggleChecklist(task.id, task.is_completed)}
                            className={`p-4 rounded-2xl border flex justify-between items-center cursor-pointer transition-all duration-150 ${
                              task.is_completed ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs' : 'bg-slate-50/80 border-slate-200 hover:border-emerald-400 hover:bg-white text-slate-800'
                            }`}
                          >
                            <span className="font-extrabold text-xs">{task.task_name}</span>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-wider shrink-0 ml-2 ${
                              task.is_completed ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {task.is_completed ? '✓ Done' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 2: ALL PRESCRIPTIONS */}
                {activeTab === 'emar' && (
                  <div className="space-y-4">
                    {(!emarData?.medication_orders || emarData.medication_orders.length === 0) ? (
                      <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                        No prescription records found for this patient.
                      </div>
                    ) : (
                      emarData.medication_orders.map((ord, idx) => (
                        <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-2 hover:border-emerald-300 transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-black text-slate-900 text-base block">{ord.medication_name}</span>
                              <span className="text-xs text-slate-400 font-bold">Generic: {ord.generic_name || 'Standard'}</span>
                            </div>
                            <span className="bg-emerald-100 text-emerald-800 font-black text-xs px-3 py-1 rounded-xl border border-emerald-200">
                              {ord.status || 'Active'}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-slate-400 block text-[10px] font-bold uppercase">Dosage</span>
                              <strong className="text-slate-800">{ord.prescribed_dose}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] font-bold uppercase">Route</span>
                              <strong className="text-slate-800">{ord.route}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] font-bold uppercase">Frequency</span>
                              <strong className="text-slate-800">{ord.frequency}</strong>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold pt-1">
                            Prescribing Doctor: <strong className="text-slate-700">{ord.prescribing_doctor || 'Attending Physician'}</strong>
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 3: VITALS HISTORY */}
                {activeTab === 'vitals' && (
                  <div className="space-y-5">
                    <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
                      <div>
                        <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                          <HeartPulse className="text-rose-600" size={20} /> Recorded Vital Signs
                        </h4>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Regular monitoring of BP, Heart Rate, SpO2, and Temperature.</p>
                      </div>
                      <button 
                        onClick={() => setShowVitalsForm(!showVitalsForm)} 
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <span>+ Record New Vitals</span>
                      </button>
                    </div>

                    {showVitalsForm && (
                      <form onSubmit={handleSaveVitals} className="bg-white p-6 rounded-3xl border-2 border-emerald-500 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                        <h5 className="font-black text-slate-900 text-sm border-b pb-2 flex items-center gap-2">
                          🩺 Enter Current Vital Signs
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                          <div>
                            <label className="block font-black text-slate-700 mb-1">BP (mmHg)</label>
                            <input type="text" value={vitalsData.blood_pressure} onChange={e=>setVitalsData(p=>({...p, blood_pressure: e.target.value}))} className="w-full border border-slate-300 p-2.5 rounded-xl font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="120/80" />
                          </div>
                          <div>
                            <label className="block font-black text-slate-700 mb-1">Pulse (bpm)</label>
                            <input type="number" value={vitalsData.pulse_rate} onChange={e=>setVitalsData(p=>({...p, pulse_rate: e.target.value}))} className="w-full border border-slate-300 p-2.5 rounded-xl font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="75" />
                          </div>
                          <div>
                            <label className="block font-black text-slate-700 mb-1">Resp Rate</label>
                            <input type="number" value={vitalsData.respiratory_rate} onChange={e=>setVitalsData(p=>({...p, respiratory_rate: e.target.value}))} className="w-full border border-slate-300 p-2.5 rounded-xl font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="18" />
                          </div>
                          <div>
                            <label className="block font-black text-slate-700 mb-1">Temp (°C)</label>
                            <input type="number" step="0.1" value={vitalsData.temperature} onChange={e=>setVitalsData(p=>({...p, temperature: e.target.value}))} className="w-full border border-slate-300 p-2.5 rounded-xl font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="37.0" />
                          </div>
                          <div>
                            <label className="block font-black text-slate-700 mb-1">SpO2 (%)</label>
                            <input type="number" value={vitalsData.spo2} onChange={e=>setVitalsData(p=>({...p, spo2: e.target.value}))} className="w-full border border-slate-300 p-2.5 rounded-xl font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="98" />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowVitalsForm(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer">Cancel</button>
                          <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md cursor-pointer">Save & Log Vitals</button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-3">
                      {vitalsHistory.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 font-medium text-xs">
                          No vitals recorded for this patient yet. Click above to log the first reading.
                        </div>
                      ) : (
                        vitalsHistory.map((v, idx) => (
                          <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-black shrink-0">
                                <HeartPulse size={20} />
                              </div>
                              <div>
                                <div className="font-black text-slate-900 text-sm">
                                  BP: {v.blood_pressure} • Heart Rate: {v.pulse_rate} bpm
                                </div>
                                <div className="text-slate-500 font-semibold mt-0.5">
                                  Temp: <strong className="text-slate-700">{v.temperature}°C</strong> • SpO2: <strong className="text-emerald-700">{v.spo2}%</strong> • Resp: {v.respiratory_rate}/min
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shrink-0">
                              {v.recorded_at}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Clean Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedPatientId(null)} 
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs transition-all shadow-sm cursor-pointer"
              >
                Close Workspace
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

