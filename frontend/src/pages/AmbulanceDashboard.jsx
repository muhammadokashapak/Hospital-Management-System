import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { Ambulance, RefreshCw, Plus, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AmbulanceDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehNum, setVehNum] = useState('AMB-01');
  const [loc, setLoc] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/ambulance/records');
      if (res.ok) setRecords(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!loc) return toast.error('Pickup location required');
    try {
      const res = await fetchWithAuth(`/ambulance/dispatch?vehicle_number=${encodeURIComponent(vehNum)}&pickup_location=${encodeURIComponent(loc)}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Ambulance dispatched');
        setLoc('');
        fetchData();
      }
    } catch (err) { toast.error('Error dispatching ambulance'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Ambulance className="text-red-600" size={28} /> Ambulance & Dispatch Services
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Fleet status, emergency dispatch logs & driver assignment</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"><RefreshCw size={14} /></button>
      </div>

      <form onSubmit={handleDispatch} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-end max-w-2xl">
        <div className="w-full sm:w-36">
          <label className="block text-xs font-black text-slate-700 mb-1">Ambulance Unit</label>
          <select value={vehNum} onChange={e => setVehNum(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium">
            <option>AMB-01</option><option>AMB-02</option><option>AMB-03 (ICU)</option>
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-black text-slate-700 mb-1">Pickup Location *</label>
          <input type="text" value={loc} onChange={e => setLoc(e.target.value)} placeholder="Address / Accident Spot" className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium" />
        </div>
        <button type="submit" className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-red-700 transition-all shadow-md shrink-0 flex items-center gap-1">
          <Navigation size={14} /> Dispatch Ambulance
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Vehicle</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Pickup Location</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-5 py-3 font-black text-slate-900">{r.vehicle_number}</td>
                <td className="px-5 py-3 font-bold text-slate-600">{r.pickup_location}</td>
                <td className="px-5 py-3 text-center">
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-black">DISPATCHED</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
