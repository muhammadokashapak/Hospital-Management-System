import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Monitor, RefreshCw, Ticket, Clock, User, CheckCircle2 } from 'lucide-react';

export default function LiveQueue() {
  const [currentTokens, setCurrentTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveQueue = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hospitalId = urlParams.get('hospital_id') || '1';
        const res = await fetch(`${API_URL}/appointments/live_queue?hospital_id=${hospitalId}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentTokens(data || []);
        }
      } catch (err) {
        console.error("Network error fetching live queue", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveQueue();
    const interval = setInterval(fetchLiveQueue, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Banner Header */}
      <header className="bg-blue-600 border-b border-blue-700 p-6 sm:p-8 text-center text-white shadow-md">
        <div className="flex items-center justify-center gap-3 mb-1">
          <Monitor size={36} className="text-white" />
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            HOSPITAL <span className="text-blue-100">OPD LIVE QUEUE</span>
          </h1>
        </div>
        <p className="text-blue-100 text-base sm:text-xl font-bold mt-1">
          Real-Time OPD Token Announcement & Waiting Display Board
        </p>
      </header>

      {/* Main Display Grid */}
      <main className="flex-1 p-6 sm:p-10 flex items-center justify-center">
        {loading ? (
          <div className="text-center py-20 text-slate-500">
            <RefreshCw className="animate-spin mx-auto mb-3 text-blue-600" size={40} />
            <p className="font-bold text-lg">Loading live token board...</p>
          </div>
        ) : currentTokens.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-12 shadow-lg max-w-lg w-full">
            <Ticket size={56} className="text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900">No Active OPD Queue</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Token numbers will appear here automatically on screen as patients register at reception.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentTokens.map((item, index) => (
              <div 
                key={index} 
                className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl flex flex-col justify-between text-center hover:border-blue-500 transition-all"
              >
                
                {/* Doctor & Room Header */}
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-blue-200">
                    <User size={14} /> {item.room}
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 leading-snug line-clamp-2 min-h-[56px]">
                    {item.doctor}
                  </h2>
                </div>
                
                {/* Huge Token Badge */}
                <div className="my-8 py-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-center items-center shadow-inner">
                  <p className="text-slate-500 text-xs uppercase tracking-widest font-black mb-2 flex items-center gap-1.5">
                    <Ticket size={16} className="text-blue-600" /> Currently Serving Token
                  </p>
                  <div className="text-7xl sm:text-8xl font-black leading-none text-blue-600 tracking-tight">
                    {item.current}
                  </div>
                  {item.patient_name && item.patient_name !== "No Active Patient" && (
                    <p className="text-xs font-extrabold text-slate-700 mt-3 truncate max-w-[240px]">
                      Patient: <span className="text-blue-700">{item.patient_name}</span>
                    </p>
                  )}
                </div>

                {/* Next Token Banner */}
                <div className="bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
                    <Clock size={16} /> Next Token In Queue:
                  </span>
                  <span className="text-2xl font-black text-white px-3 py-0.5 bg-blue-700 rounded-xl border border-blue-500">
                    {item.next}
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
      
      <footer className="bg-white p-5 text-center text-slate-500 text-xs font-bold border-t border-slate-200 shadow-xs">
        DHLMS Live Offline Hospital Intranet Display Board • Auto-Refreshes Live Every 4 Seconds
      </footer>
    </div>
  );
}
