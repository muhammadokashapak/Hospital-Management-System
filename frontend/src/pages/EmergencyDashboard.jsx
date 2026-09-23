import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { 
  Siren, RefreshCw, UserPlus, AlertTriangle, Clock, CheckCircle2, 
  Activity, Thermometer, Heart, X, ArrowRight, Skull, Shield,
  Ambulance, TrendingUp, User, Building2
} from 'lucide-react';
import StaffDutyBriefingBanner from '../components/StaffDutyBriefingBanner';

const TRIAGE_CONFIG = {
  Red: { label: 'Red — Immediate (Life Threatening)', color: 'bg-red-600 text-white', border: 'border-red-500', badge: 'bg-red-100 text-red-700 border-red-300', icon: <Skull size={14} /> },
  Yellow: { label: 'Yellow — Urgent', color: 'bg-amber-500 text-white', border: 'border-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-300', icon: <AlertTriangle size={14} /> },
  Green: { label: 'Green — Non-Urgent', color: 'bg-emerald-500 text-white', border: 'border-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: <Shield size={14} /> },
  Black: { label: 'Black — Deceased', color: 'bg-slate-800 text-white', border: 'border-slate-700', badge: 'bg-slate-200 text-slate-700 border-slate-400', icon: <X size={14} /> },
};

export default function EmergencyDashboard() {
  const [cases, setCases] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'register'
  const [selectedCase, setSelectedCase] = useState(null);

  // Registration form
  const [form, setForm] = useState({
    patient_id: '',
    chief_complaint: '',
    triage_category: 'Yellow',
    arrival_mode: 'Walk-in',
    notes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const [casesRes, statsRes, patientsRes] = await Promise.all([
        fetchWithAuth('/emergency/'),
        fetchWithAuth('/emergency/stats'),
        fetchWithAuth('/patients/')
      ]);
      if (casesRes.ok) setCases(await casesRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (patientsRes.ok) setPatients(await patientsRes.json());
    } catch (err) {
      console.error('Error fetching ER data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRegisterCase = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.chief_complaint) {
      toast.error('Please select a patient and enter chief complaint');
      return;
    }
    try {
      const res = await fetchWithAuth('/emergency/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: parseInt(form.patient_id),
          chief_complaint: form.chief_complaint,
          triage_category: form.triage_category,
          arrival_mode: form.arrival_mode,
          notes: form.notes || null
        })
      });
      if (res.ok) {
        toast.success('Emergency case registered successfully! Patient is now active on ER Triage Board.');
        setForm({ patient_id: '', chief_complaint: '', triage_category: 'Yellow', arrival_mode: 'Walk-in', notes: '' });
        setActiveTab('active');
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to register case');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleUpdateStatus = async (caseId, newStatus) => {
    try {
      const res = await fetchWithAuth(`/emergency/${caseId}/update?status=${newStatus}`, { method: 'PUT' });
      if (res.ok) {
        if (newStatus === 'Admitted') {
          toast.success('Case status updated to Admitted! Patient automatically transferred to Ward Admissions Dashboard.');
        } else {
          toast.success(`Case status updated to ${newStatus}`);
        }
        setSelectedCase(null);
        fetchData();
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  // Sort: Red first, then Yellow, then Green
  const triageOrder = { Red: 0, Yellow: 1, Green: 2, Black: 3 };
  const sortedCases = [...cases].sort((a, b) => (triageOrder[a.triage_category] || 99) - (triageOrder[b.triage_category] || 99));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <StaffDutyBriefingBanner />
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Siren className="text-red-600" size={28} /> Emergency Department
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Real-time triage board & emergency patient disposition tracking</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Cases</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.total_today}</p>
          </div>
          <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1"><Skull size={12} /> Red (Critical)</p>
            <p className="text-3xl font-black text-red-600 mt-1">{stats.red}</p>
          </div>
          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={12} /> Yellow (Urgent)</p>
            <p className="text-3xl font-black text-amber-600 mt-1">{stats.yellow}</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1"><Shield size={12} /> Green</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{stats.green}</p>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'active', label: `Active Triage Board (${sortedCases.length})`, icon: <Activity size={14} /> },
          { key: 'register', label: 'Register New ER Case', icon: <UserPlus size={14} /> }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Active Cases Board */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {sortedCases.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <Siren className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-lg font-black text-slate-900">No Active Emergency Cases</h3>
              <p className="text-sm text-slate-500 mt-1">Click "Register New ER Case" to add walk-in or ambulance arrivals.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedCases.map(c => {
                const triage = TRIAGE_CONFIG[c.triage_category] || TRIAGE_CONFIG.Green;
                return (
                  <div key={c.id} className={`bg-white border-2 ${triage.border} rounded-2xl p-5 shadow-md hover:shadow-lg transition-all cursor-pointer`}
                    onClick={() => setSelectedCase(c)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-black px-3 py-1 rounded-full border ${triage.badge} flex items-center gap-1`}>
                        {triage.icon} {c.triage_category}
                      </span>
                      <span className="text-[10px] font-black text-slate-400">ER-{c.id}</span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mb-0.5">
                      {c.patient_name || `Patient #${c.patient_id}`}
                    </h3>
                    <p className="text-[11px] font-bold text-slate-500 mb-3">
                      {c.patient_gender || 'N/A'} • {c.patient_age ? `${c.patient_age} yrs` : 'Age N/A'}
                    </p>

                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl mb-3">
                      <p className="text-xs text-slate-700 font-bold line-clamp-2">
                        Complaint: <span className="text-slate-900 font-normal">{c.chief_complaint || 'No complaint recorded'}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-black text-slate-600 flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Clock size={12} className="text-blue-600" /> {c.status?.replace('_', ' ') || 'Triaged'}
                      </span>
                      <span className="text-[11px] font-extrabold text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        <Ambulance size={12} /> {c.arrival_mode || 'Walk-in'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Registration Form & Explanatory Guide */}
      {activeTab === 'register' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleRegisterCase} className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <UserPlus className="text-red-600" size={20} /> Register Emergency Case
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Select Patient *</label>
                <select value={form.patient_id} onChange={e => setForm({...form, patient_id: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500">
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.id} - {p.full_name} ({p.gender}, {p.age} yrs)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Triage Priority Category *</label>
                <select value={form.triage_category} onChange={e => setForm({...form, triage_category: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500">
                  <option value="Red">🔴 Red — Immediate (Life-Threatening)</option>
                  <option value="Yellow">🟡 Yellow — Urgent Care</option>
                  <option value="Green">🟢 Green — Non-Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Chief Complaint *</label>
              <input type="text" value={form.chief_complaint} onChange={e => setForm({...form, chief_complaint: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="e.g., Severe chest pain, Road traffic accident, Breathing difficulty" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Arrival Mode</label>
                <select value={form.arrival_mode} onChange={e => setForm({...form, arrival_mode: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500">
                  <option value="Walk-in">🚶 Walk-in</option>
                  <option value="Ambulance">🚑 Ambulance</option>
                  <option value="Police">🚔 Police</option>
                  <option value="Referral">📋 Hospital Referral</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">Additional Triage Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="e.g., BP 140/90, Oxygen saturation 92%" />
              </div>
            </div>

            <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-black text-sm hover:bg-red-700 transition-all shadow-md flex items-center justify-center gap-2">
              <Siren size={16} /> Register Emergency Case
            </button>
          </form>

          {/* Workflow Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-black text-blue-900 flex items-center gap-2">
              <Activity className="text-blue-600" size={18} /> Emergency Workflow Guide
            </h4>
            <div className="space-y-3 text-xs text-blue-900 font-medium">
              <div className="p-3 bg-white rounded-xl border border-blue-100">
                <p className="font-black text-blue-700 mb-1">1. Registration & Triage</p>
                <p className="text-slate-600">When an emergency patient arrives, register them with a Triage Category (Red, Yellow, Green).</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-blue-100">
                <p className="font-black text-blue-700 mb-1">2. Live Triage Board</p>
                <p className="text-slate-600">The patient immediately appears on the Active ER Triage Board sorted by urgency priority.</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-blue-100">
                <p className="font-black text-blue-700 mb-1">3. Disposition & Transfer</p>
                <p className="text-slate-600">When ER staff updates status to <strong>"Admit to Ward"</strong>, the patient is automatically transferred to Ward Admissions (`/admissions`) for bed allocation!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCase(null)}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Emergency Case ER-{selectedCase.id}</h3>
              <button onClick={() => setSelectedCase(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500 font-bold">Patient Name:</span> <span className="font-black text-slate-900">{selectedCase.patient_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-bold">Age & Gender:</span> <span className="font-bold text-slate-700">{selectedCase.patient_gender} • {selectedCase.patient_age} yrs</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-bold">Triage Category:</span> 
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${(TRIAGE_CONFIG[selectedCase.triage_category] || TRIAGE_CONFIG.Green).badge}`}>
                  {selectedCase.triage_category}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-slate-500 font-bold">Current Status:</span> <span className="font-black text-slate-900">{selectedCase.status?.replace('_', ' ') || 'Triaged'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 font-bold">Chief Complaint:</span> <span className="font-bold text-slate-800 text-right max-w-[60%]">{selectedCase.chief_complaint}</span></div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-2">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Update Patient Disposition</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleUpdateStatus(selectedCase.id, 'Under_Treatment')} className="bg-blue-600 text-white py-2.5 rounded-xl text-xs font-black hover:bg-blue-700 transition-all">Under Treatment</button>
                <button onClick={() => handleUpdateStatus(selectedCase.id, 'Admitted')} className="bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-1">
                  <Building2 size={12} /> Admit to Ward
                </button>
                <button onClick={() => handleUpdateStatus(selectedCase.id, 'Discharged')} className="bg-slate-600 text-white py-2.5 rounded-xl text-xs font-black hover:bg-slate-700 transition-all">Discharge Patient</button>
                <button onClick={() => handleUpdateStatus(selectedCase.id, 'Referred')} className="bg-amber-600 text-white py-2.5 rounded-xl text-xs font-black hover:bg-amber-700 transition-all">Refer Out</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
