import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../config';
import { FlaskConical, CheckCircle2, RefreshCw, LogOut, ClipboardList, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LAB_TEST_TEMPLATES = {
  "CBC": {
    name: "Complete Blood Count",
    fields: [
      { id: "wbc", label: "WBC", unit: "x10^9/L", type: "number" },
      { id: "rbc", label: "RBC", unit: "x10^12/L", type: "number" },
      { id: "hb", label: "Hemoglobin", unit: "g/dL", type: "number" },
      { id: "hct", label: "Hematocrit", unit: "%", type: "number" },
      { id: "platelets", label: "Platelets", unit: "x10^9/L", type: "number" }
    ],
    evaluate: (data) => {
      const wbc = parseFloat(data.wbc);
      const hb = parseFloat(data.hb);
      if (isNaN(wbc) || isNaN(hb)) return 'INVALID ⚠️';
      return (wbc < 4.5 || wbc > 11.0 || hb < 12.0 || hb > 17.5) ? 'ABNORMAL 🔴' : 'NORMAL 🟢';
    }
  },
  "LIPID": {
    name: "Lipid Profile",
    fields: [
      { id: "cholesterol", label: "Total Cholesterol", unit: "mg/dL", type: "number" },
      { id: "hdl", label: "HDL", unit: "mg/dL", type: "number" },
      { id: "ldl", label: "LDL", unit: "mg/dL", type: "number" },
      { id: "triglycerides", label: "Triglycerides", unit: "mg/dL", type: "number" }
    ],
    evaluate: (data) => {
      const chol = parseFloat(data.cholesterol);
      const ldl = parseFloat(data.ldl);
      if (isNaN(chol) || isNaN(ldl)) return 'INVALID ⚠️';
      return (chol > 200 || ldl > 130) ? 'ABNORMAL 🔴' : 'NORMAL 🟢';
    }
  },
  "LFT": {
    name: "Liver Function Test",
    fields: [
      { id: "alt", label: "ALT (SGPT)", unit: "U/L", type: "number" },
      { id: "ast", label: "AST (SGOT)", unit: "U/L", type: "number" },
      { id: "alp", label: "ALP", unit: "U/L", type: "number" },
      { id: "bilirubin", label: "Total Bilirubin", unit: "mg/dL", type: "number" }
    ],
    evaluate: (data) => {
      const alt = parseFloat(data.alt);
      const ast = parseFloat(data.ast);
      if (isNaN(alt) || isNaN(ast)) return 'INVALID ⚠️';
      return (alt > 40 || ast > 40) ? 'ABNORMAL 🔴' : 'NORMAL 🟢';
    }
  },
  "URINE": {
    name: "Urinalysis",
    fields: [
      { id: "color", label: "Color", unit: "", type: "text" },
      { id: "ph", label: "pH", unit: "", type: "number" },
      { id: "protein", label: "Protein", unit: "", type: "text" },
      { id: "glucose", label: "Glucose", unit: "", type: "text" }
    ],
    evaluate: (data) => {
      const pro = (data.protein || '').toLowerCase();
      const glu = (data.glucose || '').toLowerCase();
      return (pro.includes('pos') || pro.includes('+') || glu.includes('pos') || glu.includes('+')) ? 'ABNORMAL 🔴' : 'NORMAL 🟢';
    }
  },
  "XRAY": {
    name: "Radiology & Imaging Report",
    fields: [
      { id: "status_option", label: "Test Status", unit: "", type: "select", options: ["Completed (Mark as Done)", "In Progress", "Pending"] },
      { id: "findings", label: "Diagnostic Findings & Observations", unit: "", type: "text" }
    ],
    evaluate: (data) => "COMPLETED 🟢"
  }
};

const getTemplateForTest = (testName) => {
  const upper = (testName || '').toUpperCase();
  if (upper.includes('CBC') || upper.includes('BLOOD COUNT')) return LAB_TEST_TEMPLATES["CBC"];
  if (upper.includes('LIPID')) return LAB_TEST_TEMPLATES["LIPID"];
  if (upper.includes('LFT') || upper.includes('LIVER')) return LAB_TEST_TEMPLATES["LFT"];
  if (upper.includes('URINE') || upper.includes('URINALYSIS')) return LAB_TEST_TEMPLATES["URINE"];
  if (upper.includes('X-RAY') || upper.includes('XRAY') || upper.includes('RADIOLOGY') || upper.includes('CT') || upper.includes('MRI') || upper.includes('ULTRASOUND')) return LAB_TEST_TEMPLATES["XRAY"];
  return null;
};

export default function LabTechDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [msg, setMsg] = useState('');
  const [resultInputs, setResultInputs] = useState({});
  const [structuredInputs, setStructuredInputs] = useState({});
  const [expandedPatient, setExpandedPatient] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await fetchWithAuth('/lab/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmitResult = async (id) => {
    const result = resultInputs[id];
    if (!result?.trim()) {
      setMsg('❌ Please enter a result before submitting.');
      return;
    }
    try {
      setMsg('Submitting result...');
      const res = await fetchWithAuth(`/lab/${id}/results`, {
        method: 'POST',
        body: JSON.stringify({ result })
      });
      if (res.ok) {
        setMsg('✅ Lab result submitted successfully!');
        setResultInputs(prev => ({ ...prev, [id]: '' }));
        fetchOrders();
      } else {
        setMsg('❌ Failed to submit result.');
      }
    } catch (err) {
      setMsg('❌ Server error.');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const handleStructuredSubmit = async (id, template) => {
    const data = structuredInputs[id];
    if (!data) {
      setMsg('❌ Please fill out the form fields.');
      return;
    }
    
    // Check if all fields are filled
    const missing = template.fields.find(f => !data[f.id] || !data[f.id].trim());
    if (missing) {
      setMsg(`❌ Please fill out the ${missing.label} field.`);
      return;
    }
    
    const isAbnormal = template.evaluate(data);
    
    // Format nicely as a structured string
    let finalResult = `[${template.name.toUpperCase()}]\n`;
    template.fields.forEach(f => {
      finalResult += `${f.label}: ${data[f.id]} ${f.unit}\n`;
    });
    finalResult += `Flag: ${isAbnormal}`;

    try {
      setMsg('Submitting structured result...');
      const res = await fetchWithAuth(`/lab/${id}/results`, {
        method: 'POST',
        body: JSON.stringify({ result: finalResult })
      });
      if (res.ok) {
        setMsg('✅ Result submitted successfully!');
        setStructuredInputs(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        fetchOrders();
      } else {
        setMsg('❌ Failed to submit result.');
      }
    } catch (err) {
      setMsg('❌ Server error.');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const filtered = orders.filter(o =>
    filter === 'All' ? true : o.status === filter
  );

  const pending = orders.filter(o => o.status === 'Pending').length;
  const completed = orders.filter(o => o.status === 'Completed').length;

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const groupedOrders = filtered.reduce((acc, order) => {
    const pid = order.patient_id || order.patient_name; 
    if (!acc[pid]) acc[pid] = { patient_name: order.patient_name, patient_id: pid, orders: [] };
    acc[pid].orders.push(order);
    return acc;
  }, {});

  const patientGroups = Object.values(groupedOrders);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-blue-600 border-b border-blue-700 px-6 md:px-10 py-5 flex flex-col md:flex-row justify-between items-start md:items-center shadow-md gap-4 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-blue-700 p-2.5 rounded-xl border border-blue-500 shadow-sm">
            <FlaskConical size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Lab & Diagnostics</h1>
            <p className="text-sm text-blue-100 font-medium">Test Orders & Result Entry</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchOrders} className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-md">
            <p className="text-4xl font-black text-amber-500">{orders.filter(o => o.status === 'Pending').length}</p>
            <p className="text-slate-600 text-sm font-semibold mt-1">Pending Tests</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-md">
            <p className="text-4xl font-black text-blue-600">{orders.filter(o => o.status === 'Completed').length}</p>
            <p className="text-slate-600 text-sm font-semibold mt-1">Completed</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-md">
            <p className="text-4xl font-black text-slate-900">{orders.length}</p>
            <p className="text-slate-600 text-sm font-semibold mt-1">Total Orders</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['Pending', 'Completed', 'All'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${filter === tab
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Status Message */}
        {msg && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-sm font-bold shadow-xs">
            {msg}
          </div>
        )}

        {/* Orders Feed */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">
            <RefreshCw className="animate-spin mx-auto mb-3 text-blue-600" size={32} />
            <p className="font-semibold">Loading lab orders...</p>
          </div>
        ) : patientGroups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-md">
            <ClipboardList size={48} className="text-slate-400 mx-auto mb-3" />
            <p className="text-slate-800 text-lg font-bold">No {filter} orders</p>
            <p className="text-slate-500 text-sm mt-1">Lab test orders from doctors will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {patientGroups.map(group => (
              <div
                key={group.patient_id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-md transition-all"
              >
                {/* Accordion Header */}
                <div 
                  onClick={() => setExpandedPatient(expandedPatient === group.patient_id ? null : group.patient_id)}
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedPatient === group.patient_id}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl border border-blue-200">
                      {group.patient_name ? group.patient_name.charAt(0) : '?'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-xl">{group.patient_name}</h3>
                      <p className="text-slate-500 text-sm font-medium">
                        {group.orders.length} Lab {group.orders.length === 1 ? 'Test' : 'Tests'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {group.orders.some(o => o.status === 'Pending') && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold border bg-amber-100 text-amber-800 border-amber-300">
                        Pending Actions
                      </span>
                    )}
                    <ChevronDown className={`text-slate-500 transition-transform ${expandedPatient === group.patient_id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Accordion Body */}
                {expandedPatient === group.patient_id && (
                  <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-4">
                    {group.orders.map(order => (
                      <div
                        key={order.id}
                        className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${order.status === 'Completed' ? 'border-blue-200' : 'border-amber-200'}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${order.status === 'Completed' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-700'}`}>
                              <FlaskConical size={20} />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 text-lg">{order.test_name}</p>
                              <p className="text-slate-500 text-sm">
                                Ordered by: <span className="text-slate-800 font-semibold">{order.doctor_name}</span>
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${order.status === 'Completed' ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                            {order.status}
                          </span>
                        </div>

                        {order.status === 'Completed' && (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-2">
                            <p className="text-xs text-slate-500 font-bold uppercase mb-1">Result</p>
                            <p className="text-slate-900 text-sm font-semibold whitespace-pre-wrap">{order.result}</p>
                          </div>
                        )}

                        {(() => {
                          if (order.status !== 'Pending') return null;
                          const template = getTemplateForTest(order.test_name);
                          if (template) {
                            return (
                              <div className="mt-4 p-4 bg-slate-50 border border-blue-200 rounded-xl space-y-3">
                                <p className="text-xs text-blue-700 font-extrabold uppercase tracking-wider">{template.name} Entry Form</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                  {template.fields.map(field => (
                                    <div key={field.id}>
                                      <label className="block text-xs text-slate-600 font-extrabold mb-1 uppercase">{field.label}</label>
                                      <div className="flex bg-white rounded-lg overflow-hidden border border-slate-300">
                                        <input
                                          type={field.type}
                                          step="any"
                                          value={structuredInputs[order.id]?.[field.id] || ''}
                                          onChange={e => setStructuredInputs(prev => ({
                                            ...prev, 
                                            [order.id]: { ...(prev[order.id] || {}), [field.id]: e.target.value }
                                          }))}
                                          className="w-full bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:border-blue-600"
                                        />
                                        {field.unit && (
                                          <span className="bg-slate-100 px-2.5 py-2 text-xs text-slate-600 font-bold flex items-center justify-center min-w-[50px] border-l border-slate-200">
                                            {field.unit}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => handleStructuredSubmit(order.id, template)}
                                  className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all shadow-md"
                                >
                                  <CheckCircle2 size={16} /> Submit {template.name} Result
                                </button>
                              </div>
                            );
                          }
                          return (
                            <div className="flex gap-3 mt-3">
                              <input
                                type="text"
                                placeholder="Enter custom test result here..."
                                value={resultInputs[order.id] || ''}
                                onChange={e => setResultInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                                className="flex-1 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-blue-600 transition-colors shadow-xs"
                              />
                              <button
                                onClick={() => handleSubmitResult(order.id)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-extrabold transition-all shadow-md"
                              >
                                <CheckCircle2 size={16} /> Submit Result
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
