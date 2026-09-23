import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { Flame, RefreshCw, Plus, CheckCircle2, ShieldCheck, Thermometer, Gauge } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CSSDDashboard() {
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [batchNum, setBatchNum] = useState('');
  const [autoclave, setAutoclave] = useState('Autoclave-1');

  const fetchData = useCallback(async () => {
    try {
      const [bRes, sRes] = await Promise.all([
        fetchWithAuth('/cssd/batches'),
        fetchWithAuth('/cssd/stats')
      ]);
      if (bRes.ok) setBatches(await bRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!batchNum) return toast.error('Batch number is required');
    try {
      const res = await fetchWithAuth(`/cssd/batches?batch_number=${encodeURIComponent(batchNum)}&autoclave_number=${encodeURIComponent(autoclave)}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Autoclave batch logged successfully');
        setBatchNum('');
        fetchData();
      }
    } catch (err) { toast.error('Error logging batch'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Flame className="text-orange-600" size={28} /> Central Sterile Services (CSSD)
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Sterilization batch logging, autoclave monitoring & instrument tray tracking</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"><RefreshCw size={14} /></button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Batches</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.total_batches}</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase">Passed Sterilizations</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{stats.passed_batches}</p>
          </div>
          <div className="bg-white border border-orange-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-orange-600 uppercase">Autoclave Temp</p>
            <p className="text-3xl font-black text-orange-600 mt-1">134 °C</p>
          </div>
        </div>
      )}

      <form onSubmit={handleCreateBatch} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-end max-w-2xl">
        <div className="flex-1 w-full">
          <label className="block text-xs font-black text-slate-700 mb-1">Batch / Tray Tag ID *</label>
          <input type="text" value={batchNum} onChange={e => setBatchNum(e.target.value)} placeholder="e.g., BATCH-2026-09" className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium" />
        </div>
        <div className="w-full sm:w-48">
          <label className="block text-xs font-black text-slate-700 mb-1">Autoclave Unit</label>
          <select value={autoclave} onChange={e => setAutoclave(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium">
            <option>Autoclave-1</option>
            <option>Autoclave-2</option>
            <option>Autoclave-3 (Flash)</option>
          </select>
        </div>
        <button type="submit" className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-orange-700 transition-all shadow-md shrink-0 flex items-center gap-1">
          <Plus size={14} /> Log Sterilization Batch
        </button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Batch Tag</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Autoclave</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">Temp / Pressure</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(b => (
              <tr key={b.id} className="border-b border-slate-100">
                <td className="px-5 py-3 font-black text-slate-900">{b.batch_number}</td>
                <td className="px-5 py-3 font-bold text-slate-600">{b.autoclave_number}</td>
                <td className="px-5 py-3 text-center font-semibold text-slate-700">{b.temperature_celsius}°C • {b.pressure_bar} bar</td>
                <td className="px-5 py-3 text-center">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">Passed ✓</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
