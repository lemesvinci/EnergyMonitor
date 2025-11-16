import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import DeviceForm from "./pages/DeviceForm";
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-slate-600 mt-4">carregando...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Routes>
      {/* login */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onNavigate={(p) => navigate(`/${p}`)} />
          )
        }
      />

      {/* registrar */}
      <Route
        path="/register"
        element={<Register onNavigate={(p) => navigate(`/${p}`)} />}
      />

      {/* resetar senha (solicitar email) */}
      <Route
        path="/reset-password"
        element={<ResetPassword onNavigate={(p) => navigate(`/${p}`)} />}
      />

      {/* dashboard */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard onNavigate={(p) => navigate(`/${p}`)} />
          </PrivateRoute>
        }
      />

      {/* formulário de dispositivo */}
      <Route
        path="/device-form"
        element={
          <PrivateRoute>
            <DeviceForm onNavigate={(p) => navigate(`/${p}`)} />
          </PrivateRoute>
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
