import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { 
  Users, RefreshCw, CheckCircle2, Clock, Calendar, 
  UserCheck, AlertCircle, FileText, Check, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function HRDashboard() {
  const [attendance, setAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'leaves'
  const [markUserId, setMarkUserId] = useState('');
  const [markStatus, setMarkStatus] = useState('Present');

  const fetchData = useCallback(async () => {
    try {
      const [attRes, leavesRes, statsRes] = await Promise.all([
        fetchWithAuth('/hr/attendance'),
        fetchWithAuth('/hr/leave-requests'),
        fetchWithAuth('/hr/stats')
      ]);
      if (attRes.ok) setAttendance(await attRes.json());
      if (leavesRes.ok) setLeaveRequests(await leavesRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error('Error fetching HR data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!markUserId) {
      toast.error('User ID is required');
      return;
    }
    try {
      const res = await fetchWithAuth(`/hr/attendance/mark?user_id=${markUserId}&status=${markStatus}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Attendance marked successfully');
        setMarkUserId('');
        fetchData();
      } else {
        toast.error('Failed to mark attendance');
      }
    } catch (err) {
      toast.error('Network error');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="text-blue-600" size={28} /> HR & Attendance
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Staff attendance tracking, workforce management & leave approvals</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-md">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Users size={12} /> Total Hospital Staff</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.total_staff}</p>
          </div>
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1"><UserCheck size={12} /> Present Today</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{stats.present_today}</p>
          </div>
          <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1"><Calendar size={12} /> Attendance Rate</p>
            <p className="text-3xl font-black text-blue-600 mt-1">
              {stats.total_staff > 0 ? Math.round((stats.present_today / stats.total_staff) * 100) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm w-fit">
        {[
          { key: 'attendance', label: 'Today\'s Attendance Register', icon: <UserCheck size={14} /> },
          { key: 'leaves', label: `Leave Requests (${leaveRequests.length})`, icon: <Calendar size={14} /> }
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
              activeTab === tab.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Quick Mark Attendance Form */}
          <form onSubmit={handleMarkAttendance} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-xs font-black text-slate-700 mb-1">Staff User ID</label>
              <input type="number" value={markUserId} onChange={e => setMarkUserId(e.target.value)}
                placeholder="Enter Staff User ID" className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-blue-500" />
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-xs font-black text-slate-700 mb-1">Status</label>
              <select value={markStatus} onChange={e => setMarkStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-blue-500">
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Leave">Leave</option>
              </select>
            </div>
            <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-blue-700 transition-all shadow-md shrink-0">
              Mark Attendance
            </button>
          </form>

          {/* Attendance Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {attendance.length === 0 ? (
              <div className="p-12 text-center">
                <UserCheck className="mx-auto text-slate-300 mb-3" size={48} />
                <h3 className="text-lg font-black text-slate-900">No Attendance Records Marked Today</h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">User ID</th>
                      <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">Date</th>
                      <th className="text-center px-5 py-3 font-black text-xs text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(att => (
                      <tr key={att.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-black text-slate-900">User #{att.user_id}</td>
                        <td className="px-5 py-3 font-medium text-slate-600">{att.login_date}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                            att.status === 'Present' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                            att.status === 'Absent' ? 'bg-red-100 text-red-700 border-red-300' :
                            att.status === 'Late' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                            'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leave Requests Tab */}
      {activeTab === 'leaves' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {leaveRequests.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="mx-auto text-slate-300 mb-3" size={48} />
              <h3 className="text-lg font-black text-slate-900">No Leave Requests</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">ID</th>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">Applicant</th>
                    <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase">Reason</th>
                    <th className="text-center px-5 py-3 font-black text-xs text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map(req => (
                    <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-500">#{req.id}</td>
                      <td className="px-5 py-3 font-black text-slate-900">User #{req.user_id || req.house_officer_id}</td>
                      <td className="px-5 py-3 font-medium text-slate-600">{req.reason || 'Leave requested'}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="bg-amber-100 text-amber-700 border border-amber-300 px-3 py-1 rounded-full text-xs font-black">
                          {req.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
