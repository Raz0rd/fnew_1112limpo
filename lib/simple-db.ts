// Declaração de tipo para global
declare const global: any

// Sistema de armazenamento compatível com Netlify (serverless)
class ServerlessStorage {
  private cache: Map<string, any> = new Map()
  
  async read(key: string, defaultValue: any = null) {
    // Em ambiente serverless, usar cache em memória
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }
    
    // Se não existe no cache, usar valor padrão
    this.cache.set(key, defaultValue)
    return defaultValue
  }
  
  async write(key: string, data: any) {
    // Salvar no cache em memória
    this.cache.set(key, data)
    
    // Em produção, também salvar no global para persistir entre requisições
    if (typeof global !== 'undefined') {
      if (!global.__SERVERLESS_STORAGE__) {
        global.__SERVERLESS_STORAGE__ = new Map()
      }
      global.__SERVERLESS_STORAGE__.set(key, data)
    }
  }
  
  async init() {
    // Recuperar dados do global se existir
    if (typeof global !== 'undefined' && global.__SERVERLESS_STORAGE__) {
      for (const [key, value] of global.__SERVERLESS_STORAGE__.entries()) {
        this.cache.set(key, value)
      }
    }
  }
}

const storage = new ServerlessStorage()

// Tipos para o banco de dados
export interface LogEntry {
  id: string
  timestamp: string
  type: 'click' | 'conversion' | 'payment' | 'blocked'
  userType?: 'real' | 'bot'
  destination?: string
  ip: string
  userAgent: string
  pathname?: string
  utmParams?: Record<string, string>
  conversionType?: string
  orderId?: string
  amount?: number
  qrGenerated?: boolean
  paid?: boolean
}

export interface Analytics {
  realUserClicks: number
  botClicks: number
  qrGenerated: number
  paid: number
  lastReset: string
  antibotEnabled: boolean
  logs: LogEntry[]
}
export interface IPList {
  whitelist: string[]
  blacklist: string[]
}

// Chaves para o storage
const ANALYTICS_KEY = 'analytics'
const IP_LISTS_KEY = 'ip-lists'

// Carregar analytics
export async function loadAnalytics(): Promise<Analytics> {
  await storage.init()
  
  const defaultAnalytics: Analytics = {
    realUserClicks: 0,
    botClicks: 0,
    qrGenerated: 0,
    paid: 0,
    lastReset: new Date().toISOString(),
    antibotEnabled: true,
    logs: []
  }
  
  return await storage.read(ANALYTICS_KEY, defaultAnalytics)
}

// Salvar analytics
export async function saveAnalytics(analytics: Analytics): Promise<void> {
  await storage.write(ANALYTICS_KEY, analytics)
}

// Carregar listas de IP
export async function loadIPLists(): Promise<IPList> {
  await storage.init()
  
  const defaultLists: IPList = {
    whitelist: [],
    blacklist: []
  }
  
  return await storage.read(IP_LISTS_KEY, defaultLists)
}

// Salvar listas de IP
export async function saveIPLists(ipLists: IPList): Promise<void> {
  await storage.write(IP_LISTS_KEY, ipLists)
}

// Adicionar log
export async function addLog(logEntry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
  const analytics = await loadAnalytics()
  
  const newLog: LogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    ...logEntry
  }
  
  analytics.logs.push(newLog)
  
  // Atualizar contadores
  if (logEntry.type === 'click') {
    if (logEntry.userType === 'real') {
      analytics.realUserClicks++
    } else if (logEntry.userType === 'bot') {
      analytics.botClicks++
    }
  } else if (logEntry.type === 'conversion') {
    if (logEntry.conversionType === 'qr_generated') {
      analytics.qrGenerated++
    } else if (logEntry.conversionType === 'paid') {
      analytics.paid++
    }
  }
  
  await saveAnalytics(analytics)
}

// Resetar analytics
export async function resetAnalytics(): Promise<Analytics> {
  const newAnalytics: Analytics = {
    realUserClicks: 0,
    botClicks: 0,
    qrGenerated: 0,
    paid: 0,
    lastReset: new Date().toISOString(),
    antibotEnabled: true,
    logs: []
  }
  
  await saveAnalytics(newAnalytics)
  return newAnalytics
}

// Adicionar IP à whitelist
export async function addToWhitelist(ip: string): Promise<IPList> {
  const ipLists = await loadIPLists()
  
  if (!ipLists.whitelist.includes(ip)) {
    ipLists.whitelist.push(ip)
    // Remover da blacklist se estiver lá
    ipLists.blacklist = ipLists.blacklist.filter(blacklistedIp => blacklistedIp !== ip)
    await saveIPLists(ipLists)
  }
  
  return ipLists
}

// Adicionar IP à blacklist
export async function addToBlacklist(ip: string): Promise<IPList> {
  const ipLists = await loadIPLists()
  
  if (!ipLists.blacklist.includes(ip)) {
    ipLists.blacklist.push(ip)
    // Remover da whitelist se estiver lá
    ipLists.whitelist = ipLists.whitelist.filter(whitelistedIp => whitelistedIp !== ip)
    await saveIPLists(ipLists)
  }
  
  return ipLists
}

// Remover IP das listas
export async function removeFromLists(ip: string): Promise<IPList> {
  const ipLists = await loadIPLists()
  
  ipLists.whitelist = ipLists.whitelist.filter(whitelistedIp => whitelistedIp !== ip)
  ipLists.blacklist = ipLists.blacklist.filter(blacklistedIp => blacklistedIp !== ip)
  
  await saveIPLists(ipLists)
  return ipLists
}

// Controlar antibot
export async function setAntibotEnabled(enabled: boolean): Promise<Analytics> {
  const analytics = await loadAnalytics()
  analytics.antibotEnabled = enabled
  await saveAnalytics(analytics)
  
  // Atualizar variável global do middleware
  ;(global as any).antibotEnabled = enabled
  
  return analytics
}

export async function getAntibotStatus(): Promise<boolean> {
  const analytics = await loadAnalytics()
  return analytics.antibotEnabled
}
