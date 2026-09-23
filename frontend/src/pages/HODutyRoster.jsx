import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { Calendar, Clock, Moon, Sun, ShieldAlert, Award } from 'lucide-react';

export default function HODutyRoster() {
  const [profile, setProfile] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth('/profile/', { signal });
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  }, []);

  const fetchShifts = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth('/scheduler/my_shifts', { signal });
      const data = await res.json();
      setShifts(Array.isArray(data) ? data : []);
      setIsLoading(false);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
      setShifts([]);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);
    fetchShifts(controller.signal);
    return () => controller.abort();
  }, [fetchProfile, fetchShifts]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-blue-600 p-6 rounded-2xl shadow-xl text-white border border-blue-700">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Calendar className="text-white" size={30} />
              My Duty Roster & Shift Schedule
            </h1>
            <p className="text-xs font-semibold text-blue-100 mt-1">Personal 14-day upcoming shift calendar and roster breakdown.</p>
          </div>
          {profile?.rotation_group_name && (
            <span className="px-4 py-2 bg-white text-blue-700 font-black text-xs rounded-xl shadow-md border border-blue-200">
              Batch: {profile.rotation_group_name}
            </span>
          )}
        </div>

        {/* Upcoming Shifts Table */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-6 bg-blue-700 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-black">Upcoming 14-Day Duty Calendar</h2>
              <p className="text-xs text-blue-100 mt-0.5">4-Color Shift System (Morning, Evening, Night, Post-Night Off).</p>
            </div>

            {/* 4 Shift Color Badges */}
            <div className="flex flex-wrap gap-2 text-xs font-black">
              <span className="flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg">
                🌅 Morning
              </span>
              <span className="flex items-center gap-1 bg-sky-100 text-sky-900 border border-sky-300 px-3 py-1 rounded-lg">
                🌆 Evening
              </span>
              <span className="flex items-center gap-1 bg-indigo-900 text-white border border-indigo-700 px-3 py-1 rounded-lg">
                🌙 Night
              </span>
              <span className="flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1 rounded-lg">
                🏖️ Off
              </span>
            </div>
          </div>

          <div className="p-6 bg-slate-50">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : shifts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Calendar size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-base text-slate-800">No upcoming shifts scheduled.</p>
                <p className="text-xs text-slate-500 mt-1">Please check back once the TMO or Admin generates the roster.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shifts.map(s => {
                  const shiftDate = new Date(s.date);
                  const formattedDate = shiftDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                  
                  const isNight = s.type === 'Night' || s.type === 'N';
                  const isEvening = s.type === 'Evening' || s.type === 'E';
                  const isMorning = s.type === 'Morning' || s.type === 'M';
                  
                  return (
                    <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-white flex justify-between items-center shadow-xs hover:border-blue-500 transition-all">
                      <div>
                        <p className="font-black text-slate-900 text-sm">{formattedDate}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">Assigned Duty</p>
                      </div>

                      {/* 4 Distinct Shift Color Badges */}
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-black border ${
                        isNight ? 'bg-indigo-900 text-white border-indigo-950 shadow-xs' :
                        isEvening ? 'bg-sky-100 text-sky-900 border-sky-300' :
                        isMorning ? 'bg-amber-100 text-amber-900 border-amber-300' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {isNight ? '🌙 Night' : isEvening ? '🌆 Evening' : isMorning ? '🌅 Morning' : '🏖️ Off'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
