/**
 * Utilitários para hash SHA-256 (Enhanced Conversions do Google Ads)
 */

import crypto from 'crypto'

/**
 * Gera hash SHA-256 de uma string
 * @param value - Valor para fazer hash
 * @returns Hash SHA-256 em hexadecimal
 */
export async function sha256Hash(value: string): Promise<string> {
  if (!value) return ''
  
  // Normalizar: lowercase e remover espaços
  const normalized = value.toLowerCase().trim()
  
  // Gerar hash SHA-256 usando Node.js crypto
  const hash = crypto.createHash('sha256')
  hash.update(normalized)
  const hashHex = hash.digest('hex')
  
  return hashHex
}

/**
 * Normaliza e faz hash de email
 * @param email - Email para normalizar e fazer hash
 * @returns Hash SHA-256 do email normalizado
 */
export async function hashEmail(email: string): Promise<string> {
  if (!email) return ''
  
  // Remover espaços e converter para lowercase
  let normalized = email.toLowerCase().trim()
  
  // Remover pontos (.) antes do @ para Gmail e Googlemail (requisito do Google Ads)
  if (normalized.includes('@gmail.com') || normalized.includes('@googlemail.com')) {
    const [localPart, domain] = normalized.split('@')
    const localWithoutDots = localPart.replace(/\./g, '')
    normalized = `${localWithoutDots}@${domain}`
  }
  
  return sha256Hash(normalized)
}

/**
 * Normaliza e faz hash de telefone
 * @param phone - Telefone no formato E.164 (+5511999999999)
 * @returns Hash SHA-256 do telefone normalizado
 */
export async function hashPhone(phone: string): Promise<string> {
  if (!phone) return ''
  
  // Remover tudo que não é número
  let normalized = phone.replace(/\D/g, '')
  
  // Adicionar +55 se não tiver código do país
  if (!normalized.startsWith('55')) {
    normalized = '55' + normalized
  }
  
  // Adicionar + no início para formato E.164
  normalized = '+' + normalized
  
  return sha256Hash(normalized)
}

/**
 * Gera hash de comprovação de entrega
 * @param transactionId - ID da transação
 * @param email - Email do cliente
 * @param dataEntrega - Data/hora da entrega (ISO 8601)
 * @param quantidade - Quantidade entregue
 * @returns Hash SHA-256 para comprovação de entrega
 */
export async function generateDeliveryHash(
  transactionId: string,
  email: string,
  dataEntrega: string,
  quantidade: string
): Promise<string> {
  const base = `${transactionId}|${email}|${dataEntrega}|${quantidade}`
  return sha256Hash(base)
}

/**
 * Normaliza e faz hash de nome
 * @param name - Nome para normalizar e fazer hash
 * @returns Hash SHA-256 do nome normalizado
 */
export async function hashName(name: string): Promise<string> {
  if (!name) return ''
  
  // Remover espaços extras, converter para lowercase
  const normalized = name.toLowerCase().trim().replace(/\s+/g, ' ')
  
  return sha256Hash(normalized)
}
