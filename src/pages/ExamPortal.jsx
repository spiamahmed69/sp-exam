import { Link } from 'react-router-dom';
import Dashboard from '../components/Dashboard.jsx';

/** Exam Portal — the existing own-question exam flow (selection screen). */
export default function ExamPortal({ selection, onChange, onStart }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">পরীক্ষা পোর্টাল</h1>
        <p className="mt-1 text-sm text-slate-600">
          SP-এর নিজস্ব প্রশ্নব্যাংক দিয়ে পরীক্ষা — HSC 2026 রসায়ন ১ম ও ২য় পত্র,
          ৫০টি প্রশ্ন। AAP Pathshala-র আসল পরীক্ষা দিতে চাইলে{' '}
          <Link to="/aap-portal" className="font-semibold text-teal-700 underline">
            AAP পোর্টাল
          </Link>{' '}
          খুলুন।
        </p>
      </div>
      <Dashboard selection={selection} onChange={onChange} onStart={onStart} />
    </div>
  );
}
