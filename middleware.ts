import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Função para verificar se um IP está em um range CIDR
function isIpInRange(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  
  return (ipNum & mask) === (rangeNum & mask);
}

// Ranges de IP bloqueados - Rapid7
const RAPID7_IPS = [
  // Surface Command IPs
  '50.16.148.46/32',
  '44.220.226.43/32',
  '54.157.145.68/32',
  '3.68.142.240/32',
  '3.71.239.248/32',
  '3.64.254.7/32',
  '52.192.122.175/32',
  '54.250.1.136/32',
  '52.194.209.164/32',
  '52.62.216.164/32',
  '54.253.36.0/32',
  '13.238.11.97/32',
  '3.99.109.142/32',
  '3.98.20.160/32',
  '3.98.151.228/32',
  // Regional IPs
  '34.205.208.125/32',
  '34.192.183.106/32',
  '34.224.19.93/32',
  '34.227.121.223/32',
  '52.14.12.25/32',
  '52.14.88.11/32',
  '3.22.113.166/32',
  '52.36.241.148/32',
  '52.36.245.161/32',
  '44.228.9.4/32',
  '35.158.144.37/32',
  '35.156.166.245/32',
  '172.104.153.232/32',
  '52.60.149.201/32',
  '52.60.191.46/32',
  '172.104.11.18/32',
  '52.63.190.180/32',
  '52.62.83.29/32',
  '139.162.25.220/32',
  '172.104.83.134/32',
  '52.68.0.155/32',
  '54.64.21.140/32',
];

// Ranges de IP bloqueados - Garena
const GARENA_RANGES = [
  '202.73.16.0/21',
  '202.181.80.0/21',
  '43.252.184.0/22',
  '202.73.16.0/22',
  '103.248.58.0/23',
  '124.158.134.0/23',
  '124.158.142.0/23',
  '202.181.80.0/23',
  '43.252.184.0/24',
  '43.252.185.0/24',
  '103.247.204.0/22',
  '143.92.120.0/22',
  '148.222.64.0/22',
  '202.81.96.0/22',
  '202.81.108.0/22',
  '202.81.112.0/22',
  '202.81.120.0/22',
  '202.181.72.0/22',
  '202.181.76.0/22',
  '103.247.206.0/23',
];

// Whitelist de IPs (adicione IPs confiáveis aqui)
const WHITELIST_IPS: string[] = [
  // Exemplo: '192.168.1.1'
];

// Blacklist de IPs específicos (adicione IPs individuais aqui)
const BLACKLIST_IPS: string[] = [
  // Exemplo: '123.45.67.89'
];

// Função para obter o IP real do cliente
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return request.ip || 'unknown';
}

// Função para verificar se o IP está bloqueado
function isIpBlocked(ip: string): { blocked: boolean; reason?: string } {
  // Verifica whitelist primeiro
  if (WHITELIST_IPS.includes(ip)) {
    return { blocked: false };
  }
  
  // Verifica blacklist específica
  if (BLACKLIST_IPS.includes(ip)) {
    return { blocked: true, reason: 'IP na blacklist' };
  }
  
  // Verifica IPs do Rapid7
  for (const range of RAPID7_IPS) {
    if (isIpInRange(ip, range)) {
      return { blocked: true, reason: 'Rapid7 bloqueado' };
    }
  }
  
  // Verifica ranges da Garena
  for (const range of GARENA_RANGES) {
    if (isIpInRange(ip, range)) {
      return { blocked: true, reason: 'Garena bloqueado' };
    }
  }
  
  return { blocked: false };
}

// Função para registrar acesso bloqueado
function logBlockedAccess(ip: string, reason: string, path: string, userAgent: string) {
  const timestamp = new Date().toISOString();
  console.log(`[BLOQUEIO] ${timestamp} | IP: ${ip} | Motivo: ${reason} | Path: ${path} | UA: ${userAgent}`);
}

export function middleware(request: NextRequest) {
  const clientIp = getClientIp(request);
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Verifica se o IP está bloqueado
  const blockCheck = isIpBlocked(clientIp);
  
  if (blockCheck.blocked) {
    logBlockedAccess(clientIp, blockCheck.reason || 'Desconhecido', path, userAgent);
    
    // Retorna 403 Forbidden
    return new NextResponse('Acesso negado', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
  
  // Permite o acesso
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
