import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
    LayoutDashboard, Users, Activity, Stethoscope, 
    Pill, FlaskConical, Stethoscope as Nurse, Calendar,
    CreditCard, UserCircle, LogOut, Menu, X, Clock,
    AlertCircle, Building2, Scissors, Camera, Droplet, 
    UsersRound, PackageSearch, Search, CheckCircle2, ShieldCheck,
    Flame, Landmark, ShieldAlert, Biohazard, Wrench, Hammer, Sparkles,
    Utensils, Cross, Ambulance, ChevronDown, ChevronRight, Layers, Shield
} from 'lucide-react';

const ALL_30_DEPARTMENTS = [
  { name: "1. Core Admin Command", path: "/admin", category: "Operations & Admin" },
  { name: "2. Reception Desk", path: "/reception", category: "Clinical Care" },
  { name: "3. OPD Doctor Consultation", path: "/doctor", category: "Clinical Care" },
  { name: "4. Checked Patients Archive", path: "/checked-patients?filter=all", category: "Clinical Care" },
  { name: "5. IPD Ward Admissions", path: "/admissions", category: "Clinical Care" },
  { name: "6. Emergency ER & Trauma", path: "/emergency", category: "Clinical Care" },
  { name: "7. ICU Critical Care", path: "/icu", category: "Clinical Care" },
  { name: "8. Nurse Station & eMAR", path: "/nurse", category: "Clinical Care" },
  { name: "9. Operation Theatre (OT)", path: "/ot", category: "Clinical Care" },

  { name: "10. Laboratory LIS", path: "/lab", category: "Diagnostics & Labs" },
  { name: "11. Radiology RIS / PACS", path: "/radiology", category: "Diagnostics & Labs" },
  { name: "12. Pharmacy & FEFO Stock", path: "/pharmacist", category: "Diagnostics & Labs" },
  { name: "13. Blood Bank Management", path: "/blood-bank", category: "Diagnostics & Labs" },

  { name: "14. Shift Planner (HO Rota)", path: "/admin/scheduler", category: "Operations & Admin" },
  { name: "15. HR & Staff Attendance", path: "/hr", category: "Operations & Admin" },
  { name: "16. House Officer Workspace", path: "/ho", category: "Operations & Admin" },
  { name: "17. HO Duty Roster", path: "/ho/shifts", category: "Operations & Admin" },
  { name: "18. TMO Operations", path: "/tmo", category: "Operations & Admin" },
  { name: "19. TMO HO Roster", path: "/tmo/hos", category: "Operations & Admin" },

  { name: "20. Billing & Cashier POS", path: "/billing", category: "Finance & Store" },
  { name: "21. Accounts Ledger", path: "/accounts", category: "Finance & Store" },
  { name: "22. Inventory & Store", path: "/inventory", category: "Finance & Store" },
  { name: "23. CSSD Sterilization", path: "/cssd", category: "Finance & Store" },

  { name: "24. Quality Assurance", path: "/qa", category: "Support & Facilities" },
  { name: "25. Infection Control", path: "/infection-control", category: "Support & Facilities" },
  { name: "26. Biomedical Engineering", path: "/biomedical", category: "Support & Facilities" },
  { name: "27. Facilities Maintenance", path: "/maintenance", category: "Support & Facilities" },
  { name: "28. Housekeeping Sync", path: "/housekeeping", category: "Support & Facilities" },
  { name: "29. Security Passes", path: "/security", category: "Support & Facilities" },
  { name: "30. Ambulance Dispatch", path: "/ambulance", category: "Support & Facilities" },
  { name: "31. Dietetics & Nutrition", path: "/dietetics", category: "Support & Facilities" },
  { name: "32. Mortuary Records", path: "/mortuary", category: "Support & Facilities" }
];

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Accordion Dropdown Open States
    const [openCategories, setOpenCategories] = useState({
        clinical: true,
        diagnostics: true,
        operations: true,
        finance: true,
        support: true
    });

    const toggleCategory = (cat) => {
        setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const name = localStorage.getItem('name') || 'User';
        
        if (!token) {
            navigate('/login');
        } else {
            setUser({ role, name });
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (!user) return null;

    const isSuperAdmin = user.role === 'SuperAdmin' || user.role === 'PlatformSuperAdmin';
    const isAdmin = user.role === 'Admin';

    // Grouped Nav Links for Dropdown Accordions
    const getGroupedNavLinks = () => {
        if (isSuperAdmin) {
            return [
                {
                    key: 'platform',
                    title: 'SaaS Platform Control',
                    icon: <Shield className="w-4 h-4 text-white" />,
                    items: [
                        { name: "Platform Super Admin", path: "/super-admin", icon: <Shield className="w-4 h-4 text-white" /> }
                    ]
                }
            ];
        }

        if (isAdmin) {
            return [
                {
                    key: 'admin_command',
                    title: 'Admin Command',
                    icon: <LayoutDashboard className="w-4 h-4 text-white" />,
                    items: [
                        { name: "Admin Command Center", path: "/admin", icon: <LayoutDashboard className="w-4 h-4 text-white" /> },
                        { name: "Shift Planner (HO Rota)", path: "/admin/scheduler", icon: <Clock className="w-4 h-4 text-indigo-200" /> },
                        { name: "HR & Staff Attendance", path: "/hr", icon: <UsersRound className="w-4 h-4 text-blue-200" /> },
                        { name: "Accounts Ledger", path: "/accounts", icon: <Landmark className="w-4 h-4 text-emerald-300" /> }
                    ]
                }
            ];
        }

        const clinical = [];
        const diagnostics = [];
        const operations = [];
        const finance = [];
        const support = [];

        // Clinical Group
        if (isAdmin || user.role === 'Receptionist') {
            clinical.push({ name: "Reception Front Desk", path: "/reception", icon: <Users className="w-4 h-4 text-blue-200" /> });
        }
        if (isAdmin || user.role === 'Doctor') {
            clinical.push({ name: "OPD Doctor Consultation", path: "/doctor", icon: <Stethoscope className="w-4 h-4 text-blue-200" /> });
            clinical.push({ name: "All Checked Patients", path: "/checked-patients?filter=all", icon: <CheckCircle2 className="w-4 h-4 text-emerald-200" /> });
        }
        if (isAdmin || ['Nurse', 'Doctor', 'Emergency_Staff'].includes(user.role)) {
            clinical.push({ name: "IPD Ward Admissions", path: "/admissions", icon: <Building2 className="w-4 h-4 text-indigo-200" /> });
        }
        if (isAdmin || user.role === 'Emergency_Staff' || user.role === 'Doctor') {
            clinical.push({ name: "Emergency ER & Trauma", path: "/emergency", icon: <Activity className="w-4 h-4 text-red-300" /> });
        }
        if (isAdmin || user.role === 'ICU_Staff' || user.role === 'Doctor') {
            clinical.push({ name: "ICU Critical Care", path: "/icu", icon: <Activity className="w-4 h-4 text-pink-300" /> });
        }
        if (isAdmin || user.role === 'Nurse') {
            clinical.push({ name: "Nurse Station & eMAR", path: "/nurse", icon: <Nurse className="w-4 h-4 text-emerald-300" /> });
        }
        if (isAdmin || user.role === 'OT_Staff') {
            clinical.push({ name: "Operation Theatre", path: "/ot", icon: <Scissors className="w-4 h-4 text-purple-300" /> });
        }

        // Diagnostics Group
        if (isAdmin || user.role === 'LabTech' || user.role === 'Lab_Tech') {
            diagnostics.push({ name: "Laboratory LIS", path: "/lab", icon: <FlaskConical className="w-4 h-4 text-teal-300" /> });
        }
        if (isAdmin || user.role === 'Radiology_Tech') {
            diagnostics.push({ name: "Radiology RIS / PACS", path: "/radiology", icon: <Camera className="w-4 h-4 text-sky-300" /> });
        }
        if (isAdmin || user.role === 'Pharmacist') {
            diagnostics.push({ name: "Pharmacy FEFO", path: "/pharmacist", icon: <Pill className="w-4 h-4 text-emerald-300" /> });
        }
        if (isAdmin || user.role === 'Blood_Bank_Staff') {
            diagnostics.push({ name: "Blood Bank Management", path: "/blood-bank", icon: <Droplet className="w-4 h-4 text-rose-300" /> });
        }

        // Operations Group
        if (isAdmin || user.role === 'HospitalOwner' || user.role === 'Owner') {
            operations.push({ name: "Hospital Owner Portal", path: "/hospital-owner", icon: <Building2 className="w-4 h-4 text-emerald-300" /> });
        }
        if (isAdmin) {
            operations.push({ name: "Admin Command Center", path: "/admin", icon: <LayoutDashboard className="w-4 h-4 text-white" /> });
            operations.push({ name: "Shift Planner (HO Rota)", path: "/admin/scheduler", icon: <Clock className="w-4 h-4 text-indigo-200" /> });
        }
        if (isAdmin || user.role === 'HR') {
            operations.push({ name: "HR & Staff Attendance", path: "/hr", icon: <UsersRound className="w-4 h-4 text-blue-200" /> });
        }
        if (isAdmin || user.role === 'TMO') {
            operations.push({ name: "TMO Operations", path: "/tmo", icon: <Stethoscope className="w-4 h-4 text-purple-200" /> });
            operations.push({ name: "HO Roster & List", path: "/tmo/hos", icon: <UsersRound className="w-4 h-4 text-blue-200" /> });
        }
        if (isAdmin || user.role === 'House_Officer' || user.role === 'House Officer') {
            operations.push({ name: "HO Workspace", path: "/ho", icon: <Activity className="w-4 h-4 text-blue-200" /> });
            operations.push({ name: "My Duty Roster", path: "/ho/shifts", icon: <Clock className="w-4 h-4 text-indigo-200" /> });
        }

        // Finance & Store Group
        if (isAdmin || user.role === 'Billing') {
            finance.push({ name: "Billing & Cashier POS", path: "/billing", icon: <CreditCard className="w-4 h-4 text-emerald-300" /> });
        }
        if (isAdmin) {
            finance.push({ name: "Accounts Ledger", path: "/accounts", icon: <Landmark className="w-4 h-4 text-emerald-300" /> });
            finance.push({ name: "CSSD Sterilization", path: "/cssd", icon: <Flame className="w-4 h-4 text-orange-300" /> });
        }
        if (isAdmin || user.role === 'Inventory') {
            finance.push({ name: "Inventory Store", path: "/inventory", icon: <PackageSearch className="w-4 h-4 text-blue-200" /> });
        }

        // Support & Facilities Group (Admin & Specialized Staff)
        if (isAdmin) {
            support.push({ name: "Quality Assurance", path: "/qa", icon: <ShieldAlert className="w-4 h-4 text-purple-300" /> });
            support.push({ name: "Infection Control", path: "/infection-control", icon: <Biohazard className="w-4 h-4 text-rose-300" /> });
            support.push({ name: "Biomedical Engg", path: "/biomedical", icon: <Wrench className="w-4 h-4 text-indigo-300" /> });
            support.push({ name: "Facilities Maintenance", path: "/maintenance", icon: <Hammer className="w-4 h-4 text-amber-300" /> });
            support.push({ name: "Housekeeping Sync", path: "/housekeeping", icon: <Sparkles className="w-4 h-4 text-teal-300" /> });
            support.push({ name: "Security Passes", path: "/security", icon: <ShieldCheck className="w-4 h-4 text-slate-300" /> });
            support.push({ name: "Ambulance Dispatch", path: "/ambulance", icon: <Ambulance className="w-4 h-4 text-red-300" /> });
            support.push({ name: "Dietetics Nutrition", path: "/dietetics", icon: <Utensils className="w-4 h-4 text-emerald-300" /> });
            support.push({ name: "Mortuary Records", path: "/mortuary", icon: <Cross className="w-4 h-4 text-slate-300" /> });
        } else {
            if (user.role === 'Maintenance') {
                support.push({ name: "Biomedical Engg", path: "/biomedical", icon: <Wrench className="w-4 h-4 text-indigo-300" /> });
                support.push({ name: "Facilities Maintenance", path: "/maintenance", icon: <Hammer className="w-4 h-4 text-amber-300" /> });
            }
            if (user.role === 'Housekeeping') {
                support.push({ name: "Housekeeping Sync", path: "/housekeeping", icon: <Sparkles className="w-4 h-4 text-teal-300" /> });
            }
            if (user.role === 'Security') {
                support.push({ name: "Security Passes", path: "/security", icon: <ShieldCheck className="w-4 h-4 text-slate-300" /> });
            }
            if (user.role === 'Ambulance_Driver') {
                support.push({ name: "Ambulance Dispatch", path: "/ambulance", icon: <Ambulance className="w-4 h-4 text-red-300" /> });
            }
            if (user.role === 'Dietitian') {
                support.push({ name: "Dietetics Nutrition", path: "/dietetics", icon: <Utensils className="w-4 h-4 text-emerald-300" /> });
            }
        }

        return [
            { key: 'clinical', title: 'Clinical & Patient Care', icon: <Stethoscope className="w-4 h-4 text-blue-200" />, items: clinical },
            { key: 'diagnostics', title: 'Diagnostics & Labs', icon: <FlaskConical className="w-4 h-4 text-teal-200" />, items: diagnostics },
            { key: 'operations', title: 'Operations & Rota', icon: <Layers className="w-4 h-4 text-purple-200" />, items: operations },
            { key: 'finance', title: 'Finance & Store', icon: <CreditCard className="w-4 h-4 text-emerald-200" />, items: finance },
            { key: 'support', title: 'Support & Facilities', icon: <Shield className="w-4 h-4 text-slate-200" />, items: support },
        ].filter(group => group.items.length > 0);
    };

    const groupedLinks = getGroupedNavLinks();

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
            {/* SIDEBAR WITH COLLAPSIBLE DROPDOWN MENUS */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-600 border-r border-blue-700 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block transition-transform duration-300 ease-in-out shadow-xl`}>
                <div className="h-full flex flex-col">
                    {/* Sidebar Header */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-blue-500/50 bg-blue-700/60 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white text-blue-600 rounded-xl flex items-center justify-center font-black shadow-md text-lg">
                                H
                            </div>
                            <div>
                                <h1 className="text-base font-black text-white tracking-tight leading-none">DHM ERP</h1>
                                <p className="text-[10px] text-blue-200 font-extrabold mt-0.5">Hospital Management</p>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-blue-200 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation Dropdown Accordions */}
                    <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
                        <div className="text-[10px] font-black text-blue-200/80 uppercase tracking-widest px-2 mb-2">Hospital Modules</div>

                        {groupedLinks.map(group => {
                            const isOpen = openCategories[group.key];
                            const hasActiveChild = group.items.some(item => location.pathname === item.path || (location.pathname + location.search) === item.path);

                            return (
                                <div key={group.key} className="bg-blue-700/30 rounded-2xl border border-blue-500/30 overflow-hidden transition-all">
                                    {/* Dropdown Accordion Header Button */}
                                    <button
                                        onClick={() => toggleCategory(group.key)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-black transition-all ${
                                            hasActiveChild 
                                                ? 'bg-blue-700/80 text-white' 
                                                : 'text-blue-100 hover:bg-blue-700/50 hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            {group.icon}
                                            <span>{group.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-blue-500/40 text-blue-100 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                                                {group.items.length}
                                            </span>
                                            <ChevronDown className={`w-3.5 h-3.5 text-blue-200 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    {/* Sub-Items List */}
                                    {isOpen && (
                                        <div className="px-2 py-1.5 space-y-1 bg-blue-800/40 border-t border-blue-500/20 animate-in fade-in duration-200">
                                            {group.items.map((link, idx) => {
                                                const fullUrl = location.pathname + location.search;
                                                const isActive = fullUrl === link.path || (location.pathname === link.path && !location.search && !link.path.includes('?'));
                                                return (
                                                    <Link 
                                                        key={idx} 
                                                        to={link.path}
                                                        onClick={() => setSidebarOpen(false)}
                                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-bold text-[11px] ${
                                                            isActive 
                                                                ? 'bg-white text-blue-700 shadow-sm font-black' 
                                                                : 'text-blue-100 hover:bg-blue-600/70 hover:text-white'
                                                        }`}
                                                    >
                                                        {link.icon}
                                                        <span className="truncate">{link.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Bottom User Actions */}
                    <div className="p-3 border-t border-blue-500/50 bg-blue-700/40 space-y-1.5 shrink-0">
                        <Link 
                            to="/profile"
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all font-bold text-xs ${
                                location.pathname === '/profile' 
                                    ? 'bg-white text-blue-700 shadow-md' 
                                    : 'text-blue-100 hover:bg-blue-500/60 hover:text-white'
                            }`}
                        >
                            <UserCircle className="w-5 h-5" />
                            <span>Profile</span>
                        </Link>
                        <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all font-bold text-xs text-rose-100 hover:bg-rose-600/80 hover:text-white"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50">
                
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-blue-600 border-b border-blue-700 flex items-center justify-between px-4 shrink-0 text-white">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="text-white p-1">
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="font-black text-white">DHM ERP</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm font-black text-white">{user.name}</p>
                            <p className="text-[10px] uppercase font-black text-blue-200">{user.role}</p>
                        </div>
                    </div>
                </header>

                {/* Desktop Light Blue Navbar Header with 30-Department Global Switcher */}
                <header className="hidden lg:flex h-16 bg-blue-600 border-b border-blue-700 items-center justify-between px-8 shrink-0 text-white shadow-md">
                    <div className="flex items-center gap-4 flex-1">
                        {/* 30-Department Global Switcher Dropdown (Hidden for SuperAdmin) */}
                        {isSuperAdmin ? (
                            <div className="flex items-center gap-2 bg-indigo-900/60 border border-indigo-400/50 px-4 py-2 rounded-xl text-xs font-black text-white shadow-inner">
                                <Shield className="w-4 h-4 text-indigo-300" />
                                <span>SaaS Platform Control Panel</span>
                            </div>
                        ) : (
                            <div className="relative">
                                <select 
                                    onChange={(e) => navigate(e.target.value)}
                                    value={location.pathname}
                                    className="bg-blue-700/90 border border-blue-400/60 rounded-xl px-4 py-2 text-xs font-black text-white cursor-pointer focus:outline-none focus:bg-blue-800 transition-all shadow-inner"
                                >
                                    <option value="" disabled>🏢 Global Department Switcher (30 Modules)...</option>
                                    
                                    {['Clinical Care', 'Diagnostics & Labs', 'Operations & Admin', 'Finance & Store', 'Support & Facilities'].map((cat, catIdx) => (
                                        <optgroup key={catIdx} label={`── ${cat.toUpperCase()} ──`} className="bg-slate-900 text-blue-300 font-extrabold py-1">
                                            {ALL_30_DEPARTMENTS.filter(d => d.category === cat).map((dept, idx) => (
                                                <option key={idx} value={dept.path} className="bg-slate-800 text-white font-medium py-1">
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 bg-blue-700/70 px-4 py-1.5 rounded-full border border-blue-500/50 ml-4 shadow-sm">
                        <div className="w-7 h-7 rounded-full bg-white text-blue-600 font-black text-xs flex items-center justify-center">
                            {user.name ? user.name.charAt(0) : 'U'}
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-white leading-tight">{user.name}</p>
                            <p className="text-[10px] uppercase font-bold text-blue-200 leading-tight">{user.role}</p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 pb-20 lg:pb-6">
                    <Outlet />
                </main>
            </div>
            
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Bottom Quick Navigation Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-blue-700/95 backdrop-blur-md border-t border-blue-500/50 px-4 py-2 flex items-center justify-around text-white shadow-2xl">
                <button 
                    onClick={() => setSidebarOpen(true)}
                    className="flex flex-col items-center gap-1 text-blue-200 hover:text-white transition-colors"
                >
                    <Menu size={20} />
                    <span className="text-[10px] font-bold">Modules</span>
                </button>

                <Link 
                    to="/doctor" 
                    className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/doctor' ? 'text-white font-black' : 'text-blue-200'}`}
                >
                    <Stethoscope size={20} />
                    <span className="text-[10px] font-bold">OPD</span>
                </Link>

                <Link 
                    to="/reception" 
                    className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/reception' ? 'text-white font-black' : 'text-blue-200'}`}
                >
                    <Users size={20} />
                    <span className="text-[10px] font-bold">Reception</span>
                </Link>

                <Link 
                    to="/admissions" 
                    className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/admissions' ? 'text-white font-black' : 'text-blue-200'}`}
                >
                    <Building2 size={20} />
                    <span className="text-[10px] font-bold">Wards</span>
                </Link>

                <Link 
                    to="/profile" 
                    className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/profile' ? 'text-white font-black' : 'text-blue-200'}`}
                >
                    <UserCircle size={20} />
                    <span className="text-[10px] font-bold">Profile</span>
                </Link>
            </div>
        </div>
    );
}

