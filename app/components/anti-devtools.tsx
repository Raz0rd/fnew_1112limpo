"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AntiDevTools() {
  const router = useRouter()

  useEffect(() => {
    // Detectar DevTools aberto
    const detectDevTools = () => {
      const threshold = 160
      const widthThreshold = window.outerWidth - window.innerWidth > threshold
      const heightThreshold = window.outerHeight - window.innerHeight > threshold
      
      if (widthThreshold || heightThreshold) {
        console.clear()
        window.location.href = '/404'
      }
    }

    // Detectar pelo console
    const devtoolsOpen = () => {
      const element = new Image()
      Object.defineProperty(element, 'id', {
        get: function() {
          console.clear()
          window.location.href = '/404'
        }
      })
      console.log(element)
    }

    // Detectar debugger
    const checkDebugger = () => {
      const start = performance.now()
      debugger
      const end = performance.now()
      if (end - start > 100) {
        window.location.href = '/404'
      }
    }

    // Bloquear atalhos
    const blockShortcuts = (e: KeyboardEvent) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault()
        window.location.href = '/404'
        return false
      }
      
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault()
        window.location.href = '/404'
        return false
      }
      
      // Ctrl+U (view source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault()
        window.location.href = '/404'
        return false
      }
    }

    // Bloquear menu de contexto (botão direito)
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    // Executar verificações
    const interval = setInterval(() => {
      detectDevTools()
      devtoolsOpen()
      checkDebugger()
    }, 1000)

    // Adicionar listeners
    document.addEventListener('keydown', blockShortcuts)
    document.addEventListener('contextmenu', blockContextMenu)

    // Cleanup
    return () => {
      clearInterval(interval)
      document.removeEventListener('keydown', blockShortcuts)
      document.removeEventListener('contextmenu', blockContextMenu)
    }
  }, [router])

  return null
}
