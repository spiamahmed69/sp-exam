import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

// ---- Toasts -----------------------------------------------------------------
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, kind = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const value = useMemo(
    () => ({ toast: push, success: (m) => push(m, 'success'), error: (m) => push(m, 'error') }),
    [push],
  );
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex min-h-[44px] max-w-sm items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${
              t.kind === 'success' ? 'bg-green-700' : t.kind === 'error' ? 'bg-red-700' : 'bg-slate-900'
            }`}
          >
            {t.kind === 'success' ? <CheckCircle2 size={18} /> : t.kind === 'error' ? <AlertTriangle size={18} /> : <Info size={18} />}
            <span>{t.message}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="ml-1 rounded p-1 hover:bg-white/20">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: () => {}, success: () => {}, error: () => {} };
  return ctx;
}

// ---- Primitives --------------------------------------------------------------
const btnBase =
  'inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-40';
export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-blue-700 text-white hover:bg-blue-800',
    accent: 'bg-orange-600 text-white hover:bg-orange-700',
    outline: 'bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50',
    danger: 'bg-red-700 text-white hover:bg-red-800',
    ghost: 'text-slate-700 hover:bg-slate-100',
  };
  return <button type="button" className={`${btnBase} ${styles[variant] || styles.primary} ${className}`} {...props} />;
}

export function Card({ className = '', children }) {
  return <div className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${className}`}>{children}</div>;
}

export function Input({ label, id, hint, ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <input
        id={id}
        {...props}
        className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function Textarea({ label, id, ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        {...props}
        className="mt-1 min-h-[100px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      />
    </div>
  );
}

export function Badge({ tone = 'slate', children }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    green: 'bg-green-100 text-green-800 ring-green-200',
    red: 'bg-red-100 text-red-800 ring-red-200',
    amber: 'bg-amber-100 text-amber-900 ring-amber-200',
    blue: 'bg-blue-100 text-blue-800 ring-blue-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, sub, icon }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
        {icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</span>}
      </div>
    </Card>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-slate-600" role="status">
      <Loader2 className="animate-spin" size={18} /> {label}
    </div>
  );
}

export function Skeleton({ className = 'h-24' }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200 ${className}`} aria-hidden="true" />;
}

export function EmptyState({ title, body, action }) {
  return (
    <Card className="py-10 text-center">
      <p className="text-base font-bold text-slate-900">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  );
}

export function ErrorState({ title = 'Something went wrong', body, onRetry }) {
  return (
    <Card className="border-red-200 py-8 text-center">
      <AlertTriangle className="mx-auto text-red-600" size={28} />
      <p className="mt-3 text-base font-bold text-slate-900">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">{body}</p>}
      {onRetry && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </Card>
  );
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
