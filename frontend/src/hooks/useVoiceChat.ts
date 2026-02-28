import { useState, useRef, useCallback, useEffect } from 'react'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

interface VoiceChatOptions {
  onTranscript: (text: string) => void
  onResponseChunk: (text: string) => void
  onResponseDone: (fullText: string) => void
  onError?: (error: string) => void
  context?: string
  messages: { role: string; content: string }[]
}

// Check browser support
const SpeechRecognitionClass =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null

export const isVoiceSupported = !!SpeechRecognitionClass

export function useVoiceChat({
  onTranscript,
  onResponseChunk,
  onResponseDone,
  onError,
  context,
  messages,
}: VoiceChatOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [interimTranscript, setInterimTranscript] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const responseTextRef = useRef('')
  const messagesRef = useRef(messages)
  const audioQueueRef = useRef<string[]>([])
  const isPlayingRef = useRef(false)
  const doneReceivedRef = useRef(false)

  // Keep messages ref in sync
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  // Play next audio chunk from queue (gapless sequential playback)
  const playNext = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      // If server already sent "done" and queue is empty, go idle
      if (doneReceivedRef.current) {
        audioRef.current = null
        setVoiceState('idle')
      }
      return
    }

    const base64Data = audioQueueRef.current.shift()!
    try {
      const binary = atob(base64Data)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)

      const audio = new Audio(url)
      audioRef.current = audio
      isPlayingRef.current = true
      setVoiceState('speaking')

      audio.onended = () => {
        URL.revokeObjectURL(url)
        playNext()
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        playNext()
      }

      audio.play().catch((e) => {
        console.error('[Voice] Audio playback error:', e)
        playNext()
      })
    } catch (e) {
      console.error('[Voice] Audio decode error:', e)
      playNext()
    }
  }, [])

  // Enqueue audio chunk — starts playback if not already playing
  const enqueueAudio = useCallback((base64Data: string) => {
    audioQueueRef.current.push(base64Data)
    if (!isPlayingRef.current) {
      playNext()
    }
  }, [playNext])

  // Connect WebSocket on mount
  useEffect(() => {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${location.host}/ws/voice`)

    ws.onopen = () => {
      console.log('[Voice] WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'text':
          responseTextRef.current += data.content
          onResponseChunk(data.content)
          break

        case 'audio':
          enqueueAudio(data.data)
          break

        case 'done':
          onResponseDone(responseTextRef.current)
          responseTextRef.current = ''
          doneReceivedRef.current = true
          // If nothing is playing and queue is empty, go idle now
          if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
            setVoiceState('idle')
          }
          // Otherwise playNext() will set idle when queue drains
          break

        case 'error':
          console.error('[Voice] Server error:', data.message)
          onError?.(data.message)
          setVoiceState('idle')
          responseTextRef.current = ''
          audioQueueRef.current = []
          isPlayingRef.current = false
          doneReceivedRef.current = false
          break
      }
    }

    ws.onerror = (e) => {
      console.error('[Voice] WebSocket error:', e)
    }

    ws.onclose = () => {
      console.log('[Voice] WebSocket closed')
    }

    wsRef.current = ws

    return () => {
      ws.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startListening = useCallback(() => {
    if (!SpeechRecognitionClass || voiceState !== 'idle') return

    // Reset audio state for new conversation turn
    audioQueueRef.current = []
    isPlayingRef.current = false
    doneReceivedRef.current = false

    const recognition = new SpeechRecognitionClass()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    let finalTranscript = ''

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interim += transcript
        }
      }
      setInterimTranscript(interim || finalTranscript)
    }

    recognition.onend = () => {
      const transcript = finalTranscript.trim()
      setInterimTranscript('')

      if (transcript) {
        // Notify parent of the transcript
        onTranscript(transcript)
        setVoiceState('processing')

        // Send to WebSocket with full conversation history
        const ws = wsRef.current
        if (ws && ws.readyState === WebSocket.OPEN) {
          const allMessages = [
            ...messagesRef.current,
            { role: 'user', content: transcript },
          ]
          ws.send(
            JSON.stringify({
              type: 'chat',
              messages: allMessages,
              context: context,
            })
          )
        } else {
          onError?.('Voice connection lost. Please try again.')
          setVoiceState('idle')
        }
      } else {
        setVoiceState('idle')
      }
    }

    recognition.onerror = (event: any) => {
      console.error('[Voice] Recognition error:', event.error)
      if (event.error !== 'no-speech') {
        onError?.(`Speech recognition error: ${event.error}`)
      }
      setVoiceState('idle')
      setInterimTranscript('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setVoiceState('listening')
  }, [voiceState, onTranscript, onError, context])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const stopSpeaking = useCallback(() => {
    // Stop current audio and clear queue
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    audioQueueRef.current = []
    isPlayingRef.current = false
    doneReceivedRef.current = false
    setVoiceState('idle')
  }, [])

  const toggleVoice = useCallback(() => {
    switch (voiceState) {
      case 'idle':
        startListening()
        break
      case 'listening':
        stopListening()
        break
      case 'speaking':
        stopSpeaking()
        break
      // 'processing' — can't cancel, just wait
    }
  }, [voiceState, startListening, stopListening, stopSpeaking])

  return {
    voiceState,
    interimTranscript,
    toggleVoice,
    startListening,
    stopListening,
    stopSpeaking,
    isSupported: isVoiceSupported,
  }
}
