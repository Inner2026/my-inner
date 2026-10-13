import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';
import { AdminTests } from './AdminTests';
import { CreateTest } from './CreateTest';
import { TestManage } from './TestManage';
import { QuestionEditor } from './QuestionEditor';
import { ResultEditor } from './ResultEditor';
import { AdminUsers } from './AdminUsers';
import { AdminUserDetail } from './AdminUserDetail';
import { AdminPurchases } from './AdminPurchases';
import { AdminAttempts } from './AdminAttempts';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminMarketingDeliveries } from './AdminMarketingDeliveries';
import { AdminAttemptDetail } from './AdminAttemptDetail';
import { AdminSettings } from './AdminSettings';
import { AdminReviews } from './AdminReviews';
import { AdminPromotion } from './AdminPromotion';
import { AdminFeedbackProvider } from './AdminFeedback';

const links = [['/admin', 'Overview'], ['/admin/tests', 'Tests'], ['/admin/reviews', 'Reviews'], ['/admin/users', 'Users'], ['/admin/purchases', 'Orders'], ['/admin/attempts', 'Attempts'], ['/admin/analytics', 'Analytics'], ['/admin/marketing-deliveries', 'Marketing'], ['/admin/promotion', 'Promotion'], ['/admin/settings', 'Settings']];

function AdminSidebar() {
  return <div className="hidden w-56 shrink-0 self-stretch lg:block"><aside className="admin-sidebar sticky top-[6.5rem] z-10 w-56 rounded-2xl bg-[#302447] p-4 text-white shadow-lg"><Link to="/admin" className="flex items-center gap-2 border-b border-white/10 px-3 pb-5 font-serif text-xl"><img src="/my-inner-logo.png" alt="" className="h-9 w-9 rounded-lg bg-white/10" />My Inner</Link><nav className="mt-6 space-y-1">{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => `admin-nav ${isActive ? 'active' : ''}`}>{label}</NavLink>)}</nav></aside></div>;
}

export function AdminHome() {
  const location = useLocation();
  const pageTitle = location.pathname.includes('/analytics') ? 'Analytics' : location.pathname.includes('/promotion') ? 'Promotion' : location.pathname.includes('/reviews') ? 'Reviews' : location.pathname.includes('/settings') ? 'Settings' : 'Dashboard';
  return <AdminFeedbackProvider><div className="admin-shell min-h-[calc(100vh-74px)] overflow-x-hidden"><div className="mx-auto flex min-w-0 max-w-[1440px] items-start gap-6 px-3 py-4 sm:px-6 lg:px-8"><AdminSidebar /><div className="min-w-0 max-w-full flex-1"><div className="mb-5 flex min-w-0 flex-wrap items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs uppercase tracking-widest text-[#765c8d]">Admin workspace</p><h1 className="truncate text-2xl font-semibold text-[#302447]">{pageTitle}</h1></div><Link to="/" className="shrink-0 rounded-full border bg-white px-4 py-2 text-xs">View website</Link></div><nav className="mb-4 flex flex-wrap gap-2 lg:hidden">{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => `rounded-full border px-3 py-2 text-xs transition ${isActive ? 'border-[#765c8d] bg-[#765c8d] font-semibold text-white' : 'border-transparent bg-white text-slate-600 hover:border-[#d9cedd] hover:bg-[#f4edf8] hover:text-[#765c8d]'}`}>{label}</NavLink>)}</nav><div className="admin-content min-w-0 max-w-full"><Routes><Route index element={<AdminDashboard />} /><Route path="promotion" element={<AdminPromotion />} /><Route path="tests" element={<AdminTests />} /><Route path="reviews" element={<AdminReviews />} /><Route path="tests/new" element={<CreateTest />} /><Route path="tests/:testId" element={<TestManage />} /><Route path="versions/:versionId/questions" element={<QuestionEditor />} /><Route path="versions/:versionId/results" element={<ResultEditor />} /><Route path="users" element={<AdminUsers />} /><Route path="users/:userId" element={<AdminUserDetail />} /><Route path="purchases" element={<AdminPurchases />} /><Route path="attempts" element={<AdminAttempts />} /><Route path="attempts/:attemptId" element={<AdminAttemptDetail />} /><Route path="analytics" element={<AdminAnalytics />} /><Route path="marketing-deliveries" element={<AdminMarketingDeliveries />} /><Route path="settings" element={<AdminSettings />} /></Routes></div></div></div></div></AdminFeedbackProvider>;
}
