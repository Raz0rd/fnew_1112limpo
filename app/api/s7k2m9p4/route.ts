import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ANALYTICS_FILE = path.join(process.cwd(), '.analytics-data.json')
const ALLOWED_IPS = ['191.7.55.158', '127.0.0.1', 'localhost']

interface AccessLog {
  timestamp: string
  path: string
  userAgent: string
  ip: string
  referer: string
  query: string
}

interface Analytics {
  totalAccess: number
  logs: AccessLog[]
  pathCounts: Record<string, number>
  lastReset: string
}

// Verificar IP autorizado
function isAllowedIP(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  return ALLOWED_IPS.includes(ip)
}

// Inicializar arquivo de analytics
function initAnalytics(): Analytics {
  if (!fs.existsSync(ANALYTICS_FILE)) {
    const initialData: Analytics = {
      totalAccess: 0,
      logs: [],
      pathCounts: {},
      lastReset: new Date().toISOString()
    }
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(initialData, null, 2))
    return initialData
  }
  
  const data = fs.readFileSync(ANALYTICS_FILE, 'utf-8')
  return JSON.parse(data)
}

// Salvar analytics
function saveAnalytics(data: Analytics) {
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2))
}

// GET - Visualizar analytics (protegido por IP)
export async function GET(request: NextRequest) {
  // Verificar IP
  if (!isAllowedIP(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const analytics = initAnalytics()
    
    // Estatísticas por hora (últimas 24h)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentLogs = analytics.logs.filter(log => new Date(log.timestamp) > last24h)
    
    // Agrupar por hora
    const hourlyStats: Record<string, number> = {}
    recentLogs.forEach(log => {
      const hour = new Date(log.timestamp).toISOString().slice(0, 13) + ':00'
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1
    })
    
    // Top paths
    const sortedPaths = Object.entries(analytics.pathCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
    
    // Detectar bots
    const botAccess = recentLogs.filter(log => 
      /bot|crawler|spider|googlebot|bingbot|adsbot/i.test(log.userAgent)
    ).length
    
    const humanAccess = recentLogs.length - botAccess
    
    // Agrupar por referer
    const refererCounts: Record<string, number> = {}
    recentLogs.forEach(log => {
      if (log.referer) {
        try {
          const url = new URL(log.referer)
          const domain = url.hostname
          refererCounts[domain] = (refererCounts[domain] || 0) + 1
        } catch {
          refererCounts['direct'] = (refererCounts['direct'] || 0) + 1
        }
      } else {
        refererCounts['direct'] = (refererCounts['direct'] || 0) + 1
      }
    })
    
    const topReferers = Object.entries(refererCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
    
    return NextResponse.json({
      success: true,
      data: {
        total: analytics.totalAccess,
        last24h: recentLogs.length,
        humanAccess,
        botAccess,
        lastReset: analytics.lastReset,
        hourlyStats,
        topPaths: sortedPaths,
        topReferers,
        recentLogs: analytics.logs.slice(-100).reverse() // Últimos 100
      }
    })
  } catch (error) {
    console.error('[Analytics] Erro ao ler:', error)
    return NextResponse.json({ success: false, error: 'Erro ao ler analytics' }, { status: 500 })
  }
}

// POST - Registrar acesso (sem proteção de IP - usado pelo middleware)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const analytics = initAnalytics()
    
    const log: AccessLog = {
      timestamp: new Date().toISOString(),
      path: body.path || '/',
      userAgent: body.userAgent || '',
      ip: body.ip || '',
      referer: body.referer || '',
      query: body.query || ''
    }
    
    // Adicionar log
    analytics.logs.push(log)
    analytics.totalAccess++
    
    // Contar por path
    analytics.pathCounts[log.path] = (analytics.pathCounts[log.path] || 0) + 1
    
    // Manter apenas últimos 10000 logs
    if (analytics.logs.length > 10000) {
      analytics.logs = analytics.logs.slice(-10000)
    }
    
    saveAnalytics(analytics)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Analytics] Erro ao salvar:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

// DELETE - Resetar analytics (protegido por IP)
export async function DELETE(request: NextRequest) {
  // Verificar IP
  if (!isAllowedIP(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const analytics: Analytics = {
      totalAccess: 0,
      logs: [],
      pathCounts: {},
      lastReset: new Date().toISOString()
    }
    
    saveAnalytics(analytics)
    
    return NextResponse.json({ success: true, message: 'Analytics resetado' })
  } catch (error) {
    console.error('[Analytics] Erro ao resetar:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
