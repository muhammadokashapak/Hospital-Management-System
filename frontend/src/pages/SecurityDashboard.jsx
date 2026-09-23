import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { ShieldCheck, RefreshCw, Plus, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecurityDashboard() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visitorName, setVisitorName] = useState('');
  const [patientId, setPatientId] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/security/passes');
      if (res.ok) setPasses(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!visitorName || !patientId) return toast.error('Visitor name and Patient ID required');
    try {
      const res = await fetchWithAuth(`/security/passes?visitor_name=${encodeURIComponent(visitorName)}&patient_id=${patientId}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Visitor Pass issued!');
        setVisitorName(''); setPatientId('');
        fetchData();
      }
    } catch (err) { toast.error('Error issuing pass'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-slate-800" size={28} /> Security & Visitor Management
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Visitor pass issuance, access control & restricted area monitoring</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"><RefreshCw size={14} /></button>
      </div>

      <form onSubmit={handleIssue} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-end max-w-2xl">
        <div className="flex-1 w-full">
          <label className="block text-xs font-black text-slate-700 mb-1">Visitor Full Name *</label>
          <input type="text" value={visitorName} onChange={e => setVisitorName(e.target.value)} placeholder="Visitor Name" className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium" />
        </div>
        <div className="w-full sm:w-36">
          <label className="block text-xs font-black text-slate-700 mb-1">Patient ID *</label>
          <input type="number" value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="Patient ID" className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium" />
        </div>
        <button type="submit" className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-slate-900 transition-all shadow-md shrink-0">Issue Visitor Pass</button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Pass #</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Visitor Name</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Visiting Patient</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {passes.map(p => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="px-5 py-3 font-black text-slate-900">{p.pass_number}</td>
                <td className="px-5 py-3 font-bold text-slate-700">{p.visitor_name}</td>
                <td className="px-5 py-3 font-medium text-slate-600">{p.patient_name || `Patient #${p.patient_id}`}</td>
                <td className="px-5 py-3 text-center">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">Active Pass</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
