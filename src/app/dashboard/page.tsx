"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Power, Settings, LogOut, RadioTower, AlertCircle, RefreshCw, Clock, X, Shield } from "lucide-react";
import { logout } from "@/app/auth/actions";

interface Device {
  itemData: {
    deviceid: string;
    name: string;
    online: boolean;
    params: any;
  };
}

interface LogEntry {
  id: string;
  time: number;
  source: string;
  user: string;
  action: string;
  raw: any;
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [historyModal, setHistoryModal] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<LogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');

  const fetchDevices = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError("");
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      
      if (res.status === 401) {
        window.location.href = "/";
        return;
      }
      
      if (data.error !== 0 && data.error) {
        if (!silent) setError(data.msg || "Error fetching devices");
      } else if (data.data && data.data.thingList) {
        setDevices(data.data.thingList);
      } else {
        if (!silent) setError("Unexpected response format");
      }
    } catch (err) {
      if (!silent) setError("Failed to fetch devices");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // Check role
    const checkRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user:", user?.email, user?.id);
      
      if (user) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
          
        console.log("Role fetch data:", data, "error:", error);
          
        if (data && data.role) {
          setUserRole(data.role);
        }
      }
    };
    checkRole();

    // Initial fetch (shows loading spinner)
    fetchDevices();

    // Set up polling every 3 seconds (silent update)
    const interval = setInterval(() => {
      fetchDevices(true);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const toggleDevice = async (device: Device, currentStatus: string) => {
    const deviceId = device.itemData.deviceid;
    setActionLoading(deviceId);
    try {
      const newStatus = currentStatus === "on" ? "off" : "on";
      
      // Determine if it's a multi-channel device
      const isMultiChannel = Array.isArray(device.itemData.params?.switches);
      
      const payloadParams = isMultiChannel 
        ? { switches: [{ outlet: 0, switch: newStatus }] } 
        : { switch: newStatus };

      const res = await fetch("/api/devices/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deviceId,
          params: payloadParams,
          type: 1
        })
      });
      const data = await res.json();
      if (data.error === 0) {
        // Update local state
        setDevices(prev => prev.map(d => {
          if (d.itemData.deviceid === deviceId) {
            const newParams = { ...d.itemData.params };
            if (isMultiChannel) {
              newParams.switches = [...newParams.switches];
              newParams.switches[0] = { outlet: 0, switch: newStatus };
            } else {
              newParams.switch = newStatus;
            }
            return {
              ...d,
              itemData: {
                ...d.itemData,
                params: newParams
              }
            };
          }
          return d;
        }));
      } else {
        alert("Failed to toggle device: " + (data.msg || "Unknown error"));
      }
    } catch (err) {
      alert("Error communicating with device");
    } finally {
      setActionLoading(null);
    }
  };

  const openHistory = async (deviceId: string) => {
    setHistoryModal(deviceId);
    setHistoryLoading(true);
    setHistoryData([]);
    try {
      const res = await fetch(`/api/devices/${deviceId}/history`);
      const data = await res.json();
      if (data.logs) {
        setHistoryData(data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch history");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 sm:p-12 max-w-6xl mx-auto w-full flex flex-col">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
          Mis Portones
        </h1>
        <div className="flex items-center gap-4">
          {userRole === 'admin' && (
            <a 
              href="/admin" 
              className="p-2 px-4 rounded-full glass hover:bg-brand-500/20 transition-colors text-brand-300 font-medium text-sm flex items-center gap-2"
              title="Panel de Administración"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Panel Admin</span>
            </a>
          )}
          <button 
            onClick={fetchDevices} 
            className="p-2 rounded-full glass hover:bg-white/10 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 text-brand-300 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button 
            onClick={() => logout()}
            className="p-2 rounded-full glass hover:bg-red-500/20 transition-colors text-muted hover:text-red-400"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {error && (
        <div className="glass bg-red-500/10 border-red-500/30 text-red-200 p-4 rounded-xl flex items-center gap-3 mb-8">
          <AlertCircle className="w-6 h-6" />
          <p>{error}</p>
        </div>
      )}

      {loading && devices.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-muted font-medium">Cargando dispositivos...</p>
          </div>
        </div>
      ) : devices.length === 0 && !error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <RadioTower className="w-10 h-10 text-muted" />
          </div>
          <h2 className="text-2xl font-semibold text-white">No se encontraron dispositivos</h2>
          <p className="text-muted max-w-md">
            No hay dispositivos asociados a tu cuenta de eWeLink o ocurrió un problema al obtenerlos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => {
            const id = device.itemData.deviceid;
            const name = device.itemData.name;
            const isOnline = device.itemData.online;
            
            const isMultiChannel = Array.isArray(device.itemData.params?.switches);
            const state = isMultiChannel 
              ? (device.itemData.params.switches[0]?.switch || 'off')
              : (device.itemData.params?.switch || 'off');
              
            const isOn = state === 'on';
            const isToggling = actionLoading === id;

            return (
              <div key={id} className="glass-card p-6 flex flex-col justify-between min-h-[200px] relative overflow-hidden group">
                {/* Glow effect based on state */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full mix-blend-screen filter blur-[50px] transition-all duration-700 opacity-50 ${isOn ? 'bg-green-500/30' : 'bg-brand-500/10'}`} />

                <div className="flex justify-between items-start z-10">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-white truncate max-w-[200px]">{name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </span>
                      <span className="text-sm text-muted">{isOnline ? 'En línea' : 'Fuera de línea'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => openHistory(id)}
                    className="text-muted hover:text-white transition-colors"
                    title="Ver Historial"
                  >
                    <Clock className="w-5 h-5" />
                  </button>
                </div>

                <div className="z-10 mt-6 flex items-center justify-between">
                  <div className="text-sm font-medium">
                    <span className="text-muted">Estado: </span>
                    <span className={isOn ? 'text-green-400' : 'text-brand-300'}>
                      {isOn ? 'Abierto / Encendido' : 'Cerrado / Apagado'}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleDevice(device, state)}
                    disabled={!isOnline || isToggling}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                      ${!isOnline ? 'bg-white/5 text-muted cursor-not-allowed' : 
                        isOn ? 'bg-green-500 text-white shadow-green-500/30 hover:bg-green-400' : 
                        'bg-white/10 text-brand-300 hover:bg-white/20'
                      }
                      ${isToggling ? 'animate-pulse' : ''}
                    `}
                  >
                    <Power className={`w-6 h-6 ${isToggling ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-2xl p-6 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Historial de Operaciones</h2>
              <button 
                onClick={() => setHistoryModal(null)}
                className="text-muted hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {historyLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center text-muted py-8">
                  No hay registros recientes para este dispositivo.
                </div>
              ) : (
                historyData.map((log) => {
                  const date = new Date(log.time);
                  const isArroyo = log.source === 'Arroyo App';
                  
                  return (
                    <div key={log.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-3 h-3 rounded-full ${log.action === 'on' ? 'bg-green-500' : 'bg-brand-500'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-white">
                            {log.action === 'on' ? 'Abierto / Encendido' : 'Cerrado / Apagado'}
                          </span>
                          <span className="text-xs text-muted">
                            {date.toLocaleDateString()} {date.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted">
                          <span className={isArroyo ? 'text-brand-300' : 'text-gray-400'}>
                            {log.user}
                          </span>
                          <span className="mx-2 opacity-50">•</span>
                          <span className="text-xs uppercase tracking-wider">{log.source}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
