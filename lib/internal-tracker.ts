// Sistema interno de tracking - NÃO exposto via API
import { addLog } from './simple-db'
import { promises as fs } from 'fs'

// Garantir que o diretório de dados existe
async function ensureDataDir() {
  try {
    await fs.access('./data')
  } catch {
    await fs.mkdir('./data', { recursive: true })
    console.log('[INTERNAL-TRACKER] Diretório ./data criado')
  }
}

interface TrackingData {
  ip: string
  userAgent: string
  userType: 'real' | 'bot'
  destination: 'offerpage' | 'whitepage'
  utmParams?: Record<string, string>
  pathname?: string
}

// Função interna para registrar eventos automaticamente
export async function trackUserAction(data: TrackingData) {
  try {
    // Garantir que o diretório existe
    await ensureDataDir()
    
    // Registrar no banco de dados interno
    await addLog({
      type: 'click',
      userType: data.userType,
      destination: data.destination,
      ip: data.ip,
      userAgent: data.userAgent,
      pathname: data.pathname || '/',
      utmParams: data.utmParams || {}
    })
    
    console.log(`[INTERNAL-TRACKER] Registrado: ${data.userType} -> ${data.destination} | IP: ${data.ip}`)
  } catch (error) {
    console.error('[INTERNAL-TRACKER] Erro ao registrar:', error)
  }
}

// Função para registrar conversões (QR gerado)
export async function trackQRGenerated(data: {
  ip: string
  userAgent: string
  orderId: string
  amount: number
  utmParams?: Record<string, string>
}) {
  try {
    // Garantir que o diretório existe
    await ensureDataDir()
    
    await addLog({
      type: 'conversion',
      conversionType: 'qr_generated',
      orderId: data.orderId,
      amount: data.amount,
      ip: data.ip,
      userAgent: data.userAgent,
      utmParams: data.utmParams || {}
    })
    
    console.log(`[INTERNAL-TRACKER] QR Gerado: ${data.orderId} | IP: ${data.ip}`)
  } catch (error) {
    console.error('[INTERNAL-TRACKER] Erro ao registrar QR:', error)
  }
}

// Função para registrar pagamentos (via webhook)
export async function trackPaymentReceived(data: {
  ip: string
  userAgent: string
  orderId: string
  amount: number
  transactionId: string
}) {
  try {
    // Garantir que o diretório existe
    await ensureDataDir()
    
    await addLog({
      type: 'payment',
      conversionType: 'paid',
      orderId: data.orderId,
      amount: data.amount,
      ip: data.ip,
      userAgent: data.userAgent,
      utmParams: {} // Webhook não tem UTMs diretos
    })
    
    console.log(`[INTERNAL-TRACKER] Pagamento: ${data.orderId} | Transaction: ${data.transactionId}`)
  } catch (error) {
    console.error('[INTERNAL-TRACKER] Erro ao registrar pagamento:', error)
  }
}
