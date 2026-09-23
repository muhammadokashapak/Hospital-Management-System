import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { Sparkles, RefreshCw, BedDouble, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HousekeepingDashboard() {
  const [logs, setLogs] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [lRes, bRes] = await Promise.all([
        fetchWithAuth('/housekeeping/logs'),
        fetchWithAuth('/admissions/all-beds')
      ]);
      if (lRes.ok) setLogs(await lRes.json());
      if (bRes.ok) setBeds(await bRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCleanBed = async (bedId) => {
    try {
      const res = await fetchWithAuth(`/housekeeping/clean?ward_bed_id=${bedId}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Bed sanitized & marked AVAILABLE in IPD Heatmap!');
        fetchData();
      }
    } catch (err) { toast.error('Error marking bed cleaned'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="text-teal-600" size={28} /> Housekeeping & Bed Terminal Sync
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Ward bed terminal cleaning & real-time IPD bed heatmap status synchronization</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"><RefreshCw size={14} /></button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900">Ward Beds Terminal Cleaning Control</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {beds.slice(0, 24).map(b => (
            <div key={b.id} className="border border-slate-200 rounded-xl p-3 text-center bg-slate-50">
              <BedDouble className="mx-auto text-slate-400 mb-1" size={20} />
              <p className="text-xs font-black text-slate-900">{b.bed_number}</p>
              <p className="text-[10px] text-slate-500">{b.ward_name}</p>
              <button onClick={() => handleCleanBed(b.id)} className="mt-2 text-[10px] font-black bg-teal-600 text-white px-2 py-1 rounded-lg w-full hover:bg-teal-700">
                Mark Cleaned ✓
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Log ID</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Task</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} className="border-b border-slate-100">
                <td className="px-5 py-3 font-black text-slate-900">Log #{l.id}</td>
                <td className="px-5 py-3 font-bold text-slate-600">{l.task_type}</td>
                <td className="px-5 py-3 text-center">
                  <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-black">Cleaned & Synced ✓</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
