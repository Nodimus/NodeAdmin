import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ConsultorioProvider } from './contexts/ConsultorioContext';
import { PrivateRoute } from './routes/PrivateRoute';
import { AdminLayout } from './components/layout/AdminLayout';

// Rotas Públicas do Consultório
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';

// Rotas Privadas (/admin)
import { DashboardPage } from './pages/admin/DashboardPage';
import { AppointmentsPage } from './pages/admin/AppointmentsPage';
import { PatientsPage } from './pages/admin/PatientsPage';
import { ExamsPage } from './pages/admin/ExamsPage';
import { PrescriptionsPage } from './pages/admin/PrescriptionsPage';
import { InventoryPage } from './pages/admin/InventoryPage';
import { FinancialPage } from './pages/admin/FinancialPage';
import { SettingsPage } from './pages/admin/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ConsultorioProvider>
        <AuthProvider>
          <Routes>
            {/* Rotas Públicas: Portal Institucional do Consultório */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />

            {/* Rotas Privadas (/admin) — Acesso exclusivo da equipe com login obrigatório */}
            <Route path="/admin" element={<PrivateRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="agenda" element={<AppointmentsPage />} />
                <Route path="pacientes" element={<PatientsPage />} />
                <Route path="exames" element={<ExamsPage />} />
                <Route path="prescricoes" element={<PrescriptionsPage />} />
                <Route path="estoque" element={<InventoryPage />} />
                <Route path="financeiro" element={<FinancialPage />} />
                <Route path="configuracoes" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ConsultorioProvider>
    </BrowserRouter>
  );
}
