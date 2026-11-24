import { useState } from 'react';
import type { FormEvent } from 'react';

export default function ContactForm() {
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setSending(true);
    setFeedback('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setFeedback(result.fields?.[0]?.message || result.error || 'Could not send your message. You can reach me by email.');
        return;
      }
      form.reset();
      setFeedback('Message sent. Thanks for reaching out.');
    } catch {
      setFeedback('Could not send your message. You can reach me by email.');
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={sendMessage}>
      <div className="form-row">
        <label>Name<input name="name" autoComplete="name" required minLength={2} maxLength={80} /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required maxLength={120} /></label>
      </div>
      <label>Subject<input name="subject" required minLength={3} maxLength={120} /></label>
      <label>Message<textarea name="message" rows={4} required minLength={10} maxLength={2000} /></label>
      <div hidden>
        <label>Website<input name="website" autoComplete="off" tabIndex={-1} /></label>
      </div>
      <button className="ink-button" disabled={sending}>{sending ? 'Sending…' : 'Send message'}</button>
      <p className="form-feedback" role="status">{feedback}</p>
    </form>
  );
}
