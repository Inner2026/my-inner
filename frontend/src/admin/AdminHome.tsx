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
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminMarketingDeliveries } from './AdminMarketingDeliveries';
import { AdminAttemptDetail } from './AdminAttemptDetail';
import { AdminSettings } from './AdminSettings';

const links = [['/admin', 'Overview'], ['/admin/tests', 'Tests'], ['/admin/users', 'Users'], ['/admin/purchases', 'Orders'], ['/admin/attempts', 'Attempts'], ['/admin/analytics', 'Analytics'], ['/admin/marketing-deliveries', 'Marketing'], ['/admin/audit-logs', 'Audit logs'], ['/admin/settings', 'Settings']];

export function AdminHome() {
  const location = useLocation();
  const pageTitle = location.pathname.includes('/audit-logs') ? 'Audit logs' : location.pathname.includes('/marketing-deliveries') ? 'Marketing deliveries' : location.pathname.includes('/analytics') ? 'Analytics' : location.pathname.includes('/settings') ? 'Settings' : location.pathname.includes('/users/') ? 'User activity' : location.pathname.includes('/users') ? 'Users' : location.pathname.includes('/purchases') ? 'Orders' : location.pathname.includes('/attempts') ? 'Attempts' : location.pathname.includes('/tests/new') ? 'Create test' : location.pathname.includes('/tests/') ? 'Test management' : location.pathname === '/admin/tests' ? 'Tests' : 'Dashboard';
  return <div className="admin-shell min-h-[calc(100vh-74px)]"><div className="mx-auto flex max-w-[1440px] gap-6 px-4 py-5 sm:px-6 lg:px-8"><aside className="admin-sidebar sticky top-5 hidden h-[calc(100vh-6rem)] w-56 shrink-0 overflow-y-auto rounded-2xl bg-[#302447] p-4 text-white lg:block"><Link to="/admin" className="flex items-center gap-2 border-b border-white/10 px-3 pb-5 font-serif text-xl"><img src="/my-inner-logo.png" alt="" className="h-9 w-9 rounded-lg bg-white/10" />My Inner</Link><p className="px-3 pb-2 pt-7 text-[10px] font-semibold uppercase tracking-[.2em] text-white/45">Workspace</p><nav className="space-y-1">{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => `admin-nav ${isActive ? 'active' : ''}`}><span>•</span>{label}</NavLink>)}</nav></aside><div className="min-w-0 flex-1"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[#765c8d]">Admin workspace</p><h1 className="mt-1 text-2xl font-semibold text-[#302447]">{pageTitle}</h1></div><Link to="/" className="rounded-full border border-[#ded2df] bg-white px-4 py-2 text-xs font-semibold text-[#62596c]">View website ↗</Link></div><div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">{links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin'} className={({ isActive }) => `whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold ${isActive ? 'bg-[#765c8d] text-white' : 'bg-white text-slate-500'}`}>{label}</NavLink>)}</div><div className="admin-content"><Routes><Route index element={<AdminDashboard />} /><Route path="tests" element={<AdminTests />} /><Route path="tests/new" element={<CreateTest />} /><Route path="tests/:testId" element={<TestManage />} /><Route path="versions/:versionId/questions" element={<QuestionEditor />} /><Route path="versions/:versionId/results" element={<ResultEditor />} /><Route path="users" element={<AdminUsers />} /><Route path="users/:userId" element={<AdminUserDetail />} /><Route path="purchases" element={<AdminPurchases />} /><Route path="attempts" element={<AdminAttempts />} /><Route path="attempts/:attemptId" element={<AdminAttemptDetail />} /><Route path="analytics" element={<AdminAnalytics />} /><Route path="marketing-deliveries" element={<AdminMarketingDeliveries />} /><Route path="audit-logs" element={<AdminAuditLogs />} /><Route path="settings" element={<AdminSettings />} /></Routes></div></div></div></div>;
}
