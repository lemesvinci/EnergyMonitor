import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { deviceService } from "../services/deviceService";
import { Device } from "../lib/supabase";
import {
  Zap,
  Search,
  Plus,
  LogOut,
  Trash2,
  Edit,
  TrendingUp,
  Package,
} from "lucide-react";

interface DashboardProps {
  onNavigate: (
    page: "login" | "dashboard" | "device-form",
    deviceId?: string
  ) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user, signOut } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const data = await deviceService.getAll();
      setDevices(data);
    } catch (error) {
      console.error("Error loading devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadDevices();
      return;
    }

    try {
      const data = await deviceService.search(searchQuery);
      setDevices(data);
    } catch (error) {
      console.error("Error searching devices:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este dispositivo?")) return;

    setDeleting(id);
    try {
      await deviceService.delete(id);
      setDevices(devices.filter((d) => d.id !== id));
    } catch (error) {
      console.error("Error deleting device:", error);
      alert("Erro ao excluir dispositivo");
    } finally {
      setDeleting(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate("login");
  };

  // soma total de consumo e custo
  const totalMonthlyConsumption = devices.reduce(
    (sum, device) =>
      sum +
      deviceService.calculateMonthlyConsumption(device) *
        (device.quantity || 1),
    0
  );

  const totalMonthlyCost = devices.reduce(
    (sum, device) =>
      sum + deviceService.calculateMonthlyCost(device) * (device.quantity || 1),
    0
  );

  const totalQuantity = devices.reduce(
    (sum, device) => sum + (device.quantity || 1),
    0
  );

  const filteredDevices = searchQuery
    ? devices.filter((device) =>
        device.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : devices;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-4"></div>
          <p className="text-slate-600 text-lg">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat p-6 relative overflow-hidden"
      style={{
        backgroundImage: `
      linear-gradient(to bottom, rgba(5, 150, 105, 0.1), rgba(6, 78, 59, 0.4)),
      url('/assets/bg-dashboard.jpg')
    `,
      }}
    >
      {/* Overlay suave para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-teal-900/10 to-transparent pointer-events-none" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 animate-fadeIn">
        {/* navbar */}
        <nav className="bg-white border-b border-slate-200 shadow-sm transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                  EnergyMonitor
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600 animate-pulse">
                  {user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* cards de resumo */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* total dispositivos */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">
                    Total de Dispositivos
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {devices.length}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* total quantidade */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">
                    Quantidade Total
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {totalQuantity}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* consumo mensal */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Consumo Mensal</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {totalMonthlyConsumption.toFixed(1)}
                    <span className="text-lg text-slate-600 ml-1">kWh</span>
                  </p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* custo estimado */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Custo Estimado</p>
                  <p className="text-3xl font-bold text-slate-900">
                    R$ {totalMonthlyCost.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">por mês</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          {/* tabela */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Buscar dispositivos..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-all duration-200 hover:scale-105"
              >
                Buscar
              </button>
              <button
                onClick={() => onNavigate("device-form")}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-all duration-200 hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Novo Dispositivo
              </button>
            </div>

            {filteredDevices.length === 0 ? (
              <div className="text-center py-12 animate-fadeIn">
                <Zap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 text-lg">
                  {searchQuery
                    ? "Nenhum dispositivo encontrado"
                    : "Nenhum dispositivo cadastrado"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Dispositivo
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Potência
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Uso Diário
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Quantidade
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Consumo Mensal
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Custo Mensal
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevices.map((device, index) => (
                      <tr
                        key={device.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-200"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td className="py-4 px-4 animate-slideIn flex items-center gap-3">
                          <div className="bg-emerald-100 p-2 rounded-lg">
                            <Zap className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="font-medium text-slate-900">
                            {device.name}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-700 animate-slideIn">
                          {device.power_watts}W
                        </td>
                        <td className="py-4 px-4 text-slate-700 animate-slideIn">
                          {device.hours_per_day}h
                        </td>
                        <td className="py-4 px-4 text-slate-700 animate-slideIn flex items-center gap-1">
                          <Package className="w-4 h-4 text-purple-600" />
                          {device.quantity || 1}
                        </td>
                        <td className="py-4 px-4 text-slate-700 animate-slideIn">
                          {deviceService
                            .calculateMonthlyConsumption(device)
                            .toFixed(2)}{" "}
                          kWh
                        </td>
                        <td className="py-4 px-4 text-slate-700 animate-slideIn">
                          R${" "}
                          {deviceService
                            .calculateMonthlyCost(device)
                            .toFixed(2)}
                        </td>
                        <td className="py-4 px-4 animate-slideIn">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                onNavigate("device-form", device.id)
                              }
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(device.id)}
                              disabled={deleting === device.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-in-out;
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-slideIn {
            animation: slideIn 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
}
