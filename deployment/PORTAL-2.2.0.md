# Portal 2.2.0 — páginas de gestão do anunciante

Publicada e verificada em 10/09/2026 às 22h29, America/Sao_Paulo.

Cada seção agora possui uma URL própria. Links diretos, recarregamento e os botões voltar/avançar do navegador preservam a seção. Após entrar ou renovar uma sessão expirada, o anunciante retorna à página solicitada. Alterações não salvas exigem confirmação antes de sair; durante o salvamento, os controles impedem envios duplicados.

| Seção | Caminho no domínio guiacomararaquara.com.br |
| --- | --- |
| Visão geral | `/area-do-anunciante` |
| Estabelecimentos | `/area-do-anunciante/estabelecimentos` |
| Anúncios | `/area-do-anunciante/anuncios` |
| Cupons | `/area-do-anunciante/cupons` |
| Financeiro | `/area-do-anunciante/financeiro` |
| Cadastro | `/area-do-anunciante/cadastro` |

Login: `https://guiacomararaquara.com.br/anunciante/login`.

- Estabelecimentos: busca, situação, contatos e endereço completos, edição organizada por assunto e acesso à página pública.
- Anúncios: busca, filtro de publicação, edição e prévia do conteúdo.
- Cupons: busca, situação, criação e edição, validade e prévia da oferta. A criação respeita a elegibilidade já exigida pela API.
- Financeiro: indicadores, filtros de situação e competência, detalhes da fatura e valores discriminados. Pagamentos continuam em espera, conforme orientação do usuário.
- Cadastro: dados da empresa, responsável, contatos e cobrança agrupados, com ações de salvar e cancelar acessíveis.
- Mantida a visão geral administrativa compacta, sem banner promocional.

## Validação

- TypeScript e build aprovados; permanece o aviso de tamanho do bundle.
- 48 testes de navegador aprovados, incluindo seis URLs diretas, retorno do login, histórico, proteção de rascunhos, filtros, edição de cupom, detalhes financeiros e formulários em 1440, 390 e 320 px.
- Teste de integração do anunciante aprovado com Django e banco temporário: salvamento de estabelecimento e cadastro conferido por leitura da API, sessão, expiração, nova entrada, isolamento administrativo e saída. O cenário foi ajustado para aguardar o DOM e preencher a descrição obrigatória ausente no cadastro legado de teste.
- Prévia e produção verificadas com a conta da SOL: seis páginas com HTTP 200 e recarregamento, login, sessão expirada, nova entrada, saída, histórico e preservação de rascunhos. Página pública da empresa aberta pelo domínio. Desktop 1366 × 768 e celular 390/320 px sem transbordamento. Nenhuma alteração em dados empresariais ou financeiros na conferência de produção.
- Acesso administrativo e origem não autorizada recusados com 403; cookies de sessão seguros e restritos ao domínio.

Evidências: `records/2026-09-10/portal-2.2.0-browser.json` e `portal-2.2.0-deployment.json`. Capturas locais: `output/backoffice-v2/portal-2.2.0/`.

## Publicação e reversão

Pacote SHA256 `0b3bc14a425220b521b5be3662ef7d35f7052cb8a05eef31fd6e99938a0c7ee4`, gerado a partir de um snapshot isolado de `e341c33`. Três arquivos estáticos atualizados com hashes conferidos, assets antes do índice e backups prévios. API, banco, ambiente, Nginx e certificados preservados.

- Backup do site: `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/gca-public-2.2.0-ac3biwgw`.
- Backup da interface da API: `/srv/gca-backend.2d4f02a0.configr.cloud/www/gca-public-2.2.0-d0tqf1uz`.

Para reverter, revisar alterações posteriores e restaurar o índice do respectivo backup. Assets anteriores permanecem disponíveis. Trabalho do backlog, PostgreSQL e persistência do certificado na Cloudez permanecem separados desta entrega.
