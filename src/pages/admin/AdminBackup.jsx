import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { api } from '../../lib/api.js';
import { Button, Card, useToast } from '../../components/ui.jsx';

export default function AdminBackup() {
  const { success, error: toastError } = useToast();
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [fileName, setFileName] = useState('');

  async function download() {
    setBusy(true);
    try {
      const d = await api.get('/admin/backup');
      const blob = new Blob([JSON.stringify(d.backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sp-exam-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success('Backup downloaded.');
    } catch (e) { toastError(e.message); } finally { setBusy(false); }
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!window.confirm('Restore this backup? It will REPLACE all current data (users, exams, questions, attempts, results).')) return;
      setRestoring(true);
      await api.post('/admin/restore', { backup: parsed });
      success('Backup restored.');
    } catch (ex) {
      toastError(ex.message || 'That file is not a valid SP Exam backup.');
    } finally { setRestoring(false); }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Backup & Restore</h1>
      <p className="mt-1 text-sm text-slate-600">Download the whole JSON database, or restore from a backup file.</p></div>
      <Card>
        <h2 className="text-lg font-bold text-slate-900">Download backup</h2>
        <p className="mt-1 text-sm text-slate-600">Includes users, exams, questions, attempts, results, subjects, announcements, settings and audit logs. Password hashes are included in the export — keep the file private.</p>
        <Button className="mt-4" onClick={download} disabled={busy}><Download size={16} /> {busy ? 'Preparing…' : 'Download JSON backup'}</Button>
      </Card>
      <Card>
        <h2 className="text-lg font-bold text-slate-900">Restore from backup</h2>
        <p className="mt-1 text-sm text-slate-600">Restoring replaces all current data. Download a fresh backup first.</p>
        <label className="mt-4 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-50">
          <Upload size={16} /> {fileName || 'Choose backup file (.json)'}
          <input type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
        </label>
        {restoring && <p className="mt-2 text-sm text-slate-600">Restoring…</p>}
      </Card>
    </div>
  );
}
