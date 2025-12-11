/**
 * Sistema de Logging de Conversões
 * Rastreia todo o fluxo de pagamento e conversões
 */

export interface ConversionLog {
  timestamp: string
  transactionId: string
  step: string
  status: 'success' | 'error' | 'pending' | 'info'
  message: string
  data?: any
  route?: string
  userId?: string
  utmParams?: Record<string, any>
}

// Armazenamento em memória (últimas 100 conversões)
const conversionLogs: ConversionLog[] = []
const MAX_LOGS = 100

/**
 * Adicionar log de conversão
 */
export function logConversion(log: Omit<ConversionLog, 'timestamp'>) {
  const entry: ConversionLog = {
    ...log,
    timestamp: new Date().toISOString()
  }
  
  conversionLogs.unshift(entry)
  
  // Manter apenas os últimos 100 logs
  if (conversionLogs.length > MAX_LOGS) {
    conversionLogs.pop()
  }
  
  // Log formatado no console do servidor
  const emoji = log.status === 'success' ? '✅' : 
                log.status === 'error' ? '❌' : 
                log.status === 'pending' ? '⏳' : 'ℹ️'
  
  console.log(`${emoji} [${log.step}] ${log.message}`)
  if (log.data) {
    console.log('   📦 Data:', JSON.stringify(log.data, null, 2))
  }
}

/**
 * Buscar logs por transactionId
 */
export function getLogsByTransaction(transactionId: string): ConversionLog[] {
  return conversionLogs.filter(log => log.transactionId === transactionId)
}

/**
 * Buscar todos os logs (últimos N)
 */
export function getAllLogs(limit: number = 50): ConversionLog[] {
  return conversionLogs.slice(0, limit)
}

/**
 * Buscar logs por userId
 */
export function getLogsByUserId(userId: string): ConversionLog[] {
  return conversionLogs.filter(log => log.userId === userId)
}

/**
 * Limpar logs antigos (mais de 24h)
 */
export function cleanOldLogs() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const initialLength = conversionLogs.length
  
  // Remover logs antigos
  for (let i = conversionLogs.length - 1; i >= 0; i--) {
    const logDate = new Date(conversionLogs[i].timestamp)
    if (logDate < oneDayAgo) {
      conversionLogs.splice(i, 1)
    }
  }
  
  const removed = initialLength - conversionLogs.length
  if (removed > 0) {
    console.log(`🧹 [LOGGER] Removidos ${removed} logs antigos`)
  }
}

// Limpar logs antigos a cada 1 hora
setInterval(cleanOldLogs, 60 * 60 * 1000)
