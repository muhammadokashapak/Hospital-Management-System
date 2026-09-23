import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { 
  ScanLine, RefreshCw, ClipboardList, CheckCircle2, Clock, 
  FileText, X, Camera, Activity, TrendingUp, AlertCircle, PlayCircle, StopCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import StaffDutyBriefingBanner from '../components/StaffDutyBriefingBanner';

const SCAN_TYPES = {
  X_Ray: '🩻 X-Ray',
  MRI: '🧲 MRI',
  CT_Scan: '🔬 CT Scan',
  Ultrasound: '📡 Ultrasound',
  ECG: '💓 ECG',
  Echo: '❤️ Echocardiography',
  Mammography: '🩺 Mammography'
};

export default function RadiologyDashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'completed'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusChoice, setStatusChoice] = useState('Completed'); // 'Completed', 'In Progress', 'Pending'
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetchWithAuth('/radiology/orders'),
        fetchWithAuth('/radiology/stats')
      ]);
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error('Error fetching radiology data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const pendingOrders = orders.filter(o => o.status !== 'Completed');
  const completedOrders = orders.filter(o => o.status === 'Completed');

  const handleUpdateStatus = async (targetStatus = statusChoice) => {
    if (!selectedOrder) return;
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/radiology/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          findings: reportText || (targetStatus === 'Completed' ? 'Scan completed per protocol.' : '')
        })
      });
      if (res.ok) {
        toast.success(`Radiology order marked as ${targetStatus}`);
        setSelectedOrder(null);
        setReportText('');
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to update status');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatus = async (orderId, newStatus, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetchWithAuth(`/radiology/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Order RAD-${orderId} marked as ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <StaffDutyBriefingBanner />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ScanLine className="text-blue-600" size={28} /> Radiology Department
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Imaging orders, scan status tracking & report management</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Camera size={12} /> Today's Orders</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.total_today}</p>
          </div>
          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> Pending / Waiting</p>
            <p className="text-3xl font-black text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1"><Activity size={12} /> In Progress</p>
            <p className="text-3xl font-black text-blue-600 mt-1">{stats.in_progress || 0}</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={12} /> Completed</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{stats.completed}</p>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'pending', label: `Pending & In Progress (${pendingOrders.length})`, icon: <Clock size={14} /> },
          { key: 'completed', label: `Completed (${completedOrders.length})`, icon: <CheckCircle2 size={14} /> }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Pending Orders */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <ScanLine className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-lg font-black text-slate-900">No Pending Radiology Orders</h3>
              <p className="text-sm text-slate-500 mt-1">Orders from OPD doctors will appear here for scan processing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingOrders.map(order => {
                const isInProgress = order.status === 'In Progress';
                return (
                  <div key={order.id} 
                    className={`bg-white border-2 rounded-2xl p-5 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                      isInProgress ? 'border-blue-400 bg-blue-50/20' : 'border-amber-200'
                    }`}
                    onClick={() => { setSelectedOrder(order); setStatusChoice(isInProgress ? 'Completed' : 'In Progress'); setReportText(''); }}>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-black px-3 py-1 rounded-full border flex items-center gap-1 ${
                        isInProgress ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {isInProgress ? <Activity size={12} className="animate-pulse" /> : <Clock size={12} />}
                        {order.status || 'Pending'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">RAD-{order.id}</span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 mb-1">{SCAN_TYPES[order.scan_type] || order.scan_type}</h3>
                    <p className="text-xs text-slate-700 font-bold mb-2">Patient: {order.patient_name || `Patient #${order.patient_id}`}</p>
                    <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                      {order.clinical_notes || 'OPD Diagnostic Order'}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      {!isInProgress && (
                        <button 
                          onClick={(e) => handleQuickStatus(order.id, 'In Progress', e)}
                          className="flex-1 py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 font-black rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                        >
                          <PlayCircle size={14} /> Start Scan
                        </button>
                      )}
                      <button 
                        onClick={(e) => handleQuickStatus(order.id, 'Completed', e)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1 transition-all shadow-xs"
                      >
                        <CheckCircle2 size={14} /> Mark Completed
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Completed Orders */}
      {activeTab === 'completed' && (
        <div className="space-y-3">
          {completedOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <CheckCircle2 className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-lg font-black text-slate-900">No Completed Reports Yet</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedOrders.map(order => (
                <div key={order.id} className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Completed
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">RAD-{order.id}</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1">{SCAN_TYPES[order.scan_type] || order.scan_type}</h3>
                  <p className="text-xs text-slate-600 font-medium">{order.patient_name || `Patient #${order.patient_id}`}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status Update & Report Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Update Scan Status</h3>
                <p className="text-xs text-slate-500 font-bold">RAD-{selectedOrder.id} • {selectedOrder.patient_name}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"><X size={20} /></button>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-4 space-y-1.5 border border-slate-200">
              <p className="text-xs font-bold text-slate-600">Scan Type: <strong className="text-slate-900">{SCAN_TYPES[selectedOrder.scan_type] || selectedOrder.scan_type}</strong></p>
              <p className="text-xs font-bold text-slate-600">Patient: <strong className="text-slate-900">{selectedOrder.patient_name || `Patient #${selectedOrder.patient_id}`}</strong></p>
              <p className="text-xs font-bold text-slate-600">Indication: <strong className="text-slate-900">{selectedOrder.clinical_notes || 'OPD Referral'}</strong></p>
            </div>

            {/* Select Status */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">Select Order Status *</label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setStatusChoice('Completed')}
                  className={`py-3 px-2 rounded-xl text-xs font-black border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    statusChoice === 'Completed' ? 'bg-emerald-600 text-white border-emerald-700 shadow-md scale-102' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 size={18} />
                  <span>Completed (Done)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusChoice('In Progress')}
                  className={`py-3 px-2 rounded-xl text-xs font-black border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    statusChoice === 'In Progress' ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-102' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Activity size={18} />
                  <span>In Progress</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusChoice('Pending')}
                  className={`py-3 px-2 rounded-xl text-xs font-black border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    statusChoice === 'Pending' ? 'bg-amber-500 text-white border-amber-600 shadow-md scale-102' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock size={18} />
                  <span>Pending / Not Done</span>
                </button>
              </div>
            </div>

            {/* Optional Findings */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">Radiology Findings & Impression (Optional)</label>
              <textarea 
                rows={3} 
                value={reportText} 
                onChange={e => setReportText(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
                placeholder="Enter scan findings, report notes, or impression (optional)..." 
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-1">
              <button 
                type="button"
                onClick={() => setSelectedOrder(null)} 
                className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => handleUpdateStatus(statusChoice)} 
                disabled={submitting}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black text-xs transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                {submitting ? 'Updating...' : `Save & Mark as ${statusChoice}`}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

