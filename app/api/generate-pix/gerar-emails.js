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
  const primeiroNomeLimpo = primeiroNome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  const sobrenomeLimpo = sobrenome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  
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
  const emails = [];
  
  // Processa cada linha
  linhas.forEach(linha => {
    if (linha.trim() !== '') {
      // Extrai o CPF e nome
      const partes = linha.split(':');
      if (partes.length >= 2) {
        const cpf = partes[0].trim();
        const nomeCompleto = partes[1].trim();
        const email = gerarEmail(nomeCompleto);
        emails.push(`${cpf}:${email}:${nomeCompleto}`);
      }
    }
  });
  
  // Escreve os emails em um novo arquivo
  fs.writeFile('emails-gerados.txt', emails.join('\n'), 'utf8', (err) => {
    if (err) {
      console.error('Erro ao escrever o arquivo de emails:', err);
      return;
    }
    console.log('Emails gerados com sucesso!');
    console.log('Total de emails gerados:', emails.length);
  });
});
