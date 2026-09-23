import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../config';
import { Pill, CheckCircle2, RefreshCw, Package, User, X, Search, ChevronRight, Check, Calendar, Stethoscope } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PharmacistDashboard() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending'); // 'Pending', 'Dispensed', 'All'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientGroup, setSelectedPatientGroup] = useState(null);

  const fetchPrescriptions = async () => {
    try {
      const res = await fetchWithAuth('/pharmacy/prescriptions');
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data || []);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    const interval = setInterval(fetchPrescriptions, 6000);
    return () => clearInterval(interval);
  }, []);

  // Dispense single item
  const handleDispenseItem = async (id, medName) => {
    // Optimistic update
    setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: 'Dispensed' } : p));
    toast.success(`Dispensed ${medName || 'medication'}!`, { icon: '💊' });

    try {
      const res = await fetchWithAuth(`/pharmacy/prescriptions/${id}/dispense`, { method: 'POST' });
      if (!res.ok) {
        toast.error('Failed to update server.');
        fetchPrescriptions(); // revert on failure
      }
    } catch (err) {
      console.error(err);
      toast.error('Server connection error.');
      fetchPrescriptions();
    }
  };

  // Dispense all pending for selected patient
  const handleDispenseAllForPatient = async (items) => {
    const pendingItems = items.filter(i => i.status === 'Pending');
    if (pendingItems.length === 0) return;

    const loadingToast = toast.loading(`Dispensing ${pendingItems.length} medications...`);

    // Optimistic update
    const pendingIds = pendingItems.map(i => i.id);
    setPrescriptions(prev => prev.map(p => pendingIds.includes(p.id) ? { ...p, status: 'Dispensed' } : p));

    try {
      await Promise.all(pendingIds.map(id =>
        fetchWithAuth(`/pharmacy/prescriptions/${id}/dispense`, { method: 'POST' })
      ));
      toast.success('All medications dispensed successfully!', { id: loadingToast });
      fetchPrescriptions();
    } catch (err) {
      console.error(err);
      toast.error('Error dispensing some items.', { id: loadingToast });
      fetchPrescriptions();
    }
  };

  // Filter items based on tab selection and search query
  const filteredPrescriptions = prescriptions.filter(p => {
    const matchesFilter = filter === 'All' ? true : p.status === filter;
    const nameMatch = (p.patient?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const medMatch = (p.medication || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && (nameMatch || medMatch);
  });

  // Group prescriptions by Patient
  const groupedByPatient = filteredPrescriptions.reduce((acc, presc) => {
    const pKey = presc.patient?.full_name || `Patient #${presc.patient_id || presc.id}`;
    if (!acc[pKey]) {
      acc[pKey] = {
        patient_name: pKey,
        doctor_name: presc.doctor?.user?.full_name || 'Dr. OPD',
        created_at: presc.created_at,
        patient: presc.patient,
        items: []
      };
    }
    acc[pKey].items.push(presc);
    return acc;
  }, {});

  const patientGroups = Object.values(groupedByPatient);

  const totalPendingMeds = prescriptions.filter(p => p.status === 'Pending').length;
  const totalDispensedMeds = prescriptions.filter(p => p.status === 'Dispensed').length;
  const uniquePatientsPendingCount = Object.values(
    prescriptions.filter(p => p.status === 'Pending').reduce((acc, p) => {
      const k = p.patient?.full_name || p.id;
      acc[k] = true;
      return acc;
    }, {})
  ).length;

  // Active group items for modal
  const activeModalGroupItems = selectedPatientGroup
    ? prescriptions.filter(p => (p.patient?.full_name || `Patient #${p.patient_id || p.id}`) === selectedPatientGroup.patient_name)
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Header Navbar */}
      <div className="bg-blue-600 border-b border-blue-700 px-6 md:px-10 py-5 flex flex-col md:flex-row justify-between items-start md:items-center shadow-md gap-4 text-white">
        <div className="flex items-center gap-3.5">
          <div className="bg-blue-700 p-2.5 rounded-2xl border border-blue-500 shadow-sm">
            <Pill size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Pharmacy Dispensing Portal</h1>
            <p className="text-xs font-bold text-blue-100 mt-0.5">Patient prescription fulfillment & live medicine dispensing queue</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchPrescriptions} 
            className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95"
          >
            <RefreshCw size={16} /> Refresh Feed
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0 font-black text-xl">
              {uniquePatientsPendingCount}
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Pending Patients</p>
              <p className="text-2xl font-black text-slate-900">{uniquePatientsPendingCount} Patients Waiting</p>
              <p className="text-[11px] font-bold text-amber-600 mt-0.5">{totalPendingMeds} Total Medicine Items</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 font-black text-xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Dispensed Today</p>
              <p className="text-2xl font-black text-slate-900">{totalDispensedMeds} Items</p>
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5">Fulfilled Prescriptions</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 font-black text-xl">
              <Pill size={24} />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Rx Records</p>
              <p className="text-2xl font-black text-slate-900">{prescriptions.length} Records</p>
              <p className="text-[11px] font-bold text-blue-600 mt-0.5">Live Intranet System</p>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex gap-2 w-full sm:w-auto">
            {['Pending', 'Dispensed', 'All'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                  filter === tab
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab} Prescriptions
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search patient name or medication..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Main Patient Prescriptions List */}
        {loading ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-md space-y-3">
            <RefreshCw className="animate-spin mx-auto text-blue-600" size={32} />
            <p className="font-extrabold text-slate-700 text-sm">Loading patient prescriptions feed...</p>
          </div>
        ) : patientGroups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-md space-y-3">
            <Package size={52} className="text-slate-300 mx-auto" />
            <h3 className="text-lg font-black text-slate-900">No {filter} Patient Prescriptions</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-semibold">
              No prescriptions match the selected status or search term. New prescriptions sent by OPD doctors will appear here live.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patientGroups.map(group => {
              const pendingCount = group.items.filter(i => i.status === 'Pending').length;
              const isAllDispensed = pendingCount === 0;

              return (
                <div
                  key={group.patient_name}
                  className={`bg-white border rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5 ${
                    pendingCount > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-blue-500'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 font-black shadow-xs">
                          <User size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-black text-slate-900 truncate leading-snug">
                            {group.patient_name}
                          </h3>
                          <p className="text-xs font-bold text-slate-500 mt-0.5">
                            Doctor: <strong className="text-slate-800">{group.doctor_name}</strong>
                          </p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap shrink-0 border ${
                        pendingCount > 0 
                          ? 'bg-amber-100 text-amber-900 border-amber-300' 
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}>
                        {pendingCount > 0 ? `${pendingCount} Pending` : 'Fulfilled ✓'}
                      </span>
                    </div>

                    {/* Follow-Up & Refill Strategy Badge */}
                    {(() => {
                      const fuItem = group.items.find(i => i.follow_up_days || i.follow_up_type);
                      const days = fuItem?.follow_up_days || 7;
                      const isDirectRefill = fuItem?.follow_up_type === 'Direct_Pharmacy_Refill';
                      const notes = fuItem?.follow_up_notes;

                      return (
                        <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                          isDirectRefill 
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950' 
                            : 'bg-blue-50/90 border-blue-300 text-blue-950'
                        }`}>
                          <div className="flex items-center justify-between font-black text-xs">
                            <span className="flex items-center gap-1.5">
                              {isDirectRefill ? <Pill size={14} className="text-emerald-600" /> : <Stethoscope size={14} className="text-blue-600" />}
                              {isDirectRefill ? 'Direct Refill Approved' : 'Re-Consultation Required'}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isDirectRefill ? 'bg-emerald-700 text-white' : 'bg-blue-700 text-white'
                            }`}>
                              {days}d Follow-Up
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold opacity-90 leading-tight">
                            {isDirectRefill 
                              ? 'Doctor Decision: Patient is approved for direct pharmacy refill without doctor re-checkup.' 
                              : 'Doctor Decision: Patient must complete OPD Doctor checkup before next refill.'}
                          </p>
                          {notes && (
                            <p className="text-[10px] italic font-bold text-slate-800 bg-white/90 p-1.5 rounded-lg border border-slate-200">
                              💬 Doctor Note: {notes}
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Prescription Preview Snippet */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        Prescribed Medicines ({group.items.length})
                      </p>
                      <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                        {group.items.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-200">
                            <span className="font-extrabold text-slate-800 truncate pr-2">{item.medication}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                              item.status === 'Dispensed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.dosage}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Open Dispense Modal Button */}
                  <button
                    onClick={() => setSelectedPatientGroup(group)}
                    className={`w-full py-3 px-4 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${
                      pendingCount > 0 
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' 
                        : 'bg-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span>View Prescriptions & Dispense</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POPUP MODAL: Patient Medicine Dispensing Sheet */}
      {selectedPatientGroup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden transform animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Blue Navbar Header */}
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-700 border border-blue-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
                  <User size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">OPD Pharmacy Dispensing Sheet</span>
                  <h3 className="text-xl font-black text-white leading-tight">{selectedPatientGroup.patient_name}</h3>
                  <p className="text-xs font-semibold text-blue-100 mt-0.5">Prescribed by {selectedPatientGroup.doctor_name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPatientGroup(null)}
                className="text-blue-100 hover:text-white bg-blue-700/80 hover:bg-blue-700 p-2 rounded-xl border border-blue-500/50 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Active Prescription Items */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* Top Banner Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-200 p-4 rounded-2xl gap-3">
                <div>
                  <p className="text-xs font-black text-slate-900">
                    Total Prescribed Items: <span className="text-blue-600">{activeModalGroupItems.length}</span>
                  </p>
                  <p className="text-[11px] font-semibold text-slate-500">
                    Pending Fulfillment: {activeModalGroupItems.filter(i => i.status === 'Pending').length} items
                  </p>
                </div>

                {activeModalGroupItems.some(i => i.status === 'Pending') && (
                  <button
                    onClick={() => handleDispenseAllForPatient(activeModalGroupItems)}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Dispense All Medicines
                  </button>
                )}
              </div>

              {/* Follow-Up Refill Strategy Banner for Pharmacist */}
              {(() => {
                const fuItem = activeModalGroupItems.find(i => i.follow_up_days || i.follow_up_type);
                const days = fuItem?.follow_up_days || 7;
                const isDirectRefill = fuItem?.follow_up_type === 'Direct_Pharmacy_Refill';
                const notes = fuItem?.follow_up_notes;

                return (
                  <div className={`p-4 rounded-2xl border text-xs space-y-2 shadow-xs ${
                    isDirectRefill 
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                      : 'bg-blue-50 border-blue-300 text-blue-950'
                  }`}>
                    <div className="flex items-center justify-between font-black text-sm">
                      <span className="flex items-center gap-2">
                        {isDirectRefill ? <Pill size={18} className="text-emerald-600" /> : <Stethoscope size={18} className="text-blue-600" />}
                        {isDirectRefill ? 'Direct Pharmacy Refill Approved' : 'OPD Re-Consultation Required'}
                      </span>
                      <span className={`text-xs font-black px-3 py-1 rounded-full ${
                        isDirectRefill ? 'bg-emerald-700 text-white' : 'bg-blue-700 text-white'
                      }`}>
                        {days} Days Follow-Up
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-relaxed">
                      {isDirectRefill 
                        ? '🟢 Pharmacist Instruction: Doctor has authorized direct medicine refill upon patient request. OPD re-consultation is NOT required for this refill.' 
                        : '🔵 Pharmacist Instruction: Doctor requires the patient to visit OPD for re-consultation before the next medicine refill.'}
                    </p>
                    {notes && (
                      <div className="bg-white/90 p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                        💬 Doctor Notes: <span className="font-normal italic">{notes}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Individual Prescription Items Feed */}
              <div className="space-y-3">
                {activeModalGroupItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`border rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-sm ${
                      item.status === 'Dispensed' ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-amber-200/90'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                        item.status === 'Dispensed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        <Pill size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                          <h4 className="font-black text-slate-900 text-base">{item.medication}</h4>
                        </div>
                        <p className="text-xs font-bold text-slate-600 mt-0.5">
                          Dosage / Schedule: <span className="text-blue-700 font-extrabold">{item.dosage}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                        item.status === 'Dispensed' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {item.status}
                      </span>

                      {item.status === 'Pending' ? (
                        <button
                          onClick={() => handleDispenseItem(item.id, item.medication)}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md active:scale-95"
                        >
                          <CheckCircle2 size={15} /> Dispense
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-xl">
                          <Check size={14} /> Dispensed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedPatientGroup(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
              >
                Close Sheet
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
