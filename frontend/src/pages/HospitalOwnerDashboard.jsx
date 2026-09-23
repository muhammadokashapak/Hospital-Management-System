import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../config';
import { Building2, Users, FileText, Settings, ShieldCheck, DollarSign, Activity } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function HospitalOwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/admin/stats/');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      toast.error('Failed to load hospital owner statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Hospital Owner Command Center</h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">Executive overview of hospital operational metrics, department capacity, and revenue governance</p>
          </div>

          <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Isolated Tenant Scope</span>
          </div>
        </div>

        {/* Operational Performance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Employed Staff</p>
                <h3 className="text-3xl font-extrabold text-white mt-1">{stats?.total_staff || 0}</h3>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Registered Patients</p>
                <h3 className="text-3xl font-extrabold text-indigo-400 mt-1">{stats?.total_patients || 0}</h3>
              </div>
              <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Bed Occupancy</p>
                <h3 className="text-3xl font-extrabold text-amber-400 mt-1">
                  {stats?.occupied_beds || 0} / {stats?.total_beds || 0}
                </h3>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/50 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Active Inpatient Admissions</p>
                <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{stats?.active_admissions || 0}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Management Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/admin" className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 p-6 rounded-xl transition-all group">
            <div className="p-3 bg-indigo-600/20 text-indigo-400 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Manage Hospital Administrators & Staff</h3>
            <p className="text-slate-400 text-sm">Provision access, assign department roles, and audit employee registrations.</p>
          </a>

          <a href="/billing" className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 p-6 rounded-xl transition-all group">
            <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Financial Billing & Invoices</h3>
            <p className="text-slate-400 text-sm">Review consultation fees, inpatient bills, and hospital financial ledger reports.</p>
          </a>

          <a href="/profile" className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 p-6 rounded-xl transition-all group">
            <div className="p-3 bg-purple-600/20 text-purple-400 rounded-lg w-fit mb-4 group-hover:scale-110 transition-transform">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Hospital Configuration & Settings</h3>
            <p className="text-slate-400 text-sm">Configure security credentials, theme options, and system preferences.</p>
          </a>
        </div>

      </div>
    </div>
  );
}
