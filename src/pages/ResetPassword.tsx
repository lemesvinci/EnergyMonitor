import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Zap, ArrowLeft } from "lucide-react";

interface ResetPasswordProps {
  onNavigate: (
    page: "login" | "register" | "reset-password" | "dashboard"
  ) => void;
}

export default function ResetPassword({ onNavigate }: ResetPasswordProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      setError("Erro ao enviar email de recuperação");
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(/src/assets/eletricidade.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "0%",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-emerald-500 p-3 rounded-xl">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">
              Recuperar Senha
            </h1>
            <p className="text-center text-slate-600 mb-8">
              Digite seu email para receber instruções
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg mb-6">
                Email enviado! Verifique sua caixa de entrada.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Enviando..." : "Enviar instruções"}
              </button>
            </form>

            <div className="mt-6">
              <button
                onClick={() => onNavigate("login")}
                className="flex items-center text-slate-600 hover:text-slate-900 font-medium mx-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
