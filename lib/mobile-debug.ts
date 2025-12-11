// Sistema de debug para mobile - salva logs no localStorage
export class MobileDebugger {
  private static instance: MobileDebugger
  private logs: string[] = []
  private maxLogs = 100

  static getInstance(): MobileDebugger {
    if (!MobileDebugger.instance) {
      MobileDebugger.instance = new MobileDebugger()
    }
    return MobileDebugger.instance
  }

  log(message: string, data?: any) {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `[${timestamp}] ${message}${data ? ` | ${JSON.stringify(data)}` : ''}`
    
    // Adicionar ao array local
    this.logs.push(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Salvar no localStorage
    try {
      localStorage.setItem('mobile_debug_logs', JSON.stringify(this.logs))
    } catch (error) {
      console.error('Erro ao salvar logs:', error)
    }

    // Também logar no console se disponível
    console.log(`[MOBILE DEBUG] ${logEntry}`)
  }

  error(message: string, error?: any) {
    this.log(`ERROR: ${message}`, error)
  }

  getLogs(): string[] {
    return this.logs
  }

  clearLogs() {
    this.logs = []
    try {
      localStorage.removeItem('mobile_debug_logs')
    } catch (error) {
      console.error('Erro ao limpar logs:', error)
    }
  }

  // Carregar logs do localStorage na inicialização
  loadLogs() {
    try {
      const savedLogs = localStorage.getItem('mobile_debug_logs')
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs)
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
    }
  }
}

// Instância global
export const mobileDebug = MobileDebugger.getInstance()

// Carregar logs salvos
if (typeof window !== 'undefined') {
  mobileDebug.loadLogs()
}
