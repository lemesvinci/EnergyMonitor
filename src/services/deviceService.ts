// src/services/deviceService.ts
const API_URL = "http://localhost:8000/api/v1";

const CUSTO_POR_KWH = 1.13;

export interface Device {
  id?: string;
  name: string;
  power_watts: number;
  hours_per_day: number;
  quantity?: number;
}

const notifyDashboardUpdate = () => {
  window.dispatchEvent(new Event("devicesChanged"));
};

export const deviceService = {
  // LISTAR TODOS
  async getAll(): Promise<Device[]> {
    try {
      const res = await fetch(`${API_URL}/devices/`);
      if (!res.ok) throw new Error("Erro ao carregar dispositivos");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Erro em getAll:", error);
      return [];
    }
  },

  // BUSCAR POR ID
  async getById(id: string): Promise<Device> {
    const res = await fetch(`${API_URL}/devices/${id}`);
    if (!res.ok) throw new Error("Dispositivo não encontrado");
    return res.json();
  },

  // CRIAR
  async create(device: Omit<Device, "id">): Promise<Device> {
    const res = await fetch(`${API_URL}/devices/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(device),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao criar: ${err}`);
    }
    const newDevice = await res.json();
    notifyDashboardUpdate();
    return newDevice;
  },

  // ATUALIZAR
  async update(id: string, device: Partial<Device>): Promise<Device> {
    const res = await fetch(`${API_URL}/devices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(device),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro ao atualizar: ${err}`);
    }
    const updated = await res.json();
    notifyDashboardUpdate();
    return updated;
  },

  // DELETAR
  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/devices/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao excluir");
    notifyDashboardUpdate();
  },

  // CÁLCULOS
  calculateMonthlyConsumption(device: Device): number {
    return (
      (device.power_watts / 1000) *
      device.hours_per_day *
      30 *
      (device.quantity || 1)
    );
  },

  calculateMonthlyCost(device: Device): number {
    return this.calculateMonthlyConsumption(device) * CUSTO_POR_KWH;
  },
};
