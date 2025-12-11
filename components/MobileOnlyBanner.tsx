'use client'

import { useEffect, useState } from 'react'

interface MobileOnlyBannerProps {
  children: React.ReactNode
}

/**
 * Componente que exibe conteúdo APENAS para:
 * - Dispositivos mobile (touch screen)
 * - Usuários reais (não bots)
 * - JavaScript habilitado
 */
export default function MobileOnlyBanner({ children }: MobileOnlyBannerProps) {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // Verificar se é dispositivo mobile REAL
    const isMobileDevice = () => {
      // 1. Verificar touch screen (dispositivos reais têm touch)
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // 2. Verificar user agent mobile
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      const isMobileUA = mobileRegex.test(navigator.userAgent)

      // 3. Verificar largura da tela (mobile geralmente < 768px)
      const isMobileWidth = window.innerWidth < 768

      // 4. Verificar orientação (mobile tem orientation API)
      const hasOrientation = typeof window.orientation !== 'undefined' || 
                            typeof screen.orientation !== 'undefined'

      // Precisa ter pelo menos 2 características de mobile
      const mobileScore = [hasTouch, isMobileUA, isMobileWidth, hasOrientation].filter(Boolean).length
      
      return mobileScore >= 2
    }

    // Verificar se NÃO é bot
    const isNotBot = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      
      // Lista de bots conhecidos
      const botPatterns = [
        'bot', 'crawler', 'spider', 'scraper',
        'curl', 'wget', 'python', 'java',
        'headless', 'phantom', 'selenium'
      ]

      // Se encontrar algum padrão de bot, retorna false
      return !botPatterns.some(pattern => userAgent.includes(pattern))
    }

    // Verificar se tem comportamento humano
    const hasHumanBehavior = () => {
      // Verificar se tem plugins (bots geralmente não têm)
      const hasPlugins = navigator.plugins && navigator.plugins.length > 0

      // Verificar se tem linguagens (bots geralmente têm array vazio)
      const hasLanguages = navigator.languages && navigator.languages.length > 0

      // Verificar se tem webdriver (automação)
      const hasWebDriver = navigator.webdriver === true

      return hasPlugins && hasLanguages && !hasWebDriver
    }

    // Delay para evitar que scrapers rápidos vejam o banner
    setTimeout(() => {
      if (isMobileDevice() && isNotBot() && hasHumanBehavior()) {
        setShouldShow(true)
      }
    }, 500) // 500ms de delay
  }, [])

  // Não renderizar nada até verificar
  if (!shouldShow) {
    return null
  }

  return <>{children}</>
}
