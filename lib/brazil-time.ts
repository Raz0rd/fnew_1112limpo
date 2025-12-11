/**
 * Função para obter timestamp em UTC (formato esperado pelo UTMify)
 * Formato: YYYY-MM-DD HH:MM:SS
 * 
 * @param date - Data opcional (padrão: now)
 * @returns String no formato "2025-10-07 17:37:00" em UTC
 */
export function getBrazilTimestamp(date: Date = new Date()): string {
  // IMPORTANTE: UTMify espera UTC, não horário local!
  // Usar UTC para evitar erro "createdAt is in Future"
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
