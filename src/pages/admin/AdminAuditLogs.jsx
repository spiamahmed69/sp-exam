import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Card, EmptyState, ErrorState, Spinner } from '../../components/ui.jsx';

export default function AdminAuditLogs() {
  const [state, setState] = useState('loading');
  const [logs, setLogs] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    api.get('/admin/audit-logs').then((d) => { setLogs(d.audit_logs || []); setState('ok'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }, []);
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
      <p className="mt-1 text-sm text-slate-600">Every admin/teacher write and every exam start and submit, newest first.</p></div>
      {state === 'loading' && <Spinner label="Loading audit logs…" />}
      {state === 'error' && <ErrorState title="Could not load audit logs" body={err} onRetry={() => window.location.reload()} />}
      {state === 'ok' && logs.length === 0 && <EmptyState title="No audit entries yet" body="Actions such as logins, exam creation and submissions will appear here." />}
      {state === 'ok' && logs.length > 0 && (
        <Card>
          <ul className="divide-y divide-slate-100">
            {logs.map((l) => (
              <li key={l.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0">
                <span><span className="font-bold text-slate-900">{l.action}</span>{l.details && Object.keys(l.details).length > 0 && <span className="text-slate-500"> · {JSON.stringify(l.details)}</span>}</span>
                <span className="text-slate-500">{l.created_at ? new Date(l.created_at).toLocaleString() : ''}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
