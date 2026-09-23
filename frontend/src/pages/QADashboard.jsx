import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { ShieldAlert, RefreshCw, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QADashboard() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [dept, setDept] = useState('Emergency');
  const [desc, setDesc] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/qa/incidents');
      if (res.ok) setIncidents(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReport = async (e) => {
    e.preventDefault();
    if (!title || !desc) return toast.error('Title and description are required');
    try {
      const res = await fetchWithAuth(`/qa/incidents?title=${encodeURIComponent(title)}&department_name=${encodeURIComponent(dept)}&description=${encodeURIComponent(desc)}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Quality incident logged');
        setTitle(''); setDesc('');
        fetchData();
      }
    } catch (err) { toast.error('Error logging incident'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-purple-600" size={28} /> Quality Assurance (QA) & Audit
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Incident reporting, accreditation checklists & operational SLA compliance</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"><RefreshCw size={14} /></button>
      </div>

      <form onSubmit={handleReport} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 max-w-2xl">
        <h3 className="text-sm font-black text-slate-900">Report Incident / Quality Gap</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Incident Title *" className="border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium" />
          <select value={dept} onChange={e => setDept(e.target.value)} className="border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium">
            <option>Emergency</option><option>ICU</option><option>OPD</option><option>Pharmacy</option><option>Lab</option>
          </select>
        </div>
        <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Detailed Description *" className="w-full border border-slate-300 rounded-xl p-3 text-sm font-medium resize-none" />
        <button type="submit" className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-purple-700 transition-all shadow-md">Log QA Incident</button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Title</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Department</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Description</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map(i => (
              <tr key={i.id} className="border-b border-slate-100">
                <td className="px-5 py-3 font-black text-slate-900">{i.title}</td>
                <td className="px-5 py-3 font-bold text-slate-600">{i.department_name}</td>
                <td className="px-5 py-3 font-medium text-slate-600 max-w-[300px] truncate">{i.description}</td>
                <td className="px-5 py-3 text-center">
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-black">{i.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
