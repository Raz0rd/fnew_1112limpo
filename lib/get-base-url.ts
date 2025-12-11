/**
 * Detecta a URL base do projeto automaticamente
 * Funciona tanto no servidor quanto no cliente
 */
export function getBaseUrl(): string {
  // 1. Se tiver NEXT_PUBLIC_BASE_URL definida, usa ela (override manual)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '') // Remove trailing slash
  }

  // 2. No lado do servidor (build time ou SSR)
  if (typeof window === 'undefined') {
    // Vercel
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }
    
    // Netlify
    if (process.env.DEPLOY_PRIME_URL) {
      return process.env.DEPLOY_PRIME_URL
    }
    
    if (process.env.URL) {
      return process.env.URL
    }
    
    // Fallback para localhost em desenvolvimento
    return process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://hubsblog.netlify.app' // Fallback de produção
  }

  // 3. No lado do cliente (browser)
  return window.location.origin
}

/**
 * Retorna o domínio atual (sem protocolo)
 */
export function getCurrentDomain(): string {
  const baseUrl = getBaseUrl()
  return baseUrl.replace(/^https?:\/\//, '')
}

/**
 * Retorna lista de domínios permitidos
 */
export function getAllowedDomains(): string[] {
  // Se tiver definido manualmente, usa
  if (process.env.NEXT_PUBLIC_ALLOWED_DOMAINS) {
    return process.env.NEXT_PUBLIC_ALLOWED_DOMAINS.split(',').map(d => d.trim())
  }
  
  // Senão, detecta automaticamente
  const domain = getCurrentDomain()
  return [
    domain,
    `www.${domain}`,
    'localhost:3000', // Sempre permitir localhost em dev
  ]
}
