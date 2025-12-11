"use client"

import { useEffect, useState } from 'react'

export default function DynamicTheme() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Aplicar cores dinâmicas do .env via CSS custom properties
    const primaryColor = process.env.NEXT_PUBLIC_PRIMARY_COLOR || '667eea'
    const secondaryColor = process.env.NEXT_PUBLIC_SECONDARY_COLOR || '764ba2'
    const accentColor = process.env.NEXT_PUBLIC_ACCENT_COLOR || 'e74c3c'
    
    // Criar CSS custom properties
    const style = document.createElement('style')
    style.id = 'dynamic-theme-styles'
    style.textContent = `
      :root {
        --primary-color: #${primaryColor};
        --secondary-color: #${secondaryColor};
        --accent-color: #${accentColor};
        --gradient-bg: linear-gradient(135deg, #${primaryColor} 0%, #${secondaryColor} 100%);
      }
      
      /* Aplicar cores dinâmicas aos elementos do quiz */
      .quiz-gradient {
        background: var(--gradient-bg) !important;
      }
      
      .quiz-primary {
        background-color: var(--primary-color) !important;
      }
      
      .quiz-accent {
        background-color: var(--accent-color) !important;
      }
      
      .quiz-border-primary {
        border-color: var(--primary-color) !important;
      }
      
      .quiz-text-primary {
        color: var(--primary-color) !important;
      }
      
      /* Sobrescrever cores do Tailwind */
      .bg-blue-600 {
        background: var(--gradient-bg) !important;
      }
      
      .bg-blue-700 {
        background: var(--primary-color) !important;
      }
      
      .border-blue-500 {
        border-color: var(--primary-color) !important;
      }
      
      .text-blue-600 {
        color: var(--primary-color) !important;
      }
      
      .hover\\:bg-blue-700:hover {
        background: var(--secondary-color) !important;
      }
    `
    
    // Verificar se já existe um estilo com o mesmo ID
    const existingStyle = document.getElementById('dynamic-theme-styles')
    if (existingStyle) {
      existingStyle.remove()
    }
    
    document.head.appendChild(style)
    
    return () => {
      const styleToRemove = document.getElementById('dynamic-theme-styles')
      if (styleToRemove) {
        styleToRemove.remove()
      }
    }
  }, [mounted])

  return null
}
