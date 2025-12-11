import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), '.analytics-settings.json')
const ALLOWED_IPS = ['191.7.55.158', '127.0.0.1', 'localhost']

interface Settings {
  refererCheckEnabled: boolean
  lastUpdate: string
}

// Verificar IP autorizado
function isAllowedIP(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  return ALLOWED_IPS.includes(ip)
}

// Inicializar configurações
function initSettings(): Settings {
  if (!fs.existsSync(SETTINGS_FILE)) {
    const initialSettings: Settings = {
      refererCheckEnabled: false,
      lastUpdate: new Date().toISOString()
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(initialSettings, null, 2))
    return initialSettings
  }
  
  const data = fs.readFileSync(SETTINGS_FILE, 'utf-8')
  return JSON.parse(data)
}

// Salvar configurações
function saveSettings(settings: Settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

// GET - Obter configurações (protegido por IP)
export async function GET(request: NextRequest) {
  // Verificar IP
  if (!isAllowedIP(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const settings = initSettings()
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('[Settings] Erro ao ler:', error)
    return NextResponse.json({ success: false, error: 'Erro ao ler configurações' }, { status: 500 })
  }
}

// POST - Atualizar configurações (protegido por IP)
export async function POST(request: NextRequest) {
  // Verificar IP
  if (!isAllowedIP(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const settings = initSettings()
    
    // Atualizar configuração
    if (typeof body.refererCheckEnabled === 'boolean') {
      settings.refererCheckEnabled = body.refererCheckEnabled
      settings.lastUpdate = new Date().toISOString()
      saveSettings(settings)
      
      console.log(`[Settings] Verificação de referer ${settings.refererCheckEnabled ? 'ATIVADA' : 'DESATIVADA'}`)
      
      return NextResponse.json({ 
        success: true, 
        settings,
        message: `Verificação de referer ${settings.refererCheckEnabled ? 'ativada' : 'desativada'}`
      })
    }
    
    return NextResponse.json({ success: false, error: 'Parâmetro inválido' }, { status: 400 })
  } catch (error) {
    console.error('[Settings] Erro ao salvar:', error)
    return NextResponse.json({ success: false, error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}

// Rota pública para middleware consultar (sem proteção de IP)
export async function HEAD(request: NextRequest) {
  try {
    const settings = initSettings()
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Referer-Check': settings.refererCheckEnabled ? 'enabled' : 'disabled'
      }
    })
  } catch (error) {
    return new NextResponse(null, { status: 200 })
  }
}
