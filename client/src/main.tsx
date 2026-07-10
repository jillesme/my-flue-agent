import { FlueProvider, useFlueAgent } from '@flue/react';
import { createFlueClient } from '@flue/sdk';
import { useState, type FormEvent } from 'react';
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
