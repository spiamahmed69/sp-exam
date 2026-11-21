import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Badge, Button, Card, EmptyState, ErrorState, Spinner, useToast } from '../../components/ui.jsx';

export default function AdminUsers({ roleFilter }) {
  const [params] = useSearchParams();
  const role = roleFilter || params.get('role') || '';
  const { success, error: toastError } = useToast();
  const [state, setState] = useState('loading');
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState('');
  function load() {
    setState('loading');
    api.get(role ? `/admin/users?role=${role}` : '/admin/users').then((d) => { setUsers(d.users || []); setState('ok'); })
      .catch((e) => { setErr(e.message); setState('error'); });
  }
  useEffect(load, [role]);
  async function act(u, action) {
    try { await api.post(`/admin/users/${u.id}/${action}`, {}); success(`User ${action === 'approve' ? 'approved' : 'suspended'}.`); load(); }
    catch (e) { toastError(e.message); }
  }
  const title = role === 'teacher' ? 'Teacher Management' : role === 'student' ? 'Student Management' : 'User Management';
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">Approve teacher accounts so they can create exams, or suspend accounts that break the rules.</p></div>
      {state === 'loading' && <Spinner label="Loading users…" />}
      {state === 'error' && <ErrorState title="Could not load users" body={err} onRetry={load} />}
      {state === 'ok' && users.length === 0 && <EmptyState title="No users found" body="No accounts match this filter yet." />}
      {state === 'ok' && users.length > 0 && (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{u.name} <span className="font-normal text-slate-500">· {u.email}</span></p>
                  <p className="mt-1 flex flex-wrap gap-2">
                    <Badge tone={u.role === 'admin' ? 'blue' : u.role === 'teacher' ? 'amber' : 'slate'}>{u.role}</Badge>
                    <Badge tone={u.status === 'approved' ? 'green' : u.status === 'pending' ? 'amber' : 'red'}>{u.status}</Badge>
                  </p>
                </div>
                <div className="flex gap-2">
                  {u.status !== 'approved' && <Button onClick={() => act(u, 'approve')}>Approve</Button>}
                  {u.status !== 'suspended' && <Button variant="danger" onClick={() => act(u, 'suspend')}>Suspend</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
