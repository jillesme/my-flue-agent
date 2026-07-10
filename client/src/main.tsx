import { FlueProvider, useFlueAgent } from '@flue/react';
import { createFlueClient } from '@flue/sdk';
import { useEffect, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
import './styles.css';

const client = createFlueClient({ baseUrl: '/api' });
const conversationKey = 'world-cup-signal:conversation-id';
const suggestedPrompts = [
  'What are the biggest World Cup stories today?',
  'Give me the latest on injuries affecting the tournament.',
  'What should I know before the next major match?',
];

type WatchtowerStory = {
  id: number;
  headline: string;
  summary: string;
  sourceTitle: string;
  sourceUrl: string;
  publishedAt: string | null;
  lastSeenAt: string;
};

type WatchtowerResponse = {
  news: WatchtowerStory[];
  refreshedAt: string | null;
  refreshStatus: string | null;
};

function createConversationId() {
  return crypto.randomUUID();
}

function getConversationId() {
  const storedId = localStorage.getItem(conversationKey);
  if (storedId) return storedId;

  const id = createConversationId();
  localStorage.setItem(conversationKey, id);
  return id;
}

function Chat() {
  const [conversationId, setConversationId] = useState(getConversationId);
  const [input, setInput] = useState('');
  const agent = useFlueAgent({
    name: 'world-cup-signal',
    id: conversationId,
    live: 'sse',
  });

  const isWorking = agent.status === 'submitted' || agent.status === 'streaming';
  const visibleMessages = agent.messages.filter((message) =>
    message.parts.some((part) => part.type === 'text' && part.text.trim()),
  );
  const statusMessage = getStatusMessage(agent.status, agent.historyReady);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || isWorking) return;

    setInput('');
    try {
      await agent.sendMessage(message);
    } catch {
      // The hook retains the error and failed optimistic message for the UI.
    }
  }

  function startNewConversation() {
    const id = createConversationId();
    localStorage.setItem(conversationKey, id);
    setConversationId(id);
    setInput('');
  }

  function useSuggestedPrompt(prompt: string) {
    setInput(prompt);
  }

  return (
    <main className="shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">SOURCE-GROUNDED WORLD CUP REPORTING</p>
          <h1>World Cup Signal</h1>
          <p className="intro">
            Fast, careful briefings built from current reporting—not speculation.
          </p>
        </div>
        <button className="new-conversation" onClick={startNewConversation} type="button">
          New conversation
        </button>
      </header>

      <Watchtower />

      <section aria-label="Conversation" className="conversation">
        {visibleMessages.length === 0 ? (
          <div className="empty-state">
            <p className="kicker">THE BRIEFING DESK</p>
            <h2>What do you want to know?</h2>
            <p>
              Ask about results, fixtures, squads, injuries, quotes, or the stories shaping the
              tournament. Current questions are researched before they are answered.
            </p>
            <div className="suggestions">
              {suggestedPrompts.map((prompt) => (
                <button key={prompt} onClick={() => useSuggestedPrompt(prompt)} type="button">
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages" aria-live="polite">
            {visibleMessages.map((message) => (
              <article className={`message ${message.role}`} key={message.id}>
                <p className="message-label">{message.role === 'user' ? 'YOU' : 'WORLD CUP SIGNAL'}</p>
                <div className="message-content">
                  {message.parts.map((part, index) => {
                    if (part.type === 'text') {
                      return message.role === 'assistant' ? (
                        <ReactMarkdown key={`${message.id}-${index}`}>{part.text}</ReactMarkdown>
                      ) : (
                        <p key={`${message.id}-${index}`}>{part.text}</p>
                      );
                    }

                    return null;
                  })}
                </div>
              </article>
            ))}
          </div>
        )}

        {statusMessage ? <p className="status" role="status">{statusMessage}</p> : null}
        {agent.error ? <p className="error">{agent.error.message}</p> : null}
      </section>

      <form className="composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="question">
          Ask a World Cup question
        </label>
        <textarea
          id="question"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about the World Cup…"
          rows={2}
          value={input}
        />
        <button disabled={!input.trim() || isWorking} type="submit">
          {isWorking ? 'Researching…' : 'Ask'}
        </button>
      </form>

      <footer>
        Current facts are checked against reporting. Sources appear in each briefing when available.
      </footer>
    </main>
  );
}

function Watchtower() {
  const [watchtower, setWatchtower] = useState<WatchtowerResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadWatchtower() {
      try {
        const response = await fetch('/api/watchtower/news');
        if (!response.ok) throw new Error('Watchtower request failed.');
        const data = (await response.json()) as WatchtowerResponse;
        if (!cancelled) {
          setWatchtower(data);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void loadWatchtower();
    const interval = window.setInterval(loadWatchtower, 5 * 60 * 1_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const refreshLabel = watchtower?.refreshedAt
    ? `Last checked ${formatDate(watchtower.refreshedAt)}`
    : 'Next scheduled check pending';

  return (
    <section aria-labelledby="watchtower-title" className="watchtower">
      <div className="watchtower-heading">
        <div>
          <p className="kicker">AUTONOMOUS NEWS DESK</p>
          <h2 id="watchtower-title">Watchtower</h2>
        </div>
        <p className="watchtower-status">{refreshLabel}</p>
      </div>

      {failed ? <p className="watchtower-empty">Latest news is temporarily unavailable.</p> : null}
      {!failed && !watchtower ? <p className="watchtower-empty">Loading latest reporting…</p> : null}
      {!failed && watchtower?.news.length === 0 ? (
        <p className="watchtower-empty">
          The Watchtower checks current reporting every 30 minutes on US weekdays while the
          tournament is active. No material updates have been published yet.
        </p>
      ) : null}
      {watchtower?.news.length ? (
        <ol className="watchtower-list">
          {watchtower.news.map((story) => (
            <li key={story.id}>
              <article className="watchtower-story">
                <p className="story-meta">
                  {story.publishedAt ? formatDate(story.publishedAt) : `Seen ${formatDate(story.lastSeenAt)}`}
                </p>
                <h3>{story.headline}</h3>
                <p>{story.summary}</p>
                <a href={story.sourceUrl} rel="noreferrer" target="_blank">
                  {story.sourceTitle} ↗
                </a>
              </article>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getStatusMessage(status: string, historyReady: boolean) {
  if (!historyReady && status === 'connecting') return 'Loading your conversation…';
  if (status === 'submitted') return 'Finding current reporting…';
  if (status === 'streaming') return 'Writing your briefing…';
  if (status === 'connecting') return 'Reconnecting to the briefing desk…';
  return undefined;
}

function App() {
  return (
    <FlueProvider client={client}>
      <Chat />
    </FlueProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
