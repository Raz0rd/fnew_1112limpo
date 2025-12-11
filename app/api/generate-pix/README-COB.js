const fs = require('fs');

// Lê o arquivo de cobranças gerado
fs.readFile('cobrancas-qr-code.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Erro ao ler o arquivo de cobranças:', err);
    return;
  }
  
  // Divide o conteúdo em linhas
  const linhas = data.split('\n');
  
  console.log('=== EXEMPLO DE COMO VAI FUNCIONAR PRA GERAR A COBRANÇA DO QRCODE ===');
  console.log('');
  console.log('No checkout, quando o usuário inserir apenas o email, o sistema:');
  console.log('1. Selecionará aleatoriamente um CPF e nome da lista');
  console.log('2. Gerará um telefone válido aleatório');
  console.log('3. Usará o endereço fixo fornecido');
  console.log('4. Chamará a API Umbrela com esses dados');
  console.log('');
  console.log('Exemplos de registros gerados:');
  
  // Mostra os primeiros 5 registros como exemplo
  for (let i = 0; i < Math.min(5, linhas.length); i++) {
    if (linhas[i].trim() !== '') {
      console.log(`${i + 1}. ${linhas[i]}`);
    }
  }
  
  console.log('');
  console.log('Formato dos dados:');
  console.log('CPF:EMAIL:NOME:TELEFONE:CEP|BAIRRO|Rua|CIDADE|ESTADO');
  console.log('');
  console.log('=== PROCESSO DE GERAÇÃO DE COBRANÇA ===');
  console.log('');
  console.log('Para cada registro, o sistema fará:');
  console.log('1. Extrair CPF, email e nome do registro');
  console.log('2. Chamar a API Umbrela com esses dados');
  console.log('3. Receber o QR Code e código PIX');
  console.log('4. Salvar os dados da transação no storage');
  console.log('');
  console.log('Exemplo de payload para a API Umbrela:');
  console.log('');
  
  // Exemplo de payload usando o primeiro registro
  if (linhas.length > 0 && linhas[0].trim() !== '') {
    const partes = linhas[0].split(':');
    if (partes.length >= 5) {
      const cpf = partes[0];
      const email = partes[1];
      const nome = partes[2];
      const telefone = partes[3];
      const enderecoParts = partes[4].split('|');
      const [cep, bairro, rua, cidade, estado] = enderecoParts;
      
      const exemploPayload = {
        amount: 1990, // R$ 19,90
        currency: "BRL",
        paymentMethod: "PIX",
        customer: {
          name: nome,
          email: email,
          document: {
            number: cpf,
            type: "CPF"
          },
          phone: "11999999999",
          externalRef: "",
          address: {
            street: "Rua Digital",
            streetNumber: "123",
            complement: "",
            zipCode: "01000000",
            neighborhood: "Centro",
            city: "São Paulo",
            state: "SP",
            country: "br"
          }
        },
        shipping: {
          fee: 0,
          address: {
            street: "Rua Digital",
            streetNumber: "123",
            complement: "",
            zipCode: "01000000",
            neighborhood: "Centro",
            city: "São Paulo",
            state: "SP",
            country: "br"
          }
        },
        items: [{
          title: "IPTV Assinatura Premium 300",
          unitPrice: 1990,
          quantity: 1,
          tangible: false,
          externalRef: ""
        }],
        pix: {
          expiresInDays: 1
        },
        postbackUrl: "https://seudominio.com/api/webhook",
        metadata: JSON.stringify({
          usuario: {
            nome: nome,
            cpf: cpf,
            email: email,
            telefone: telefone
          },
          pedido: {
            valor_centavos: 1990,
            valor_reais: "19.90"
          }
        }),
        traceable: true,
        ip: "0.0.0.0"
      };
      
      // Atualizar o payload com o endereço fornecido
      exemploPayload.customer.phone = telefone;
      exemploPayload.customer.address = {
        street: rua,
        streetNumber: "123", // Número fixo
        complement: "",
        zipCode: cep,
        neighborhood: bairro,
        city: cidade,
        state: estado,
        country: "br"
      };
      
      exemploPayload.shipping.address = {
        street: rua,
        streetNumber: "123", // Número fixo
        complement: "",
        zipCode: cep,
        neighborhood: bairro,
        city: cidade,
        state: estado,
        country: "br"
      };
      
      console.log(JSON.stringify(exemploPayload, null, 2));
    }
  }
});
