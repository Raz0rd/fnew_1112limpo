const fs = require('fs');

// Lê o arquivo de emails gerados
fs.readFile('emails-gerados.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Erro ao ler o arquivo:', err);
    return;
  }
  
  // Divide o conteúdo em linhas
  const linhas = data.split('\n');
  
  console.log(`Total de linhas: ${linhas.length}`);
  
  // Verifica o formato de algumas linhas
  for (let i = 0; i < Math.min(5, linhas.length); i++) {
    const partes = linhas[i].split(':');
    console.log(`Linha ${i + 1}: ${partes.length} partes`);
    console.log(`  CPF: ${partes[0]}`);
    console.log(`  Email: ${partes[1]}`);
    console.log(`  Nome: ${partes[2]}`);
    console.log('---');
  }
  
  // Verifica se todas as linhas têm 3 partes
  let linhasInvalidas = 0;
  linhas.forEach((linha, index) => {
    if (linha.trim() !== '') {
      const partes = linha.split(':');
      if (partes.length !== 3) {
        console.log(`Linha ${index + 1} inválida: ${linha}`);
        linhasInvalidas++;
      }
    }
  });
  
  console.log(`Linhas inválidas: ${linhasInvalidas}`);
});
