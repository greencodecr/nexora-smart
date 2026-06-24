"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Clock, Users, Activity, Plus, Loader2, Edit2, Trash2, X, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface LogEntry {
  id: string;
  time: number;
  source: string;
  user: string;
  device_id: string;
  action: string;
}

interface UserEntry {
  id: string;
  email: string;
  created_at: string;
  role: string;
}

interface AdminClientProps {
  logs: LogEntry[];
  stats: {
    totalUsers: number;
    todayOpens: number;
    weekOpens: number;
    totalActivity: number;
  };
  usersList: UserEntry[];
}

export default function AdminClient({ logs: initialLogs, stats, usersList }: AdminClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'auditoria' | 'usuarios'>('auditoria');
  
  // Merged audit logs state
  const [auditLogs, setAuditLogs] = useState<LogEntry[]>(initialLogs as any);
  const [auditLoading, setAuditLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch('/api/admin/audit');
      const data = await res.json();
      if (data.logs) {
        setAuditLogs(data.logs);
        setCurrentPage(1); // Reset to first page on refresh
      }
    } catch (e) {
      console.error('Failed to fetch audit logs', e);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => { fetchAuditLogs(); }, []);

  // Pagination logic
  const totalPages = Math.ceil(auditLogs.length / ITEMS_PER_PAGE);
  const currentLogs = auditLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Create User State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Edit User State
  const [editModal, setEditModal] = useState<UserEntry | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editLoading, setEditLoading] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, newRole: role }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al crear usuario');

      setMessage({ type: 'success', text: 'Usuario creado exitosamente.' });
      setEmail(''); setPassword(''); setRole('user');
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: UserEntry) => {
    setEditModal(user);
    setEditRole(user.role);
    setEditPassword('');
    setMessage(null);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setEditLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${editModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password: editPassword, 
          role: editRole 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar usuario');

      setMessage({ type: 'success', text: 'Usuario actualizado exitosamente.' });
      setEditModal(null);
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario ${email}? Su historial de aperturas se conservará.`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al borrar usuario');
      router.refresh();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen p-6 sm:p-12 max-w-7xl mx-auto w-full flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="p-2 rounded-full glass hover:bg-white/10 transition-colors text-muted hover:text-white"
            title="Volver al Panel"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Image src="/nexora-logo.webp" alt="Nexora Smart" width={120} height={120} className="drop-shadow-lg" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50">
              Panel de Administración
            </h1>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6 rounded-2xl border border-brand-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted font-medium">Total Usuarios</h3>
            <Users className="w-5 h-5 text-brand-300" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-brand-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted font-medium">Aperturas Hoy</h3>
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.todayOpens}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-brand-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted font-medium">Aperturas Semana</h3>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.weekOpens}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-brand-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-muted font-medium">Actividad Total</h3>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalActivity}</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 glass-card rounded-xl border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab('auditoria')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'auditoria' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Auditoría Global
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'usuarios' ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Gestión de Usuarios
        </button>
      </div>

      {activeTab === 'auditoria' && (
        <div className="glass-card p-6 md:p-8 rounded-2xl border border-brand-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-brand-300" />
              <h2 className="text-xl font-semibold text-white">Auditoría Global</h2>
              <span className="text-xs text-muted bg-white/5 px-2 py-1 rounded-full">{auditLogs.length} registros</span>
            </div>
            <button
              onClick={fetchAuditLogs}
              className="p-2 rounded-full glass hover:bg-white/10 transition-colors"
              title="Recargar"
            >
              <RefreshCw className={`w-4 h-4 text-brand-300 ${auditLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {auditLoading && auditLogs.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="text-center py-12 text-muted">
              No hay registros de operaciones todavía.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] pr-2 custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white/5 backdrop-blur-md z-10">
                  <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                    <th className="py-4 px-4 font-semibold rounded-tl-lg">Fecha y Hora</th>
                    <th className="py-4 px-4 font-semibold">Usuario</th>
                    <th className="py-4 px-4 font-semibold">Fuente</th>
                    <th className="py-4 px-4 font-semibold">Dispositivo ID</th>
                    <th className="py-4 px-4 font-semibold rounded-tr-lg">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {currentLogs.map((log: any) => {
                    const date = new Date(log.time || log.created_at);
                    const isNexora = log.source === 'Nexora Smart';
                    return (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap text-gray-400">
                          {date.toLocaleDateString()} <span className="opacity-75">{date.toLocaleTimeString()}</span>
                        </td>
                        <td className="py-4 px-4 text-brand-200">{log.user || log.user_email || '—'}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isNexora
                              ? 'bg-brand-500/20 text-brand-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {log.source || 'eWeLink'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-500 font-mono text-xs">{log.device_id}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            log.action === 'on' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {log.action === 'on' ? 'ABIERTO' : 'CERRADO'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {auditLogs.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <div className="text-sm text-muted">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, auditLogs.length)} de {auditLogs.length} registros
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                        currentPage === i + 1 ? 'bg-brand-600 text-white font-medium' : 'hover:bg-white/10 text-muted'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create User Form */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-brand-500/20 h-full">
              <div className="flex items-center gap-3 mb-6">
                <Plus className="w-6 h-6 text-brand-300" />
                <h2 className="text-xl font-semibold text-white">Nuevo Usuario</h2>
              </div>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Correo Electrónico</label>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Rol en el Sistema</label>
                  <select
                    value={role} onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  >
                    <option value="user">Usuario Regular</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center mt-4"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Usuario'}
                </button>
              </form>
            </div>
          </div>

          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-brand-500/20 h-full">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-brand-300" />
                <h2 className="text-xl font-semibold text-white">Usuarios Registrados</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-muted text-sm">
                      <th className="pb-3 pr-4 font-medium">Email</th>
                      <th className="pb-3 pr-4 font-medium">Rol</th>
                      <th className="pb-3 pr-4 font-medium">Creado el</th>
                      <th className="pb-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {usersList.map((u) => {
                      const date = new Date(u.created_at);
                      return (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 pr-4 font-medium text-white">{u.email}</td>
                          <td className="py-4 pr-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-gray-400">
                            {date.toLocaleDateString()}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => openEditModal(u)}
                                className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                title="Borrar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl border border-brand-500/20 shadow-2xl relative">
            <button 
              onClick={() => setEditModal(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-semibold text-white mb-6">Editar Usuario</h3>
            <p className="text-sm text-brand-200 mb-6 font-mono">{editModal.email}</p>
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nueva Contraseña (opcional)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  minLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="Dejar en blanco para no cambiar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Rol</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                >
                  <option value="user">Usuario Regular</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition-all flex justify-center items-center"
                >
                  {editLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scrollbar styles for the table */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}} />
    </div>
  );
}
