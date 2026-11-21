import { useState } from 'react';
import { Button, Card, Input, Textarea, useToast } from '../../components/ui.jsx';
export default function ContactPage() {
  const { success } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  function submit(e) {
    e.preventDefault();
    // No backend mailbox is configured yet: the message is kept locally and
    // the page says so instead of pretending an email was sent.
    try { localStorage.setItem('sp-exam:contact-draft', JSON.stringify({ ...form, at: new Date().toISOString() })); } catch {}
    setSent(true);
    success('Your message was saved on this device. Email sending is not configured yet.');
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Contact</h1>
      <Card>
        <p className="text-sm leading-relaxed text-slate-600">Questions about SP Exam, or about using AAP Pathshala questions with written permission? AAP Pathshala can be reached at +880 1710-090043 or aapathshala09@gmail.com — SP Exam cannot provide their questions without that permission.</p>
        {sent ? (
          <p className="mt-4 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800" role="status">Thanks — your message is saved on this device. There is no email backend configured yet, so nothing was sent online.</p>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <Input label="Your name" id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Email" id="c-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Textarea label="Message" id="c-message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            <Button type="submit" variant="accent">Save message</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
