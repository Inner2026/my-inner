import { useEffect, useState } from 'react';
import { AdminApi } from '../api/adminEndpoints';

export function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null); const [error, setError] = useState<string | null>(null);
  useEffect(() => { AdminApi.settingsStatus().then((res) => setSettings(res.settings)).catch((e) => setError(e.message)); }, []);
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!settings) return <p className="text-sm text-slate-500">Loading settings status...</p>;
  const labels: Record<string, string> = { environment: 'Environment', database: 'Database', paymentsMode: 'Payments mode', paypalMode: 'PayPal mode', paypalConfigured: 'PayPal credentials', paypalWebhookConfigured: 'PayPal webhook', smtpConfigured: 'SMTP', mailFromConfigured: 'Mail sender', publicApiUrl: 'Public API URL', clientOrigin: 'Client origin', uploadDirectoryConfigured: 'Upload directory override' };
  return <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#765c8d]">Operations</p><h1 className="mt-1 text-2xl font-semibold text-[#302447]">Settings status</h1><p className="mt-2 text-sm text-slate-500">Operational configuration only. Secret values are never displayed.</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{Object.entries(labels).map(([key, label]) => { const value = settings[key]; const boolean = typeof value === 'boolean'; const good = boolean ? value : key === 'database' ? value === 'connected' : true; return <div key={key} className="rounded-2xl border border-[#eee5e9] bg-white p-5 shadow-sm"><p className="text-xs text-slate-400">{label}</p><p className={`mt-2 font-semibold ${good ? 'text-emerald-700' : 'text-amber-700'}`}>{boolean ? (value ? 'Configured' : 'Not configured') : String(value)}</p></div>; })}</div></div>;
}
