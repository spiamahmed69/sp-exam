import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../../lib/auth.jsx';
import { apiConfigured } from '../../lib/api.js';
import { Button, Card, ErrorState, Input, useToast } from '../../components/ui.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const d = await register(form.name.trim(), form.email.trim(), form.password, form.role);
      success(d.message || 'Account created. Please log in.');
      navigate('/login', { replace: true });
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
        <ErrorState title="Backend not connected" body="Registration needs the PHP API. Set VITE_API_URL to your backend URL and restart the app — see backend/README.md." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Input label="Full name" id="reg-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" id="reg-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Password (at least 8 characters)" id="reg-password" type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <div>
            <span className="block text-sm font-semibold text-slate-700">I am registering as</span>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {[['student', 'Student'], ['teacher', 'Teacher']].map(([v, label]) => (
                <button key={v} type="button" onClick={() => setForm({ ...form, role: v })} aria-pressed={form.role === v}
                  className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${form.role === v ? 'bg-blue-700 text-white ring-blue-700' : 'bg-white text-slate-800 ring-slate-300 hover:bg-slate-50'}`}>
                  {label}
                </button>
              ))}
            </div>
            {form.role === 'teacher' && <p className="mt-2 text-xs text-slate-500">Teacher accounts need admin approval before they can create exams.</p>}
          </div>
          {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800" role="alert">{err}</p>}
          <Button type="submit" variant="accent" className="w-full" disabled={busy}><UserPlus size={16} /> {busy ? 'Creating…' : 'Create account'}</Button>
        </form>
        <p className="mt-4 text-sm text-slate-600">Already have an account? <Link to="/login" className="font-bold text-blue-700 underline">Log in</Link></p>
      </Card>
    </div>
  );
}
