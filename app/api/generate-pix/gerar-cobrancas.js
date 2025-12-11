const fs = require('fs');

// Função para gerar um número aleatório de 3 dígitos
function gerarNumero3Digitos() {
  return Math.floor(100 + Math.random() * 900);
}

// Função para parsear endereço
function parseAddress(addressLine) {
  // Extrair CEP
  const cepMatch = addressLine.match(/CEP:\s*(\d{5}-?\d{3})/);
  const cep = cepMatch ? cepMatch[1].replace(/-/g, '') : '00000000';
  
  // Extrair cidade e estado
  const cityStateMatch = addressLine.match(/([A-Za-zÀ-ÿ\s]+)\/([A-Z]{2})\s*-?\s*-?\s*CEP/);
  const cidade = cityStateMatch ? cityStateMatch[1].trim() : 'Cidade';
  const estado = cityStateMatch ? cityStateMatch[2].trim() : 'SP';
  
  // Extrair bairro
  const bairroMatch = addressLine.match(/-\s*([A-Za-zÀ-ÿ\s]+),\s*[A-Za-zÀ-ÿ\s\/]+\s*-?\s*-?\s*CEP/);
  const bairro = bairroMatch ? bairroMatch[1].trim() : 'Bairro';
  
  // Extrair rua e número
  const streetMatch = addressLine.match(/^(.+?),\s*(\d+[A-Z0-9\-\/\s]*)/);
  const rua = streetMatch ? streetMatch[1].trim() : 'Rua';
  
  return { cep, cidade, estado, bairro, rua };
}

// Função para gerar um telefone válido aleatório
function gerarTelefone() {
  // DDDs válidos brasileiros
  const ddds = ['11', '21', '31', '41', '51', '61', '71', '81', '91'];
  const ddd = ddds[Math.floor(Math.random() * ddds.length)];
  
  // Gera os 8 ou 9 dígitos restantes
  const isCelular = Math.random() > 0.5;
  if (isCelular) {
    // Celular: 9 dígitos começando com 9
    const numero = Math.floor(10000000 + Math.random() * 90000000);
    return `${ddd}9${numero}`;
  } else {
    // Telefone fixo: 8 dígitos
    const numero = Math.floor(10000000 + Math.random() * 90000000);
    return `${ddd}${numero}`;
  }
}

// Função para processar o nome e gerar o email
function gerarEmail(nomeCompleto) {
  // Remove espaços extras e divide o nome em partes
  const partes = nomeCompleto.trim().split(' ');
  
  // Pega o primeiro nome
  const primeiroNome = partes[0].toLowerCase();
  
  // Pega o último sobrenome (ou o segundo nome se houver apenas dois)
  const sobrenome = partes.length > 1 ? partes[partes.length - 1].toLowerCase() : partes[0].toLowerCase();
  
  // Remove caracteres especiais dos nomes
  const primeiroNomeLimpo = primeiroNome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  const sobrenomeLimpo = sobrenome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  
  // Gera número aleatório de 3 dígitos
  const numero = gerarNumero3Digitos();
  
  // Retorna o email no formato solicitado
  return `${primeiroNomeLimpo}.${sobrenomeLimpo}_${numero}@hotmail.com`;
}

// Lê o arquivo registros-formatados.txt
fs.readFile('registros-formatados.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Erro ao ler o arquivo registros-formatados.txt:', err);
    return;
  }
  
  // Lê o arquivo de endereços
  fs.readFile('addresses.txt', 'utf8', (err, addressesData) => {
    if (err) {
      console.error('Erro ao ler o arquivo addresses.txt:', err);
      return;
    }
    
    const addresses = addressesData.split('\n').filter(line => line.trim() !== '');
    
    // Divide o conteúdo em linhas
    const linhas = data.split('\n');
    
    // Array para armazenar os registros formatados
    const registros = [];
    
    // Processa cada linha
    linhas.forEach(linha => {
      if (linha.trim() !== '') {
        // Remove caracteres especiais da linha inteira
        linha = linha.replace(/\r/g, '').trim();
        
        // Extrai o CPF, email e nome
        const partes = linha.split(':');
        if (partes.length >= 3) {
          const cpf = partes[0].trim().replace(/\r/g, '').replace(/\n/g, '');
          const emailExistente = partes[1].trim().replace(/\r/g, '').replace(/\n/g, '');
          const nomeCompleto = partes[2].trim().replace(/\r/g, '').replace(/\n/g, '');
          const telefone = gerarTelefone();
          
          // Selecionar endereço aleatório
          const randomAddressLine = addresses[Math.floor(Math.random() * addresses.length)];
          const { cep, cidade, estado, bairro, rua } = parseAddress(randomAddressLine);
          const endereco = `${cep}|${bairro}|${rua}|${cidade}|${estado}`;
          registros.push(`${cpf}:${emailExistente}:${nomeCompleto}:${telefone}:${endereco}`);
        }
      }
    });
    
    // Escreve os registros em um novo arquivo
    fs.writeFile('cobrancas-qr-code.txt', registros.join('\n'), 'utf8', (err) => {
      if (err) {
        console.error('Erro ao escrever o arquivo de cobranças:', err);
        return;
      }
      console.log('Cobranças formatadas com sucesso!');
      console.log('Total de cobranças geradas:', registros.length);
    });
  });
});
