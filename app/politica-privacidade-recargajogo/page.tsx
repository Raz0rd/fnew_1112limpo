"use client"

export default function PoliticaPrivacidadePage() {
  return (
    <>
      <style jsx global>{`
        html {
          text-rendering: optimizeLegibility !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-font-smoothing: antialiased !important;
          margin: 0;
          background-color: #f2f0eb;
        }

        body {
          color: #767676;
          background: #f2f0eb;
          font-family: 'Open Sans', sans-serif;
          font-size: 14px;
          padding: 0px !important;
          margin: 0px !important;
        }

        .content {
          width: 80%;
          padding-left: 10%;
          line-height: 20px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .content .title {
          border-bottom: 2px solid #aa1419;
          margin: 30px 0 10px 0;
        }

        .title h2 {
          margin-bottom: 6px;
          color: #aa1419;
        }

        .privacy-content p {
          font-size: 100%;
          line-height: 30px;
          text-align: justify;
        }

        .privacy-content ul {
          list-style-type: disc;
          margin-left: 40px;
        }

        .privacy-content li {
          margin-bottom: 10px;
          line-height: 24px;
          text-align: justify;
        }

        .privacy-content a {
          text-decoration: none;
          color: #0000ff;
        }
      `}</style>

      <div className="content">
        <div className="title">
          <p style={{ textAlign: 'center' }}><strong>Política de Privacidade da Garena</strong></p>
        </div>

        <div className="privacy-content" dangerouslySetInnerHTML={{ __html: `
          <p style="text-align:justify"><strong>1. INTRODUÇÃO </strong></p>

          <p style="text-align:justify"><br/>
          1.1&nbsp;&nbsp;Bem-vindo aos Serviços da Garena,&nbsp; administrados pela <strong>Garena Online Private Limited </strong>e&nbsp; suas afiliadas e demais empresas do grupo (individual e coletivamente, "Garena", "nós", "nós" ou "nosso"). A Garena assume seriamente suas responsabilidades sob as leis e regulamentos de privacidade aplicáveis ​​("Leis de Privacidade") e está comprometido em respeitar os direitos e preocupações de privacidade de todos os Usuários dos Jogos da Garena ("Jogos"), website e aplicativos de celular ("Site")&nbsp; (nos referimos à Jogos, Site e aos outros serviços referidos em nossos Termos de Serviços coletivamente como os "Serviços"). Usuários se refere ao usuário que registra uma conta conosco ou quem de qualquer forma usa ou acessa os Serviços (individual ou coletivamente "usuários", você ou vocês, e seu ou seus"). Reconhecemos a importância dos dados pessoais que você nos confiou e acreditamos que é nossa responsabilidade gerenciar, proteger e processar adequadamente seus dados pessoais. Esta Política de Privacidade ("Política de Privacidade" ou "Política") foi criada para ajudá-lo a entender como coletamos, usamos, divulgamos, transferimos e / ou processamos os dados pessoais que você nos forneceu e/ou possuímos sobre você, agora ou no futuro, além de ajudá-lo a tomar uma decisão informada antes de nos fornecer seus dados pessoais. Os termos em Caixa Alta empregados nesta Política de Privacidade que não possuírem uma definição específica terão o significado dado aos mesmos nos Termos de Serviço da Garena.<br/>
          1.1.1 Para usuários que sejam da Coreia do Sul ou acessem os Jogos na Coreia do Sul, por favor, acessem a Política de Privacidade aplicável <a href="http://content.garena.com/legal/pp/pp_kr.html"><strong>aqui</strong></a>.</p>

          <p style="text-align:justify"><br/><br/>
          1.2&nbsp;&nbsp;​​Dados Pessoais" ou "dados pessoais" significam dados, verdadeiros ou não, sobre um indivíduo que pode ser identificado a partir desses dados ou daqueles dados e outras informações às quais uma organização tem ou é provável que tenha acesso. Exemplos comuns de dados pessoais podem incluir nome, número de identificação e informação de contato.</p>

          <p style="text-align:justify"><br/>
          1.3&nbsp; Ao usar os Serviços, registrar uma conta conosco, visitar nossa Plataforma ou acessar os Serviços, você reconhece e concorda que aceita as práticas, requisitos e/ou políticas descritas nesta Política de Privacidade e, por meio deste, concorda em que coletemos , usemos, divulguemos e/ou processemos seus dados pessoais, conforme descrito aqui. SE VOCÊ NÃO CONSENTIR COM O PROCESSAMENTO DE SEUS DADOS PESSOAIS, CONFORME DESCRITO NESTA POLÍTICA DE PRIVACIDADE, POR FAVOR, NÃO USE NOSSOS SERVIÇOS NEM ACESSE NOSSA PLATAFORMA. Se alterarmos nossa Política de Privacidade, nos vamos notificar você incluindo publicando essas alterações ou a Política de Privacidade alterada em nosso Site. Reservamo-nos o direito de alterar esta Política de Privacidade a qualquer momento. Até o limite permitido por lei, o fato de você, usuário, continuar a utilizar os Serviços ou Site, incluindo, mas não limitado, a realização de pedidos de compras, constituirá o seu reconhecimento e aceite quanto as modificações realizadas nesta Política de Privacidade.</p>

          <p style="text-align:justify">1.4 Esta Política se aplica em conjunto com as demais notificações, cláusulas contratuais, termos de consentimento aplicáveis relativamente a coleta, armazenamento, utilização, disponibilização e/ou processamento dos seus dados pessoais por nós e não tem o condão de se sobrepor a tais notificações e cláusulas a não ser que expressamente previsto neste sentido.</p>

          <p style="text-align:justify">&nbsp;</p>

          <p style="text-align:justify"><strong>2. QUANDO A GARENA RECOLHERÁ DADOS PESSOAIS?</strong></p>

          <p style="text-align:justify"><br/>
          2.1&nbsp;Nós iremos / poderemos coletar dados pessoais sobre você:</p>

          <ul>
            <li>quando você se registra e/ou usa nossos Serviços ou Plataforma, ou abre uma conta conosco;</li>
            <li>quando você envia qualquer formulário, incluindo, entre outros, formulários de inscrição ou outros formulários relacionados a qualquer um de nossos produtos e serviços, seja online ou por meio de um formulário físico;</li>
            <li>quando você firma qualquer contrato ou fornece outra documentação ou informação a respeito de suas interações conosco ou quando você usa nossos produtos e serviços;</li>
            <li>quando você interage conosco, como em chamadas telefônicas (que podem ser gravadas), cartas, fax, reuniões presenciais, plataformas de mídia social e e-mails, incluindo quando você com nossos agentes de suporte ao usuário;</li>
            <li>quando você usa nossos serviços eletrônicos, ou interage conosco por meio de nosso aplicativo ou usa serviços em nossa Plataforma. Isso inclui, sem limitação, através de cookies que podemos implantar quando você interage com nosso aplicativo ou site;</li>
            <li>quando você concede permissões no seu dispositivo para compartilhar informações com o seu aplicativo de celular ou Site;</li>
            <li>quando você vincula a sua conta Garena a sua rede social (definida abaixo) ou outra conta externa ou utiliza outras funcionalidades de sua rede social, em conformidades com as políticas dos respectivos fornecedores;</li>
            <li>quando você realiza transações através de nossos Games ou Site (quando aplicável) ou com nossos parceiros de pagamentos autorizados;</li>
            <li>quando você nos fornecer feedback ou reclamações;</li>
            <li>quando você se inscreve em um concurso; ou</li>
            <li>quando você envia seus dados pessoais para nós por qualquer motivo.</li>
          </ul>

          <p style="text-align:justify">O acima exposto não pretende ser exaustivo e define alguns exemplos comuns de quando podem ser coletados dados pessoais sobre você.</p>

          <p style="text-align:justify">&nbsp;</p>

          <p style="text-align:justify"><strong>Última modificação: 23 de fevereiro de 2023</strong></p>
        ` }} />
      </div>
    </>
  )
}
