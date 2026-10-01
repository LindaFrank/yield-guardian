import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { HelpWizardProvider } from "@/contexts/HelpWizardContext";
import { useKeepAlive } from "@/hooks/useKeepAlive";
import { Footer } from "@/components/Footer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import AdminInbox from "./pages/AdminInbox";
import Profile from "./pages/Profile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Contact from "./pages/Contact";
import DownloadReport from "./pages/DownloadReport";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";


const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function PageViewTracker() {
  const location = useLocation();
  const { user } = useAuth();
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (last.current === location.pathname) return;
    last.current = location.pathname;
    trackEvent('page_view', { category: 'Page visits', label: location.pathname, userId: user?.id ?? null });
  }, [location.pathname, user?.id]);
  return null;
}

function ConditionalFooter() {
  const location = useLocation();
  return location.pathname !== "/" ? <Footer /> : null;
}

const AppRoutes = () => {
  useKeepAlive();
  return (
    <BrowserRouter>
      <PageViewTracker />
      <Routes>
        <Route path="/" element={<ComingSoon />} />
        <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/try" element={<Index />} />
        <Route path="/app" element={<ProtectedRoute><Index /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/admin/inbox" element={<ProtectedRoute><AdminInbox /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/download-report" element={<DownloadReport />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <ConditionalFooter />
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <HelpWizardProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </HelpWizardProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
