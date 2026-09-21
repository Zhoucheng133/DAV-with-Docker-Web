import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { type ApiResponse } from '../api';
import { useTranslation } from 'react-i18next';
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
  AlertCircle
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';

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
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<ConfigItem | null>(null);
  const [errorModalMsg, setErrorModalMsg] = useState('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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

    try {
      const res = await api.get<ApiResponse<ConfigItem[]>>('/api/config/list');
      if (res.data && res.data.ok) {
        setConfigs(res.data.data || []);
      } else {
        setErrorModalMsg(typeof res.data.data === 'string' ? res.data.data : 'Failed to fetch configs');
      }
    } catch (err: any) {
      setErrorModalMsg(err.response?.data?.data || err.message || 'Network error');
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
    if (item.running === 1) {
      setErrorModalMsg(t('running_edit_forbidden'));
      return;
    }
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
          setIsAddOpen(false);
          fetchConfigs();
        } else {
          setErrorModalMsg(typeof res.data.data === 'string' ? res.data.data : 'Failed to update config');
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
          setIsAddOpen(false);
          fetchConfigs();
        } else {
          setErrorModalMsg(typeof res.data.data === 'string' ? res.data.data : 'Failed to add config');
        }
      }
    } catch (err: any) {
      setErrorModalMsg(err.response?.data?.data || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunStop = async (item: ConfigItem) => {
    try {
      if (item.running === 1) {
        const res = await api.post<ApiResponse>(`/api/config/stop/${item.id}`);
        if (res.data && res.data.ok) {
          fetchConfigs();
        } else {
          setErrorModalMsg(typeof res.data.data === 'string' ? res.data.data : 'Failed to stop server');
        }
      } else {
        const res = await api.post<ApiResponse>(`/api/config/run/${item.id}`);
        if (res.data && res.data.ok) {
          fetchConfigs();
        } else {
          setErrorModalMsg(typeof res.data.data === 'string' ? res.data.data : 'Failed to start server');
        }
      }
    } catch (err: any) {
      setErrorModalMsg(err.response?.data?.data || err.message || 'Action failed');
    }
  };

  const handleDelete = async (id: string, name: string, running: number) => {
    if (running === 1) {
      setErrorModalMsg(t('running_delete_forbidden'));
      return;
    }
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);

    try {
      const res = await api.delete<ApiResponse>(`/api/config/del/${id}`);
      if (res.data && res.data.ok) {
        fetchConfigs();
      } else {
        setErrorModalMsg(typeof res.data.data === 'string' ? res.data.data : 'Failed to delete config');
      }
    } catch (err: any) {
      setErrorModalMsg(err.response?.data?.data || err.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <img src="/icon.svg" alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{t('app_title')}</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">{t('app_subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector />
            <ThemeToggle />

            <button
              onClick={() => fetchConfigs(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline sm:inline">{t('refresh')}</span>
            </button>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 transition-all shadow-sm cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">{t('configurations')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('total_items', { count: configs.length })}</p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add_config')}</span>
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
            <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-1">{t('no_configs_found')}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">{t('no_configs_desc')}</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('add_config')}</span>
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
                            {isRunning ? t('running') : t('stopped')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          disabled={isRunning}
                          className={`p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl transition-all ${
                            isRunning 
                              ? 'opacity-40 cursor-not-allowed text-slate-300 dark:text-slate-700' 
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer'
                          }`}
                          title={isRunning ? t('running_edit_forbidden') : t('edit_config')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name, item.running)}
                          disabled={isRunning}
                          className={`p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl transition-all ${
                            isRunning 
                              ? 'opacity-40 cursor-not-allowed text-slate-300 dark:text-slate-700' 
                              : 'hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/20 cursor-pointer'
                          }`}
                          title={isRunning ? t('running_delete_forbidden') : t('delete_config')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5" /> {t('username')}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{item.username}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5" /> {t('root_path')}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-35" title={item.root}>
                          {item.root}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Folder className="w-3.5 h-3.5" /> {t('port')}
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
                          <span>{t('stop_server')}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{t('run_server')}</span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">
                {editItem ? t('modal_edit_title') : t('modal_add_title')}
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t('name_placeholder')}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('username')}
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder={t('username_placeholder')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    {t('password')} {editItem && t('password_edit_hint')}
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={t('password_placeholder')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                    {...(!editItem ? { required: true } : {})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('host_root_path')}
                </label>
                <input
                  type="text"
                  value={formRoot}
                  onChange={(e) => setFormRoot(e.target.value)}
                  placeholder={t('host_root_placeholder')}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {t('port_number_only')}
                </label>
                <input
                  type="text"
                  value={formPort}
                  onChange={(e) => setFormPort(e.target.value)}
                  placeholder={t('port_placeholder')}
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
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  <span>{editItem ? t('save_changes') : t('create_config')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {errorModalMsg && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-1">{t('error')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{errorModalMsg}</p>
            </div>
            <button
              onClick={() => setErrorModalMsg('')}
              className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              {t('ok')}
            </button>
          </div>
        </div>
      )}

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-1">{t('confirm_logout')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('logout_desc')}</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer shadow-lg shadow-red-600/20"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-1">{t('delete_confirm_title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('delete_confirm_desc', { name: deleteTarget.name })}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer shadow-lg shadow-red-600/20"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
