"use client"

interface LogEntry {
  id: string
  timestamp: string
  type: "login" | "pageview" | "click" | "payment" | "webhook" | "blocked" | "utm_params" | "utmify" | "order_created" | "order_paid"
  message: string
  ip: string
  userAgent: string
  userId?: string
  details?: Record<string, any>
  pathname?: string
}

export class AdminLogger {
  private static instance: AdminLogger
  
  private constructor() {}
  
  static getInstance(): AdminLogger {
    if (!AdminLogger.instance) {
      AdminLogger.instance = new AdminLogger()
    }
    return AdminLogger.instance
  }
  
  async addLog(log: Omit<LogEntry, 'id' | 'timestamp' | 'ip' | 'userAgent'>) {
    if (typeof window === 'undefined') return // Só funciona no cliente
    
    // DESABILITADO: Não fazer mais requisições para API
    // Os logs agora são capturados pelo middleware automaticamente
    
    // Apenas log local para debug
    console.log(`[ADMIN LOG] ${log.type} - ${log.message}`)
  }
  
  logPageView(pathname: string, utmParams?: Record<string, string>) {
    this.addLog({
      type: 'pageview',
      message: `Página acessada: ${pathname}`,
      details: { utmParams }
    })
  }
  
  logUtmParams(utmParams: Record<string, string>) {
    this.addLog({
      type: 'utm_params',
      message: `Parâmetros UTM capturados: ${Object.keys(utmParams || {}).join(', ')}`,
      details: { utmParams }
    })
  }
  
  logPayment(orderId: string, amount: number, utmParams?: Record<string, string>) {
    this.addLog({
      type: 'payment',
      message: `Pagamento iniciado - Order: ${orderId}, Valor: R$ ${(amount / 100).toFixed(2)}`,
      details: { orderId, amount, utmParams }
    })
  }
  
  logUtmifyRequest(orderData: any, success: boolean, response?: any, error?: string) {
    this.addLog({
      type: 'utmify',
      message: success ? `UTMify request enviado com sucesso - Order: ${orderData.orderId}` : `UTMify request falhou - Order: ${orderData.orderId}`,
      details: { 
        orderData, 
        success, 
        response, 
        error,
        gclid: orderData.trackingParameters?.gclid,
        utm_source: orderData.trackingParameters?.utm_source,
        testMode: orderData.status !== 'paid'
      }
    })
  }
}

// Exportar instância singleton
export const adminLogger = AdminLogger.getInstance()
