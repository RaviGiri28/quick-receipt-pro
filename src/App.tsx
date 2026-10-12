import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import CreateReceipt from "./pages/CreateReceipt";
import EditReceipt from "./pages/EditReceipt";
import History from "./pages/History";
import SavedReceipts from "./pages/SavedReceipts";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Support from "./pages/Support";
import Faq from "./pages/Faq";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Notifications from "./pages/Notifications";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import AdminBlog from "./pages/admin/AdminBlog";
import BlogEditor from "./pages/admin/BlogEditor";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import { BlogShell, PublicShell } from "@/components/BlogShell";
import { AdminRoute } from "@/components/AdminRoute";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { TourProvider } from "@/components/TourProvider";

const queryClient = new QueryClient();

function HomeRoute() {
  const { user, isLoading, sessionError } = useAuth();
  if (isLoading) return null;
  // AppLayout shows the "can't connect" screen when a saved session couldn't be checked.
  return user || sessionError ? <AppLayout><Index /></AppLayout> : <Navigate to="/landing" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AnalyticsTracker />
            <TourProvider>
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<AppLayout><Index /></AppLayout>} />
              <Route path="/create" element={<AppLayout><CreateReceipt /></AppLayout>} />
              <Route path="/edit/:id" element={<AppLayout><EditReceipt /></AppLayout>} />
              <Route path="/history" element={<AppLayout><History /></AppLayout>} />
              <Route path="/saved" element={<AppLayout><SavedReceipts /></AppLayout>} />
              <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
              <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
              <Route path="/about" element={<AppLayout><About /></AppLayout>} />
              <Route path="/support" element={<AppLayout><Support /></AppLayout>} />
              <Route path="/faq" element={<AppLayout><Faq /></AppLayout>} />
              <Route path="/notifications" element={<AppLayout><Notifications /></AppLayout>} />
              {/* Public for visitors, in-app for logged-in users. */}
              <Route path="/privacy" element={<PublicShell>{() => <PrivacyPolicy />}</PublicShell>} />
              <Route path="/terms" element={<PublicShell>{() => <Terms />}</PublicShell>} />
              <Route path="/blog" element={<BlogShell>{audience => <Blog audience={audience} />}</BlogShell>} />
              <Route path="/blog/:slug" element={<BlogShell>{audience => <BlogPost audience={audience} />}</BlogShell>} />
              <Route path="/admin/blog" element={<AppLayout><AdminRoute><AdminBlog /></AdminRoute></AppLayout>} />
              <Route path="/admin/blog/new" element={<AppLayout><AdminRoute><BlogEditor /></AdminRoute></AppLayout>} />
              <Route path="/admin/blog/:id/edit" element={<AppLayout><AdminRoute><BlogEditor /></AdminRoute></AppLayout>} />
              <Route path="/admin/announcements" element={<AppLayout><AdminRoute><AdminAnnouncements /></AdminRoute></AppLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </TourProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
