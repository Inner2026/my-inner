import { useEffect, useState } from 'react';
import { AdminApi } from '../api/adminEndpoints';

const socialFields = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['snapchat', 'Snapchat'], ['youtube', 'YouTube'], ['linkedin', 'LinkedIn'], ['x', 'X / Twitter']];

export function AdminSettings() {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [footerMessage, setFooterMessage] = useState('');
  const [announcementTagline, setAnnouncementTagline] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => { AdminApi.promotionSettings().then((res) => { setLinks(res.settings.socialLinks ?? {}); setFooterMessage(res.settings.footerMessage ?? ''); setAnnouncementTagline(res.settings.announcementTagline ?? ''); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const updateLink = (key: string, value: string) => setLinks((current) => ({ ...current, [key]: value }));
  async function saveSettings() { setError(''); setMessage(''); try { const result = await AdminApi.updatePromotionSettings({ socialLinks: links, footerMessage, announcementTagline }); setLinks(result.settings.socialLinks ?? links); setFooterMessage(result.settings.footerMessage ?? footerMessage); setAnnouncementTagline(result.settings.announcementTagline ?? announcementTagline); setMessage('Website settings saved.'); } catch (e: any) { setError(e.message); } }
  if (loading) return <p className="text-sm text-slate-500">Loading website settings...</p>;
  return <div className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#765c8d]">Website settings</p><h1 className="mt-1 text-2xl font-semibold text-[#302447]">Social media links</h1><p className="mt-2 text-sm text-slate-500">Manage social links, the footer message, and the announcement bar tagline.</p>{(error || message) && <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{error || message}</p>}<section className="mt-6 rounded-3xl border border-[#eadff0] bg-white p-5 shadow-sm sm:p-7"><div className="grid gap-4 sm:grid-cols-2">{socialFields.map(([key, label]) => <label key={key} className="text-sm font-medium text-[#302447]">{label}<input type="url" value={links[key] ?? ''} onChange={(e) => updateLink(key, e.target.value)} placeholder="https://..." className="admin-input mt-2" /></label>)}</div><label className="mt-5 block text-sm font-medium text-[#302447]">Footer message<input value={footerMessage} onChange={(e) => setFooterMessage(e.target.value)} placeholder="Have questions? Contact us - we are here to help." className="admin-input mt-2" /></label><label className="mt-5 block text-sm font-medium text-[#302447]">Announcement bar tagline<input value={announcementTagline} onChange={(e) => setAnnouncementTagline(e.target.value)} placeholder="Share the good energy" className="admin-input mt-2" /><span className="mt-1 block text-xs font-normal text-slate-400">Leave empty to remove the second phrase from the moving bar.</span></label><button type="button" onClick={saveSettings} className="mt-6 rounded-full bg-[#765c8d] px-6 py-3 text-sm font-semibold text-white">Save website settings</button></section></div>;
}
