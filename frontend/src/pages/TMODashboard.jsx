import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { useNavigate } from 'react-router-dom';
import { LogOut, Stethoscope, ClipboardList, Award, AlertCircle, UserCheck, X, CheckCircle, XCircle, Calendar, ArrowRight } from 'lucide-react';

export default function TMODashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [hos, setHos] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [logbookInbox, setLogbookInbox] = useState([]);
  
  // Task parameters
  const [selectedHo, setSelectedHo] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskMsg, setTaskMsg] = useState('');
  
  const [inboxMsg, setInboxMsg] = useState('');

  // Interactive Modal Popup States
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [tmoComment, setTmoComment] = useState('');
  const [selectedLogbook, setSelectedLogbook] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const fetchProfile = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth('/profile/', { signal });
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  }, []);

  const fetchGroupHOs = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth('/tasks/group_hos', { signal });
      const data = await res.json();
      setHos(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) setSelectedHo(data[0].id);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
      setHos([]);
    }
  }, []);

  const fetchInbox = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth('/leave_requests/inbox', { signal });
      const data = await res.json();
      setInbox(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
      setInbox([]);
    }
  }, []);

  const fetchLogbook = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth('/tasks/logbook/inbox', { signal });
      const data = await res.json();
      setLogbookInbox(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
      setLogbookInbox([]);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);
    fetchGroupHOs(controller.signal);
    fetchInbox(controller.signal);
    fetchLogbook(controller.signal);
    return () => controller.abort();
  }, [fetchProfile, fetchGroupHOs, fetchInbox, fetchLogbook]);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!selectedHo) {
      setTaskMsg('Error: Please select a House Officer.');
      return;
    }
    setTaskMsg('Assigning...');
    try {
      const res = await fetchWithAuth('/tasks/', {
        method: 'POST',
        body: JSON.stringify({
          ho_id: parseInt(selectedHo),
          task_title: taskTitle,
          task_description: taskDesc
        })
      });
      if (res.ok) {
        setTaskMsg('✅ Task assigned successfully!');
        setTaskTitle('');
        setTaskDesc('');
      } else {
        const errData = await res.json();
        setTaskMsg(`❌ ${errData.detail || 'Failed to assign task.'}`);
      }
    } catch (err) {
      setTaskMsg('❌ Server connection error.');
    }
  };

  const handleLeaveAction = async (id, status) => {
    setIsProcessingAction(true);
    try {
      const res = await fetchWithAuth(`/leave_requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, tmo_comment: tmoComment })
      });
      if (res.ok) {
        setInboxMsg(`Leave request updated to ${status}!`);
        fetchInbox();
        setSelectedLeave(null);
        setTmoComment('');
      } else {
        setInboxMsg('Failed to update request.');
      }
    } catch (err) {
      setInboxMsg('Server error updating request.');
    }
    setIsProcessingAction(false);
    setTimeout(() => setInboxMsg(''), 4000);
  };

  const handleApproveLogbook = async (id) => {
    setIsProcessingAction(true);
    try {
      const res = await fetchWithAuth(`/tasks/logbook/${id}/approve`, {
        method: 'PUT'
      });
      if (res.ok) {
        setInboxMsg('Procedure log approved successfully!');
        fetchLogbook();
        setSelectedLogbook(null);
      } else {
        setInboxMsg('Failed to approve procedure.');
      }
    } catch (err) {
      setInboxMsg('Server error.');
    }
    setIsProcessingAction(false);
    setTimeout(() => setInboxMsg(''), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="space-y-8">
        
        {/* Top Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
              <Stethoscope className="text-indigo-600" size={34} />
              TMO Clinical Operations Console
            </h1>
            <p className="text-sm text-slate-500 mt-1">Senior Consultant Support, Clinical Supervision & HO Duty Delegation.</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-600 hover:text-red-600 font-bold transition-colors">
            <LogOut size={20} /> Logout
          </button>
        </div>

        {/* Global Feedback Banner */}
        {inboxMsg && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-sm rounded-2xl shadow-xs animate-in fade-in duration-200">
            {inboxMsg}
          </div>
        )}

        {/* 1. TOP STATUS BANNER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-indigo-600">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">Assigned Track</span>
            <h3 className="text-2xl font-black text-slate-800 mt-3">{profile?.rotation_group_name || 'Loading Track...'}</h3>
            <p className="text-xs text-slate-500 mt-1">Active Specialty Ward & Rotations</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-600">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">Senior Consultant Assistance</span>
            <h3 className="text-lg font-bold text-slate-800 mt-2">Prof. Dr. Farooq (Senior Consultant)</h3>
            <p className="text-xs text-slate-500 mt-1">Assisting OPD Rounds & Surgical Procedures</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-amber-600">
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">Supervised HO Batch</span>
            <h3 className="text-2xl font-black text-slate-800 mt-2">
              {hos.length} Registered HOs
            </h3>
            <p className="text-xs text-slate-500 mt-1">Managing Ward & Procedure Assignments</p>
          </div>
        </div>

        {/* 2. MAIN SPACIOUS CLINICAL TASK DELEGATION SECTION */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2 flex items-center gap-3">
            <ClipboardList className="text-indigo-600" size={28} />
            Delegate Clinical Task / Ward Procedure to HO
          </h2>
          <p className="text-sm text-slate-500 mb-6">Assign specific consultant support tasks (e.g., Pre-Op preparation, OPD Round assist, Dressing, Wound Care) to HOs.</p>
          
          <form onSubmit={handleAssignTask} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Select House Officer</label>
                <select 
                  value={selectedHo}
                  onChange={e => setSelectedHo(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-slate-900 shadow-2xs"
                >
                  {hos.map(h => (
                    <option key={h.id} value={h.id}>{h.full_name} ({h.gender}) - Batch {h.batch_year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Task / Procedure Title</label>
                <input 
                  type="text"
                  placeholder="e.g., Assist Prof. Farooq in Ward Round Bed 4-8"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900 placeholder-slate-400 bg-white shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Detailed Instructions & Notes</label>
              <textarea 
                rows="3"
                placeholder="Explain specific patient care or vital check instructions..."
                value={taskDesc}
                onChange={e => setTaskDesc(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900 placeholder-slate-400 bg-white shadow-2xs"
              />
            </div>

            <button 
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-base"
            >
              <UserCheck size={20} />
              Assign Clinical Task
            </button>

            {taskMsg && (
              <p className="text-sm text-indigo-600 font-bold mt-2">{taskMsg}</p>
            )}
          </form>
        </div>

        {/* 3. INBOX AREA: Leave Approvals & Surgical Logbook Verifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Leaves Inbox */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <AlertCircle className="text-indigo-600" size={22} />
              HO Leave Applications Inbox
            </h2>
            <p className="text-xs text-slate-500 mb-4">Click on any request to open the review popup modal.</p>
            
            {inbox.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl text-slate-500 text-sm font-medium">
                No leave requests pending in your inbox.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {inbox.map((req) => (
                  <div 
                    key={req.id} 
                    onClick={() => setSelectedLeave(req)}
                    className="p-4 border border-slate-200 rounded-xl bg-white hover:bg-indigo-50/40 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {req.ho_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Date: {req.leave_date}</p>
                      <p className="text-xs text-slate-600 italic line-clamp-1 mt-1 font-semibold">"{req.reason}"</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        req.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-900 border border-amber-200'
                      }`}>
                        {req.status}
                      </span>
                      <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Surgical/Procedure Logbooks Inbox */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Award className="text-indigo-600" size={22} />
              Procedure & Logbook Verifications Inbox
            </h2>
            <p className="text-xs text-slate-500 mb-4">Click on any procedure card to verify & approve in popup modal.</p>

            {logbookInbox.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl text-slate-500 text-sm font-medium">
                No HO procedure entries awaiting verification.
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {logbookInbox.map((entry) => (
                  <div 
                    key={entry.id} 
                    onClick={() => setSelectedLogbook(entry)}
                    className="p-4 border border-slate-200 rounded-xl bg-white hover:bg-indigo-50/40 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {entry.procedure_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Performed Date: {entry.date_performed}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {entry.supervisor_approved ? (
                        <span className="text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-3 py-1 rounded-full">
                          Verified
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-full">
                          Verify Now
                        </span>
                      )}
                      <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 1. INTERACTIVE LEAVE APPLICATION MODAL POPUP */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform animate-in fade-in zoom-in duration-200">
            
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Leave Application Review</span>
                <h3 className="text-xl font-black mt-1 text-white">{selectedLeave.ho_name}</h3>
              </div>
              <button 
                onClick={() => setSelectedLeave(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Requested Leave Date</span>
                  <p className="text-base font-extrabold text-slate-900">{selectedLeave.leave_date}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  selectedLeave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  selectedLeave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-900'
                }`}>
                  {selectedLeave.status}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Applicant's Reason</label>
                <div className="mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold italic">
                  "{selectedLeave.reason}"
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Supervisor Notes / Remarks (Optional)</label>
                <textarea 
                  rows="2"
                  placeholder="Type remarks or approval notes..."
                  value={tmoComment}
                  onChange={e => setTmoComment(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900 placeholder-slate-400 bg-white"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Close
              </button>

              {selectedLeave.status === 'Pending' && (
                <>
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => handleLeaveAction(selectedLeave.id, 'Rejected')}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-1.5"
                  >
                    <XCircle size={18} /> Reject
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => handleLeaveAction(selectedLeave.id, 'Approved')}
                    className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle size={18} /> Approve Leave
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 2. INTERACTIVE LOGBOOK VERIFICATION MODAL POPUP */}
      {selectedLogbook && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform animate-in fade-in zoom-in duration-200">
            
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Logbook Procedure Verification</span>
                <h3 className="text-xl font-black mt-1 text-white">{selectedLogbook.procedure_name}</h3>
              </div>
              <button 
                onClick={() => setSelectedLogbook(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
                <span className="text-xs font-bold text-indigo-800 uppercase">Performed Date</span>
                <p className="text-lg font-black text-indigo-950 mt-0.5">{selectedLogbook.date_performed}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Status</label>
                <div className="mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">Supervisor Signature</span>
                  {selectedLogbook.supervisor_approved ? (
                    <span className="text-xs font-bold bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle size={14} /> Verified & Signed
                    </span>
                  ) : (
                    <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
                      Awaiting Verification
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedLogbook(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Close
              </button>

              {!selectedLogbook.supervisor_approved && (
                <button
                  type="button"
                  disabled={isProcessingAction}
                  onClick={() => handleApproveLogbook(selectedLogbook.id)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <CheckCircle size={18} /> Verify & Approve Procedure
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
