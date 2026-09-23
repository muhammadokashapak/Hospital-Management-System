import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { Utensils, RefreshCw, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DieteticsDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState('');
  const [dietType, setDietType] = useState('Diabetic Diet');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/dietetics/orders');
      if (res.ok) setOrders(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!patientId) return toast.error('Patient ID required');
    try {
      const res = await fetchWithAuth(`/dietetics/orders?patient_id=${patientId}&diet_type=${encodeURIComponent(dietType)}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Diet order logged');
        setPatientId('');
        fetchData();
      }
    } catch (err) { toast.error('Error logging diet order'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Utensils className="text-emerald-600" size={28} /> Dietetics & Clinical Nutrition
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Therapeutic diet orders (Diabetic, Renal, Cardiac) & kitchen preparation sheets</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"><RefreshCw size={14} /></button>
      </div>

      <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-end max-w-2xl">
        <div className="w-full sm:w-36">
          <label className="block text-xs font-black text-slate-700 mb-1">Patient ID *</label>
          <input type="number" value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="Patient ID" className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium" />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-black text-slate-700 mb-1">Therapeutic Diet Type</label>
          <select value={dietType} onChange={e => setDietType(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium">
            <option>Diabetic Diet</option><option>Renal Diet</option><option>Cardiac Low-Salt Diet</option><option>Soft / Liquid Diet</option><option>High Protein</option>
          </select>
        </div>
        <button type="submit" className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-emerald-700 transition-all shadow-md shrink-0">Log Diet Order</button>
      </form>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Patient ID</th>
              <th className="px-5 py-3 text-left font-black text-xs text-slate-500 uppercase">Diet Type</th>
              <th className="px-5 py-3 text-center font-black text-xs text-slate-500 uppercase">Kitchen Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b border-slate-100">
                <td className="px-5 py-3 font-black text-slate-900">{o.patient_name || `Patient #${o.patient_id}`}</td>
                <td className="px-5 py-3 font-bold text-slate-700">{o.diet_type}</td>
                <td className="px-5 py-3 text-center">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black">Active Diet Plan</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
