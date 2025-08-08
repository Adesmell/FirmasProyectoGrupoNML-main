import React from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import EmailVerificationPage from './components/auth/EmailVerificationPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Principal from './components/Pages/Principal';
import ProfilePage from './components/Pages/ProfilePage';
import CertificateUploadPage from './components/Pages/CertificateUploadPage';
import CertificateGeneratorPage from './components/Pages/CertificateGeneratorPage';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
                  <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route 
            path="/principal" 
            element={
              <ProtectedRoute>
                <Principal />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/certificates/upload" 
            element={
              <ProtectedRoute>
                <CertificateUploadPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/certificates/generate" 
            element={
              <ProtectedRoute>
                <CertificateGeneratorPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;