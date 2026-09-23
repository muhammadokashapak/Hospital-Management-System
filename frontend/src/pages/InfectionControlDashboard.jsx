import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { Biohazard, RefreshCw, Plus, ShieldCheck, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InfectionControlDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [type, setType] = useState('SSI (Surgical Site Infection)');
  const [organism, setOrganism] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/infection-control/reports');
      if (res.ok) setReports(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!patientId) return toast.error('Patient ID is required');
    try {
      const res = await fetchWithAuth(`/infection-control/reports?patient_id=${patientId}&infection_type=${encodeURIComponent(type)}&organism_detected=${encodeURIComponent(organism || 'MRSA')}&isolation_required=true`, { method: 'POST' });
      if (res.ok) {
        toast.success('Infection report logged');
        setPatientId(''); setOrganism('');
        fetchData();
      }
    } catch (err) { toast.error('Error logging report'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Biohazard className="text-rose-600" size={28} /> Infection Control & Hygiene
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Hospital-acquired infection (HAI) surveillance & isolation bed tracking</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"><RefreshCw size={14} /></button>
      </div>

      <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-end max-w-3xl">
        <div className="w-full sm:w-36">
          <label className="block text-xs font-black text-slate-700 mb-1">Patient ID *</label>
          <input type="number" value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="Patient ID" className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium" />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-black text-slate-700 mb-1">Infection Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium">
            <option>SSI (Surgical Site Infection)</option>
            <option>CLABSI (Central Line Associated)</option>
            <option>CAUTI (Catheter Associated UTI)</option>
            <option>VAP (Ventilator Associated Pneumonia)</option>
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-black text-slate-700 mb-1">Organism</label>
          <input type="text" value={organism} onChange={e => setOrganism(e.target.value)} placeholder="e.g. MRSA, Pseudomonas" className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium" />
        </div>
        <button type="submit" className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-rose-700 transition-all shadow-md shrink-0">Report HAI</button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Patient ID</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Infection Type</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Organism</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">Isolation</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-5 py-3 font-black text-slate-900">{r.patient_name || `Patient #${r.patient_id}`}</td>
                <td className="px-5 py-3 font-bold text-slate-600">{r.infection_type}</td>
                <td className="px-5 py-3 font-medium text-slate-600">{r.organism_detected || 'N/A'}</td>
                <td className="px-5 py-3 text-center">
                  <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-black">ISOLATION REQUIRED</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
