import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { type ApiResponse } from '../api';
import { 
  Server, 
  Plus, 
  RefreshCw, 
  LogOut, 
  Play, 
  Square, 
  Edit3, 
  Trash2, 
  Folder, 
  User as UserIcon, 
  HardDrive, 
  X, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface ConfigItem {
  id: string;
  name: string;
  username: string;
  root: string;
  running: number;
  port: string;
  password?: string;
}

export default function Dashboard() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<ConfigItem | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRoot, setFormRoot] = useState('');
  const [formPort, setFormPort] = useState('');
  const [formRunning, setFormRunning] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const fetchConfigs = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await api.get<ApiResponse<ConfigItem[]>>('/api/config/list');
      if (res.data && res.data.ok) {
        setConfigs(res.data.data || []);
      } else {
        setError(typeof res.data.data === 'string' ? res.data.data : 'Failed to fetch configs');
      }
    } catch (err: any) {
      setError(err.response?.data?.data || err.message || 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/api/logout');
    } catch {}
    localStorage.removeItem('dav_token');
    navigate('/login', { replace: true });
  };

  const openAddModal = () => {
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRoot('');
    setFormPort('');
    setFormRunning(0);
    setEditItem(null);
    setIsAddOpen(true);
  };

  const openEditModal = (item: ConfigItem) => {
    setEditItem(item);
    setFormName(item.name);
    setFormUsername(item.username);
    setFormPassword('');
    setFormRoot(item.root);
    setFormPort(item.port);
    setFormRunning(item.running);
    setIsAddOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editItem) {
        const payload: any = {
          name: formName,
          username: formUsername,
          root: formRoot,
          port: formPort,
          running: formRunning,
        };
        if (formPassword) {
          payload.password = formPassword;
        }
        const res = await api.post<ApiResponse>(`/api/config/edit/${editItem.id}`, payload);
        if (res.data && res.data.ok) {
          setSuccessMsg('Config updated successfully');
          setIsAddOpen(false);
          fetchConfigs();
        } else {
          setError(typeof res.data.data === 'string' ? res.data.data : 'Failed to update config');
        }
      } else {
        const payload = {
          name: formName,
          username: formUsername,
          password: formPassword,
          root: formRoot,
          port: formPort,
          running: formRunning,
        };
        const res = await api.post<ApiResponse>('/api/config/add', payload);
        if (res.data && res.data.ok) {
          setSuccessMsg('Config added successfully');
          setIsAddOpen(false);
          fetchConfigs();
        } else {
          setError(typeof res.data.data === 'string' ? res.data.data : 'Failed to add config');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.data || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleRunStop = async (item: ConfigItem) => {
    try {
      if (item.running === 1) {
        const res = await api.get<ApiResponse>(`/api/config/stop/${item.id}`);
        if (res.data && res.data.ok) {
          setSuccessMsg(`Stopped server: ${item.name}`);
          fetchConfigs();
        } else {
          setError(typeof res.data.data === 'string' ? res.data.data : 'Failed to stop server');
        }
      } else {
        const res = await api.post<ApiResponse>(`/api/config/run/${item.id}`);
        if (res.data && res.data.ok) {
          setSuccessMsg(`Started server: ${item.name}`);
          fetchConfigs();
        } else {
          setError(typeof res.data.data === 'string' ? res.data.data : 'Failed to start server');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.data || err.message || 'Action failed');
    } finally {
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete config "${name}"?`)) return;

    try {
      const res = await api.delete<ApiResponse>(`/api/config/del/${id}`);
      if (res.data && res.data.ok) {
        setSuccessMsg(`Deleted config: ${name}`);
        fetchConfigs();
      } else {
        setError(typeof res.data.data === 'string' ? res.data.data : 'Failed to delete config');
      }
    } catch (err: any) {
      setError(err.response?.data?.data || err.message || 'Delete failed');
    } finally {
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <img src="/icon.svg" alt="Logo" className="w-10 h-10" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-slate-100">WebDAV Console</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Manage Docker-backed WebDAV instances</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button
              onClick={() => fetchConfigs(true)}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 transition-all shadow-sm cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center justify-between text-red-600 dark:text-red-400 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 dark:hover:text-red-300 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Configurations</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total items: {configs.length}</p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Config</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : configs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
              <Server className="w-6 h-6" />
            </div>
            <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-1">No configurations found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Get started by creating your first WebDAV config item.</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Config</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map((item) => {
              const isRunning = item.running === 1;
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-sm relative overflow-hidden"
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      isRunning ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />

                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1 truncate max-w-50">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-500'
                            }`}
                          />
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {isRunning ? 'Running' : 'Stopped'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
                          title="Edit Config"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-2 bg-slate-50 dark:bg-slate-950 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-500/20 transition-all cursor-pointer"
                          title="Delete Config"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5" /> Username
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{item.username}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5" /> Root Path
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-35" title={item.root}>
                          {item.root}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5" /> Port
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-35" title={item.port}>
                          {item.port}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => handleRunStop(item)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isRunning
                          ? 'bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop Server</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Run Server</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                {editItem ? 'Edit Configuration' : 'Add New Configuration'}
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. My Storage"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="WebDAV username"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Password {editItem && '(leave blank to keep)'}
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="WebDAV password"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                    {...(!editItem ? { required: true } : {})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Host Root Path
                </label>
                <input
                  type="text"
                  value={formRoot}
                  onChange={(e) => setFormRoot(e.target.value)}
                  placeholder="e.g. /home/user/dav"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Port (Number Only)
                </label>
                <input
                  type="text"
                  value={formPort}
                  onChange={(e) => setFormPort(e.target.value)}
                  placeholder="e.g. 8080"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{editItem ? 'Save Changes' : 'Create Config'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
