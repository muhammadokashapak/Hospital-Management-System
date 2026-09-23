import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { Users, Calendar, Clock, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';

export default function TMOHoManagement() {
  const [profile, setProfile] = useState(null);
  const [hos, setHos] = useState([]);
  const [roster, setRoster] = useState({ today: [], tomorrow: [] });
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState(90);
  const [rosterMsg, setRosterMsg] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchProfile = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth('/profile/', { signal });
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  }, []);

  const fetchGroupHOs = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth('/tasks/group_hos', { signal });
      const data = await res.json();
      setHos(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
      setHos([]);
    }
  }, []);

  const fetchRoster = useCallback(async (groupId, signal) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrow = tomorrowDate.toISOString().split('T')[0];
      
      const res = await fetchWithAuth(`/scheduler/shifts?start_date=${today}&end_date=${tomorrow}&group_id=${groupId}`, { signal });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        const todayShifts = data.filter(s => s.date === today);
        const tomorrowShifts = data.filter(s => s.date === tomorrow);
        setRoster({ today: todayShifts, tomorrow: tomorrowShifts });
      } else {
        setRoster({ today: [], tomorrow: [] });
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
      setRoster({ today: [], tomorrow: [] });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);
    fetchGroupHOs(controller.signal);
    return () => controller.abort();
  }, [fetchProfile, fetchGroupHOs]);

  useEffect(() => {
    if (profile?.rotation_group_id) {
      const controller = new AbortController();
      fetchRoster(profile.rotation_group_id, controller.signal);
      return () => controller.abort();
    }
  }, [profile?.rotation_group_id, fetchRoster]);

  const handleGenerateShifts = async (e) => {
    e.preventDefault();
    if (!profile?.rotation_group_id) {
      setRosterMsg('❌ Error: You are not assigned to any rotation group batch.');
      return;
    }
    setGenerating(true);
    setRosterMsg('');
    try {
      const res = await fetchWithAuth(`/scheduler/generate_shifts?rotation_group_id=${profile.rotation_group_id}&start_date=${startDate}&days=${days}`, {
        method: 'POST'
      });
      if (res.ok) {
        setRosterMsg('✅ Successfully generated and published shift roster!');
        fetchRoster(profile.rotation_group_id);
      } else {
        const errData = await res.json();
        setRosterMsg(`❌ ${errData.detail || 'Failed to generate schedule.'}`);
      }
    } catch (err) {
      setRosterMsg('❌ Server connection error.');
    }
    setGenerating(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Users className="text-indigo-600" size={32} />
              HO Directory & Duty Roster Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">Dedicated portal for House Officers directory, duty schedules, and batch rotation planning.</p>
          </div>
          {profile?.rotation_group_name && (
            <span className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-sm rounded-xl">
              Category: {profile.rotation_group_name}
            </span>
          )}
        </div>

        {/* Live Roster Cards */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={22} />
            Live Duty Roster (Today & Tomorrow)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 pb-2 border-b border-slate-200 flex justify-between">
                <span>Today's On-Duty Team</span>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs">{roster.today.length} HOs</span>
              </h3>
              {roster.today.length === 0 ? <p className="text-sm text-slate-500">No shifts assigned today.</p> : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {roster.today.map(s => (
                    <div key={s.id} className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-xl shadow-2xs">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{s.ho_name}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                        s.type === 'Night' ? 'bg-indigo-900 text-white' : 
                        s.type === 'Evening' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 
                        'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {s.type} Shift
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 pb-2 border-b border-slate-200 flex justify-between">
                <span>Tomorrow's On-Duty Team</span>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-xs">{roster.tomorrow.length} HOs</span>
              </h3>
              {roster.tomorrow.length === 0 ? <p className="text-sm text-slate-500">No shifts assigned tomorrow.</p> : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {roster.tomorrow.map(s => (
                    <div key={s.id} className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-xl shadow-2xs">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{s.ho_name}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-lg ${
                        s.type === 'Night' ? 'bg-indigo-900 text-white' : 
                        s.type === 'Evening' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 
                        'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {s.type} Shift
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Track HO Directory Grid */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Track House Officers Directory ({hos.length})</h2>
              <p className="text-xs text-slate-500 mt-0.5">Registered House Officers in {profile?.rotation_group_name || 'your batch'}</p>
            </div>
          </div>

          {hos.length === 0 ? (
            <p className="text-sm text-slate-500">No House Officers found in your track.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {hos.map(h => (
                <div key={h.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-md transition-all">
                  <p className="text-base font-extrabold text-slate-800">{h.full_name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{h.email}</p>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200">
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">{h.gender}</span>
                    <span className="text-xs text-slate-500 font-semibold">Batch {h.batch_year}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Batch Roster Generator Control */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={22} />
            Generate Batch Roster
          </h2>
          <p className="text-xs text-slate-500 mb-4">Run the Automated Roster Generator to assign fair 90-day/180-day duties for your HO batch.</p>
          
          <form onSubmit={handleGenerateShifts} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Start Date</label>
              <input 
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Rotation Duration</label>
              <select 
                value={days}
                onChange={e => setDays(parseInt(e.target.value))}
                className="w-full border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium bg-white"
              >
                <option value={90}>3 Months (90 Days)</option>
                <option value={180}>6 Months (180 Days)</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={generating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {generating ? <RefreshCw className="animate-spin" size={18} /> : <Clock size={18} />}
              Generate Rota
            </button>
          </form>

          {rosterMsg && (
            <p className="text-sm font-bold text-center mt-4 text-indigo-600">{rosterMsg}</p>
          )}
        </div>

    </div>
  );
}
