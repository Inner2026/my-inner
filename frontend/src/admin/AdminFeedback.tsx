import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error';
type ConfirmOptions = { title: string; message: string; confirmLabel?: string; danger?: boolean };
type FeedbackContextValue = { showSuccess: (message: string) => void; showError: (message: string) => void; askConfirmation: (options: ConfirmOptions) => Promise<boolean> };

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const [confirmation, setConfirmation] = useState<(ConfirmOptions & { resolve: (answer: boolean) => void }) | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value: FeedbackContextValue = {
    showSuccess: (message) => setToast({ type: 'success', message }),
    showError: (message) => setToast({ type: 'error', message }),
    askConfirmation: (options) => new Promise((resolve) => setConfirmation({ ...options, resolve }))
  };

  function closeConfirmation(answer: boolean) {
    confirmation?.resolve(answer);
    setConfirmation(null);
  }

  return <FeedbackContext.Provider value={value}>
    {children}
    {toast && <div className={`admin-toast fixed right-5 top-24 z-[100] flex max-w-[min(92vw,24rem)] items-start gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`} role="status"><span className={`admin-toast-icon mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${toast.type === 'success' ? 'admin-toast-icon-success' : 'admin-toast-icon-error'}`}>{toast.type === 'success' ? '✓' : '!'}</span><span className="break-words">{toast.message}</span><button type="button" onClick={() => setToast(null)} className="ml-auto text-white/80 hover:text-white" aria-label="Close notification">×</button></div>}
    {confirmation && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="admin-confirm-title" className="text-lg font-semibold text-[#302447]">{confirmation.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{confirmation.message}</p><div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => closeConfirmation(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button type="button" onClick={() => closeConfirmation(true)} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${confirmation.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#765c8d] hover:bg-[#634a78]'}`}>{confirmation.confirmLabel || 'Confirm'}</button></div></div></div>}
  </FeedbackContext.Provider>;
}

export function useAdminFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useAdminFeedback must be used inside AdminFeedbackProvider');
  return context;
}
