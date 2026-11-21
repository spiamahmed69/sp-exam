import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';
import { apiConfigured } from '../../lib/api.js';
import { Button, Card, ErrorState, Input, useToast } from '../../components/ui.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const { error: toastError } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const user = await login(form.email.trim(), form.password);
      navigate(user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/dashboard', { replace: true });
    } catch (ex) {
      setErr(ex.message);
      toastError(ex.message);
    } finally {
      setBusy(false);
    }
  }

  if (!apiConfigured()) {
    return (
      <div className="mx-auto max-w-lg">
        <ErrorState
          title="Backend not connected"
          body="Log in needs the PHP API. Set VITE_API_URL to your backend URL and restart the app — see backend/README.md. Until then you can still use the offline Chemistry exam portal without an account."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-bold text-slate-900">Log in to SP Exam</h1>
      {loc.state?.from && <p className="text-sm text-slate-600">Please log in to continue.</p>}
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Email" id="login-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Password" id="login-password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800" role="alert">{err}</p>}
          <Button type="submit" className="w-full" disabled={busy}><LogIn size={16} /> {busy ? 'Logging in…' : 'Log in'}</Button>
        </form>
        <p className="mt-4 text-sm text-slate-600">No account yet? <Link to="/register" className="font-bold text-blue-700 underline">Register as a student</Link></p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">Demo seed accounts (change after first login): admin@sp-exam.local / Admin123! · teacher@sp-exam.local / Teacher123! · student@sp-exam.local / Student123!</p>
      </Card>
    </div>
  );
}
