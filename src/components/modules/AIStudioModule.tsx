import React, { useState, useRef, useEffect } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import {
  Sparkles,
  MessageSquare,
  Mic,
  MicOff,
  Search,
  MapPin,
  Image as ImageIcon,
  Video,
  Music,
  Send,
  Upload,
  Volume2,
  Loader2,
  ExternalLink,
  PlusCircle,
  CheckCircle2,
  Radio,
  FileAudio,
  Wand2,
  Film,
  Bot,
  Trash2,
} from 'lucide-react';

type AITab = 'chat' | 'live' | 'transcribe' | 'grounding' | 'media' | 'music';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

const PERSONAS = [
  {
    id: 'coach',
    name: 'Executive Life Coach',
    instruction:
      'You are the MY LIFE OS Executive & Personal Intelligence Coach. Provide actionable, structured, empathetic advice tailored to personal productivity, habits, career, and holistic wellbeing.',
  },
  {
    id: 'fitness',
    name: 'Bio & Fitness Scientist',
    instruction:
      'You are an elite exercise physiologist and sports nutritionist inside MY LIFE OS. Analyze workouts, progressive overload, macros, hydration, recovery, and sleep with scientific precision.',
  },
  {
    id: 'finance',
    name: 'Wealth & Career Strategist',
    instruction:
      'You are a pragmatic personal finance and executive career advisor. Help optimize savings rate, high-leverage engineering/leadership impact, and long-term wealth building.',
  },
  {
    id: 'stoic',
    name: 'Stoic Journal Companion',
    instruction:
      'You are a calm, reflective philosophical companion inspired by Marcus Aurelius and Seneca. Help the user process daily emotions, gratitude, and mental clarity.',
  },
];

