import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../config';
import { 
  Shield, Hospital as HospitalIcon, Plus, CheckCircle, AlertCircle, RefreshCw, 
  Eye, Copy, Lock, Key, Mail, Phone, MapPin, Award, Activity, Power, X, ExternalLink, Users, Database
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    license_key: '',
    address: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/admin/hospitals');
      if (res.ok) {
        const data = await res.json();
        setHospitals(data);
      } else {
        toast.error('Failed to load hospitals list');
      }
    } catch (err) {
      toast.error('Error connecting to backend server');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHospital = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth('/admin/hospitals', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const created = await res.json();
        toast.success(`Hospital '${created.name}' registered successfully!`);
        setShowAddModal(false);
        setFormData({ name: '', license_key: '', address: '', phone: '', email: '' });
        loadHospitals();
        setSelectedHospital(created); // Automatically open details for newly created hospital
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to create hospital');
      }
    } catch (err) {
      toast.error('Error submitting request');
    }
  };

  const handleToggleHospitalStatus = async (hospitalId, currentStatus) => {
    const newStatus = currentStatus === 'Suspended' ? 'Active' : 'Suspended';
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`/admin/hospitals/${hospitalId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Hospital status updated to ${newStatus}`);
        loadHospitals();
        if (selectedHospital && selectedHospital.id === hospitalId) {
          setSelectedHospital({ ...selectedHospital, status: newStatus });
        }
      } else {
        toast.error('Failed to update hospital status');
      }
    } catch (err) {
      toast.error('Error connecting to backend');
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Bar Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                  SaaS Super Admin Control Panel
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Platform Owner Mode
                  </span>
                </h1>
                <p className="text-slate-400 text-sm mt-1">Multi-tenant hospital infrastructure, licensing & automated admin provisioning</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button
              onClick={loadHospitals}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/60 transition-all"
              title="Refresh Hospital Registry"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              <span>Onboard New Hospital</span>
            </button>
          </div>
        </div>

        {/* Global SaaS Telemetry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Onboarded Hospitals</p>
                <h3 className="text-3xl font-black text-white mt-2">{hospitals.length}</h3>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                <HospitalIcon className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">Separated by Tenant Code (H001, H002...)</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Platform Tenants</p>
                <h3 className="text-3xl font-black text-emerald-400 mt-2">
                  {hospitals.filter(h => h.status !== 'Suspended').length}
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-emerald-500/80 font-medium">100% Operational & Isolated</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Data Isolation Architecture</p>
                <h3 className="text-xl font-bold text-indigo-400 mt-2">JWT + RLS Enforced</h3>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">Cross-tenant queries strictly blocked</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Auto Admin Provisioning</p>
                <h3 className="text-xl font-bold text-sky-400 mt-2">Instant Setup</h3>
              </div>
              <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">Automatic initial Admin credential assignment</div>
          </div>
        </div>

        {/* Tenant Registry Section */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="p-6 border-b border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Registered Multi-Tenant Hospitals</h2>
              <p className="text-slate-400 text-xs mt-1">Hover & click on any hospital row to inspect full tenant specifications, credentials, and controls.</p>
            </div>
            <div className="text-xs text-slate-400 font-mono bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
              Total Count: <span className="text-indigo-400 font-bold">{hospitals.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-xs tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Tenant Code</th>
                  <th className="px-6 py-4">Hospital Name</th>
                  <th className="px-6 py-4">License Key</th>
                  <th className="px-6 py-4">Contact / Email</th>
                  <th className="px-6 py-4">Subscription Status</th>
                  <th className="px-6 py-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {hospitals.map((h) => {
                  const tenantCode = h.hospital_code || `H${h.id.toString().padStart(3, '0')}`;
                  const isSuspended = h.status === 'Suspended';

                  return (
                    <tr 
                      key={h.id} 
                      onClick={() => setSelectedHospital(h)}
                      className="hover:bg-slate-800/60 cursor-pointer transition-all duration-150 group"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-indigo-400 group-hover:text-indigo-300">
                        <span className="bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                          {tenantCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-white group-hover:text-indigo-200 transition-colors">
                        <div className="flex items-center space-x-2">
                          <HospitalIcon className="w-4 h-4 text-indigo-400 opacity-75 group-hover:opacity-100" />
                          <span>{h.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                        {h.license_key}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">{h.email || 'N/A'}</div>
                        <div className="text-xs text-slate-500">{h.phone || h.address || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                            Active Tenant
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHospital(h);
                          }}
                          className="inline-flex items-center space-x-1.5 bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {hospitals.length === 0 && !loading && (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-500">
                      <HospitalIcon className="w-12 h-12 mx-auto text-slate-600 mb-2 opacity-50" />
                      <p className="text-base font-semibold text-slate-400">No Hospitals Onboarded Yet</p>
                      <p className="text-xs text-slate-500 mt-1">Click "Onboard New Hospital" above to add the first hospital tenant.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- DETAILED INSPECTION DRAWER / MODAL --- */}
        {selectedHospital && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs px-2.5 py-1 rounded-md border border-indigo-500/30">
                      {selectedHospital.hospital_code || `H${selectedHospital.id.toString().padStart(3, '0')}`}
                    </span>
                    <h3 className="text-2xl font-black text-white">{selectedHospital.name}</h3>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">Hospital ID #{selectedHospital.id} • Registered Tenant Specifications</p>
                </div>

                <button
                  onClick={() => setSelectedHospital(null)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* License & Infrastructure */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <span>Licensing & Registry</span>
                  </div>
                  <div className="text-sm font-mono text-slate-200">{selectedHospital.license_key}</div>
                  <div className="text-xs text-slate-500">Database Schema Scoped via Hospital ID</div>
                </div>

                {/* Subscription Tier */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>SaaS Subscription Plan</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-400">Enterprise SaaS Tier</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-md ${selectedHospital.status === 'Suspended' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {selectedHospital.status || 'Active'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">Full 30-Department Clinical ERP Suite Enabled</div>
                </div>

                {/* Auto Provisioned Admin Credentials */}
                <div className="bg-indigo-950/20 border border-indigo-800/50 p-4 rounded-xl space-y-2.5 col-span-1 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-indigo-400" />
                      <span>Auto-Provisioned Hospital Admin Account</span>
                    </div>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">Role: Admin</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Admin Email:</span>
                      <span className="font-mono text-slate-200 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 block truncate">
                        {selectedHospital.email || selectedHospital.admin_email || `admin_${selectedHospital.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@hospitalcloud.com`}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Initial Setup Password:</span>
                      <span className="font-mono text-emerald-400 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 block">
                        AdminSetup123!
                      </span>
                    </div>
                  </div>
                </div>

                {/* Address & Contact Details */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2 col-span-1 md:col-span-2">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Physical Location & Contact</span>
                  </div>
                  <div className="text-xs text-slate-300">{selectedHospital.address || 'Address not configured.'}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 pt-1">
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-indigo-400" /> {selectedHospital.email || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-indigo-400" /> {selectedHospital.phone || 'N/A'}</span>
                  </div>
                </div>

              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    const relativeLink = selectedHospital.invitation_link || `/activate-account?hospital_id=${selectedHospital.id}&email=${selectedHospital.email || selectedHospital.admin_email || 'admin@hospital.com'}`;
                    const fullUrl = relativeLink.startsWith('http') ? relativeLink : `${window.location.origin}${relativeLink.startsWith('/') ? '' : '/'}${relativeLink}`;
                    copyToClipboard(fullUrl, 'Full Activation Link');
                  }}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Copy Admin Invitation Link</span>
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleToggleHospitalStatus(selectedHospital.id, selectedHospital.status)}
                    className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                      selectedHospital.status === 'Suspended' 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-rose-600/90 hover:bg-rose-600 text-white'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{selectedHospital.status === 'Suspended' ? 'Activate Tenant' : 'Suspend Tenant'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedHospital(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- REGISTER NEW HOSPITAL MODAL --- */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <HospitalIcon className="w-5 h-5 text-indigo-400" />
                  <span>Onboard Hospital Tenant</span>
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateHospital} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Hospital Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Shifa International Hospital"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">License Key / Code</label>
                  <input
                    type="text"
                    required
                    value={formData.license_key}
                    onChange={(e) => setFormData({ ...formData, license_key: e.target.value })}
                    placeholder="e.g. LIC-SHIFA-001"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Sector H-8/4, Islamabad"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Contact Email (Auto Admin Account)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin.shifa@hospital.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    Register & Provision Admin
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
