# Portal 2.1.1 — painel administrativo compacto

Publicada e verificada em 10/09/2026 às 21h50, America/Sao_Paulo.

O banner de apresentação ocupava quase 300 px no desktop antes dos indicadores. Foi removido, junto com a ilustração e os textos promocionais do painel. A visão geral começa pelos indicadores; a ação Gerenciar estabelecimentos fica no cabeçalho, junto de Atualizar. Espaçamentos, cartões e prévia da empresa ficaram mais compactos. Os atalhos usam nomes de tarefas: Editar estabelecimento, Gerenciar anúncios e Criar cupom.

O login permanece em `https://guiacomararaquara.com.br/anunciante/login`; o painel autenticado usa `/area-do-anunciante`.

## Verificação

- TypeScript e build aprovados. Mantido o aviso conhecido sobre tamanho do bundle.
- Dois testes existentes de navegador passaram: seis seções em desktop/celular e proteção de rascunhos, erro e salvamento do cadastro.
- Prévia e produção verificadas com a conta da SOL. Em 1366 × 768, os indicadores, Gerenciar estabelecimentos, o link da página pública e Criar cupom estão visíveis sem rolar a página. O botão de gestão abre os estabelecimentos.
- Seis abas verificadas também em 390 e 320 px sem transbordamento da página; login, recarregamento, expiração, nova entrada e logout aprovados. Página pública da SOL aberta pelo domínio. Acesso administrativo e origem não autorizada recusados com 403. Nenhuma alteração nos dados da empresa ou financeiros durante a conferência real.

Evidências em `records/2026-09-10/portal-2.1.1-browser.json` e `portal-2.1.1-deployment.json`; capturas locais em `output/backoffice-v2/portal-2.1.1/`.

## Publicação

Pacote `output/backoffice-v2/portal-2.1.1/gca-portal-2.1.1.zip`, SHA256 `c2e2b866b547af62242060696a3db1202738b30fc5bde8001a2da46e5e0820f0`. Build isolado do commit `c197dec`; trabalho do backlog preservado. Somente três arquivos estáticos atualizados, com hashes conferidos, assets antes do índice e backups prévios. Banco, API, ambiente, Nginx e certificados não foram alterados.

- Site: `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/gca-public-2.1.1-z6ilelfj`.
- Interface servida pela API: `/srv/gca-backend.2d4f02a0.configr.cloud/www/gca-public-2.1.1-zv11fa31`.

Para reverter, revisar alterações posteriores e restaurar o `index.html` do respectivo backup. Os assets anteriores permanecem disponíveis.
