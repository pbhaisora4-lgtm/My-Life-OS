import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatApiError(err: any): { status: number; message: string } {
  const raw = err?.message || String(err);
  if (raw.includes('403') || raw.includes('PERMISSION_DENIED') || raw.includes('billing')) {
    return {
      status: 403,
      message:
        'This model requires a billing-enabled Gemini API key or higher quota. Try switching to a Flash model or enabling a paid API key in AI Studio.',
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Rate limit reached for Gemini API. Please wait a moment and try again.',
    };
  }
  return { status: 500, message: raw };
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Increase payload limit for base64 images and audio recordings
  app.use(express.json({ limit: '50mb' }));

  // 1. Multi-Turn Gemini Chatbot (gemini-4-argon, gemini-3.8-flash, gemini-3.1-flash-lite)
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const {
        model = 'gemini-3.8-flash',
        message,
        history = [],
        systemInstruction = 'You are the MY LIFE OS Executive & Personal Intelligence Coach. Provide actionable, structured, empathetic advice tailored to personal productivity, fitness, finance, career, and holistic wellbeing.',
      } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required.' });
      }

      const ai = getGenAI();
      const allowedModels = ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
      const selectedModel = allowedModels.includes(model) ? model : 'gemini-3.8-flash';

      const formattedHistory = Array.isArray(history)
        ? history
            .filter((h: any) => h && (h.role === 'user' || h.role === 'model') && h.text)
            .map((h: any) => ({
              role: h.role,
              parts: [{ text: String(h.text) }],
            }))
        : [];

      const chat = ai.chats.create({
        model: selectedModel,
        config: {
          systemInstruction,
        },
        history: formattedHistory,
      });

      const response = await chat.sendMessage({ message });
      return res.json({
        text: response.text || '',
        model: selectedModel,
      });
    } catch (err: any) {
      console.error('Error in /api/gemini/chat:', err);
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 2. Google Search Grounding (gemini-3.8-flash with googleSearch tool)
  app.post('/api/gemini/search', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required.' });
      }

      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: query,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const chunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks
        .map((chunk: any) => {
          if (chunk.web?.uri) {
            return {
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
            };
          }
          return null;
        })
        .filter(Boolean);

      return res.json({
        text: response.text || '',
        sources,
      });
    } catch (err: any) {
      console.error('Error in /api/gemini/search:', err);
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 3. Google Maps Grounding (gemini-3.8-flash with googleMaps tool; no responseMimeType/Schema)
  app.post('/api/gemini/maps', async (req, res) => {
    try {
      const { query, latitude, longitude } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Maps query is required.' });
      }

      const ai = getGenAI();
      const config: any = {
        tools: [{ googleMaps: {} }],
      };

      if (typeof latitude === 'number' && typeof longitude === 'number') {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude,
              longitude,
            },
          },
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: query,
        config,
      });

      const chunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const places = chunks
        .map((chunk: any) => {
          if (chunk.maps) {
            const snippets =
              chunk.maps.placeAnswerSources?.reviewSnippets?.map(
                (s: any) => s.text || s.reviewText || ''
              ).filter(Boolean) || [];
            return {
              title: chunk.maps.title || 'Google Maps Location',
              uri: chunk.maps.uri || '',
              placeId: chunk.maps.placeId || '',
              reviewSnippets: snippets,
            };
          }
          return null;
        })
        .filter(Boolean);

      return res.json({
        text: response.text || '',
        places,
      });
    } catch (err: any) {
      console.error('Error in /api/gemini/maps:', err);
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 4. Image Creation & Editing (gemini-nano-banana-2.1 & gemini-3.1-flash-lite-image)
  app.post('/api/gemini/image', async (req, res) => {
    try {
      const {
        prompt,
        base64Image,
        mimeType = 'image/png',
        aspectRatio = '1:1',
        imageSize = '1K',
        model = 'gemini-nano-banana-2.1',
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Image prompt is required.' });
      }

      const ai = getGenAI();
      const selectedModel =
        model === 'gemini-3.1-flash-lite-image'
          ? 'gemini-3.1-flash-lite-image'
          : 'gemini-nano-banana-2.1';

      const parts: any[] = [];
      if (base64Image) {
        const cleanBase64 = base64Image.includes(',')
          ? base64Image.split(',')[1]
          : base64Image;
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType,
          },
        });
      }
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      });

      let imageUrl: string | null = null;
      let textOutput = '';

      const candidateParts = response.candidates?.[0]?.content?.parts || [];
      for (const part of candidateParts) {
        if (part.inlineData?.data) {
          const outMime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${outMime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          textOutput += part.text;
        }
      }

      if (!imageUrl) {
        return res.status(500).json({
          error: textOutput || 'No image was generated. Try refining your prompt.',
        });
      }

      return res.json({
        imageUrl,
        text: textOutput,
        model: selectedModel,
      });
    } catch (err: any) {
      console.error('Error in /api/gemini/image:', err);
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 5. Video Generation & Image-to-Video Animation (gemini-omni-1.1-flash via Interactions API)
  app.post('/api/gemini/video', async (req, res) => {
    try {
      const {
        prompt,
        base64Image,
        mimeType = 'image/jpeg',
        aspectRatio = '16:9',
        duration = '5s',
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Video prompt is required.' });
      }

      const ai = getGenAI();
      let inputPayload: any = prompt;

      if (base64Image) {
        const cleanBase64 = base64Image.includes(',')
          ? base64Image.split(',')[1]
          : base64Image;
        inputPayload = [
          { type: 'text', text: prompt },
          {
            type: 'image',
            data: cleanBase64,
            mime_type: mimeType,
          },
        ];
      }

      const interaction: any = await (ai as any).interactions.create({
        model: 'gemini-omni-1.1-flash',
        input: inputPayload,
        response_format: {
          type: 'video',
          duration: duration === '5s' ? '5s' : '5s',
          aspect_ratio: aspectRatio === '9:16' ? '9:16' : '16:9',
          resolution: '720p',
        },
      });

      const outputs: any[] = interaction?.outputs || [];
      let videoDataUrl: string | null = null;
      let textSummary = '';

      for (const output of outputs) {
        if (output.type === 'video' && output.data) {
          const outMime = output.mime_type || 'video/mp4';
          videoDataUrl = `data:${outMime};base64,${output.data}`;
        } else if (output.type === 'text' && output.text) {
          textSummary += output.text;
        }
      }

      if (!videoDataUrl) {
        return res.status(500).json({
          error: 'No video output returned by gemini-omni-1.1-flash.',
        });
      }

      return res.json({
        videoUrl: videoDataUrl,
        interactionId: interaction?.id || '',
        text: textSummary,
      });
    } catch (err: any) {
      console.error('Error in /api/gemini/video:', err);
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 6. Music Generation (lyria-3-clip-preview & lyria-3-pro-preview via generateContentStream)
  app.post('/api/gemini/music', async (req, res) => {
    try {
      const {
        prompt,
        model = 'lyria-3-clip-preview',
        base64Image,
        mimeType = 'image/jpeg',
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Music prompt is required.' });
      }

      const ai = getGenAI();
      const selectedModel =
        model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';

      let contentsPayload: any = prompt;
      if (base64Image) {
        const cleanBase64 = base64Image.includes(',')
          ? base64Image.split(',')[1]
          : base64Image;
        contentsPayload = [
          prompt,
          {
            inlineData: {
              data: cleanBase64,
              mimeType,
            },
          },
        ];
      }

      const responseStream = await ai.models.generateContentStream({
        model: selectedModel,
        contents: contentsPayload,
        config: {
          responseModalities: ['AUDIO', 'TEXT'],
        },
      });

      const audioBuffers: Buffer[] = [];
      let lyricsText = '';
      let detectedMime = 'audio/mp3';

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (part.inlineData.mimeType) {
              detectedMime = part.inlineData.mimeType;
            }
            audioBuffers.push(Buffer.from(part.inlineData.data, 'base64'));
          } else if (part.text) {
            lyricsText += part.text;
          }
        }
      }

      if (audioBuffers.length === 0) {
        return res.status(500).json({
          error: 'No audio stream was generated. Please refine your musical prompt.',
        });
      }

      const combinedAudio = Buffer.concat(audioBuffers).toString('base64');
      return res.json({
        audioUrl: `data:${detectedMime};base64,${combinedAudio}`,
        lyrics: lyricsText.trim(),
        model: selectedModel,
      });
    } catch (err: any) {
      console.error('Error in /api/gemini/music:', err);
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 7. Audio Transcription (gemini-3.5-transcribe)
  app.post('/api/gemini/transcribe', async (req, res) => {
    try {
      const { base64Audio, mimeType = 'audio/webm', prompt } = req.body;
      if (!base64Audio || typeof base64Audio !== 'string') {
        return res.status(400).json({ error: 'Audio data is required for transcription.' });
      }

      const cleanBase64 = base64Audio.includes(',')
        ? base64Audio.split(',')[1]
        : base64Audio;

      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text:
              prompt ||
              'Generate a clean, accurate, verbatim transcript of the speech in this audio.',
          },
        ],
      });

      return res.json({
        transcript: response.text || '',
        model: 'gemini-3.5-transcribe',
      });
    } catch (err: any) {
      console.error('Error in /api/gemini/transcribe:', err);
      const formatted = formatApiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // 8. Full-Length Online Music Search (320kbps Full Songs via Saavn + Audius fallback)
  app.get('/api/music/search', async (req, res) => {
    const query = String(req.query.q || 'Arijit Singh').trim();
    const decodeHtml = (str: string) =>
      String(str || '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

    try {
      const saavnUrl = `https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(
        query
      )}&limit=30`;
      const saavnRes = await fetch(saavnUrl);
      if (saavnRes.ok) {
        const saavnData: any = await saavnRes.json();
        const rawResults: any[] = saavnData?.data?.results || [];
        const tracks = rawResults
          .map((item: any) => {
            const downloads: any[] = item.downloadUrl || [];
            const bestAudio =
              downloads.find((d) => d.quality === '320kbps') ||
              downloads.find((d) => d.quality === '160kbps') ||
              downloads[downloads.length - 1];

            if (!bestAudio?.url) return null;

            const images: any[] = item.image || [];
            const bestImg =
              images.find((img) => img.quality === '500x500') ||
              images[images.length - 1];

            const primaryArtists =
              item.artists?.primary?.map((a: any) => a.name).join(', ') ||
              item.primaryArtists ||
              'Artist';

            return {
              id: `saavn_${item.id}`,
              title: decodeHtml(item.name || item.title || 'Unknown Song'),
              artist: decodeHtml(primaryArtists),
              album: decodeHtml(item.album?.name || ''),
              artworkUrl: bestImg?.url || '',
              streamUrl: bestAudio.url,
              durationSec: Number(item.duration) || 240,
              isLiveRadio: false,
              genre: `${item.language ? item.language.toUpperCase() + ' · ' : ''}320kbps Full`,
            };
          })
          .filter(Boolean);

        if (tracks.length > 0) {
          return res.json({ tracks, source: 'saavn-320kbps' });
        }
      }

      // Secondary Full-Length Stream Source: Audius Public Network
      const audiusUrl = `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(
        query
      )}&app_name=MYLIFEOS`;
      const audiusRes = await fetch(audiusUrl);
      if (audiusRes.ok) {
        const audiusData: any = await audiusRes.json();
        const tracks = (audiusData?.data || []).slice(0, 25).map((t: any) => ({
          id: `audius_${t.id}`,
          title: t.title || 'Track',
          artist: t.user?.name || 'Artist',
          album: t.genre || 'Full Stream',
          artworkUrl: t.artwork?.['480x480'] || t.artwork?.['150x150'] || '',
          streamUrl: `https://discoveryprovider.audius.co/v1/tracks/${t.id}/stream?app_name=MYLIFEOS`,
          durationSec: Number(t.duration) || 180,
          isLiveRadio: false,
          genre: 'Full Stream',
        }));
        return res.json({ tracks, source: 'audius-full' });
      }

      return res.json({ tracks: [] });
    } catch (err: any) {
      console.error('Error in /api/music/search:', err);
      return res.status(500).json({ error: 'Music search failed' });
    }
  });

  // 8. WebSocket Server for Real-time Voice Conversations (gemini-3.8-live)
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    if (pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (ws: WebSocket) => {
    let session: any = null;
    try {
      const ai = getGenAI();
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Zephyr',
              },
            },
          },
          systemInstruction:
            'You are the MY LIFE OS Live Voice Companion. Keep responses natural, warm, concise, and helpful for daily planning, reflection, fitness, career, and mindfulness.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'status', status: 'connected' }));
            }
          },
          onmessage: (message: any) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'serverMessage', payload: message }));
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live error:', err);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: err?.message || 'Live voice session encountered an error.',
                })
              );
            }
          },
          onclose: () => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
          },
        },
      });
    } catch (err: any) {
      console.error('Failed to initialize Gemini Live session:', err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'error',
            message: formatApiError(err).message,
          })
        );
        ws.close();
      }
      return;
    }

    ws.on('message', (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());
        if (!session) return;

        if (msg.realtimeInput) {
          session.sendRealtimeInput(msg.realtimeInput);
        } else if (msg.text) {
          session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: msg.text }] }],
            turnComplete: true,
          });
        }
      } catch (e) {
        console.error('Live WS message parse error:', e);
      }
    });

    ws.on('close', () => {
      try {
        session?.close();
      } catch {
        // ignore
      }
    });
  });

  // Vite middleware in development, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`MY LIFE OS Full-Stack Server listening on http://localhost:${PORT}`);
  });
}

startServer();
