'use client'

import { useState, useEffect } from 'react'
import WhitePage from './WhitePage'

interface WhitePageWrapperProps {
  children: React.ReactNode
}

export default function WhitePageWrapper({ children }: WhitePageWrapperProps) {
  const [showWhitePage, setShowWhitePage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    if (isLocalhost) {
      setShowWhitePage(false)
      setIsLoading(false)
      return
    }

    const currentPath = window.location.pathname
    const publicRoutes = ['/cupons', '/success', '/sucesso', '/checkout', '/termos', '/privacidade', '/blog']
    const isPublicRoute = publicRoutes.some(route => currentPath.startsWith(route))
    
    if (isPublicRoute) {
      setIsLoading(false)
      return
    }
    
    const whitePagePassed = localStorage.getItem('whitepage_passed')
    
    if (!whitePagePassed) {
      setShowWhitePage(true)
      setIsLoading(false)
      return
    }
    
    setIsLoading(false)
  }, [])

  const handleWhitePageActivate = () => {
    localStorage.setItem('whitepage_passed', 'true')
    localStorage.setItem('whitepage_passed_at', Date.now().toString())
    setShowWhitePage(false)
  }

  if (showWhitePage) {
    return <WhitePage onActivate={handleWhitePageActivate} isBot={false} />
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-black">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent mb-4"></div>
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
