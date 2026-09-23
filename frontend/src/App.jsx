import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import OPD from './pages/OPD';
import LiveQueue from './pages/LiveQueue';
import ShiftPlanner from './pages/ShiftPlanner';
import AdminDashboard from './pages/AdminDashboard';
import Admissions from './pages/Admissions';
import CheckedPatients from './pages/CheckedPatients';

import { Toaster } from 'react-hot-toast';

// ERP Portals
import PharmacistDashboard from './pages/PharmacistDashboard';
import LabTechDashboard from './pages/LabTechDashboard';
import NurseDashboard from './pages/NurseDashboard';
import TMODashboard from './pages/TMODashboard';
import TMOHoManagement from './pages/TMOHoManagement';
import HouseOfficerDashboard from './pages/HouseOfficerDashboard';
import HODutyRoster from './pages/HODutyRoster';

// Department Portals (Full 30-Department Suite)
import EmergencyDashboard from './pages/EmergencyDashboard';
import ICUDashboard from './pages/ICUDashboard';
import RadiologyDashboard from './pages/RadiologyDashboard';
import BillingDashboard from './pages/BillingDashboard';
import BloodBankDashboard from './pages/BloodBankDashboard';
import OTDashboard from './pages/OTDashboard';
import InventoryDashboard from './pages/InventoryDashboard';
import HRDashboard from './pages/HRDashboard';
import CSSDDashboard from './pages/CSSDDashboard';
import AccountsDashboard from './pages/AccountsDashboard';
import QADashboard from './pages/QADashboard';
import InfectionControlDashboard from './pages/InfectionControlDashboard';
import BiomedicalDashboard from './pages/BiomedicalDashboard';
import MaintenanceDashboard from './pages/MaintenanceDashboard';
import HousekeepingDashboard from './pages/HousekeepingDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import AmbulanceDashboard from './pages/AmbulanceDashboard';
import DieteticsDashboard from './pages/DieteticsDashboard';
import MortuaryDashboard from './pages/MortuaryDashboard';

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import HospitalOwnerDashboard from './pages/HospitalOwnerDashboard';

import Layout from './components/Layout';
import Profile from './pages/Profile';

