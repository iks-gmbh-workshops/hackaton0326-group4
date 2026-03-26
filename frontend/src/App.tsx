import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { TermsOfServicePage } from '@/pages/auth/TermsOfServicePage';
import { GroupListPage } from '@/pages/groups/GroupListPage';
import { GroupDetailPage } from '@/pages/groups/GroupDetailPage';
import { CreateGroupPage } from '@/pages/groups/CreateGroupPage';
import { ActivityListPage } from '@/pages/activities/ActivityListPage';
import { ActivityDetailPage } from '@/pages/activities/ActivityDetailPage';
import { CreateActivityPage } from '@/pages/activities/CreateActivityPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { InvitePage } from '@/pages/auth/InvitePage';
import '@fontsource/merriweather/300-italic.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
          <main className="mx-auto max-w-5xl px-6 py-8">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/terms-of-service" element={<TermsOfServicePage />} />
              <Route path="/invite/:token" element={<InvitePage />} />

              {/* Protected routes */}
              <Route path="/groups" element={<ProtectedRoute><GroupListPage /></ProtectedRoute>} />
              <Route path="/groups/new" element={<ProtectedRoute><CreateGroupPage /></ProtectedRoute>} />
              <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetailPage /></ProtectedRoute>} />
              <Route path="/activities" element={<ProtectedRoute><ActivityListPage /></ProtectedRoute>} />
              <Route path="/activities/new" element={<ProtectedRoute><CreateActivityPage /></ProtectedRoute>} />
              <Route path="/activities/:activityId" element={<ProtectedRoute><ActivityDetailPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/groups" replace />} />
            </Routes>
          </main>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
