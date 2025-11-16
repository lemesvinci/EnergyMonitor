import { useState, useEffect } from "react";
import { deviceService } from "../services/deviceService";
import { Device } from "../lib/supabase";
import { Zap, ArrowLeft, Save } from "lucide-react";

interface DeviceFormProps {
  deviceId?: string;
  onNavigate: (page: "dashboard") => void;
}

export default function DeviceForm({ deviceId, onNavigate }: DeviceFormProps) {
  const [name, setName] = useState("");
  const [powerWatts, setPowerWatts] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("");
  const [quantity, setQuantity] = useState("1"); // Novo campo
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingDevice, setLoadingDevice] = useState(!!deviceId);

  const isEditing = !!deviceId;

  useEffect(() => {
    if (deviceId) {
      loadDevice();
    }
  }, [deviceId]);

  const loadDevice = async () => {
    if (!deviceId) return;

    try {
      const device: Device = await deviceService.getById(deviceId);
      if (device) {
        setName(device.name);
        setPowerWatts(device.power_watts.toString());
        setHoursPerDay(device.hours_per_day.toString());
        setQuantity(device.quantity?.toString() || "1");
      } else {
        setError("Dispositivo não encontrado");
      }
    } catch (error: any) {
      console.error("Erro ao carregar dispositivo:", error.message || error);
      setError(
        `Erro ao carregar dispositivo: ${error.message || "Desconhecido"}`
      );
    } finally {
      setLoadingDevice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("O nome do dispositivo é obrigatório");
      return;
    }

    const power = parseInt(powerWatts);
    const hours = parseFloat(hoursPerDay);
    const qty = parseInt(quantity);

    if (isNaN(power) || power <= 0) {
      setError("A potência deve ser um número maior que zero");
      return;
    }

    if (isNaN(hours) || hours < 0 || hours > 24) {
      setError("O uso diário deve ser um número entre 0 e 24 horas");
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      setError("A quantidade deve ser um número maior que zero");
      return;
    }

    setLoading(true);

    try {
      const deviceData: Device = {
        name: name.trim(),
        power_watts: power,
        hours_per_day: hours,
        quantity: qty,
      };
      console.log("Enviando dados:", deviceData);

      if (isEditing && deviceId) {
        await deviceService.update(deviceId, deviceData);
      } else {
        await deviceService.create(deviceData);
      }
      onNavigate("dashboard");
    } catch (error: any) {
      console.error("Erro ao salvar dispositivo:", error.message || error);
      setError(
        `Erro ao salvar dispositivo: ${error.message || "Tente novamente"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const monthlyConsumption =
    powerWatts &&
    hoursPerDay &&
    quantity &&
    !isNaN(parseInt(powerWatts)) &&
    !isNaN(parseFloat(hoursPerDay)) &&
    !isNaN(parseInt(quantity))
      ? (
          (parseInt(powerWatts) *
            parseFloat(hoursPerDay) *
            30 *
            parseInt(quantity)) /
          1000
        ).toFixed(2)
      : "0.00";

  const monthlyCost =
    powerWatts &&
    hoursPerDay &&
    quantity &&
    !isNaN(parseInt(powerWatts)) &&
    !isNaN(parseFloat(hoursPerDay)) &&
    !isNaN(parseInt(quantity))
      ? (
          (parseInt(powerWatts) *
            parseFloat(hoursPerDay) *
            30 *
            parseInt(quantity) *
            0.75) /
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
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Nome do Dispositivo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                placeholder="Ex: Geladeira, TV da Sala, Ar Condicionado"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="power"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Potência (Watts)
                </label>
                <input
                  id="power"
                  type="number"
                  min="1"
                  value={powerWatts}
                  onChange={(e) => setPowerWatts(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="Ex: 150"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">
                  Consulte o manual ou etiqueta do produto
                </p>
              </div>

              <div>
                <label
                  htmlFor="hours"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Uso Diário (Horas)
                </label>
                <input
                  id="hours"
                  type="number"
                  min="0"
                  max="24"
                  step="0.1"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  placeholder="Ex: 8"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">
                  Tempo médio de uso por dia
                </p>
              </div>
            </div>

            <div>
              {" "}
              {/* Novo campo: Quantidade */}
              <label
                htmlFor="quantity"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Quantidade
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                placeholder="Ex: 1"
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Número de dispositivos
              </p>
            </div>

            {powerWatts && hoursPerDay && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Estimativa de Consumo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">
                      Consumo Mensal
                    </p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {monthlyConsumption} kWh
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">
                      Custo Estimado (R$ 0,75/kWh)
                    </p>
                    <p className="text-2xl font-bold text-emerald-700">
                      R$ {monthlyCost}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => onNavigate("dashboard")}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
