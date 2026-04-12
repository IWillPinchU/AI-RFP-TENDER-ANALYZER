import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingLayout } from '@/components/layout/LandingLayout';
import { DocumentLayout } from '@/components/layout/DocumentLayout/DocumentLayout';
import { ProtectedRoute } from './ProtectedRoute';

/* Auth pages */
import { AuthPage } from '@/pages/auth/AuthPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage';

/* App pages */
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ComparePage } from '@/pages/compare/ComparePage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/* Document workspace pages */
import { ChatPage } from '@/pages/document/chat/ChatPage';
import { SummaryPage } from '@/pages/document/summary/SummaryPage';
import { QAPage } from '@/pages/document/qa/QAPage';
import { ProposalPage } from '@/pages/document/proposals/ProposalPage';

/* Landing pages */
import { LandingPage } from '@/pages/landing/LandingPage';

export const router = createBrowserRouter([
  /* ── Marketing routes ── */
  {
    element: <LandingLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
    ],
  },

  /* ── Auth routes (Unified UI) ── */
  { path: '/login', element: <AuthPage /> },
  { path: '/register', element: <AuthPage /> },
  { path: '/forgot-password', element: <AuthPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/oauth-callback', element: <OAuthCallbackPage /> },
  { path: '/verify-email', element: <VerifyEmailPage /> },

  /* ── Protected routes (with sidebar) ── */
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/compare', element: <ComparePage /> },
      { path: '/settings', element: <SettingsPage /> },
      
      /* ── Nested Document Workspace ── */
      {
        path: '/document/:id',
        element: <DocumentLayout />,
        children: [
          { index: true, element: <Navigate to="chat" replace /> },
          { path: 'chat', element: <ChatPage /> },
          { path: 'summary', element: <SummaryPage /> },
          { path: 'qa', element: <QAPage /> },
          { path: 'proposals', element: <ProposalPage /> },
        ]
      }
    ],
  },

  /* ── Redirects & fallback ── */
  { path: '*', element: <NotFoundPage /> },
]);
