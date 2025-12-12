'use client'

interface WhitePageWrapperProps {
  children: React.ReactNode
}

export default function WhitePageWrapper({ children }: WhitePageWrapperProps) {
  // WhitePage desativado - retorna conteúdo diretamente
  return <>{children}</>
}
