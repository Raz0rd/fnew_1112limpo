/**
 * Sistema de Retry para Requisições HTTP
 * Tenta novamente com backoff exponencial em caso de falha
 */

interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  timeout?: number;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Fetch com retry automático
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    timeout = 30000,
    onRetry
  } = retryOptions;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Adicionar timeout à requisição
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Se for sucesso (2xx), retorna
      if (response.ok) {
        if (attempt > 0) {
          console.log(`✅ [Retry] Sucesso após ${attempt} tentativa(s)`);
        }
        return response;
      }

      // Se for erro 4xx (cliente), não tenta novamente
      if (response.status >= 400 && response.status < 500) {
        console.error(`❌ [Retry] Erro ${response.status} (cliente) - Não vai tentar novamente`);
        return response;
      }

      // Se for erro 5xx (servidor), tenta novamente
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error: any) {
      lastError = error;
      
      // Se for erro de abort (timeout), loga específico
      if (error.name === 'AbortError') {
        console.error(`⏱️ [Retry] Timeout após ${timeout}ms`);
      }
    }

    // Se não é a última tentativa, aguarda e tenta novamente
    if (attempt < maxRetries) {
      const delay = delayMs * Math.pow(2, attempt); // Backoff exponencial
      console.warn(`⚠️ [Retry] Tentativa ${attempt + 1}/${maxRetries + 1} falhou. Tentando novamente em ${delay}ms...`);
      
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Todas as tentativas falharam
  console.error(`❌ [Retry] Todas as ${maxRetries + 1} tentativas falharam`);
  throw lastError;
}

/**
 * Armazena requisição falhada no localStorage para retry posterior
 */
export function saveFailedRequest(endpoint: string, data: any) {
  try {
    const key = `failed_request_${Date.now()}`;
    const failedRequest = {
      endpoint,
      data,
      timestamp: new Date().toISOString(),
      attempts: 0
    };
    
    localStorage.setItem(key, JSON.stringify(failedRequest));
    console.log(`💾 [Retry] Requisição salva para retry: ${key}`);
  } catch (error) {
    console.error('❌ [Retry] Erro ao salvar requisição falhada:', error);
  }
}

/**
 * Tenta reenviar todas as requisições falhadas armazenadas
 */
export async function retryFailedRequests() {
  const keys = Object.keys(localStorage).filter(key => key.startsWith('failed_request_'));
  
  if (keys.length === 0) {
    return;
  }
  
  console.log(`🔄 [Retry] Encontradas ${keys.length} requisição(ões) falhada(s). Tentando reenviar...`);
  
  for (const key of keys) {
    try {
      const item = localStorage.getItem(key);
      if (!item) continue;
      
      const failedRequest = JSON.parse(item);
      
      // Limitar tentativas a 5
      if (failedRequest.attempts >= 5) {
        console.warn(`⚠️ [Retry] Requisição ${key} excedeu 5 tentativas. Removendo.`);
        localStorage.removeItem(key);
        continue;
      }
      
      // Tentar reenviar
      const response = await fetchWithRetry(failedRequest.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(failedRequest.data)
      }, {
        maxRetries: 1,
        timeout: 10000
      });
      
      if (response.ok) {
        console.log(`✅ [Retry] Requisição ${key} reenviada com sucesso`);
        localStorage.removeItem(key);
      } else {
        // Incrementar contador de tentativas
        failedRequest.attempts++;
        localStorage.setItem(key, JSON.stringify(failedRequest));
        console.warn(`⚠️ [Retry] Requisição ${key} falhou novamente (tentativa ${failedRequest.attempts})`);
      }
      
    } catch (error) {
      console.error(`❌ [Retry] Erro ao reenviar ${key}:`, error);
    }
  }
}
