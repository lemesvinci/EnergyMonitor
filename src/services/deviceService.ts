import { supabase, Device } from "../lib/supabase";

export interface CreateDeviceData {
  name: string;
  power_watts: number;
  hours_per_day: number;
}

export interface UpdateDeviceData {
  name?: string;
  power_watts?: number;
  hours_per_day?: number;
}

// Cache simples para otimizar chamadas (limpa a cada 5 minutos)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const clearCache = (key: string) => cache.delete(key);

export const deviceService = {
  async getAll(): Promise<Device[]> {
    const cacheKey = "getAll";
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Erro ao buscar dispositivos: ${error.message}`);
    cache.set(cacheKey, { data: data || [], timestamp: Date.now() });
    return data || [];
  },

  async search(query: string): Promise<Device[]> {
    if (!query.trim()) return this.getAll();

    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("user_id", user.id)
      .ilike("name", `%${query}%`)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Erro na busca: ${error.message}`);
    cache.set(cacheKey, { data: data || [], timestamp: Date.now() });
    return data || [];
  },

  async getById(id: string): Promise<Device | null> {
    if (!id) throw new Error("ID do dispositivo é obrigatório");

    const cacheKey = `getById:${id}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw new Error(`Erro ao buscar dispositivo: ${error.message}`);
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  },

  async create(deviceData: CreateDeviceData): Promise<Device> {
    if (!deviceData.name.trim())
      throw new Error("Nome do dispositivo é obrigatório");
    if (deviceData.power_watts <= 0)
      throw new Error("Potência deve ser maior que zero");
    if (deviceData.hours_per_day < 0 || deviceData.hours_per_day > 24)
      throw new Error("Horas diárias devem estar entre 0 e 24");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("devices")
      .insert([{ ...deviceData, user_id: user.id }])
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar dispositivo: ${error.message}`);
    // Limpa cache relevante
    clearCache("getAll");
    return data;
  },

  async update(id: string, deviceData: UpdateDeviceData): Promise<Device> {
    if (!id) throw new Error("ID do dispositivo é obrigatório");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("devices")
      .update(deviceData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error)
      throw new Error(`Erro ao atualizar dispositivo: ${error.message}`);
    // Limpa cache relevante
    clearCache("getAll");
    clearCache(`getById:${id}`);
    return data;
  },

  async delete(id: string): Promise<void> {
    if (!id) throw new Error("ID do dispositivo é obrigatório");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("devices")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(`Erro ao excluir dispositivo: ${error.message}`);
    // Limpa cache relevante
    clearCache("getAll");
  },

  calculateDailyConsumption(device: Device): number {
    return (device.power_watts * device.hours_per_day) / 1000;
  },

  calculateMonthlyConsumption(device: Device): number {
    return this.calculateDailyConsumption(device) * 30;
  },

  calculateMonthlyCost(device: Device, costPerKwh: number = 0.75): number {
    return this.calculateMonthlyConsumption(device) * costPerKwh;
  },
};
