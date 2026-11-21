import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Button, Card, ErrorState, Input, Spinner, useToast } from '../../components/ui.jsx';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [err, setErr] = useState('');
  const { success, error: toastError } = useToast();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get('/settings').then((d) => setSettings(d.settings)).catch((e) => setErr(e.message));
  }, []);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api.put('/admin/settings', settings);
      setSettings(d.settings);
      success('Settings saved.');
    } catch (ex) { toastError(ex.message); } finally { setBusy(false); }
  }
  if (err) return <ErrorState title="Could not load settings" body={err} />;
  if (!settings) return <Spinner label="Loading settings…" />;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Website Settings</h1>
      <p className="mt-1 text-sm text-slate-600">Platform-wide settings stored on the server.</p></div>
      <Card>
        <form onSubmit={save} className="space-y-4">
          <Input label="Site name" id="set-name" value={settings.site_name || ''} onChange={(e) => setSettings({ ...settings, site_name: e.target.value })} />
          <Input label="Default negative marking" id="set-neg" type="number" step="0.05" min={0} max={1} value={settings.default_negative_marking ?? 0.25} onChange={(e) => setSettings({ ...settings, default_negative_marking: Number(e.target.value) })} />
          <Input label="Default duration (minutes)" id="set-dur" type="number" min={1} max={300} value={settings.default_duration_min ?? 25} onChange={(e) => setSettings({ ...settings, default_duration_min: Number(e.target.value) })} />
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={!!settings.allow_registration} onChange={(e) => setSettings({ ...settings, allow_registration: e.target.checked })} className="h-5 w-5 accent-blue-700" /> Allow new registrations
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={!!settings.maintenance_mode} onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })} className="h-5 w-5 accent-blue-700" /> Maintenance mode
          </label>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</Button>
        </form>
      </Card>
    </div>
  );
}
