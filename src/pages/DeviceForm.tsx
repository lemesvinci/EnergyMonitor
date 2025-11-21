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
        // EDITAR
        const res = await fetch(`${API_URL}/devices/${deviceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deviceData),
        });
        if (!res.ok) throw new Error("Erro ao atualizar");
      } else {
        // CRIAR
        const res = await fetch(`${API_URL}/devices/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deviceData),
        });
        if (!res.ok) throw new Error("Erro ao criar");
      }

      // VOLTA E AVISA O DASHBOARD
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-slate-600 mt-4">Carregando dispositivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("dashboard")}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isEditing ? "Editar Dispositivo" : "Novo Dispositivo"}
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nome do Dispositivo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="Ex: Geladeira"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Potência (Watts)
                </label>
                <input
                  type="number"
                  min="1"
                  value={powerWatts}
                  onChange={(e) => setPowerWatts(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="150"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="8"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="1"
              />
            </div>

            {powerWatts && hoursPerDay && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Estimativa Mensal
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600">Consumo</p>
                    <p className="text-3xl font-bold text-emerald-700">
                      {monthlyKwh} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Custo</p>
                    <p className="text-3xl font-bold text-emerald-700">
                      R$ {monthlyCost}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => onNavigate("dashboard")}
                className="flex-1 py-3 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {loading
                  ? "Salvando..."
                  : isEditing
                  ? "Atualizar"
                  : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
