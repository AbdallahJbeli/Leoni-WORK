import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login               from './pages/Login';
import ChangePassword      from './pages/ChangePassword';
import DashboardDemandeur  from './pages/demandeur/DashboardDemandeur';
import NouvelleDemande     from './pages/demandeur/NouvelleDemande';
import DashboardTechnicien from './pages/technicien/DashboardTechnicien';
import FicheTechnicien     from './pages/technicien/FicheTechnicien';
import DashboardQualite    from './pages/qualite/DashboardQualite';
import DashboardAdmin      from './pages/admin/DashboardAdmin';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Changement de mot de passe forcé — accessible à tous les rôles connectés */}
          <Route path="/change-password" element={
            <ProtectedRoute roles={['admin','demandeur','technicien','qualite']}>
              <ChangePassword />
            </ProtectedRoute>
          } />

          {/* Demandeur */}
          <Route path="/demandeur" element={
            <ProtectedRoute roles={['demandeur']}>
              <DashboardDemandeur />
            </ProtectedRoute>
          } />
          <Route path="/demandeur/nouvelle" element={
            <ProtectedRoute roles={['demandeur']}>
              <NouvelleDemande />
            </ProtectedRoute>
          } />

          {/* Technicien */}
          <Route path="/technicien" element={
            <ProtectedRoute roles={['technicien']}>
              <DashboardTechnicien />
            </ProtectedRoute>
          } />
          <Route path="/technicien/fiche/:id" element={
            <ProtectedRoute roles={['technicien']}>
              <FicheTechnicien />
            </ProtectedRoute>
          } />

          {/* Qualité */}
          <Route path="/qualite" element={
            <ProtectedRoute roles={['qualite']}>
              <DashboardQualite />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <DashboardAdmin />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}