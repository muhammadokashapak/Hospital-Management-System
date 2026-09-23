import { useState, useEffect } from 'react';
import { CalendarDays, Settings, CheckCircle2, Users, PlayCircle, Loader2, FileText, Grid, Moon, Sun, ShieldAlert, Award } from 'lucide-react';
import { fetchWithAuth } from '../config';

export default function ShiftPlanner() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  
  const [scheduleGenerated, setScheduleGenerated] = useState(false);
  const [rawShifts, setRawShifts] = useState([]);
  const [dailyRota, setDailyRota] = useState([]);
  const [doctorBreakdown, setDoctorBreakdown] = useState([]);
  const [houseOfficers, setHouseOfficers] = useState([]);
  const [startDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [viewMode, setViewMode] = useState('sheet'); // 'sheet' or 'grid'
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState('');

  // 1. Fetch Rotation Groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetchWithAuth('/admin/rotation_groups/');
        if (res.ok) {
          const data = await res.json();
          setGroups(data);
          if (data.length > 0) {
            setSelectedGroup(data[0].id.toString());
          }
        }
      } catch (err) {
        console.error("Error fetching rotation groups", err);
      }
    };
    fetchGroups();
  }, []);

  // 2. Fetch Shifts whenever the selected group changes
  useEffect(() => {
    if (selectedGroup) {
      fetchShifts(selectedGroup);
    }
  }, [selectedGroup]);

  const fetchShifts = async (groupId) => {
    try {
      const end = new Date();
      end.setDate(end.getDate() + 13);
      const endDate = end.toISOString().split('T')[0];
      
      const res = await fetchWithAuth(`/scheduler/shifts?start_date=${startDate}&end_date=${endDate}&group_id=${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setRawShifts(data);
        if (data.length > 0) {
          setScheduleGenerated(true);
          processRotaData(data);
        } else {
          setScheduleGenerated(false);
          setDailyRota([]);
          setDoctorBreakdown([]);
          setHouseOfficers([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const processRotaData = (shifts) => {
    // 1. Group shifts by Date for the Rota Sheet
    const dateMap = new Map();
    const docMap = new Map();

    shifts.forEach(s => {
      // Build Doctor breakdown
      if (!docMap.has(s.house_officer_id)) {
        docMap.set(s.house_officer_id, {
          id: s.house_officer_id,
          name: s.ho_name,
          gender: s.gender,
          nights: 0,
          evenings: 0,
          mornings: 0,
          offs: 0,
          points: 0,
          shifts: Array(14).fill('O')
        });
      }
      const doc = docMap.get(s.house_officer_id);
      doc.points += s.points;
      if (s.type === 'Night') doc.nights += 1;
      else if (s.type === 'Evening') doc.evenings += 1;
      else if (s.type === 'Morning') doc.mornings += 1;
      else if (s.type === 'Off') doc.offs += 1;

      // Fill grid array
      const sDate = new Date(s.date);
      const refDate = new Date(startDate);
      const diffTime = Math.abs(sDate - refDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 14) {
        doc.shifts[diffDays] = s.type.charAt(0).toUpperCase();
      }

      // Build Daily Rota
      if (!dateMap.has(s.date)) {
        dateMap.set(s.date, {
          dateStr: s.date,
          eveningDoc: [],
          nightDoc: [],
          offDocs: []
        });
      }
      const dayItem = dateMap.get(s.date);
      if (s.type === 'Evening') dayItem.eveningDoc.push(s.ho_name);
      else if (s.type === 'Night') dayItem.nightDoc.push(s.ho_name);
      else if (s.type === 'Off') dayItem.offDocs.push(s.ho_name);
    });

    // Convert date map to sorted array
    const sortedRota = Array.from(dateMap.values()).sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));
    setDailyRota(sortedRota);
    setDoctorBreakdown(Array.from(docMap.values()));
    setHouseOfficers(Array.from(docMap.values()));
  };

  const handleGenerateShifts = async () => {
    if (!selectedGroup) return;
    setGenerating(true);
    setGenMsg('');
    try {
      const res = await fetchWithAuth(`/scheduler/generate_shifts?rotation_group_id=${selectedGroup}&start_date=${startDate}&days=30`, {
        method: 'POST'
      });
      if (res.ok) {
        setGenMsg('✅ Rota generated successfully for this batch!');
        fetchShifts(selectedGroup);
      } else {
        const errData = await res.json();
        setGenMsg(`❌ ${errData.detail || 'Failed to generate.'}`);
      }
    } catch (err) {
      setGenMsg('❌ Server error.');
    }
    setGenerating(false);
    setTimeout(() => setGenMsg(''), 4000);
  };

  const shiftColors = {
    'M': 'bg-amber-100 text-amber-900 border-amber-300 font-black',
    'E': 'bg-sky-100 text-sky-900 border-sky-300 font-black',
    'N': 'bg-indigo-900 text-white border-indigo-950 font-black',
    'O': 'bg-slate-100 text-slate-700 border-slate-300 font-black'
  };

  const selectedGroupName = groups.find(g => g.id.toString() === selectedGroup)?.name || 'Selected Batch';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="max-w-[1500px] mx-auto space-y-6">
        
        {/* Header Bar */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-blue-600 p-6 rounded-2xl shadow-xl border border-blue-700 gap-6 text-white">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <CalendarDays className="text-white" size={32} />
              Hospital Executive Duty Rota
            </h1>
            <p className="text-blue-100 mt-1 text-xs font-semibold">Clean 4-Color Duty Rota Sheet & Analytics for Batch Management</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Users className="text-indigo-600" size={20} />
              <select 
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 font-bold text-base rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
              >
                {groups.length === 0 && <option value="">No Batches Found</option>}
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            
            {/* View Mode Toggle Buttons */}
            <div className="flex bg-slate-200 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('sheet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'sheet' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={16} /> Rota Sheet
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid size={16} /> Full Grid
              </button>
            </div>

            <button 
              onClick={handleGenerateShifts}
              disabled={generating || !selectedGroup}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition-all disabled:opacity-50 text-sm"
            >
              {generating ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
              Generate Rota
            </button>
          </div>
        </header>

        {genMsg && (
          <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 shadow-sm font-bold text-center text-slate-800">
            {genMsg}
          </div>
        )}

        {scheduleGenerated ? (
          <div>
            {viewMode === 'sheet' ? (
              /* --- EXECUTIVE ROTA SHEET VIEW (MATCHING USER PHOTO) --- */
              <div className="space-y-8">
                
                {/* Main Rota Sheet Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 bg-blue-600 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800/50">
                        {selectedGroupName}
                      </span>
                      <h2 className="text-2xl font-bold mt-2">Revised Duty Rota Sheet</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Showing Evening, Night, and Post-Night Off duty assignments. All other HOs are on Morning duty.</p>
                    </div>
                    <div className="flex gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/30"><Sun size={14} /> Evening (2pm-8pm)</span>
                      <span className="flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/30"><Moon size={14} /> Night (8pm-8am)</span>
                      <span className="flex items-center gap-1.5 bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-600"><ShieldAlert size={14} /> Post-Night Off</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase text-slate-600 tracking-wider">
                          <th className="py-3.5 px-6 w-56">Day & Date</th>
                          <th className="py-3.5 px-6">Evening Duty (2pm-8pm)</th>
                          <th className="py-3.5 px-6">Night Duty (8pm-8am)</th>
                          <th className="py-3.5 px-6">Post-Night Off (Rest)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {dailyRota.map((day, idx) => {
                          const dateObj = new Date(day.dateStr);
                          const dayName = dateObj.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' });
                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-4 px-6 font-extrabold text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                {dayName}
                              </td>
                              
                              <td className="py-4 px-6">
                                {day.eveningDoc.length > 0 ? (
                                  day.eveningDoc.map((name, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-lg font-bold text-xs shadow-2xs">
                                      <Sun size={13} className="text-amber-600" />
                                      {name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-xs italic">-</span>
                                )}
                              </td>

                              <td className="py-4 px-6">
                                {day.nightDoc.length > 0 ? (
                                  day.nightDoc.map((name, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 bg-indigo-900 text-white border border-indigo-950 px-3 py-1 rounded-lg font-bold text-xs shadow-xs">
                                      <Moon size={13} className="text-indigo-300" />
                                      {name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-xs italic">-</span>
                                )}
                              </td>

                              <td className="py-4 px-6">
                                {day.offDocs.length > 0 ? (
                                  day.offDocs.map((name, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1 rounded-lg font-semibold text-xs">
                                      <ShieldAlert size={13} className="text-slate-400" />
                                      {name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-slate-400 text-xs italic">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Duty Breakdown Summary Table (Matching lower section of Photo) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Award className="text-indigo-600" size={24} />
                        Duty Breakdown & Count Summary
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Total Nights, Evenings, and Offs count per doctor for audit</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-xs font-black uppercase text-slate-700 tracking-wider">
                          <th className="py-3 px-4">Doctor Name</th>
                          <th className="py-3 px-4">Gender</th>
                          <th className="py-3 px-4 text-center">Night Duties (N)</th>
                          <th className="py-3 px-4 text-center">Evening Duties (E)</th>
                          <th className="py-3 px-4 text-center">Morning Duties (M)</th>
                          <th className="py-3 px-4 text-center">Post-Night Offs (O)</th>
                          <th className="py-3 px-4 text-right">Total Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {doctorBreakdown.map(doc => (
                          <tr key={doc.id} className="hover:bg-slate-50 transition-colors font-medium text-slate-800">
                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                              {doc.name}
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500">{doc.gender}</td>
                            <td className="py-3 px-4 text-center font-bold">
                              <span className="bg-indigo-900 text-white px-3 py-1 rounded-lg text-xs font-black border border-indigo-950 inline-block w-10">
                                {doc.nights}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold">
                              <span className="bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-lg text-xs font-black inline-block w-10">
                                {doc.evenings}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-600">
                              {doc.mornings}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-500">
                              {doc.offs}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-indigo-600 text-base">
                              {doc.points.toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              /* --- FULL MATRIX GRID VIEW --- */
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 lg:col-span-3 overflow-hidden">
                  <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold">Full 14-Day Matrix View</h2>
                    <div className="flex gap-4 text-xs font-medium">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 border border-yellow-200 inline-block"></span> M = Morning</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-100 border border-orange-200 inline-block"></span> E = Evening</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-800 border border-blue-900 inline-block"></span> N = Night</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 border border-gray-200 inline-block"></span> O = Off</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto p-4">
                    <table className="min-w-full text-center border-collapse">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 text-left border-b-2 border-slate-200 font-bold text-slate-600 w-48">Officer</th>
                          {[...Array(14)].map((_, i) => (
                            <th key={i} className="py-2 px-2 border-b-2 border-slate-200 text-slate-500 font-bold">Day {i+1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {houseOfficers.map((ho) => (
                          <tr key={ho.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-4 px-4 text-left font-bold text-slate-800">
                              {ho.name}
                              <div className="text-xs text-slate-500 font-normal">{ho.gender}</div>
                            </td>
                            {ho.shifts.map((shift, i) => (
                              <td key={i} className="py-2 px-1">
                                <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center font-bold border ${shiftColors[shift] || shiftColors['O']}`}>
                                  {shift}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-indigo-200 border-t-4 border-t-indigo-600 p-6 flex flex-col">
                  <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Settings className="text-indigo-600" />
                    Audit Summary
                  </h2>
                  <div className="flex-1 space-y-4">
                    {houseOfficers.map(ho => (
                      <div key={ho.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-800">{ho.name}</div>
                          <div className="text-xs text-slate-500">{ho.gender}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-indigo-600">{ho.points.toFixed(1)}</div>
                          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Points</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-bold flex items-center gap-2">
                      <CheckCircle2 size={18} /> Schedule is fully equitable and verified.
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border border-slate-200 shadow-sm mt-8">
            <CalendarDays size={64} className="text-slate-300 mb-4" />
            <h2 className="text-2xl font-bold text-slate-600">No Schedule Generated for this Batch</h2>
            <p className="text-slate-500 mt-2">Select a batch above and click "Generate Rota" to create the executive sheet.</p>
          </div>
        )}

      </div>
    </div>
  );
}
