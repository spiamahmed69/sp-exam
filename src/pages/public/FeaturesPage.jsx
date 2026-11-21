import { Card } from '../../components/ui.jsx';
const GROUPS = [
  ['For students', ['Register and log in securely', 'Browse published exams and read instructions', 'Server-timed exam with question palette and mark-for-review', 'Answer autosave and auto-submit on expiry', 'Results only after publication, plus exam history and leaderboard']],
  ['For teachers', ['Create MCQ and CQ exams with marks and duration', 'Schedule and publish / unpublish exams', 'Manage questions per exam', 'Review submissions and mark CQ answers by hand', 'Publish results when marking is done']],
  ['For admins', ['Approve or suspend student and teacher accounts', 'Manage subjects, announcements and all exams', 'Platform statistics and audit logs', 'Backup and restore the whole JSON database']],
];
export default function FeaturesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Features</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {GROUPS.map(([title, items]) => (
          <Card key={title}>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600">{items.map((i) => <li key={i}>{i}</li>)}</ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
