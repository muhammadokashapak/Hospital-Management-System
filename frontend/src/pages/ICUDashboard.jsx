import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { 
  HeartPulse, RefreshCw, BedDouble, Activity, AlertTriangle,
  Thermometer, Wind, Monitor, Users, TrendingUp, X, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import StaffDutyBriefingBanner from '../components/StaffDutyBriefingBanner';

export default function ICUDashboard() {
  const [icuPatients, setIcuPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [allBeds, setAllBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('patients'); // 'patients', 'beds'

  const fetchData = useCallback(async () => {
    try {
      const [patientsRes, statsRes, bedsRes] = await Promise.all([
        fetchWithAuth('/icu/'),
        fetchWithAuth('/icu/stats'),
        fetchWithAuth('/admissions/all-beds')
      ]);
      if (patientsRes.ok) setIcuPatients(await patientsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (bedsRes.ok) {
        const beds = await bedsRes.json();
        setAllBeds(beds.filter(b => b.ward_type === 'ICU'));
      }
    } catch (err) {
      console.error('Error fetching ICU data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const occupiedBeds = allBeds.filter(b => b.is_occupied);
  const freeBeds = allBeds.filter(b => !b.is_occupied);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <StaffDutyBriefingBanner />
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <HeartPulse className="text-red-600" size={28} /> ICU Dashboard
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Intensive Care Unit — Critical patient monitoring & bed management</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><BedDouble size={12} /> Total ICU Beds</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.total_icu_beds}</p>
          </div>
          <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1"><Users size={12} /> Active Patients</p>
            <p className="text-3xl font-black text-red-600 mt-1">{stats.active_patients}</p>
          </div>
          <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1"><Wind size={12} /> On Ventilator</p>
            <p className="text-3xl font-black text-blue-600 mt-1">{stats.ventilator_usage}</p>
          </div>
          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1"><TrendingUp size={12} /> Occupancy</p>
            <p className="text-3xl font-black text-amber-600 mt-1">{stats.occupancy_percent}%</p>
          </div>
        </div>
      )}

      {/* Occupancy Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-slate-900">ICU Bed Occupancy</h3>
          <span className="text-xs font-bold text-slate-500">{occupiedBeds.length} / {allBeds.length} beds occupied</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              (stats?.occupancy_percent || 0) > 80 ? 'bg-red-500' : 
              (stats?.occupancy_percent || 0) > 50 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${stats?.occupancy_percent || 0}%` }}
          />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'patients', label: 'ICU Patients', icon: <Activity size={14} /> },
          { key: 'beds', label: 'Bed Grid', icon: <BedDouble size={14} /> }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ICU Patients List */}
      {activeTab === 'patients' && (
        <div className="space-y-3">
          {icuPatients.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <HeartPulse className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-lg font-black text-slate-900">No Active ICU Patients</h3>
              <p className="text-sm text-slate-500 mt-1">ICU admissions will appear here when patients are transferred from Emergency or OPD.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {icuPatients.map(p => (
                <div key={p.id} className="bg-white border-2 border-red-200 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                      ICU-{p.id}
                    </span>
                    {p.ventilator_required && (
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                        <Wind size={12} /> Ventilator
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1">Admission #{p.admission_id}</h3>
                  <p className="text-xs text-slate-600 font-medium mb-2">{p.reason || 'Critical care monitoring'}</p>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Monitor size={10} /> Bed: {p.bed_number || 'Assigned'}</span>
                    <span className="flex items-center gap-1"><Activity size={10} /> {p.status || 'Active'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ICU Bed Grid */}
      {activeTab === 'beds' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {allBeds.map(bed => (
            <div key={bed.id} className={`rounded-2xl p-4 text-center border-2 transition-all ${
              bed.is_occupied 
                ? 'bg-red-50 border-red-300 shadow-md' 
                : 'bg-emerald-50 border-emerald-300 shadow-sm hover:shadow-md'
            }`}>
              <BedDouble size={24} className={`mx-auto mb-2 ${bed.is_occupied ? 'text-red-500' : 'text-emerald-500'}`} />
              <p className="text-xs font-black text-slate-900">{bed.bed_number}</p>
              <p className="text-[10px] font-bold text-slate-500 mt-0.5">{bed.ward_name}</p>
              {bed.is_occupied && bed.patient_name && (
                <p className="text-[10px] font-bold text-red-600 mt-1 truncate">{bed.patient_name}</p>
              )}
              <span className={`inline-block mt-2 text-[9px] font-black px-2 py-0.5 rounded-full ${
                bed.is_occupied ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {bed.is_occupied ? 'OCCUPIED' : 'AVAILABLE'}
              </span>
            </div>
          ))}
          {allBeds.length === 0 && (
            <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <BedDouble className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-lg font-black text-slate-900">No ICU Beds Configured</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
