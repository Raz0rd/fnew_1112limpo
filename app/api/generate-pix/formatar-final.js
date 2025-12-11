const fs = require('fs');

// Função para gerar um número aleatório de 3 dígitos
function gerarNumero3Digitos() {
  return Math.floor(100 + Math.random() * 900);
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

// Lê o arquivo lista.txt
fs.readFile('lista.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Erro ao ler o arquivo:', err);
    return;
  }
  
  // Divide o conteúdo em linhas
  const linhas = data.split('\n');
  
  // Array para armazenar os emails gerados
  const registros = [];
  
  // Processa cada linha
  linhas.forEach(linha => {
    if (linha.trim() !== '') {
      // Remove caracteres especiais da linha inteira
      linha = linha.replace(/\r/g, '').trim();
      
      // Extrai o CPF e nome
      const partes = linha.split(':');
      if (partes.length >= 2) {
        const cpf = partes[0].trim().replace(/\r/g, '');
        const nomeCompleto = partes[1].trim().replace(/\r/g, '');
        const email = gerarEmail(nomeCompleto);
        registros.push(`${cpf}:${email}:${nomeCompleto}`);
      }
    }
  });
  
  // Escreve os registros em um novo arquivo
  fs.writeFile('registros-formatados.txt', registros.join('\n'), 'utf8', (err) => {
    if (err) {
      console.error('Erro ao escrever o arquivo de registros:', err);
      return;
    }
    console.log('Registros formatados com sucesso!');
    console.log('Total de registros gerados:', registros.length);
  });
});
