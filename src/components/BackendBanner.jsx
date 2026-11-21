import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlugZap, ServerOff } from 'lucide-react';
import { apiConfigured, apiUrl, checkConnection } from '../lib/api.js';

/**
 * Shows the backend connection state. When the PHP API is not configured or
 * unreachable, the app keeps working in local/offline mode (the Chemistry
 * exam portal) and never shows fake API data.
 */
export function useBackendStatus() {
  const [status, setStatus] = useState({ status: 'unknown', url: apiUrl });
  useEffect(() => {
    let alive = true;
    checkConnection().then((s) => {
      if (alive) setStatus(s);
    });
    return () => {
      alive = false;
    };
  }, []);
  return status;
}

export default function BackendBanner() {
  const { status, url } = useBackendStatus();
  if (status === 'online') return null;
  if (status === 'not_configured') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm" role="note">
        <ServerOff className="mt-0.5 shrink-0 text-amber-700" size={20} />
        <div>
          <p className="font-bold text-amber-900">Backend not connected — running in local mode</p>
          <p className="mt-1 leading-relaxed text-amber-900">
            The Chemistry exam portal below works offline from the local question bank. To enable accounts,
            online exams and results, set <code className="rounded bg-amber-100 px-1">VITE_API_URL</code> to your
            PHP API URL (for example <code className="rounded bg-amber-100 px-1">http://127.0.0.1:8080/api</code> locally)
            and restart the app. See <code className="rounded bg-amber-100 px-1">backend/README.md</code>.
          </p>
        </div>
      </div>
    );
  }
  if (status === 'offline') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm" role="alert">
        <PlugZap className="mt-0.5 shrink-0 text-red-700" size={20} />
        <div>
          <p className="font-bold text-red-900">Backend unreachable</p>
          <p className="mt-1 leading-relaxed text-red-900">
            The API at <code className="rounded bg-red-100 px-1">{url}</code> did not respond. Online exams,
            results and dashboards are unavailable until it is back — the local Chemistry exam portal still works.
          </p>
          <Link to="/settings" className="mt-2 inline-block font-bold text-red-800 underline">
            Check connection settings
          </Link>
        </div>
      </div>
    );
  }
  return null;
}