export const AIStudioModule: React.FC = () => {
  const {
    settings,
    fitnessRecord,
    habits,
    careerRecord,
    financeTransactions,
    moodRecord,
    saveJournalEntry,
    selectedDate,
    showIslandNotice,
  } = useLifeOS();

  const [activeTab, setActiveTab] = useState<AITab>('chat');

  // ==================== 1. CHATBOT STATE ====================
  const [chatModel, setChatModel] = useState<
    'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'
  >('gemini-3.8-flash');
  const [personaId, setPersonaId] = useState<string>('coach');
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello ${settings.userName}! I am your MY LIFE OS Gemini Assistant. Ask me anything about your day, goals, fitness, career, or tap "Include Today's Life Context" to analyze your live records.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const buildLifeContextSummary = () => {
    const doneHabits = habits.filter((h) => h.completedDates.includes(selectedDate)).length;
    const todayExpenses = financeTransactions
      .filter((t) => t.date === selectedDate && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return `[MY LIFE OS Context for ${selectedDate}]: Steps=${fitnessRecord?.steps || 0}, Water=${
      fitnessRecord?.waterMl || 0
    }ml, HabitsCompleted=${doneHabits}/${habits.length}, CareerTasks=${
      careerRecord?.tasks.length || 0
    }, SpentToday=$${todayExpenses.toFixed(2)}, Mood=${moodRecord?.moodScore || 'unlogged'}/5.`;
  };

  const handleSendChat = async (includeLifeContext = false) => {
    const trimmed = chatInput.trim();
    if (!trimmed && !includeLifeContext) return;

    const finalMessage = includeLifeContext
      ? `${buildLifeContextSummary()}\n\n${trimmed || 'Analyze my day so far and give me 3 high-impact recommendations.'}`
      : trimmed;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: finalMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const priorHistory = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);
    setChatError(null);

    try {
      const selectedPersona = PERSONAS.find((p) => p.id === personaId) || PERSONAS[0];
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: chatModel,
          message: finalMessage,
          history: priorHistory,
          systemInstruction: selectedPersona.instruction,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from Gemini.');
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.text || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setChatError(err.message || 'Chat request failed.');
    } finally {
      setIsChatLoading(false);
    }
  };

  // ==================== 2. LIVE VOICE API STATE ====================
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLiveConnecting, setIsLiveConnecting] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveTranscripts, setLiveTranscripts] = useState<
    { id: string; speaker: 'You' | 'Gemini'; text: string }[]
  >([]);
  const [liveTextPrompt, setLiveTextPrompt] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  const stopLiveSession = () => {
    try {
      wsRef.current?.close();
    } catch {
      // ignore
    }
    wsRef.current = null;

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (captureCtxRef.current) {
      captureCtxRef.current.close().catch(() => {});
      captureCtxRef.current = null;
    }
    if (playbackCtxRef.current) {
      playbackCtxRef.current.close().catch(() => {});
      playbackCtxRef.current = null;
    }
    setIsLiveConnected(false);
    setIsLiveConnecting(false);
  };

  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const playPcm24kChunk = (base64Pcm: string) => {
    try {
      if (!playbackCtxRef.current) {
        playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
        nextPlayTimeRef.current = playbackCtxRef.current.currentTime;
      }
      const ctx = playbackCtxRef.current;
      const binaryStr = atob(base64Pcm);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      const startTime = Math.max(now, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;
    } catch (e) {
      console.error('PCM playback error:', e);
    }
  };

  const startLiveSession = async () => {
    setLiveError(null);
    setIsLiveConnecting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      micStreamRef.current = stream;

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/live`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status' && data.status === 'connected') {
            setIsLiveConnected(true);
            setIsLiveConnecting(false);
            showIslandNotice('Live Voice Active', 'Speaking with Gemini 3.8 Live');
          } else if (data.type === 'error') {
            setLiveError(data.message || 'Live voice error');
            stopLiveSession();
          } else if (data.type === 'serverMessage') {
            const msg = data.payload;
            // Handle interruption
            if (msg.serverContent?.interrupted && playbackCtxRef.current) {
              playbackCtxRef.current.close().catch(() => {});
              playbackCtxRef.current = null;
              nextPlayTimeRef.current = 0;
            }
            // Handle audio output
            const parts = msg.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                playPcm24kChunk(part.inlineData.data);
              }
            }
            // Handle transcripts
            const inText = msg.serverContent?.inputTranscription?.text;
            if (inText) {
              setLiveTranscripts((prev) => [
                ...prev.slice(-20),
                { id: Date.now() + '_in', speaker: 'You', text: inText },
              ]);
            }
            const outText = msg.serverContent?.outputTranscription?.text;
            if (outText) {
              setLiveTranscripts((prev) => [
                ...prev.slice(-20),
                { id: Date.now() + '_out', speaker: 'Gemini', text: outText },
              ]);
            }
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onerror = () => {
        setLiveError('WebSocket connection error.');
        stopLiveSession();
      };

      ws.onclose = () => {
        setIsLiveConnected(false);
        setIsLiveConnecting(false);
      };

      // Set up 16kHz PCM microphone capture
      const captureCtx = new AudioContext({ sampleRate: 16000 });
      captureCtxRef.current = captureCtx;
      const source = captureCtx.createMediaStreamSource(stream);
      const processor = captureCtx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);
        wsRef.current.send(
          JSON.stringify({
            realtimeInput: {
              audio: {
                data: base64Audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            },
          })
        );
      };

      source.connect(processor);
      processor.connect(captureCtx.destination);
    } catch (err: any) {
      setLiveError(
        err.message || 'Microphone access is required for Live Voice conversations.'
      );
      setIsLiveConnecting(false);
    }
  };

  const sendLiveTextTurn = () => {
    if (!liveTextPrompt.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      return;
    wsRef.current.send(JSON.stringify({ text: liveTextPrompt.trim() }));
    setLiveTranscripts((prev) => [
      ...prev,
      { id: Date.now().toString(), speaker: 'You', text: liveTextPrompt.trim() },
    ]);
    setLiveTextPrompt('');
  };

  // ==================== 3. AUDIO TRANSCRIPTION STATE ====================
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptResult, setTranscriptResult] = useState('');
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecordingForTranscribe = async () => {
    setTranscribeError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        await transcribeAudioBlob(audioBlob, recorder.mimeType || 'audio/webm');
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingAudio(true);
    } catch (err: any) {
      setTranscribeError(err.message || 'Could not access microphone for recording.');
    }
  };

  const stopRecordingForTranscribe = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  const transcribeAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setTranscribeError(null);
    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Audio,
          mimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transcription failed');
      setTranscriptResult(data.transcript || '');
      showIslandNotice('Audio Transcribed', 'Ready to save to Journal');
    } catch (err: any) {
      setTranscribeError(err.message || 'Audio transcription failed.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await transcribeAudioBlob(file, file.type || 'audio/mp3');
  };

  const handleSaveTranscriptToJournal = async () => {
    if (!transcriptResult.trim()) return;
    await saveJournalEntry({
      id: `journal_voice_${Date.now()}`,
      date: selectedDate,
      timestamp: new Date().toISOString(),
      title: 'Voice Note Transcript',
      story: transcriptResult.trim(),
      photos: [],
      moodTag: 'Reflective',
      tags: ['VoiceNote', 'GeminiTranscribe'],
    });
    showIslandNotice('Saved to My Journal', 'Voice note added to your diary');
  };

  // ==================== 4. SEARCH & MAPS GROUNDING STATE ====================
  const [groundingMode, setGroundingMode] = useState<'search' | 'maps'>('search');
  const [groundingQuery, setGroundingQuery] = useState('');
  const [isGroundingLoading, setIsGroundingLoading] = useState(false);
  const [groundingError, setGroundingError] = useState<string | null>(null);
  const [groundingAnswer, setGroundingAnswer] = useState('');
  const [searchSources, setSearchSources] = useState<{ title: string; uri: string }[]>([]);
  const [mapPlaces, setMapPlaces] = useState<
    { title: string; uri: string; reviewSnippets: string[] }[]
  >([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const detectLocationForMaps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        showIslandNotice('Location Locked', 'GPS coordinates ready for Google Maps grounding');
      },
      () => {
        showIslandNotice('Location Skipped', 'Using query text for Maps search');
      }
    );
  };

  const handleRunGrounding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groundingQuery.trim()) return;
    setIsGroundingLoading(true);
    setGroundingError(null);
    setGroundingAnswer('');
    setSearchSources([]);
    setMapPlaces([]);

    try {
      if (groundingMode === 'search') {
        const res = await fetch('/api/gemini/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: groundingQuery.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search grounding failed');
        setGroundingAnswer(data.text || '');
        setSearchSources(data.sources || []);
      } else {
        const res = await fetch('/api/gemini/maps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: groundingQuery.trim(),
            latitude: userCoords?.lat,
            longitude: userCoords?.lng,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Maps grounding failed');
        setGroundingAnswer(data.text || '');
        setMapPlaces(data.places || []);
      }
    } catch (err: any) {
      setGroundingError(err.message || 'Grounding request failed.');
    } finally {
      setIsGroundingLoading(false);
    }
  };

  // ==================== 5. IMAGE & VIDEO STUDIO STATE ====================
  const [mediaSubMode, setMediaSubMode] = useState<'image' | 'video'>('image');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>(
    '1:1'
  );
  const [imageSize, setImageSize] = useState<'1K' | '2K'>('1K');
  const [imageModel, setImageModel] = useState<
    'gemini-nano-banana-2.1' | 'gemini-3.1-flash-lite-image'
  >('gemini-nano-banana-2.1');
  const [sourceImageBase64, setSourceImageBase64] = useState<string | null>(null);
  const [sourceImageMime, setSourceImageMime] = useState<string>('image/png');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Video state
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [videoSourceMime, setVideoSourceMime] = useState<string>('image/jpeg');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const handleUploadImageForEdit = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'image' | 'video' | 'music'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (target === 'image') {
        setSourceImageBase64(result);
        setSourceImageMime(file.type || 'image/png');
      } else if (target === 'video') {
        setVideoSourceImage(result);
        setVideoSourceMime(file.type || 'image/jpeg');
      } else if (target === 'music') {
        setMusicImageBase64(result);
        setMusicImageMime(file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateOrEditImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim()) return;
    setIsImageLoading(true);
    setImageError(null);

    try {
      const res = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          base64Image: sourceImageBase64,
          mimeType: sourceImageMime,
          aspectRatio: imageAspectRatio,
          imageSize,
          model: imageModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image generation failed');
      setGeneratedImageUrl(data.imageUrl);
      showIslandNotice(
        sourceImageBase64 ? 'Image Edited' : 'Image Created',
        'Generated with Gemini Nano Banana'
      );
    } catch (err: any) {
      setImageError(err.message || 'Image generation failed.');
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleSaveImageToJournal = async () => {
    if (!generatedImageUrl) return;
    await saveJournalEntry({
      id: `journal_img_${Date.now()}`,
      date: selectedDate,
      timestamp: new Date().toISOString(),
      title: imagePrompt.slice(0, 50) || 'AI Visual Creation',
      story: `Created in MY LIFE OS AI Studio: "${imagePrompt}"`,
      photos: [generatedImageUrl],
      moodTag: 'Inspired',
      tags: ['AIArt', 'JournalPhoto'],
    });
    showIslandNotice('Saved to Journal', 'Artwork attached to today’s diary');
  };

  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoPrompt.trim()) return;
    setIsVideoLoading(true);
    setVideoError(null);

    try {
      const res = await fetch('/api/gemini/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt.trim(),
          base64Image: videoSourceImage,
          mimeType: videoSourceMime,
          aspectRatio: videoAspectRatio,
          duration: '5s',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Video generation failed');
      setGeneratedVideoUrl(data.videoUrl);
      showIslandNotice(
        videoSourceImage ? 'Photo Animated' : 'Video Generated',
        'Rendered with Gemini Omni 1.1 Flash'
      );
    } catch (err: any) {
      setVideoError(err.message || 'Video generation failed.');
    } finally {
      setIsVideoLoading(false);
    }
  };

  // ==================== 6. MUSIC GENERATION STATE ====================
  const [musicPrompt, setMusicPrompt] = useState('');
  const [musicModel, setMusicModel] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>(
    'lyria-3-clip-preview'
  );
  const [musicImageBase64, setMusicImageBase64] = useState<string | null>(null);
  const [musicImageMime, setMusicImageMime] = useState<string>('image/jpeg');
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState<string>('');
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const [musicError, setMusicError] = useState<string | null>(null);

  const handleGenerateMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicPrompt.trim()) return;
    setIsMusicLoading(true);
    setMusicError(null);

    try {
      const res = await fetch('/api/gemini/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt.trim(),
          model: musicModel,
          base64Image: musicImageBase64,
          mimeType: musicImageMime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Music generation failed');
      setGeneratedAudioUrl(data.audioUrl);
      setGeneratedLyrics(data.lyrics || '');
      showIslandNotice('Soundtrack Ready', 'Generated with Lyria 3');
    } catch (err: any) {
      setMusicError(err.message || 'Music generation failed.');
    } finally {
      setIsMusicLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-indigo-600 dark:text-cyan-400">
            Multimodal Intelligence Engine
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Life OS AI Studio
          </h1>
        </div>
        <div className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono font-bold text-indigo-500 dark:text-cyan-400">
          Server-Side SDK
        </div>
      </div>

      {/* Sub-navigation Bar */}
      <div className="grid grid-cols-6 gap-1 p-1 rounded-2xl bg-slate-200/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
        {[
          { id: 'chat', label: 'Chat', icon: MessageSquare },
          { id: 'live', label: 'Voice', icon: Radio },
          { id: 'transcribe', label: 'Transcribe', icon: FileAudio },
          { id: 'grounding', label: 'Web/Maps', icon: Search },
          { id: 'media', label: 'Img/Video', icon: ImageIcon },
          { id: 'music', label: 'Music', icon: Music },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as AITab)}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${
                active
                  ? 'bg-white dark:bg-[#151924] text-indigo-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate max-w-full">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: GEMINI CHATBOT ==================== */}
      {activeTab === 'chat' && (
        <div className="space-y-3">
          {/* Model & Persona Selectors */}
          <div className="p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Gemini Model
                </label>
                <select
                  value={chatModel}
                  onChange={(e) => setChatModel(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Balanced)</option>
                  <option value="gemini-4-argon">Gemini 4 Argon (Deep Reasoning)</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Fast)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  System Role
                </label>
                <select
                  value={personaId}
                  onChange={(e) => setPersonaId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  {PERSONAS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => handleSendChat(true)}
                disabled={isChatLoading}
                className="text-[11px] font-semibold text-indigo-600 dark:text-cyan-400 flex items-center gap-1 hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze Today’s Life OS Data</span>
              </button>
              <button
                onClick={() =>
                  setMessages([
                    {
                      id: 'welcome',
                      role: 'model',
                      text: 'Conversation cleared. How can I help you optimize your day?',
                      timestamp: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                    },
                  ])
                }
                className="text-[11px] text-slate-400 hover:text-rose-500 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Scrollable Message Thread */}
          <div className="h-80 overflow-y-auto p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/60 dark:border-white/10'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 px-1">
                  {m.role === 'user' ? 'You' : m.modelUsed || 'Gemini'} · {m.timestamp}
                </span>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Thinking with {chatModel}...</span>
              </div>
            )}
            {chatError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {chatError}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat(false);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask your Life OS Coach..."
              className="flex-1 p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ==================== TAB 2: LIVE VOICE CONVERSATIONS ==================== */}
      {activeTab === 'live' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 space-y-4">
          <div className="text-center space-y-2 py-2">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              {isLiveConnected && (
                <>
                  <span className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
                  <span className="absolute inset-2 rounded-full bg-indigo-500/20 animate-pulse" />
                </>
              )}
              <button
                onClick={isLiveConnected ? stopLiveSession : startLiveSession}
                disabled={isLiveConnecting}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition active:scale-95 ${
                  isLiveConnected
                    ? 'bg-rose-600 text-white'
                    : 'bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white'
                }`}
              >
                {isLiveConnecting ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isLiveConnected ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isLiveConnected
                ? 'Live Voice Session Active (Zephyr)'
                : isLiveConnecting
                ? 'Connecting to Gemini 3.8 Live...'
                : 'Tap Microphone for Real-Time Voice Chat'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Bidirectional low-latency 16kHz/24kHz PCM voice stream powered by{' '}
              <span className="font-mono">gemini-3.8-live</span>.
            </p>
          </div>

          {liveError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
              {liveError}
            </div>
          )}

          {/* Live Transcript Feed */}
          <div className="h-48 overflow-y-auto p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 space-y-2">
            {liveTranscripts.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-12">
                Live speech transcriptions will appear here as you converse...
              </p>
            ) : (
              liveTranscripts.map((t) => (
                <div key={t.id} className="text-xs">
                  <span
                    className={`font-bold ${
                      t.speaker === 'You'
                        ? 'text-indigo-600 dark:text-cyan-400'
                        : 'text-emerald-500'
                    }`}
                  >
                    {t.speaker}:{' '}
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">{t.text}</span>
                </div>
              ))
            )}
          </div>

          {isLiveConnected && (
            <div className="flex gap-2">
              <input
                type="text"
                value={liveTextPrompt}
                onChange={(e) => setLiveTextPrompt(e.target.value)}
                placeholder="Or type a message into the live voice session..."
                className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
              />
              <button
                onClick={sendLiveTextTurn}
                className="px-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: AUDIO TRANSCRIPTION ==================== */}
      {activeTab === 'transcribe' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Speech-to-Text Transcription
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Record a voice memo or upload an audio file (<span className="font-mono">gemini-3.5-transcribe</span>)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={
                isRecordingAudio ? stopRecordingForTranscribe : startRecordingForTranscribe
              }
              disabled={isTranscribing}
              className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
                isRecordingAudio
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500'
              }`}
            >
              {isRecordingAudio ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Stop & Transcribe</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Record Voice Note</span>
                </>
              )}
            </button>

            <label className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 transition">
              <Upload className="w-4 h-4 text-cyan-500" />
              <span>Upload Audio</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {isTranscribing && (
            <div className="flex items-center justify-center gap-2 py-4 text-xs text-indigo-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Transcribing audio with gemini-3.5-transcribe...</span>
            </div>
          )}

          {transcribeError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
              {transcribeError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Transcript Output
            </label>
            <textarea
              rows={5}
              value={transcriptResult}
              onChange={(e) => setTranscriptResult(e.target.value)}
              placeholder="Your transcribed speech will appear here..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-slate-200"
            />
            {transcriptResult && (
              <button
                onClick={handleSaveTranscriptToJournal}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Transcript to My Journal</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 4: SEARCH & MAPS GROUNDING ==================== */}
      {activeTab === 'grounding' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
            <button
              onClick={() => setGroundingMode('search')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                groundingMode === 'search'
                  ? 'bg-white dark:bg-[#151924] text-indigo-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Google Search Grounding</span>
            </button>
            <button
              onClick={() => setGroundingMode('maps')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                groundingMode === 'maps'
                  ? 'bg-white dark:bg-[#151924] text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Google Maps Grounding</span>
            </button>
          </div>

          {groundingMode === 'maps' && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-slate-500">
                {userCoords
                  ? `GPS Active: ${userCoords.lat.toFixed(3)}, ${userCoords.lng.toFixed(3)}`
                  : 'Optional: Share GPS for nearby gyms, cafes, or running trails'}
              </span>
              <button
                type="button"
                onClick={detectLocationForMaps}
                className="text-[11px] font-bold text-emerald-500 hover:underline"
              >
                Use My GPS
              </button>
            </div>
          )}

          <form onSubmit={handleRunGrounding} className="flex gap-2">
            <input
              type="text"
              value={groundingQuery}
              onChange={(e) => setGroundingQuery(e.target.value)}
              placeholder={
                groundingMode === 'search'
                  ? 'Search live web news, tech docs, market data...'
                  : 'Find top-rated gyms, healthy restaurants, or parks nearby...'
              }
              className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
            />
            <button
              type="submit"
              disabled={isGroundingLoading}
              className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1"
            >
              {isGroundingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
            </button>
          </form>

          {groundingError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
              {groundingError}
            </div>
          )}

          {groundingAnswer && (
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                {groundingAnswer}
              </div>

              {searchSources.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Verified Web Citations ({searchSources.length})
                  </p>
                  <div className="space-y-1">
                    {searchSources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-between text-xs text-indigo-600 dark:text-cyan-400 hover:underline"
                      >
                        <span className="truncate pr-2">{s.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {mapPlaces.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Google Maps Grounded Locations ({mapPlaces.length})
                  </p>
                  <div className="space-y-2">
                    {mapPlaces.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            {p.title}
                          </span>
                          {p.uri && (
                            <a
                              href={p.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                            >
                              <span>Open Maps</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {p.reviewSnippets && p.reviewSnippets.length > 0 && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            “{p.reviewSnippets[0]}”
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 5: IMAGE & VIDEO STUDIO ==================== */}
      {activeTab === 'media' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 space-y-4">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
            <button
              onClick={() => setMediaSubMode('image')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                mediaSubMode === 'image'
                  ? 'bg-white dark:bg-[#151924] text-indigo-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Create & Edit Images</span>
            </button>
            <button
              onClick={() => setMediaSubMode('video')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                mediaSubMode === 'video'
                  ? 'bg-white dark:bg-[#151924] text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Generate & Animate Video</span>
            </button>
          </div>

          {mediaSubMode === 'image' ? (
            <form onSubmit={handleGenerateOrEditImage} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Model</label>
                  <select
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value as any)}
                    className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-semibold"
                  >
                    <option value="gemini-nano-banana-2.1">Nano Banana 2.1</option>
                    <option value="gemini-3.1-flash-lite-image">Flash Lite Image</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Aspect</label>
                  <select
                    value={imageAspectRatio}
                    onChange={(e) => setImageAspectRatio(e.target.value as any)}
                    className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-semibold"
                  >
                    <option value="1:1">1:1 Square</option>
                    <option value="16:9">16:9 Wide</option>
                    <option value="9:16">9:16 Story</option>
                    <option value="4:3">4:3 Classic</option>
                    <option value="3:4">3:4 Portrait</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Resolution</label>
                  <select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value as any)}
                    className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-semibold"
                  >
                    <option value="1K">1K Crisp</option>
                    <option value="2K">2K Ultra</option>
                  </select>
                </div>
              </div>

              {/* Optional Reference Image for Editing */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/15">
                <div className="flex items-center gap-2">
                  {sourceImageBase64 ? (
                    <img
                      src={sourceImageBase64}
                      alt="Reference"
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {sourceImageBase64
                        ? 'Reference Photo Attached (Edit Mode)'
                        : 'Optional: Upload Photo to Edit'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Add a photo to restyle, edit objects, or transform
                    </p>
                  </div>
                </div>
                {sourceImageBase64 ? (
                  <button
                    type="button"
                    onClick={() => setSourceImageBase64(null)}
                    className="text-xs text-rose-500 font-semibold"
                  >
                    Remove
                  </button>
                ) : (
                  <label className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 text-xs font-semibold cursor-pointer">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImageForEdit(e, 'image')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder={
                    sourceImageBase64
                      ? 'Describe how to edit this image...'
                      : 'Describe the vision board or artwork to generate...'
                  }
                  className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
                />
                <button
                  type="submit"
                  disabled={isImageLoading}
                  className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {isImageLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{sourceImageBase64 ? 'Edit' : 'Create'}</span>
                  )}
                </button>
              </div>

              {imageError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                  {imageError}
                </div>
              )}

              {generatedImageUrl && (
                <div className="space-y-2 pt-2">
                  <img
                    src={generatedImageUrl}
                    alt="Generated"
                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 shadow-md"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSourceImageBase64(generatedImageUrl);
                        showIslandNotice('Loaded for Editing', 'Enter a prompt to modify this image');
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-semibold"
                    >
                      Edit This Image
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveImageToJournal}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
                    >
                      Save to My Journal
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleGenerateVideo} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Model: <span className="font-mono text-purple-500">gemini-omni-1.1-flash</span>
                </span>
                <div className="flex gap-1">
                  {(['16:9', '9:16'] as const).map((ar) => (
                    <button
                      type="button"
                      key={ar}
                      onClick={() => setVideoAspectRatio(ar)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        videoAspectRatio === ar
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                      }`}
                    >
                      {ar === '16:9' ? '16:9 Landscape' : '9:16 Portrait'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Photo to Animate into Video */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/15">
                <div className="flex items-center gap-2">
                  {videoSourceImage ? (
                    <img
                      src={videoSourceImage}
                      alt="Animate source"
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <Video className="w-5 h-5 text-purple-400" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {videoSourceImage
                        ? 'Image-to-Video Animation Mode'
                        : 'Text-to-Video (or Upload Photo to Animate)'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Generates a 5-second 720p video clip
                    </p>
                  </div>
                </div>
                {videoSourceImage ? (
                  <button
                    type="button"
                    onClick={() => setVideoSourceImage(null)}
                    className="text-xs text-rose-500 font-semibold"
                  >
                    Remove
                  </button>
                ) : (
                  <label className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold cursor-pointer">
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImageForEdit(e, 'video')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder={
                    videoSourceImage
                      ? 'Describe how this photo should animate and move...'
                      : 'Describe a cinematic scene to generate as video...'
                  }
                  className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
                />
                <button
                  type="submit"
                  disabled={isVideoLoading}
                  className="px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {isVideoLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{videoSourceImage ? 'Animate' : 'Render'}</span>
                  )}
                </button>
              </div>

              {isVideoLoading && (
                <p className="text-[11px] text-purple-500 text-center animate-pulse">
                  Synthesizing 720p video frames with gemini-omni-1.1-flash (takes ~15–30s)...
                </p>
              )}

              {videoError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                  {videoError}
                </div>
              )}

              {generatedVideoUrl && (
                <div className="pt-2">
                  <video
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 shadow-md"
                  />
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {/* ==================== TAB 6: LYRIA 3 MUSIC GENERATOR ==================== */}
      {activeTab === 'music' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Focus & Workout Music Studio (Lyria 3)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Generate custom deep-work ambient beats, gym anthems, or acoustic tracks.
            </p>
          </div>

          <form onSubmit={handleGenerateMusic} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMusicModel('lyria-3-clip-preview')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                  musicModel === 'lyria-3-clip-preview'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                Lyria 3 Clip (30s Fast)
              </button>
              <button
                type="button"
                onClick={() => setMusicModel('lyria-3-pro-preview')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                  musicModel === 'lyria-3-pro-preview'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                Lyria 3 Pro (Full Track)
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                placeholder="e.g., Lo-fi chill synthwave beat for deep coding focus, 95 BPM..."
                className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
              />
              <button
                type="submit"
                disabled={isMusicLoading}
                className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1"
              >
                {isMusicLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Compose'}
              </button>
            </div>

            {musicError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {musicError}
              </div>
            )}

            {generatedAudioUrl && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-500">
                  <Volume2 className="w-4 h-4" />
                  <span>Generated Soundtrack Ready</span>
                </div>
                <audio src={generatedAudioUrl} controls className="w-full" />
                {generatedLyrics && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/10">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Lyrics / Musical Notes
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {generatedLyrics}
                    </p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
