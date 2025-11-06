import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import Dashboard from '@/pages/Dashboard'
import Applications from '@/pages/Applications'
import ApplicationDetail from '@/pages/ApplicationDetail'
import Schools from '@/pages/Schools'
import Prerequisites from '@/pages/Prerequisites'
import Observations from '@/pages/Observations'
import Calendar from '@/pages/Calendar'
import ComparisonPage from '@/pages/Comparison'
import ResourcesPage from '@/pages/Resources'
import { configError } from '@/lib/supabase'

function App() {
  // Show configuration error if environment variables are missing
  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-2xl w-full bg-destructive/10 border border-destructive rounded-lg p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">⚠️ Configuration Error</h1>
          <p className="text-foreground mb-4">{configError}</p>
          <div className="bg-background border rounded-lg p-4 space-y-2 text-sm">
            <p className="font-semibold">To fix this:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Go to your Vercel project dashboard</li>
              <li>Navigate to <strong>Settings</strong> → <strong>Environment Variables</strong></li>
              <li>Add the following variables:</li>
            </ol>
            <div className="mt-3 space-y-1 font-mono text-xs bg-muted p-3 rounded">
              <div>VITE_SUPABASE_URL = https://your-project.supabase.co</div>
              <div>VITE_SUPABASE_ANON_KEY = your-anon-key</div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Make sure to add them for <strong>Production</strong> environment, then redeploy.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <Layout>
                <Applications />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ApplicationDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/schools"
          element={
            <ProtectedRoute>
              <Layout>
                <Schools />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/prerequisites"
          element={
            <ProtectedRoute>
              <Layout>
                <Prerequisites />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/observations"
          element={
            <ProtectedRoute>
              <Layout>
                <Observations />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Layout>
                <Calendar />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/comparison"
          element={
            <ProtectedRoute>
              <Layout>
                <ComparisonPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedRoute>
              <Layout>
                <ResourcesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

