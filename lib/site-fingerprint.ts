/**
 * Sistema de fingerprinting único por site
 * Gera identificadores únicos baseados no domínio para diferenciar sites
 */

// Função para gerar hash simples a partir de string
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

// Função para gerar seed baseado no domínio
function getDomainSeed(domain: string): number {
  let seed = 0
  for (let i = 0; i < domain.length; i++) {
    seed += domain.charCodeAt(i) * (i + 1)
  }
  return seed
}

// Gerador de números pseudo-aleatórios baseado em seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

/**
 * Gera um fingerprint único para o site baseado no domínio
 */
export function getSiteFingerprint(): {
  siteId: string
  sessionId: string
  instanceId: string
  timestamp: number
  hash: string
} {
  if (typeof window === 'undefined') {
    return {
      siteId: 'server',
      sessionId: 'server',
      instanceId: 'server',
      timestamp: Date.now(),
      hash: 'server'
    }
  }

  const domain = window.location.hostname
  const seed = getDomainSeed(domain)
  
  // ID único do site baseado no domínio
  const siteId = simpleHash(domain)
  
  // Session ID único por sessão (muda a cada reload)
  const sessionId = simpleHash(domain + Date.now() + Math.random())
  
  // Instance ID baseado em seed do domínio + timestamp
  const random1 = seededRandom(seed)
  const random2 = seededRandom(seed + 1)
  const instanceId = simpleHash(domain + random1 + random2)
  
  // Hash combinado
  const hash = simpleHash(siteId + sessionId + instanceId)
  
  return {
    siteId,
    sessionId,
    instanceId,
    timestamp: Date.now(),
    hash
  }
}

/**
 * Gera classes CSS únicas baseadas no domínio
 */
export function getUniqueCSSClasses(): string {
  if (typeof window === 'undefined') return ''
  
  const domain = window.location.hostname
  const seed = getDomainSeed(domain)
  const hash = simpleHash(domain)
  
  // Gerar variações de classes baseadas no domínio
  const prefixes = ['site', 'app', 'page', 'container', 'wrapper']
  const randomIndex = Math.floor(seededRandom(seed) * prefixes.length)
  const prefix = prefixes[randomIndex]
  
  return `${prefix}-${hash}`
}

/**
 * Gera atributos data-* únicos para elementos
 */
export function getUniqueDataAttributes(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  
  const fingerprint = getSiteFingerprint()
  
  return {
    'data-site': fingerprint.siteId,
    'data-instance': fingerprint.instanceId,
    'data-session': fingerprint.sessionId,
    'data-hash': fingerprint.hash
  }
}

/**
 * Gera meta tags únicas para o head
 */
export function getUniqueMetaTags(): Array<{ name: string; content: string }> {
  if (typeof window === 'undefined') return []
  
  const fingerprint = getSiteFingerprint()
  const domain = window.location.hostname
  
  return [
    { name: 'site-id', content: fingerprint.siteId },
    { name: 'instance-id', content: fingerprint.instanceId },
    { name: 'site-hash', content: fingerprint.hash },
    { name: 'site-version', content: simpleHash(domain + Date.now().toString().slice(0, -3)) }
  ]
}

/**
 * Injeta variáveis CSS únicas baseadas no domínio
 */
export function injectUniqueCSSVariables(): void {
  if (typeof window === 'undefined') return
  
  const domain = window.location.hostname
  const seed = getDomainSeed(domain)
  
  // Gerar valores únicos mas consistentes para o domínio
  const hue = Math.floor(seededRandom(seed) * 360)
  const saturation = Math.floor(seededRandom(seed + 1) * 20) + 40 // 40-60%
  const lightness = Math.floor(seededRandom(seed + 2) * 20) + 40 // 40-60%
  
  const style = document.createElement('style')
  style.innerHTML = `
    :root {
      --site-hue: ${hue};
      --site-saturation: ${saturation}%;
      --site-lightness: ${lightness}%;
      --site-id: "${getSiteFingerprint().siteId}";
    }
  `
  document.head.appendChild(style)
}

/**
 * Gera um delay único baseado no domínio (para timing de animações)
 */
export function getUniqueDelay(baseDelay: number = 1000): number {
  if (typeof window === 'undefined') return baseDelay
  
  const domain = window.location.hostname
  const seed = getDomainSeed(domain)
  const variation = seededRandom(seed) * 500 // Variação de até 500ms
  
  return Math.floor(baseDelay + variation)
}

/**
 * Adiciona ruído único aos eventos de tracking
 */
export function addTrackingNoise(eventData: Record<string, any>): Record<string, any> {
  const fingerprint = getSiteFingerprint()
  
  return {
    ...eventData,
    _sid: fingerprint.siteId,
    _iid: fingerprint.instanceId,
    _ts: fingerprint.timestamp,
    _h: fingerprint.hash
  }
}
