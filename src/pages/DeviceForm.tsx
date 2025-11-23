import { useState, useEffect } from "react";
import { Zap, ArrowLeft, Save } from "lucide-react";

interface DeviceFormProps {
  deviceId?: string;
  onNavigate: (page: "dashboard") => void;
}

export default function DeviceForm({ deviceId, onNavigate }: DeviceFormProps) {
  const [name, setName] = useState("");
  const [powerWatts, setPowerWatts] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingDevice, setLoadingDevice] = useState(!!deviceId);

  const isEditing = !!deviceId;
  const API_URL = "http://localhost:8000/api/v1";

  // CARREGA DISPOSITIVO PARA EDIÇÃO
  useEffect(() => {
    if (!deviceId) return;
    setLoadingDevice(true);
    fetch(`${API_URL}/devices/${deviceId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Dispositivo não encontrado");
        return res.json();
      })
      .then((data) => {
        setName(data.name);
        setPowerWatts(data.power_watts.toString());
        setHoursPerDay(data.hours_per_day.toString());
        setQuantity(data.quantity?.toString() || "1");
      })
      .catch(() => setError("Erro ao carregar"))
      .finally(() => setLoadingDevice(false));
  }, [deviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const power = parseInt(powerWatts);
    const hours = parseFloat(hoursPerDay);
    const qty = parseInt(quantity) || 1;

    if (!name.trim()) return setError("Nome é obrigatório");
    if (isNaN(power) || power <= 0) return setError("Potência inválida");
    if (isNaN(hours) || hours < 0 || hours > 24)
      return setError("Horas entre 0 e 24");
    if (qty <= 0) return setError("Quantidade inválida");

    const deviceData = {
      name: name.trim(),
      power_watts: power,
      hours_per_day: hours,
      quantity: qty,
    };

    try {
      if (isEditing && deviceId) {
        const res = await fetch(`${API_URL}/devices/${deviceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deviceData),
        });
        if (!res.ok) throw new Error("Erro ao atualizar");
      } else {
        const res = await fetch(`${API_URL}/devices/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deviceData),
        });
        if (!res.ok) throw new Error("Erro ao criar");
      }

      onNavigate("dashboard");
      setTimeout(() => window.dispatchEvent(new Event("devicesChanged")), 100);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const monthlyKwh =
    powerWatts && hoursPerDay
      ? (
          (parseInt(powerWatts) *
            parseFloat(hoursPerDay) *
            30 *
            (parseInt(quantity) || 1)) /
          1000
        ).toFixed(2)
      : "0.00";

  const monthlyCost =
    powerWatts && hoursPerDay
      ? (
          (parseInt(powerWatts) *
            parseFloat(hoursPerDay) *
            30 *
            (parseInt(quantity) || 1) *
            1.13) /
          1000
        ).toFixed(2)
      : "0.00";

  if (loadingDevice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-4"></div>
          <p className="text-emerald-700 text-xl font-medium">
            Carregando dispositivo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Navbar com cor */}
      <nav className="bg-gradient-to-r from-emerald-600 to-teal-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate("dashboard")}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all hover:scale-110"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center gap-4">
              <div className="bg-white/30 p-3 rounded-xl backdrop-blur">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                {isEditing ? "Editar Dispositivo" : "Novo Dispositivo"}
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-10 border border-emerald-100">
          {/* Mensagem de erro com cor */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-xl mb-8 shadow-md">
              <p className="font-semibold">⚠️ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Nome */}
            <div>
              <label className="block text-lg font-semibold text-emerald-800 mb-3">
                Nome do Dispositivo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-5 py-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-lg"
                placeholder="Ex: Geladeira, Ar Condicionado"
              />
            </div>

            {/* Potência + Horas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-lg font-semibold text-emerald-800 mb-3">
                  Potência (Watts)
                </label>
                <input
                  type="number"
                  min="1"
                  value={powerWatts}
                  onChange={(e) => setPowerWatts(e.target.value)}
                  required
                  className="w-full px-5 py-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-lg"
                  placeholder="150"
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-emerald-800 mb-3">
                  Uso Diário (Horas)
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.1"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                  required
                  className="w-full px-5 py-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-lg"
                  placeholder="8"
                />
              </div>
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-lg font-semibold text-emerald-800 mb-3">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full px-5 py-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-lg"
                placeholder="1"
              />
            </div>

            {/* Estimativa com fundo verde */}
            {powerWatts && hoursPerDay && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-8 shadow-inner">
                <h3 className="text-2xl font-bold text-emerald-900 mb-6 text-center">
                  Estimativa Mensal
                </h3>
                <div className="grid grid-cols-2 gap-8 text-center">
                  <div className="bg-white/70 rounded-2xl p-6 shadow-md">
                    <p className="text-emerald-700 text-lg font-medium">
                      Consumo
                    </p>
                    <p className="text-4xl font-bold text-emerald-600 mt-2">
                      {monthlyKwh} <span className="text-2xl">kWh</span>
                    </p>
                  </div>
                  <div className="bg-white/70 rounded-2xl p-6 shadow-md">
                    <p className="text-emerald-700 text-lg font-medium">
                      Custo Estimado
                    </p>
                    <p className="text-4xl font-bold text-emerald-600 mt-2">
                      R$ {monthlyCost}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-6 pt-8">
              <button
                type="button"
                onClick={() => onNavigate("dashboard")}
                className="flex-1 py-4 border-2 border-slate-300 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all hover:scale-105"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold hover:from-emerald-600 hover:to-teal-700 transition-all hover:scale-105 shadow-lg disabled:opacity-70"
              >
                <Save className="w-6 h-6" />
                {loading
                  ? "Salvando..."
                  : isEditing
                  ? "Atualizar Dispositivo"
                  : "Cadastrar Dispositivo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
