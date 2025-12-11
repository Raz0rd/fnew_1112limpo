#!/usr/bin/env node

/**
 * Script para atualizar lista de IPs de bots (Google, Bing)
 * Executa antes do build para gerar arquivo com IPs bloqueados
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GOOGLEBOT_URL = 'https://developers.google.com/search/apis/ipranges/googlebot.json';
const BINGBOT_URL = 'https://www.bing.com/toolbox/bingbot.json';
const OUTPUT_FILE = path.join(__dirname, '..', 'lib', 'bot-ips.ts');

console.log('🤖 [BOT-IPS] Atualizando lista de IPs de bots...\n');

// Função para fazer GET request
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Função para extrair prefixo base de um range IPv6
function extractIPv6Prefix(cidr) {
  // Remove o /64 e pega apenas o prefixo base
  // Ex: "2001:4860:4801:10::/64" -> "2001:4860:4801:10::"
  return cidr.split('/')[0];
}

// Função para extrair prefixo base de um range IPv4
function extractIPv4Prefix(cidr) {
  // Remove a máscara e pega apenas o prefixo base
  // Ex: "157.55.39.0/24" -> "157.55.39."
  const ip = cidr.split('/')[0];
  const parts = ip.split('.');
  // Pega os primeiros 3 octetos para /24
  return parts.slice(0, 3).join('.') + '.';
}

async function main() {
  try {
    // Buscar lista do Google
    console.log('📥 Baixando lista do GoogleBot...');
    const googleData = await fetchJSON(GOOGLEBOT_URL);
    console.log(`✅ GoogleBot: ${googleData.prefixes.length} ranges encontrados`);
    
    // Buscar lista do Bing
    console.log('📥 Baixando lista do BingBot...');
    const bingData = await fetchJSON(BINGBOT_URL);
    console.log(`✅ BingBot: ${bingData.prefixes.length} ranges encontrados\n`);
    
    // Extrair ranges IPv6 do Google (simplificados)
    const googleIPv6Ranges = new Set();
    googleData.prefixes.forEach(prefix => {
      if (prefix.ipv6Prefix) {
        const basePrefix = extractIPv6Prefix(prefix.ipv6Prefix);
        googleIPv6Ranges.add(basePrefix);
      }
    });
    
    // Extrair ranges IPv4 do Bing (simplificados)
    const bingIPv4Ranges = new Set();
    bingData.prefixes.forEach(prefix => {
      if (prefix.ipv4Prefix) {
        const basePrefix = extractIPv4Prefix(prefix.ipv4Prefix);
        bingIPv4Ranges.add(basePrefix);
      }
    });
    
    // Gerar arquivo TypeScript
    const fileContent = `/**
 * Lista de IPs de bots bloqueados
 * Gerado automaticamente por scripts/update-bot-ips.js
 * Última atualização: ${new Date().toISOString()}
 * 
 * GoogleBot: ${googleData.creationTime}
 * BingBot: ${bingData.creationTime}
 */

// Ranges IPv6 do GoogleBot (${googleIPv6Ranges.size} ranges)
export const GOOGLEBOT_IPV6_RANGES = [
${Array.from(googleIPv6Ranges).map(ip => `  '${ip}',`).join('\n')}
];

// Ranges IPv4 do BingBot (${bingIPv4Ranges.size} ranges)
export const BINGBOT_IPV4_RANGES = [
${Array.from(bingIPv4Ranges).map(ip => `  '${ip}',`).join('\n')}
];

// Função para verificar se IP está bloqueado
export function isBlockedBotIP(ip: string): boolean {
  // Verificar GoogleBot (IPv6)
  if (ip.includes(':')) {
    return GOOGLEBOT_IPV6_RANGES.some(range => ip.startsWith(range));
  }
  
  // Verificar BingBot (IPv4)
  return BINGBOT_IPV4_RANGES.some(range => ip.startsWith(range));
}
`;
    
    // Criar diretório lib se não existir
    const libDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(libDir)) {
      fs.mkdirSync(libDir, { recursive: true });
    }
    
    // Escrever arquivo
    fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [BOT-IPS] Lista atualizada com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📁 Arquivo: ${OUTPUT_FILE}`);
    console.log(`🤖 GoogleBot IPv6: ${googleIPv6Ranges.size} ranges`);
    console.log(`🤖 BingBot IPv4: ${bingIPv4Ranges.size} ranges`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ [BOT-IPS] Erro ao atualizar lista:', error.message);
    process.exit(1);
  }
}

main();
