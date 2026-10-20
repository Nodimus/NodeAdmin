import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ConsultorioProvider } from './contexts/ConsultorioContext';
import { PrivateRoute } from './routes/PrivateRoute';
import { RequirePermission } from './routes/RequirePermission';
import { AdminLayout } from './components/layout/AdminLayout';

// Rotas Públicas do Consultório
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage';
import { BookingConfirmationPage } from './pages/public/BookingConfirmationPage';
import { PublicPrescriptionPage } from './pages/public/PublicPrescriptionPage';
import { OfflinePage } from './pages/public/OfflinePage';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

// Rotas Privadas (/admin)
import { DashboardPage } from './pages/admin/DashboardPage';
import { AppointmentsPage } from './pages/admin/AppointmentsPage';
import { PatientsPage } from './pages/admin/PatientsPage';
import { ExamsPage } from './pages/admin/ExamsPage';
import { PrescriptionsPage } from './pages/admin/PrescriptionsPage';
import { FinancialPage } from './pages/admin/FinancialPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { HomePageEditor } from './pages/admin/HomePageEditor';
import { UsersPage } from './pages/admin/UsersPage';
import { RolesPage } from './pages/admin/RolesPage';
import { AuditPage } from './pages/admin/AuditPage';
import { ReportsPage } from './pages/admin/ReportsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ConsultorioProvider>
        <AuthProvider>
          <Routes>
            {/* Rotas Públicas: Portal Institucional do Consultório */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/agendar/confirmacao" element={<BookingConfirmationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
            <Route path="/receita-digital/:token" element={<PublicPrescriptionPage />} />

            {/* Rotas Privadas (/admin) — Acesso exclusivo da equipe com autenticação e validação por módulo */}
            <Route path="/admin" element={<PrivateRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route
                  path="agenda"
                  element={
                    <RequirePermission perm="agenda.ler">
                      <AppointmentsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="pacientes"
                  element={
                    <RequirePermission perm="pacientes.ler">
                      <PatientsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="exames"
                  element={
                    <RequirePermission perm="atendimento.ler">
                      <ExamsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="prescricoes"
                  element={
                    <RequirePermission perm="receitas.ler">
                      <PrescriptionsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="financeiro"
                  element={
                    <RequirePermission perm="financeiro.ler">
                      <FinancialPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="usuarios"
                  element={
                    <RequirePermission perm="usuarios.ler">
                      <UsersPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="papeis"
                  element={
                    <RequirePermission perm="papeis.ler">
                      <RolesPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="auditoria"
                  element={
                    <RequirePermission perm="auditoria.ler">
                      <AuditPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="relatorios"
                  element={
                    <RequirePermission perm="relatorios.ler">
                      <ReportsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="home"
                  element={
                    <RequirePermission perm="empresa.editar">
                      <HomePageEditor />
                    </RequirePermission>
                  }
                />
                <Route
                  path="empresa"
                  element={
                    <RequirePermission perm="empresa.ler">
                      <SettingsPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="configuracoes"
                  element={
                    <RequirePermission perm="empresa.ler">
                      <SettingsPage />
                    </RequirePermission>
                  }
                />
              </Route>
            </Route>

            {/* Rota Offline PWA */}
            <Route path="/offline" element={<OfflinePage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Componentes Globais PWA */}
          <PWAInstallBanner />
          <OfflineIndicator />
        </AuthProvider>
      </ConsultorioProvider>
    </BrowserRouter>
  );
}
