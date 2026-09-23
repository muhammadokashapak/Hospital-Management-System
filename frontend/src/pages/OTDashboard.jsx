import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { 
  Scissors, RefreshCw, Clock, CheckCircle2, Play, 
  Pause, FileText, Calendar, Activity, TrendingUp, X, User
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OTDashboard() {
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'schedule'

  // Schedule form
  const [form, setForm] = useState({
    patient_id: '',
    surgeon_id: '',
    procedure_name: '',
    scheduled_datetime: '',
    ot_room: 'OT-1',
    notes: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const [schedRes, statsRes] = await Promise.all([
        fetchWithAuth('/ot/schedule'),
        fetchWithAuth('/ot/stats')
      ]);
      if (schedRes.ok) setSchedules(await schedRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error('Error fetching OT data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStartSurgery = async (id) => {
    try {
      const res = await fetchWithAuth(`/ot/${id}/start`, { method: 'PUT' });
      if (res.ok) {
        toast.success('Surgery started');
        fetchData();
      } else {
        toast.error('Failed to start surgery');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleCompleteSurgery = async (id) => {
    const notes = prompt('Enter post-op notes:');
    if (notes === null) return;
    try {
      const res = await fetchWithAuth(`/ot/${id}/complete?notes=${encodeURIComponent(notes || 'Completed successfully')}`, { method: 'PUT' });
      if (res.ok) {
        toast.success('Surgery completed');
        fetchData();
      } else {
        toast.error('Failed to complete surgery');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleScheduleSurgery = async (e) => {
    e.preventDefault();
    if (!form.patient_id || !form.procedure_name || !form.scheduled_datetime) {
      toast.error('Patient ID, Procedure, and Date/Time are required');
      return;
    }
    try {
      const res = await fetchWithAuth('/ot/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: parseInt(form.patient_id),
          surgeon_id: form.surgeon_id ? parseInt(form.surgeon_id) : null,
          procedure_name: form.procedure_name,
          scheduled_datetime: form.scheduled_datetime,
          ot_room: form.ot_room,
          notes: form.notes || null
        })
      });
      if (res.ok) {
        toast.success('Surgery scheduled successfully');
        setForm({ patient_id: '', surgeon_id: '', procedure_name: '', scheduled_datetime: '', ot_room: 'OT-1', notes: '' });
        setActiveTab('today');
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to schedule surgery');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const STATUS_STYLES = {
    Scheduled: { bg: 'bg-blue-100 text-blue-700 border-blue-300', icon: <Clock size={12} /> },
    In_Progress: { bg: 'bg-amber-100 text-amber-700 border-amber-300', icon: <Activity size={12} /> },
    Completed: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: <CheckCircle2 size={12} /> },
    Cancelled: { bg: 'bg-red-100 text-red-700 border-red-300', icon: <X size={12} /> },
    Postponed: { bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: <Pause size={12} /> }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Scissors className="text-blue-600" size={28} /> Operation Theatre
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Surgery scheduling, live tracking & post-op notes</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Calendar size={12} /> Today's Surgeries</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.total_today}</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={12} /> Completed</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{stats.completed}</p>
          </div>
          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> Pending/In Progress</p>
            <p className="text-3xl font-black text-amber-600 mt-1">{stats.pending}</p>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'today', label: 'Surgery Board', icon: <Activity size={14} /> },
          { key: 'schedule', label: 'Schedule New Surgery', icon: <Calendar size={14} /> }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Surgery Board */}
      {activeTab === 'today' && (
        <div className="space-y-3">
          {schedules.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <Scissors className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-lg font-black text-slate-900">No Surgeries Scheduled</h3>
              <p className="text-sm text-slate-500 mt-1">Schedule a new surgery using the form tab above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedules.map(surg => {
                const st = STATUS_STYLES[surg.status] || STATUS_STYLES.Scheduled;
                return (
                  <div key={surg.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-black px-3 py-1 rounded-full border flex items-center gap-1 ${st.bg}`}>
                        {st.icon} {surg.status?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">OT-{surg.id}</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mb-1">{surg.procedure_name || 'Surgical Procedure'}</h3>
                    <p className="text-xs text-slate-600 font-medium mb-1 flex items-center gap-1">
                      <User size={10} /> {surg.patient_name || `Patient #${surg.patient_id}`}
                    </p>
                    <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                      <Clock size={10} /> {surg.scheduled_datetime ? new Date(surg.scheduled_datetime).toLocaleString() : 'TBD'}
                    </p>
                    {surg.ot_room && (
                      <p className="text-xs text-blue-600 font-bold mb-3">Room: {surg.ot_room}</p>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      {surg.status === 'Scheduled' && (
                        <button onClick={() => handleStartSurgery(surg.id)} className="flex-1 bg-amber-500 text-white py-2 rounded-xl text-xs font-black hover:bg-amber-600 transition-all flex items-center justify-center gap-1">
                          <Play size={12} /> Start Surgery
                        </button>
                      )}
                      {surg.status === 'In_Progress' && (
                        <button onClick={() => handleCompleteSurgery(surg.id)} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-1">
                          <CheckCircle2 size={12} /> Complete Surgery
                        </button>
                      )}
                      {(surg.status === 'Completed' || surg.status === 'Cancelled') && (
                        <span className="flex-1 text-center text-xs font-bold text-slate-400 py-2">No actions available</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Schedule New Surgery */}
      {activeTab === 'schedule' && (
        <form onSubmit={handleScheduleSurgery} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} /> Schedule New Surgery
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Patient ID *</label>
              <input type="number" value={form.patient_id} onChange={e => setForm({...form, patient_id: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Patient ID" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Surgeon ID</label>
              <input type="number" value={form.surgeon_id} onChange={e => setForm({...form, surgeon_id: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Surgeon User ID (optional)" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Procedure Name *</label>
            <input type="text" value={form.procedure_name} onChange={e => setForm({...form, procedure_name: e.target.value})}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="e.g., Appendectomy, Cholecystectomy" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Date & Time *</label>
              <input type="datetime-local" value={form.scheduled_datetime} onChange={e => setForm({...form, scheduled_datetime: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">OT Room</label>
              <select value={form.ot_room} onChange={e => setForm({...form, ot_room: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500">
                <option value="OT-1">OT Room 1</option>
                <option value="OT-2">OT Room 2</option>
                <option value="OT-3">OT Room 3</option>
                <option value="OT-4">OT Room 4 (Minor)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Pre-Op Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 resize-none" placeholder="Pre-operative notes..." />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-sm hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2">
            <Scissors size={16} /> Schedule Surgery
          </button>
        </form>
      )}
    </div>
  );
}
