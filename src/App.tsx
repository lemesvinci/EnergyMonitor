import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import DeviceForm from "./pages/DeviceForm";

// Componente privado
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-slate-600 mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

// Página do formulário com suporte a :id (opcional)
function DeviceFormPage() {
  const { id } = useParams<{ id?: string }>(); // ← pega o ID da URL
  const navigate = useNavigate();

  return <DeviceForm deviceId={id} onNavigate={() => navigate("/dashboard")} />;
}

// Rotas principais
function AppRoutes() {
  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={
          <RequireNoAuth>
            <Login />
          </RequireNoAuth>
        }
      />

      {/* Register */}
      <Route path="/register" element={<Register />} />

      {/* Reset Password */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      {/* Formulário de dispositivo — com ou sem ID */}
      <Route
        path="/device-form"
        element={
          <PrivateRoute>
            <DeviceFormPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/device-form/:id"
        element={
          <PrivateRoute>
            <DeviceFormPage />
          </PrivateRoute>
        }
      />

      {/* Redireciona tudo pro login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// Evita entrar no login se já estiver logado
function RequireNoAuth({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
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
