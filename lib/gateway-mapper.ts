// Mapeamento de gateways para códigos ofuscados
// Não expor nomes reais dos gateways no localStorage do cliente

const GATEWAY_MAP: Record<string, string> = {
  'ghostpay': 'gw_alpha',
  'ezzpag': 'gw_beta',
  'umbrela': 'gw_gamma',
  'nitro': 'gw_delta',
}

const REVERSE_MAP: Record<string, string> = {
  'gw_alpha': 'ghostpay',
  'gw_beta': 'ezzpag',
  'gw_gamma': 'umbrela',
  'gw_delta': 'nitro',
}

export function encodeGateway(gateway: string): string {
  return GATEWAY_MAP[gateway] || 'gw_unknown'
}

export function decodeGateway(encoded: string): string {
  return REVERSE_MAP[encoded] || 'ezzpag'
}

// Para debug (apenas server-side)
export function getGatewayMapping() {
  return GATEWAY_MAP
}
