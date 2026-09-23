import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../config';
import { ClipboardCheck, X, CheckCircle2, Clock, AlertCircle, Calendar, User, ArrowRight } from 'lucide-react';

export default function HouseOfficerDashboard() {
  const [profile, setProfile] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaveDate, setLeaveDate] = useState('');
  const [reason, setReason] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [procedureName, setProcedureName] = useState('');
  const [myLogbooks, setMyLogbooks] = useState([]);
  
  const [leaveMsg, setLeaveMsg] = useState('');
  const [logbookMsg, setLogbookMsg] = useState('');
  const [taskMsg, setTaskMsg] = useState('');

  // Interactive Task Modal State
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalStatus, setModalStatus] = useState('');
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  const fetchProfile = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth('/profile/', { signal });
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  }, []);

  const fetchShifts = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth('/scheduler/my_shifts', { signal });
      const data = await res.json();
      setShifts(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
      setShifts([]);
    }
  }, []);

  const fetchTasks = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth('/tasks/my_tasks', { signal });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
      setTasks([]);
    }
  }, []);

  const fetchRequests = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth('/leave_requests/my_requests', { signal });
      const data = await res.json();
      setMyRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
      setMyRequests([]);
    }
  }, []);

  const fetchLogbooks = useCallback(async (signal) => {
    try {
      const res = await fetchWithAuth('/tasks/logbook/my_logbook', { signal });
      const data = await res.json();
      setMyLogbooks(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
      setMyLogbooks([]);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);
    fetchShifts(controller.signal);
    fetchTasks(controller.signal);
    fetchRequests(controller.signal);
    fetchLogbooks(controller.signal);
    return () => controller.abort();
  }, [fetchProfile, fetchShifts, fetchTasks, fetchRequests, fetchLogbooks]);

  const handleOpenTaskModal = (task) => {
    setSelectedTask(task);
    setModalStatus(task.status);
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
    setModalStatus('');
  };

  const handleSaveTaskStatus = async () => {
    if (!selectedTask) return;
    setIsUpdatingTask(true);
    try {
      const res = await fetchWithAuth(`/tasks/${selectedTask.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: modalStatus })
      });
      if (res.ok) {
        setTaskMsg(`Task status updated to ${modalStatus}!`);
        fetchTasks();
        handleCloseTaskModal();
      } else {
        setTaskMsg('Failed to update task status.');
      }
    } catch (err) {
      setTaskMsg('Server connection error.');
    }
    setIsUpdatingTask(false);
    setTimeout(() => setTaskMsg(''), 4000);
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setLeaveMsg('Submitting...');
    try {
      const res = await fetchWithAuth('/leave_requests/', {
        method: 'POST',
        body: JSON.stringify({
          leave_date: leaveDate,
          reason: reason
        })
      });
      if (res.ok) {
        setLeaveMsg('Leave application submitted successfully!');
        setLeaveDate('');
        setReason('');
        fetchRequests();
      } else {
        const errData = await res.json();
        const detail = errData.detail;
        const msg = Array.isArray(detail) ? detail.map(e => e.msg).join(', ') : (detail || 'Failed to submit request.');
        setLeaveMsg(msg);
      }
    } catch (err) {
      setLeaveMsg('Server error.');
    }
  };

  const handleSubmitLogbook = async (e) => {
    e.preventDefault();
    setLogbookMsg('Submitting log...');
    try {
      const res = await fetchWithAuth('/tasks/logbook', {
        method: 'POST',
        body: JSON.stringify({
          procedure_name: procedureName
        })
      });
      if (res.ok) {
        setLogbookMsg('Procedure logged successfully!');
        setProcedureName('');
        fetchLogbooks();
      } else {
        const errData = await res.json();
        const detail = errData.detail;
        const msg = Array.isArray(detail) ? detail.map(e => e.msg).join(', ') : (detail || 'Failed to log procedure.');
        setLogbookMsg(msg);
      }
    } catch (err) {
      setLogbookMsg('Server error.');
    }
  };

  const nextShift = shifts.length > 0 ? shifts[0] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">House Officer Workspace</h1>
          <p className="text-sm text-slate-500 mt-1">Check assigned TMO tasks, submit logbook procedures, and apply for leaves.</p>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-indigo-600">
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">Active Track</span>
            <p className="text-2xl font-black text-slate-800 mt-3">{profile?.rotation_group_name || 'Loading...'}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Specialty Track Departments</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-600">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">Current Status</span>
            <p className="text-2xl font-black text-slate-800 mt-3">Active</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Ready for Assignments</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-amber-600">
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">Next Shift</span>
            <p className="text-2xl font-black text-slate-800 mt-3">
              {nextShift ? `${new Date(nextShift.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} (${nextShift.type})` : 'No duties'}
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1">Check "My Duty Roster" for full schedule</p>
          </div>
        </div>

        {/* Interactive TMO Tasks Feed */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ClipboardCheck className="text-indigo-600" size={28} />
                TMO Assigned Tasks Feed
              </h2>
              <p className="text-sm text-slate-500 mt-1">Click on any task card below to view full details and update your progress status.</p>
            </div>
          </div>

          {taskMsg && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-sm rounded-xl">
              {taskMsg}
            </div>
          )}

          {tasks.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
              <ClipboardCheck size={40} className="mx-auto text-slate-300 mb-2" />
              <p className="font-bold">No tasks assigned by your TMO yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleOpenTaskModal(t)}
                  className="p-5 border border-slate-200 rounded-2xl bg-white hover:bg-indigo-50/40 hover:border-indigo-300 hover:shadow-lg cursor-pointer transform hover:-translate-y-1 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {t.task_title}
                      </h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        t.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' :
                        t.status === 'In_Progress' ? 'bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse' :
                        'bg-amber-100 text-amber-900 border-amber-200'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                      {t.task_description || 'No detailed instructions provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">From: <strong className="text-slate-700">{t.tmo_name}</strong></span>
                    <span className="text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Click to Update <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaves Application & Logbook Submission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Leaves Application Module */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Leave Application</h2>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Leave Date</label>
                <input 
                  type="date"
                  value={leaveDate}
                  onChange={e => setLeaveDate(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Reason</label>
                <textarea 
                  rows="2"
                  placeholder="Explain your absence..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 bg-white font-semibold"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg shadow-sm"
              >
                Apply Leave
              </button>
              {leaveMsg && <p className="text-xs text-indigo-600 text-center font-bold">{leaveMsg}</p>}
            </form>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-700 mb-3">My Applications</h3>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                {myRequests.map(r => (
                  <div key={r.id} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-700">{r.leave_date}</p>
                      <p className="text-slate-500 italic">"{r.reason}"</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      r.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      r.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Procedure Logbooks Module */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Logbook Submission</h2>
            <form onSubmit={handleSubmitLogbook} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Performed Procedure Name</label>
                <input 
                  type="text"
                  placeholder="e.g., Appendectomy Assist"
                  value={procedureName}
                  onChange={e => setProcedureName(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 bg-white font-semibold"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg"
              >
                Log Procedure
              </button>
              {logbookMsg && <p className="text-xs text-indigo-600 text-center font-bold">{logbookMsg}</p>}
            </form>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Logged Procedures</h3>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                {myLogbooks.map(l => (
                  <div key={l.id} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-700">{l.procedure_name}</p>
                      <p className="text-slate-400">{l.date_performed}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      l.supervisor_approved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {l.supervisor_approved ? 'Approved' : 'Pending Verification'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* PRO TASK DETAIL MODAL POPUP */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Task Details</span>
                <h3 className="text-xl font-black mt-1 text-white">{selectedTask.task_title}</h3>
              </div>
              <button 
                onClick={handleCloseTaskModal}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned By TMO</label>
                <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-2">
                  <User size={16} className="text-indigo-600" /> {selectedTask.tmo_name}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detailed Instructions</label>
                <div className="mt-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-semibold leading-relaxed">
                  {selectedTask.task_description || 'No additional notes provided by TMO.'}
                </div>
              </div>

              {/* Status Update Pills */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Update Progress Status</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setModalStatus('Pending')}
                    className={`py-3 px-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                      modalStatus === 'Pending' 
                        ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock size={16} /> Pending
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalStatus('In_Progress')}
                    className={`py-3 px-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                      modalStatus === 'In_Progress' 
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock size={16} /> In Progress
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalStatus('Completed')}
                    className={`py-3 px-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                      modalStatus === 'Completed' 
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 size={16} /> Completed
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseTaskModal}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isUpdatingTask}
                onClick={handleSaveTaskStatus}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2"
              >
                {isUpdatingTask ? 'Updating...' : 'Save & Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
