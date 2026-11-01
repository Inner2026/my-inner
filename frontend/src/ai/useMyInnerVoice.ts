/**
 * useMyInnerVoice — WebRTC voice session with the OpenAI Realtime API.
 *
 * - Microphone is requested ONLY inside start(), which must be called from a
 *   user gesture (tap/click). This also satisfies iOS Safari's autoplay rules.
 * - The browser never sees the permanent API key; it gets an ephemeral secret
 *   from POST {API_BASE}/api/ai/session.
 * - The entity state is DERIVED from real signals:
 *     speaking  ⇐ the AI's audio track is actually producing sound
 *     listening ⇐ the mic track is live and enabled
 *     thinking  ⇐ the visitor stopped talking and no audio has started yet
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EntityState } from './goldenThread';
import { readLevel } from './goldenThread';
import { runTool } from './tools';
import { apiRequest } from '../api/client';

const REALTIME_URL = 'https://api.openai.com/v1/realtime/calls';
const SPEAKING_THRESHOLD = 0.04;

type Phase = 'off' | 'connecting' | 'live' | 'error';

export function useMyInnerVoice() {
  const [phase, setPhase] = useState<Phase>('off');
  const [muted, setMuted] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pc = useRef<RTCPeerConnection | null>(null);
  const dc = useRef<RTCDataChannel | null>(null);
  const mic = useRef<MediaStream | null>(null);
  const audioEl = useRef<HTMLAudioElement | null>(null);
  const ac = useRef<AudioContext | null>(null);
  const outAn = useRef<AnalyserNode | null>(null);
  const inAn = useRef<AnalyserNode | null>(null);
  const buf = useRef(new Uint8Array(1024));
  const lastLoud = useRef(0);
  const captionBuf = useRef('');

  /** Read once per animation frame by the renderer — no React re-render per frame. */
  const levelRef = useRef(0);

  const send = (evt: unknown) => {
    if (dc.current?.readyState === 'open') dc.current.send(JSON.stringify(evt));
  };

  // Per-frame audio metering → levelRef + speaking flag.
  useEffect(() => {
    if (phase !== 'live') return;
    let raf = 0;
    const loop = () => {
      const now = performance.now();
      const out = outAn.current ? readLevel(outAn.current, buf.current) : 0;
      if (out > SPEAKING_THRESHOLD) lastLoud.current = now;
      const isSpeaking = now - lastLoud.current < 250; // short hold so syllable gaps don't flicker
      setSpeaking((s) => (s !== isSpeaking ? isSpeaking : s));
      if (isSpeaking) {
        levelRef.current = out;
      } else {
        levelRef.current = !muted && inAn.current ? readLevel(inAn.current, buf.current) : 0;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, muted]);

  const teardown = () => {
    dc.current?.close();
    pc.current?.close();
    mic.current?.getTracks().forEach((t) => t.stop()); // mic indicator turns off
    ac.current?.close().catch(() => {});
    if (audioEl.current) audioEl.current.srcObject = null;
    pc.current = dc.current = mic.current = ac.current = outAn.current = inAn.current = null;
    levelRef.current = 0;
  };

  const handleEvent = useCallback(async (e: any) => {
    switch (e.type) {
      case 'input_audio_buffer.speech_started':
        setThinking(false);
        break;
      case 'input_audio_buffer.speech_stopped':
        setThinking(true);
        break;
      case 'output_audio_buffer.started':
        setThinking(false);
        captionBuf.current = '';
        break;
      case 'response.output_audio_transcript.delta':
        captionBuf.current += e.delta ?? '';
        setCaption(captionBuf.current);
        break;
      case 'response.done': {
        const calls = (e.response?.output ?? []).filter((o: any) => o.type === 'function_call');
        if (!calls.length) {
          setThinking(false);
          break;
        }
        setThinking(true);
        for (const c of calls) {
          const output = await runTool(c.name, safeJson(c.arguments));
          send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: c.call_id, output: JSON.stringify(output) } });
        }
        send({ type: 'response.create' });
        break;
      }
      case 'error':
        console.warn('[my-inner-ai]', e.error?.message);
        break;
    }
  }, []);

  const start = useCallback(async () => {
    if (phase === 'connecting' || phase === 'live') return;
    setPhase('connecting');
    setError(null);
    try {
      // 1. Audio context + mic — inside the user gesture.
      ac.current = new AudioContext();
      await ac.current.resume();
      mic.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      inAn.current = ac.current.createAnalyser();
      inAn.current.fftSize = 1024;
      ac.current.createMediaStreamSource(mic.current).connect(inAn.current);

      // 2. Ephemeral key from our backend.
      const { clientSecret } = await apiRequest<{ clientSecret: string }>('/ai/session', { method: 'POST', auth: false }).catch((e: { status?: number }) => {
        throw new Error(e.status === 429 ? 'rate_limited' : e.status === 503 ? 'ai_disabled' : 'session_failed');
      });

      // 3. WebRTC.
      const conn = new RTCPeerConnection();
      pc.current = conn;
      audioEl.current = new Audio();
      audioEl.current.autoplay = true;
      (audioEl.current as any).playsInline = true;
      conn.ontrack = (ev) => {
        const stream = ev.streams[0];
        audioEl.current!.srcObject = stream;
        audioEl.current!.play().catch(() => {});
        outAn.current = ac.current!.createAnalyser();
        outAn.current.fftSize = 1024;
        ac.current!.createMediaStreamSource(stream).connect(outAn.current); // metering only, not to speakers
      };
      mic.current.getTracks().forEach((t) => conn.addTrack(t, mic.current!));
      const channel = conn.createDataChannel('oai-events');
      dc.current = channel;
      channel.onmessage = (m) => handleEvent(safeJson(m.data));
      channel.onopen = () => {
        setPhase('live');
        send({ type: 'response.create', response: { instructions: 'Greet the visitor now using the exact FIRST TURN greeting.' } });
      };
      conn.onconnectionstatechange = () => {
        if (['failed', 'disconnected'].includes(conn.connectionState)) {
          setError('disconnected');
          setPhase('error');
        }
      };

      const offer = await conn.createOffer();
      await conn.setLocalDescription(offer);
      const sdp = await fetch(REALTIME_URL, {
        method: 'POST',
        body: offer.sdp,
        headers: { Authorization: `Bearer ${clientSecret}`, 'Content-Type': 'application/sdp' },
      });
      if (!sdp.ok) throw new Error('realtime_connect_failed');
      await conn.setRemoteDescription({ type: 'answer', sdp: await sdp.text() });
    } catch (err) {
      const msg = (err as Error).name === 'NotAllowedError' ? 'mic_denied' : (err as Error).message;
      setError(msg);
      setPhase('error');
      teardown();
    }
  }, [phase, handleEvent]);

  const end = useCallback(() => {
    teardown();
    setPhase('off');
    setMuted(false);
    setThinking(false);
    setSpeaking(false);
    setCaption('');
  }, []);

  /** Mute = mic off AND AI audio silenced. */
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      mic.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
      if (audioEl.current) audioEl.current.muted = next;
      if (next) send({ type: 'response.cancel' });
      return next;
    });
  }, []);

  /** Optional typed input (text fallback). */
  const sendText = useCallback((text: string) => {
    if (!text.trim()) return;
    send({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } });
    send({ type: 'response.create' });
    setThinking(true);
  }, []);

  useEffect(() => () => teardown(), []);

  const state: EntityState =
    phase === 'error' ? 'unavailable'
    : phase !== 'live' ? 'idle'
    : muted ? 'muted'
    : speaking ? 'speaking'
    : thinking ? 'thinking'
    : 'listening';

  return { phase, state, error, caption, levelRef, start, end, toggleMute, sendText, muted };
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
