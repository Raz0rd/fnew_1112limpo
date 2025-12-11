// Forçar Node.js runtime
export const runtime = 'nodejs'

// Helper simples para ler env vars
export function getEnvVar(key: string, fallback: string = ''): string {
  return process.env[key] || fallback
}

// Configurações - lidas em runtime das env vars
export function getConfig() {
  return {
    // Gateway de pagamento
    paymentGateway: process.env.PAYMENT_GATEWAY || 'umbrela',
    
    // API Keys - DEVEM estar configuradas no Netlify
    umbrelaApiKey: process.env.UMBRELA_API_KEY || '',
    blackcatAuth: process.env.BLACKCAT_API_AUTH || '',
    ghostpayKey: process.env.GHOSTPAY_API_KEY || '',
    
    // Debug
    isProduction: process.env.NODE_ENV === 'production',
    isNetlify: !!(process.env.NETLIFY || process.env.DEPLOY_PRIME_URL || process.env.CONTEXT),
  }
}
