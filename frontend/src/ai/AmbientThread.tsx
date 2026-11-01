/**
 * <AmbientThread /> — the My Inner AI presence for the homepage hero.
 *
 * Usage (inside the existing hero <section>, which must be position:relative):
 *   <section className="relative ...">
 *     ...existing hero content, unchanged...
 *     <AmbientThread />
 *   </section>
 *
 * No chat panel, no avatar. Just the golden thread, a quiet invitation,
 * and minimal controls that appear only once voice is active.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAiNavigate } from './tools';
import { GoldenThread } from './goldenThread';
import { useMyInnerVoice } from './useMyInnerVoice';
import './ambientThread.css';

const LABEL: Record<string, string> = {
  idle: 'Tap to speak with My Inner AI',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'My Inner AI is speaking',
  muted: 'Voice paused',
  unavailable: 'Voice unavailable',
};

const ERRORS: Record<string, string> = {
  mic_denied: 'Microphone access was declined. You can type instead, or keep browsing.',
  rate_limited: 'Voice is busy right now. Please try again a little later.',
  ai_disabled: 'Voice guide is currently offline.',
};

export default function AmbientThread() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threadRef = useRef<GoldenThread | null>(null);
  const voice = useMyInnerVoice();
  const navigate = useNavigate();
  useEffect(() => setAiNavigate((p) => navigate(p)), [navigate]);
  const [consented, setConsented] = useState(false);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState('');

  // Mount renderer once.
  useEffect(() => {
    if (!canvasRef.current) return;
    const t = new GoldenThread(canvasRef.current, { maxAmplitude: 30 });
    threadRef.current = t;
    t.start();
    let raf = 0;
    const feed = () => {
      t.setLevel(voice.levelRef.current);
      raf = requestAnimationFrame(feed);
    };
    raf = requestAnimationFrame(feed);
    return () => {
      cancelAnimationFrame(raf);
      t.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => threadRef.current?.setState(voice.state), [voice.state]);

  const active = voice.phase === 'live' || voice.phase === 'connecting';

  const onInvite = () => {
    if (voice.phase === 'error') return setTyping(true);
    if (!consented) return setConsented(true); // first tap: show the one-line disclosure
    voice.start(); // second tap ("Start") is the user gesture for mic + audio
  };

  return (
    <div className="mi-ai" aria-live="polite">
      <canvas ref={canvasRef} className="mi-ai__thread" aria-hidden="true" />

      <div className="mi-ai__ui">
        {!active && !consented && (
          <button type="button" className="mi-ai__pill" onClick={onInvite} aria-label="Start a voice conversation with My Inner AI">
            <MicIcon /> <span>{voice.phase === 'error' ? LABEL.unavailable : LABEL.idle}</span>
          </button>
        )}

        {!active && consented && voice.phase !== 'error' && (
          <div className="mi-ai__pill mi-ai__pill--consent" role="dialog" aria-label="Voice consent">
            <span>You'll be talking with an AI. We'll use your microphone only while voice is on; audio isn't stored.</span>
            <button type="button" className="mi-ai__link" onClick={() => voice.start()}>Start</button>
            <button type="button" className="mi-ai__link mi-ai__link--muted" onClick={() => setTyping(true)}>Type instead</button>
          </div>
        )}

        {active && (
          <div className="mi-ai__controls">
            <span className="mi-ai__status">
              {voice.state === 'listening' && <span className="mi-ai__rec" aria-hidden="true" />}
              {voice.phase === 'connecting' ? 'Connecting…' : LABEL[voice.state]}
            </span>
            <button type="button" className="mi-ai__icon" onClick={voice.toggleMute} aria-pressed={voice.muted} aria-label={voice.muted ? 'Resume voice' : 'Pause voice'}>
              {voice.muted ? <MicIcon /> : <PauseIcon />}
            </button>
            <button type="button" className="mi-ai__icon" onClick={() => setTyping((t) => !t)} aria-label="Type a message">
              <KeyIcon />
            </button>
            <button type="button" className="mi-ai__icon" onClick={voice.end} aria-label="End voice session">
              <CloseIcon />
            </button>
          </div>
        )}

        {voice.phase === 'error' && voice.error && <p className="mi-ai__note">{ERRORS[voice.error] ?? 'Voice is unavailable right now. You can keep browsing.'}</p>}

        {typing && (
          <form
            className="mi-ai__type"
            onSubmit={(e) => {
              e.preventDefault();
              voice.sendText(text);
              setText('');
            }}
          >
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask My Inner AI…" aria-label="Message to My Inner AI" />
          </form>
        )}

        {(typing || voice.muted) && voice.caption && <p className="mi-ai__caption">{voice.caption}</p>}
      </div>
    </div>
  );
}

const MicIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 5v14M15 5v14" /></svg>
);
const KeyIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" /></svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
