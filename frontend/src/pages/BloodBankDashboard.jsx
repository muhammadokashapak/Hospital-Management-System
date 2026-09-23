import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { 
  Droplets, RefreshCw, Plus, AlertTriangle, CheckCircle2,
  Minus, Activity, TrendingUp, X, Package
} from 'lucide-react';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['Whole_Blood', 'Packed_RBCs', 'Platelets', 'FFP', 'Cryoprecipitate'];
const COMPONENT_LABELS = {
  Whole_Blood: 'Whole Blood',
  Packed_RBCs: 'Packed RBCs',
  Platelets: 'Platelets',
  FFP: 'FFP',
  Cryoprecipitate: 'Cryoprecipitate'
};

export default function BloodBankDashboard() {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'add', 'issue'
  const [addForm, setAddForm] = useState({ blood_group: 'O+', component: 'Whole_Blood', units_available: 1 });
  const [issueForm, setIssueForm] = useState({ blood_group: 'O+', component: 'Whole_Blood', units: 1 });

  const fetchData = useCallback(async () => {
    try {
      const [invRes, statsRes] = await Promise.all([
        fetchWithAuth('/blood-bank/inventory'),
        fetchWithAuth('/blood-bank/stats')
      ]);
      if (invRes.ok) setInventory(await invRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error('Error fetching blood bank data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/blood-bank/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        toast.success(`${addForm.units_available} units of ${addForm.blood_group} added to stock`);
        setAddForm({ blood_group: 'O+', component: 'Whole_Blood', units_available: 1 });
        setActiveTab('inventory');
        fetchData();
      } else {
        toast.error('Failed to add stock');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleIssueBlood = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth(`/blood-bank/issue?blood_group=${encodeURIComponent(issueForm.blood_group)}&component=${issueForm.component}&units=${issueForm.units}`, {
        method: 'POST'
      });
      if (res.ok) {
        toast.success(`${issueForm.units} units of ${issueForm.blood_group} issued successfully`);
        setIssueForm({ blood_group: 'O+', component: 'Whole_Blood', units: 1 });
        setActiveTab('inventory');
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Insufficient stock');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  // Create a grid map for blood_group -> units
  const groupedInventory = {};
  BLOOD_GROUPS.forEach(bg => { groupedInventory[bg] = 0; });
  inventory.forEach(item => {
    groupedInventory[item.blood_group] = (groupedInventory[item.blood_group] || 0) + item.units_available;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Droplets className="text-red-600" size={28} /> Blood Bank
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Blood inventory management, donor stock & issue tracking</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Package size={12} /> Total Units</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.total_units}</p>
          </div>
          <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={12} /> Critical Low (&lt;5)</p>
            <p className="text-3xl font-black text-red-600 mt-1">{stats.critical_groups}</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1"><Droplets size={12} /> Blood Groups</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{BLOOD_GROUPS.length}</p>
          </div>
        </div>
      )}

      {/* Blood Group Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {BLOOD_GROUPS.map(bg => {
          const units = groupedInventory[bg] || 0;
          const isCritical = units < 5;
          return (
            <div key={bg} className={`rounded-2xl p-5 text-center border-2 shadow-sm transition-all ${
              isCritical ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
            }`}>
              <div className={`text-3xl font-black ${isCritical ? 'text-red-600' : 'text-slate-900'}`}>{bg}</div>
              <div className={`text-lg font-black mt-1 ${isCritical ? 'text-red-500' : 'text-blue-600'}`}>{units} units</div>
              {isCritical && (
                <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={10} /> LOW
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'inventory', label: 'Full Inventory', icon: <Package size={14} /> },
          { key: 'add', label: 'Add Stock (Donation)', icon: <Plus size={14} /> },
          { key: 'issue', label: 'Issue Blood', icon: <Minus size={14} /> }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {inventory.length === 0 ? (
            <div className="p-12 text-center">
              <Droplets className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-lg font-black text-slate-900">No Blood Stock Records</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">Blood Group</th>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">Component</th>
                    <th className="text-right px-5 py-3 font-black text-xs text-slate-500 uppercase">Units Available</th>
                    <th className="text-center px-5 py-3 font-black text-xs text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-black text-lg text-slate-900">{item.blood_group}</td>
                      <td className="px-5 py-3 font-bold text-slate-700">{COMPONENT_LABELS[item.component] || item.component}</td>
                      <td className="px-5 py-3 font-black text-slate-900 text-right">{item.units_available}</td>
                      <td className="px-5 py-3 text-center">
                        {item.units_available < 5 ? (
                          <span className="bg-red-100 text-red-700 border border-red-300 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 w-fit mx-auto">
                            <AlertTriangle size={10} /> Critical
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-700 border border-emerald-300 px-3 py-1 rounded-full text-xs font-black">Adequate</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Stock Form */}
      {activeTab === 'add' && (
        <form onSubmit={handleAddStock} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Plus className="text-emerald-600" size={20} /> Add Blood Stock (Donor Donation)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Blood Group</label>
              <select value={addForm.blood_group} onChange={e => setAddForm({...addForm, blood_group: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500">
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Component</label>
              <select value={addForm.component} onChange={e => setAddForm({...addForm, component: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500">
                {COMPONENTS.map(c => <option key={c} value={c}>{COMPONENT_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Units</label>
              <input type="number" min="1" value={addForm.units_available} onChange={e => setAddForm({...addForm, units_available: parseInt(e.target.value) || 1})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black text-sm hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2">
            <Plus size={16} /> Add to Blood Bank Stock
          </button>
        </form>
      )}

      {/* Issue Blood Form */}
      {activeTab === 'issue' && (
        <form onSubmit={handleIssueBlood} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Minus className="text-red-600" size={20} /> Issue Blood to Patient / OT
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Blood Group</label>
              <select value={issueForm.blood_group} onChange={e => setIssueForm({...issueForm, blood_group: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500">
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Component</label>
              <select value={issueForm.component} onChange={e => setIssueForm({...issueForm, component: e.target.value})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500">
                {COMPONENTS.map(c => <option key={c} value={c}>{COMPONENT_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Units to Issue</label>
              <input type="number" min="1" value={issueForm.units} onChange={e => setIssueForm({...issueForm, units: parseInt(e.target.value) || 1})}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <button type="submit" className="w-full bg-red-600 text-white py-3 rounded-xl font-black text-sm hover:bg-red-700 transition-all shadow-md flex items-center justify-center gap-2">
            <Minus size={16} /> Issue Blood Units
          </button>
        </form>
      )}
    </div>
  );
}
