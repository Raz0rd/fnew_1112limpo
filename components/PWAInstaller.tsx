"use client"

import { useEffect, useState } from "react"

export default function PWAInstaller() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // SERVICE WORKER DESATIVADO
    // Estava causando bloqueios no cloaker (reason: 13 - referer inválido)
    // O SW fazia requisições com referer "sw.js" que eram bloqueadas pelo AlterCPA
    
    // if ("serviceWorker" in navigator) {
    //   navigator.serviceWorker
    //     .register("/sw.js")
    //     .then(() => {
    //       // Service Worker registrado
    //     })
    //     .catch(() => {
    //       // Erro ao registrar Service Worker
    //     })
    // }
  }, [mounted])

  return null
}
