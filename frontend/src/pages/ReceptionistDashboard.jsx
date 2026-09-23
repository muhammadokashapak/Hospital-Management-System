import { useState, useEffect } from 'react';
import { Search, Printer, UserPlus, FileText, User, Sparkles, Clock, CheckCircle2, Stethoscope, Ticket, Phone, AlertCircle } from 'lucide-react';
import { fetchWithAuth } from '../config';

export default function ReceptionistDashboard() {
  const [searchPhone, setSearchPhone] = useState('');
  const [patient, setPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  
  // Registration Form
  const [regData, setRegData] = useState({
    fullName: '', phone: '', age: '', gender: 'Male', cnic: '', emergencyContact: 'None'
  });
  
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  
  // Queue tracking
  const [queue, setQueue] = useState([]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info'); // 'info' | 'success' | 'error'

  // Print state
  const [printData, setPrintData] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetchWithAuth('/appointments/doctors');
        if (res.ok) {
          const data = await res.json();
          setDoctors(data);
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
      }
    };
    fetchDoctors();
    fetchQueue();
    
    // Poll the queue every 5 seconds for live status updates
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetchWithAuth('/appointments/hospital_queue');
      if (res.ok) {
        const data = await res.json();
        const mappedQueue = data.map(apt => ({
          id: apt.id,
          name: apt.patient?.full_name || 'Unknown',
          doctor: apt.doctor?.user?.full_name || 'Unknown',
          dept: apt.doctor?.department?.name || 'General OPD',
          token: apt.token_number,
          status: apt.status
        })).sort((a, b) => a.token - b.token);
        setQueue(mappedQueue);
      }
    } catch (err) {
      console.error("Error fetching queue:", err);
    }
  };

  const handleSearch = async () => {
    if (!searchPhone) {
      setMsg('Please enter a phone number to search.');
      setMsgType('error');
      return;
    }
    try {
      setMsg('Searching patient database...');
      setMsgType('info');
      const res = await fetchWithAuth(`/patients/search?phone=${searchPhone}`);
      if (res.ok) {
        const data = await res.json();
        setPatient(data);
        setShowPatientModal(true);
        setMsg(`Found registered patient: ${data.full_name}`);
        setMsgType('success');
      } else {
        setMsg('Patient not found. Please register below.');
        setMsgType('error');
        setPatient(null);
        setShowPatientModal(false);
      }
    } catch (err) {
      setMsg('Error searching patient.');
      setMsgType('error');
    }
  };

  const handleRegisterAndToken = async () => {
    try {
      setMsg('Processing registration & token...');
      setMsgType('info');
      let patientId = patient?.id;
      
      // If no patient found, register them
      if (!patient) {
        if (!regData.fullName || !regData.phone || !regData.age) {
          setMsg('Please fill in Full Name, Phone, and Age.');
          setMsgType('error');
          return;
        }

        const res = await fetchWithAuth('/patients/', {
          method: 'POST',
          body: JSON.stringify({
            full_name: regData.fullName,
            phone: regData.phone,
            age: parseInt(regData.age),
            gender: regData.gender,
            cnic: regData.cnic || undefined,
            emergency_contact: regData.emergencyContact
          })
        });
        if (!res.ok) {
          const err = await res.json();
          const detail = err.detail;
          const message = Array.isArray(detail) ? detail.map(e => e.msg).join(', ') : (detail || 'Failed to register patient');
          setMsg(message);
          setMsgType('error');
          return;
        }
        const data = await res.json();
        patientId = data.id;
        setPatient(data);
      }

      if (!selectedDoctorId) {
        setMsg('Please select an OPD doctor.');
        setMsgType('error');
        return;
      }

      // Generate Token
      const tokenRes = await fetchWithAuth('/appointments/', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: patientId,
          doctor_id: parseInt(selectedDoctorId)
        })
      });
      
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        setMsg(`🎉 Success! Token #${tokenData.token_number} generated.`);
        setMsgType('success');
        fetchQueue();
        
        // Reset form
        setPatient(null);
        setSearchPhone('');
        setRegData({ fullName: '', phone: '', age: '', gender: 'Male', cnic: '', emergencyContact: 'None' });
      } else {
        setMsg('Failed to generate token.');
        setMsgType('error');
      }
    } catch (err) {
      setMsg('Server error.');
      setMsgType('error');
    }
  };

  const handlePrint = (item) => {
    setPrintData({ ...item, time: new Date().toLocaleTimeString() });
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const waitingCount = queue.filter(q => q.status === 'Waiting').length;
  const completedCount = queue.filter(q => q.status === 'Completed').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Banner */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Ticket className="text-indigo-600" size={34} />
              Reception Desk & Token Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">Fast patient registration, OPD consultant token assignment, and live queue monitoring.</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-indigo-600 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">Total Tokens</span>
              <p className="text-3xl font-black text-slate-900 mt-2">{queue.length}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Issued Today</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Ticket size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">Waiting Queue</span>
              <p className="text-3xl font-black text-slate-900 mt-2">{waitingCount}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Patients In Line</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Clock size={24} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-600 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">Consultations Done</span>
              <p className="text-3xl font-black text-slate-900 mt-2">{completedCount}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Completed Today</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {msg && (
          <div className={`p-4 rounded-2xl font-bold text-sm border shadow-2xs animate-in fade-in duration-200 ${
            msgType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
            msgType === 'error' ? 'bg-red-50 border-red-200 text-red-900' :
            'bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Fast Search & New Registration (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Fast Lookup Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <Search className="text-indigo-600" size={22} /> Fast Patient Lookup
              </h2>
              <p className="text-xs text-slate-500 mb-4">Search registered patient records by mobile phone number.</p>
              
              <div className="space-y-3">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                  <input 
                    type="tel" 
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-base font-semibold text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 bg-white" 
                    placeholder="e.g. 0300-1234567"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleSearch} 
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Search size={18} /> Lookup Patient
                </button>
              </div>
            </div>

            {/* New Registration & Token Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-200 border-t-4 border-t-indigo-600">
              <h2 className="text-xl font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <UserPlus className="text-indigo-600" size={22} /> New Patient Registration
              </h2>
              <p className="text-xs text-slate-500 mb-6">Enter patient demographic info and assign an OPD consultant doctor.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Patient full name"
                    value={regData.fullName} 
                    onChange={e => setRegData({...regData, fullName: e.target.value})} 
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-base font-semibold text-slate-900 bg-white" 
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Age</label>
                    <input 
                      type="number" 
                      placeholder="Years"
                      value={regData.age} 
                      onChange={e => setRegData({...regData, age: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-base font-semibold text-slate-900 bg-white" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Gender</label>
                    <select 
                      value={regData.gender} 
                      onChange={e => setRegData({...regData, gender: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white text-base font-semibold text-slate-900"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="Mobile phone number"
                    value={regData.phone} 
                    onChange={e => setRegData({...regData, phone: e.target.value})} 
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-base font-semibold text-slate-900 bg-white" 
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Assign OPD Doctor</label>
                  <select 
                    value={selectedDoctorId} 
                    onChange={e => setSelectedDoctorId(e.target.value)} 
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white text-base font-extrabold text-slate-900 mb-4 shadow-2xs"
                  >
                    <option value="">-- Select OPD Doctor --</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.user?.full_name || `Doctor #${doc.id}`} ({doc.department?.name || 'General'})
                      </option>
                    ))}
                  </select>
                  
                  <button 
                    onClick={handleRegisterAndToken} 
                    className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-lg transition-all text-lg flex items-center justify-center gap-2"
                  >
                    <FileText size={22} /> Generate OPD Token
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Today's Active Tokens Queue (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="text-indigo-600" size={26} />
                  Today's Active OPD Queue ({queue.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Live token queue automatically updated every 5 seconds.</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-3.5 px-4 font-bold text-slate-600 uppercase text-xs tracking-wider">Token #</th>
                    <th className="py-3.5 px-4 font-bold text-slate-600 uppercase text-xs tracking-wider">Patient Name</th>
                    <th className="py-3.5 px-4 font-bold text-slate-600 uppercase text-xs tracking-wider">Assigned Doctor</th>
                    <th className="py-3.5 px-4 font-bold text-slate-600 uppercase text-xs tracking-wider">Status</th>
                    <th className="py-3.5 px-4 font-bold text-slate-600 uppercase text-xs tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-900 rounded-xl font-black text-lg border border-indigo-200 shadow-2xs">
                          #{item.token}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-black text-slate-900 text-base">{item.name}</td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-800 text-sm">{item.doctor}</p>
                        <span className="text-[11px] text-slate-500 font-semibold">{item.dept}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`py-1 px-3 rounded-full text-xs font-bold border ${
                          item.status === 'Waiting' ? 'bg-amber-100 text-amber-900 border-amber-200' :
                          item.status === 'Called' ? 'bg-indigo-600 text-white border-indigo-700 animate-pulse shadow-sm' :
                          item.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                          item.status === 'In-Consultation' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                          'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => handlePrint(item)} 
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
                        >
                          <Printer size={15} /> Print Slip
                        </button>
                      </td>
                    </tr>
                  ))}

                  {queue.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400">
                        <Ticket size={40} className="mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-base text-slate-600">No active tokens in queue today.</p>
                        <p className="text-xs text-slate-400">Tokens generated for patients will appear here live.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* Hidden Thermal Printer Slip */}
        {printData && (
          <div className="hidden print-only p-4 font-mono text-sm max-w-[80mm] mx-auto border-dashed border-2 border-slate-400">
            <h2 className="text-center font-extrabold text-xl mb-1">DHM ERP HOSPITAL</h2>
            <p className="text-center font-bold mb-3">OPD Token Slip</p>
            <hr className="border-t border-black mb-3"/>
            <p className="text-5xl text-center font-black my-4">#{printData.token}</p>
            <hr className="border-t border-black mb-3"/>
            <p><strong>Patient:</strong> {printData.name}</p>
            <p><strong>Doctor:</strong> {printData.doctor}</p>
            <p><strong>Department:</strong> {printData.dept}</p>
            <p><strong>Time:</strong> {printData.time}</p>
            <hr className="border-t border-black mt-3 mb-2"/>
            <p className="text-center text-xs font-bold">Please wait in OPD waiting area for your turn.</p>
          </div>
        )}

        {/* Patient Details Modal */}
        {showPatientModal && patient && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
              <div className="bg-indigo-600 p-6 text-center text-white">
                <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-inner">
                  <User size={36} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-white">{patient.full_name}</h2>
                <p className="text-indigo-200 font-bold text-xs uppercase tracking-wider mt-1">Patient ID #{patient.id}</p>
              </div>
              
              <div className="p-6 space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold text-xs uppercase">Phone Number</span>
                  <span className="text-slate-900 font-black text-base">{patient.phone}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold text-xs uppercase">Age</span>
                  <span className="text-slate-900 font-black text-base">{patient.age} Yrs</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold text-xs uppercase">Gender</span>
                  <span className="text-slate-900 font-black text-base">{patient.gender}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500 font-bold text-xs uppercase">CNIC</span>
                  <span className="text-slate-900 font-black text-base">{patient.cnic || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500 font-bold text-xs uppercase">Emg. Contact</span>
                  <span className="text-slate-900 font-black text-base">{patient.emergency_contact || 'None'}</span>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  onClick={() => {
                     setRegData({
                       fullName: patient.full_name,
                       phone: patient.phone,
                       age: patient.age,
                       gender: patient.gender,
                       cnic: patient.cnic || '',
                       emergencyContact: patient.emergency_contact || 'None'
                     });
                     setShowPatientModal(false);
                  }}
                  className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  Auto-Fill Patient Info
                </button>
                <button 
                  onClick={() => setShowPatientModal(false)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