import ActivateAccount from './pages/ActivateAccount';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const role = (localStorage.getItem('role') || '').replace('RoleEnum.', '');
  const token = localStorage.getItem('token');
  if (!token || !role || (allowedRoles && !allowedRoles.includes(role))) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/activate-account" element={<ActivateAccount />} />
        <Route path="/queue" element={<LiveQueue />} />
        
        {/* All Authenticated routes wrapped in Layout */}
        <Route element={<Layout />}>
          {/* Platform Super Admin & Hospital Owner Portals */}
          <Route path="/super-admin" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'PlatformSuperAdmin']}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/hospital-owner" element={<ProtectedRoute allowedRoles={['HospitalOwner', 'Owner', 'Admin']}><HospitalOwnerDashboard /></ProtectedRoute>} />

          {/* Core Portals */}
          <Route path="/reception" element={<ProtectedRoute allowedRoles={['Receptionist', 'Admin']}><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/doctor" element={<ProtectedRoute allowedRoles={['Doctor', 'Admin']}><OPD /></ProtectedRoute>} />
          <Route path="/checked-patients" element={<ProtectedRoute allowedRoles={['Doctor', 'Admin']}><CheckedPatients /></ProtectedRoute>} />
          <Route path="/admissions" element={<ProtectedRoute allowedRoles={['Nurse', 'ICU_Staff', 'Emergency_Staff', 'Admin', 'Doctor']}><Admissions /></ProtectedRoute>} />
          
          {/* Admin / Management Portals */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin', 'HospitalOwner']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/scheduler" element={<ProtectedRoute allowedRoles={['Admin']}><ShiftPlanner /></ProtectedRoute>} />
          
          {/* Specialized ERP Portals */}
          <Route path="/pharmacist" element={<ProtectedRoute allowedRoles={['Pharmacist', 'Admin']}><PharmacistDashboard /></ProtectedRoute>} />
          <Route path="/lab" element={<ProtectedRoute allowedRoles={['LabTech', 'Lab_Tech', 'Admin']}><LabTechDashboard /></ProtectedRoute>} />
          <Route path="/nurse" element={<ProtectedRoute allowedRoles={['Nurse', 'Admin']}><NurseDashboard /></ProtectedRoute>} />
          <Route path="/tmo" element={<ProtectedRoute allowedRoles={['TMO', 'Admin']}><TMODashboard /></ProtectedRoute>} />
          <Route path="/tmo/hos" element={<ProtectedRoute allowedRoles={['TMO', 'Admin']}><TMOHoManagement /></ProtectedRoute>} />
          <Route path="/ho" element={<ProtectedRoute allowedRoles={['House_Officer', 'House Officer', 'Admin']}><HouseOfficerDashboard /></ProtectedRoute>} />
          <Route path="/ho/shifts" element={<ProtectedRoute allowedRoles={['House_Officer', 'House Officer', 'Admin']}><HODutyRoster /></ProtectedRoute>} />
          
          {/* 30-Department ERP Suite */}
          <Route path="/emergency" element={<ProtectedRoute allowedRoles={['Emergency_Staff', 'Admin', 'Doctor', 'Nurse']}><EmergencyDashboard /></ProtectedRoute>} />
          <Route path="/icu" element={<ProtectedRoute allowedRoles={['ICU_Staff', 'Admin', 'Doctor', 'Nurse']}><ICUDashboard /></ProtectedRoute>} />
          <Route path="/radiology" element={<ProtectedRoute allowedRoles={['Radiology_Tech', 'Admin', 'Doctor']}><RadiologyDashboard /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute allowedRoles={['Billing', 'Admin', 'Receptionist']}><BillingDashboard /></ProtectedRoute>} />
          <Route path="/blood-bank" element={<ProtectedRoute allowedRoles={['Blood_Bank_Staff', 'Admin', 'Doctor', 'Nurse']}><BloodBankDashboard /></ProtectedRoute>} />
          <Route path="/ot" element={<ProtectedRoute allowedRoles={['OT_Staff', 'Admin', 'Doctor', 'Nurse']}><OTDashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute allowedRoles={['Inventory', 'Admin', 'Pharmacist']}><InventoryDashboard /></ProtectedRoute>} />
          <Route path="/hr" element={<ProtectedRoute allowedRoles={['HR', 'Admin']}><HRDashboard /></ProtectedRoute>} />
          <Route path="/cssd" element={<ProtectedRoute allowedRoles={['Admin', 'Nurse', 'OT_Staff']}><CSSDDashboard /></ProtectedRoute>} />
          <Route path="/accounts" element={<ProtectedRoute allowedRoles={['Admin', 'Billing']}><AccountsDashboard /></ProtectedRoute>} />
          <Route path="/qa" element={<ProtectedRoute allowedRoles={['Admin', 'Doctor', 'Nurse']}><QADashboard /></ProtectedRoute>} />
          <Route path="/infection-control" element={<ProtectedRoute allowedRoles={['Admin', 'Doctor', 'Nurse']}><InfectionControlDashboard /></ProtectedRoute>} />
          <Route path="/biomedical" element={<ProtectedRoute allowedRoles={['Admin', 'Maintenance']}><BiomedicalDashboard /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute allowedRoles={['Admin', 'Maintenance']}><MaintenanceDashboard /></ProtectedRoute>} />
          <Route path="/housekeeping" element={<ProtectedRoute allowedRoles={['Admin', 'Nurse', 'Housekeeping']}><HousekeepingDashboard /></ProtectedRoute>} />
          <Route path="/security" element={<ProtectedRoute allowedRoles={['Admin', 'Security']}><SecurityDashboard /></ProtectedRoute>} />
          <Route path="/ambulance" element={<ProtectedRoute allowedRoles={['Admin', 'Emergency_Staff', 'Ambulance_Driver']}><AmbulanceDashboard /></ProtectedRoute>} />
          <Route path="/dietetics" element={<ProtectedRoute allowedRoles={['Admin', 'Dietitian', 'Nurse']}><DieteticsDashboard /></ProtectedRoute>} />
          <Route path="/mortuary" element={<ProtectedRoute allowedRoles={['Admin', 'Doctor', 'Nurse']}><MortuaryDashboard /></ProtectedRoute>} />

          {/* Profile Route */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
