import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import './PortfolioChat.css';

const prompts = [
  'What games has Kaif built?',
  'What is Kaif’s experience with multiplayer?',
  'What did Kaif work on during his internships?',
];

type Message = { role: 'visitor' | 'assistant'; text: string };

export default function PortfolioChat() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [failedQuestion, setFailedQuestion] = useState('');
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, pending, failedQuestion, open]);

  useEffect(() => () => request.current?.abort(), []);

  function close() {
    setOpen(false);
    launcher.current?.focus();
  }

  async function ask(question: string, retry = false) {
    if (!question || request.current) return;

    const controller = new AbortController();
    request.current = controller;
    setPending(true);
    setFailedQuestion('');
    input.current?.focus();

    if (!retry) {
      setMessages(current => [...current, { role: 'visitor', text: question }]);
      setDraft('');
    }

    const timeout = window.setTimeout(() => controller.abort(), 55_000);
    try {
      const response = await fetch('/api/portfolio-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Portfolio chat request failed');

      const { answer } = await response.json();
      if (typeof answer !== 'string' || !answer.trim()) throw new Error('Missing portfolio chat answer');

      setMessages(current => [...current, { role: 'assistant', text: answer.trim() }]);
    } catch {
      setFailedQuestion(question);
    } finally {
      window.clearTimeout(timeout);
      request.current = null;
      setPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft.trim());
  }

  return (
    <aside className="portfolio-chat" aria-label="Portfolio chat">
      {open && (
        <section
          className="chat-panel"
          id="portfolio-chat-panel"
          aria-labelledby="portfolio-chat-title"
          onKeyDown={event => {
            if (event.key === 'Escape') close();
          }}
        >
          <header className="chat-header">
            <h2 id="portfolio-chat-title">Portfolio chat</h2>
            <button type="button" className="chat-close" aria-label="Close portfolio chat" onClick={close}>×</button>
          </header>

          <div className="chat-body" ref={log}>
            {messages.length === 0 && (
              <div className="chat-intro">
                <p>Ask about Kaif’s projects, skills, or experience.</p>
                <div className="chat-prompts">
                  {prompts.map(prompt => (
                    <button type="button" key={prompt} onClick={() => void ask(prompt)}>{prompt}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="chat-log" role="log" aria-label="Chat messages">
              {messages.map(({ role, text }, index) => (
                <div className={`chat-message chat-message--${role}`} key={index}>
                  <span className="chat-speaker">{role === 'visitor' ? 'You' : 'Portfolio assistant'}</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
            {pending && <p className="chat-status" role="status">Looking up your question…</p>}
            {failedQuestion && (
              <div className="chat-error">
                <p role="status">The assistant couldn’t reply. Try again in a moment.</p>
                <button type="button" onClick={() => void ask(failedQuestion, true)}>Retry</button>
              </div>
            )}
          </div>

          <form className="chat-form" onSubmit={handleSubmit}>
            <label className="chat-input-label" htmlFor="portfolio-chat-question">Your question</label>
            <textarea
              ref={input}
              id="portfolio-chat-question"
              value={draft}
              onChange={event => setDraft(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Ask about Kaif’s work…"
              onKeyDown={event => {
                if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }}
            />
            <button className="ink-button" type="submit" disabled={pending || !draft.trim()}>Send</button>
          </form>
        </section>
      )}

      <button
        ref={launcher}
        type="button"
        className="chat-launcher ink-button"
        aria-expanded={open}
        aria-controls={open ? 'portfolio-chat-panel' : undefined}
        onClick={open ? close : () => setOpen(true)}
      >
        <span className="chat-launcher-icon" aria-hidden="true" />
        Portfolio chat
      </button>
    </aside>
  );
}
