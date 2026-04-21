'use client'

import { useCallback, useRef, useEffect } from 'react'

export default function useAudioAlert() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio()
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const playSound = useCallback(async (soundUrl: string) => {
    if (!audioRef.current) return
    
    try {
      audioRef.current.src = soundUrl
      audioRef.current.volume = 0.8
      await audioRef.current.play()
    } catch (error) {
      console.log('Audio play failed:', error)
      // Fallback: beep menggunakan Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.frequency.value = 800
        gainNode.gain.value = 0.5
        oscillator.start()
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5)
        oscillator.stop(audioContext.currentTime + 0.5)
      } catch (e) {
        // Silent fail
      }
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'id-ID'
      utterance.rate = 0.9
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  return { playSound, speak }
}
