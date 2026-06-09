import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { CurrentCompanyProvider } from "@/hooks/useCurrentCompany";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import OfflinePage from "@/pages/OfflinePage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { SystemValidationAlert } from "@/components/dev/SystemValidationAlert";
import { ConsentBanner } from "@/components/consent/ConsentBanner";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignUpPage = lazy(() => import("./pages/SignUpPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const Index = lazy(() => import("./pages/Index"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const SharedProposalPage = lazy(() => import("./pages/SharedProposalPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const TrustCenterPage = lazy(() => import("./pages/TrustCenterPage"));

// Wave 5 — Perceived performance: delay the spinner so cached chunks don't
// trigger a flash. After ~180ms we fade in a minimal branded indicator.
const Loader = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 180);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="flex items-center justify-center min-h-screen bg-background" aria-live="polite">
      {show && (
        <div
          className="h-8 w-8 rounded-full border-2 border-border border-t-primary animate-spin animate-fade-in motion-reduce:animate-none"
          role="status"
          aria-label="Carregando"
        />
      )}
    </div>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Quick win auditoria: defaults conservadores para reduzir refetch desnecessário.
      // Hooks específicos podem sobrescrever (ex.: AdminQueries usa staleTime explícito).
      staleTime: 60 * 1000, // 1 min
      gcTime: 5 * 60 * 1000, // 5 min
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" storageKey="theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OfflinePage />
          <BrowserRouter>
            <AuthProvider>
              <CurrentCompanyProvider>
                <SystemValidationAlert />
                <ConsentBanner />
                <Suspense fallback={<Loader />}>
                  <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/app" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                  <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                  <Route path="/proposta" element={<SharedProposalPage />} />
                  <Route path="/privacidade" element={<PrivacyPolicyPage />} />
                  <Route path="/termos" element={<TermsPage />} />
                  <Route path="/confianca" element={<TrustCenterPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </CurrentCompanyProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
