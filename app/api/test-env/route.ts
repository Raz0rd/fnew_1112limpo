import { NextRequest, NextResponse } from "next/server"

// Forçar Node.js runtime explicitamente
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Múltiplas tentativas de ler env vars
  
  // Método 1: process.env direto
  const method1 = {
    PAYMENT_GATEWAY: process.env.PAYMENT_GATEWAY,
    UMBRELA_API_KEY: process.env.UMBRELA_API_KEY,
    NODE_ENV: process.env.NODE_ENV
  }
  
  // Método 2: Destructuring
  const { PAYMENT_GATEWAY, UMBRELA_API_KEY, NODE_ENV } = process.env
  const method2 = { PAYMENT_GATEWAY, UMBRELA_API_KEY, NODE_ENV }
  
  // Método 3: Verificar se existe no object keys
  const allKeys = Object.keys(process.env)
  const method3 = {
    hasPaymentGateway: allKeys.includes('PAYMENT_GATEWAY'),
    hasUmbrelaKey: allKeys.includes('UMBRELA_API_KEY'),
    hasNodeEnv: allKeys.includes('NODE_ENV'),
    totalKeys: allKeys.length,
    someKeys: allKeys.slice(0, 10) // Primeiras 10 keys
  }
  
  // Método 4: Tentar Reflect
  const method4 = {
    reflectGateway: Reflect.get(process.env, 'PAYMENT_GATEWAY'),
    reflectUmbrela: Reflect.get(process.env, 'UMBRELA_API_KEY')
  }
  
  return NextResponse.json({
    test: 'Environment Variables Test',
    runtime: 'nodejs',
    timestamp: new Date().toISOString(),
    methods: {
      direct: method1,
      destructuring: method2,
      objectKeys: method3,
      reflect: method4
    },
    // Debug do processo
    processInfo: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  })
}

export async function POST(request: NextRequest) {
  // Tentar acessar env vars específicas que sabemos que existem
  const knownVars = [
    'PAYMENT_GATEWAY',
    'UMBRELA_API_KEY', 
    'BLACKCAT_API_AUTH',
    'GHOSTPAY_API_KEY',
    'NODE_ENV',
    'NETLIFY',
    'CONTEXT',
    'DEPLOY_PRIME_URL'
  ]
  
  const results = {}
  
  for (const varName of knownVars) {
    results[varName] = {
      value: process.env[varName] || 'NOT_FOUND',
      exists: varName in process.env,
      type: typeof process.env[varName]
    }
  }
  
  return NextResponse.json({
    test: 'Specific Variables Test',
    results,
    processEnvLength: Object.keys(process.env).length
  })
}
