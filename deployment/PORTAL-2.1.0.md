# Portal 2.1.0 — Área do Anunciante

Publicada e verificada em 10/09/2026 às 21h43, America/Sao_Paulo.

A Área do Anunciante recebeu uma interface própria, com navegação lateral no computador, menu horizontal no celular, identificação da conta, atalhos e uma nova tela de login. A visão geral reúne os estabelecimentos, anúncios, cupons válidos, valores em aberto, contratos e uma conferência dos cinco campos essenciais da primeira empresa. Os indicadores usam os dados cadastrados; a conferência de preenchimento não determina publicação.

As seis seções foram organizadas: cadastro, estabelecimentos, anúncios, cupons, financeiro e visão geral. Formulários ganharam agrupamentos, instruções, campos bloqueados durante o envio, proteção contra descarte acidental e preservação de rascunhos em falhas. Anúncios explicam a revisão antes do envio. Status, vencimentos e meios de pagamento aparecem em português; cupons distinguem ofertas ativas, agendadas, expiradas e inativas. Tabelas possuem rolagem independente e estados vazios com orientação.

O acesso continua em `https://guiacomararaquara.com.br/anunciante/login`, seguindo para `/area-do-anunciante` após autenticar. O painel abre a página pública da empresa pelo domínio do Guia. Pagamentos on-line permanecem em espera.

## Verificação

- TypeScript e build da versão isolada passaram. O aviso já conhecido do tamanho do bundle permanece.
- 39 testes de navegador passaram, cobrindo as seções em 1440, 390 e 320 px, gravações simuladas, mensagens, rascunhos, valores financeiros, validade dos cupons e regressões do portal/backoffice.
- Integração com Django e banco temporário: autenticação, persistência, expiração e saída passaram; fluxo de cadastro e publicação com foto foi reexecutado após um timeout de carregamento na execução concorrente.
- Prévia e versão publicada verificadas com a conta `sol.automotivo`, anunciante 9, empresa 8: seis abas, abertura dos dados da empresa, página pública, sessão após recarregar, expiração, nova entrada e saída. Larguras de 390 e 320 px sem transbordamento. Nenhuma alteração em dados empresariais ou financeiros nesses testes.
- Login e painel retornaram 200, acesso administrativo e origem não autorizada foram recusados com 403. Cookies no domínio do Guia preservaram Secure/HttpOnly. Sessões de verificação encerradas.

Evidências: `records/2026-09-10/portal-2.1.0-browser.json` e `portal-2.1.0-deployment.json`. Capturas locais em `output/backoffice-v2/portal-2.1.0/`.

## Operação e reversão

Pacote `output/backoffice-v2/portal-2.1.0/gca-portal-2.1.0.zip`, SHA256 `83de951e3c333dacb883e0803c990ce5d33ba3aa01bbae247ffc0276dfa03c0a`. Gerado a partir do commit publicado `d550da0` com as alterações desta entrega. O trabalho local do backlog foi preservado e não integra este pacote.

Somente os três arquivos estáticos foram aplicados ao site e à interface servida pela API, com hashes conferidos e assets antes do índice. Não houve migração, reinício, mudança no banco, nas credenciais, no Nginx ou no certificado.

- Backup do site: `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/gca-public-2.1.0-zgvclcew`.
- Backup da interface da API: `/srv/gca-backend.2d4f02a0.configr.cloud/www/gca-public-2.1.0-rvutp_w2`.
- Registros remotos: `/home/guia_comercial_araraquara/gca-portal-2.1.0-ayfro3ur/result.json` e `/home/gca-backend/gca-portal-2.1.0-bq04ngek/result.json`.

Para reverter, revisar alterações posteriores e restaurar o `index.html` de cada backup no respectivo destino. Os assets anteriores foram preservados. Pendências de infraestrutura seguem separadas: persistência/renovação do wildcard na Cloudez e criação do PostgreSQL pelo usuário.
