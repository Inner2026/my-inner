import { useEffect, useMemo, useState } from 'react';
import { AdminApi } from '../api/adminEndpoints';

function money(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

function StatCard({ icon, label, value, caption, color }: { icon: string; label: string; value: string; caption: string; color: string }) {
  return <article className="relative min-w-0 overflow-hidden rounded-[1.25rem] border border-[#eee5e9] bg-white p-5 shadow-[0_8px_24px_rgba(73,57,88,.045)] sm:p-6">
    <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${color}`}>{icon}</span>
    <p className="mt-5 text-[11px] font-bold uppercase tracking-[.14em] text-[#9a919e]">{label}</p>
    <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-[#302447] sm:text-3xl">{value}</p>
    <p className="mt-1 text-xs text-[#aaa1ad]">{caption}</p>
  </article>;
}

function Section({ eyebrow, title, children, className = '' }: { eyebrow?: string; title: string; children: React.ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-[1.25rem] border border-[#eee5e9] bg-white p-5 shadow-[0_8px_24px_rgba(73,57,88,.045)] sm:p-6 ${className}`}>
    {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#765c8d]">{eyebrow}</p>}
    <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#302447] sm:text-xl">{title}</h2>
    {children}
  </section>;
}

export function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true); setError(null);
    AdminApi.analytics({ from: from || undefined, to: to || undefined })
      .then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const daily = data?.dailyPurchases ?? [];
    return {
      purchases: daily.reduce((sum: number, row: any) => sum + row.purchases, 0),
      revenue: daily.reduce((sum: number, row: any) => sum + row.revenue, 0),
      attempts: (data?.attempts ?? []).reduce((sum: number, row: any) => sum + row.count, 0)
    };
  }, [data]);

  const daily = data?.dailyPurchases ?? [];
  const tests = data?.byTest ?? [];
  const maxRevenue = Math.max(1, ...daily.map((row: any) => row.revenue));

  return <div className="min-w-0 space-y-5 pb-8 sm:space-y-6">
    <header className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#765c8d] sm:text-xs">Business intelligence</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#302447] sm:text-3xl">Analytics</h1><p className="mt-2 max-w-lg text-sm leading-6 text-[#8b8190]">Understand your sales, customers, and assessment activity at a glance.</p></div>
      <div className="flex w-full flex-col gap-2 rounded-2xl border border-[#eee5e9] bg-white p-3 shadow-sm sm:flex-row sm:items-end xl:w-auto">
        <label className="min-w-0 flex-1 text-[10px] font-bold uppercase tracking-wider text-[#9a919e]">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="admin-input mt-1 !w-full !py-2.5" /></label>
        <label className="min-w-0 flex-1 text-[10px] font-bold uppercase tracking-wider text-[#9a919e]">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="admin-input mt-1 !w-full !py-2.5" /></label>
        <button type="button" onClick={load} className="h-[2.7rem] rounded-xl bg-[#765c8d] px-5 text-sm font-semibold text-white transition hover:bg-[#634a78] sm:shrink-0">Apply filters</button>
      </div>
    </header>

    {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {loading && <div className="rounded-2xl bg-white p-12 text-center text-sm text-[#8b8190] shadow-sm">Loading your analytics...</div>}
    {!loading && data && <>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        <StatCard icon="$" label="Revenue" value={money(summary.revenue)} caption="Paid orders in this period" color="bg-[#f0eaf5] text-[#765c8d]" />
        <StatCard icon="↗" label="Paid purchases" value={String(summary.purchases)} caption="Completed transactions" color="bg-[#f5e8ed] text-[#bd7891]" />
        <StatCard icon="♡" label="New users" value={String(data.newUsers)} caption="Accounts created" color="bg-[#e4f0eb] text-[#719b8d]" />
        <StatCard icon="✦" label="Attempts" value={String(summary.attempts)} caption="Assessment activity" color="bg-[#f5eedf] text-[#a47e4d]" />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.85fr)]">
        <Section eyebrow="Revenue trend" title="Paid purchases by day" className="min-w-0">
          <div className="mt-5 flex items-center justify-between gap-3"><p className="text-xs text-[#9a919e]">Daily revenue</p><span className="rounded-full bg-[#f5eff9] px-3 py-1 text-xs font-semibold text-[#765c8d]">{summary.purchases} orders</span></div>
          {daily.length === 0 ? <p className="py-16 text-center text-sm text-[#8b8190]">No paid purchases in this period.</p> : <div className="mt-5 flex h-56 min-w-0 items-end gap-1.5 overflow-x-auto border-b border-[#eee5e9] pb-0 sm:gap-2">{daily.map((row: any) => <div key={row._id} className="group flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-1.5 sm:min-w-10"><span className="pointer-events-none whitespace-nowrap rounded-md bg-[#302447] px-1.5 py-1 text-[9px] font-semibold text-white opacity-0 transition group-hover:opacity-100">{money(row.revenue)}</span><div className="w-full rounded-t-lg bg-gradient-to-t from-[#765c8d] to-[#bd7891] transition group-hover:from-[#634a78]" style={{ height: `${Math.max(8, (row.revenue / maxRevenue) * 155)}px` }} /><span className="mb-2 text-[9px] text-[#9a919e]">{String(row._id).slice(5)}</span></div>)}</div>}
        </Section>
        <Section eyebrow="Performance" title="Revenue by test">
          {tests.length === 0 ? <p className="py-12 text-sm text-[#8b8190]">No test sales in this period.</p> : <div className="mt-5 space-y-4">{tests.slice(0, 6).map((row: any, index: number) => <div key={row._id}><div className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate font-medium text-[#62596c]"><span className="mr-2 text-[10px] font-bold text-[#bd7891]">{String(index + 1).padStart(2, '0')}</span>{row.name || 'Unknown test'}</span><span className="shrink-0 font-semibold text-[#302447]">{money(row.revenue)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f2edf3]"><div className="h-full rounded-full bg-[#719b8d]" style={{ width: `${Math.max(8, (row.revenue / Math.max(1, tests[0]?.revenue)) * 100)}%` }} /></div></div>)}</div>}
        </Section>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Section title="Assessment activity"><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{data.attempts.length === 0 ? <p className="col-span-full text-sm text-[#8b8190]">No attempts in this period.</p> : data.attempts.map((row: any) => <div key={row._id} className="rounded-xl bg-[#faf7fb] p-4"><p className="truncate text-xs capitalize text-[#8b8190]">{String(row._id).replaceAll('_', ' ')}</p><p className="mt-1 text-xl font-semibold text-[#302447]">{row.count}</p></div>)}</div></Section>
        <Section title="Marketing delivery"><div className="mt-4 space-y-2">{data.marketing.length === 0 ? <p className="text-sm text-[#8b8190]">No marketing deliveries in this period.</p> : data.marketing.map((row: any) => <div key={row._id} className="flex items-center justify-between rounded-xl bg-[#faf7fb] px-4 py-3 text-sm"><span className="capitalize text-[#62596c]">{row._id}</span><span className="font-semibold text-[#302447]">{row.count}</span></div>)}</div></Section>
      </div>
    </>}
  </div>;
}
