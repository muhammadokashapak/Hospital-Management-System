import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { Cross, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MortuaryDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [chamber, setChamber] = useState('Chamber-1');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/mortuary/records');
      if (res.ok) setRecords(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name) return toast.error('Deceased name is required');
    try {
      const res = await fetchWithAuth(`/mortuary/records?deceased_name=${encodeURIComponent(name)}&chamber_number=${encodeURIComponent(chamber)}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Deceased record logged');
        setName('');
        fetchData();
      }
    } catch (err) { toast.error('Error registering record'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Cross className="text-slate-700" size={28} /> Mortuary & Deceased Management
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Mortuary capacity tracking, body identification & death certificate issuance documentation</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"><RefreshCw size={14} /></button>
      </div>

      <form onSubmit={handleRegister} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-end max-w-2xl">
        <div className="flex-1 w-full">
          <label className="block text-xs font-black text-slate-700 mb-1">Deceased Name *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Deceased Full Name" className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium" />
        </div>
        <div className="w-full sm:w-36">
          <label className="block text-xs font-black text-slate-700 mb-1">Chamber #</label>
          <select value={chamber} onChange={e => setChamber(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium">
            <option>Chamber-1</option><option>Chamber-2</option><option>Chamber-3</option><option>Chamber-4</option>
          </select>
        </div>
        <button type="submit" className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-slate-900 transition-all shadow-md shrink-0">Log Mortuary Entry</button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Deceased Name</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Chamber #</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">Death Certificate</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-5 py-3 font-black text-slate-900">{r.deceased_name}</td>
                <td className="px-5 py-3 font-bold text-slate-700">{r.chamber_number}</td>
                <td className="px-5 py-3 text-center font-semibold text-slate-600">Issued ✓</td>
                <td className="px-5 py-3 text-center">
                  <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-black">{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
