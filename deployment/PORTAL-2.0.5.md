# Portal 2.0.5 — acesso pelo domínio do Guia

Publicada e verificada em 10/09/2026 às 20h48, America/Sao_Paulo.

O painel do anunciante permanece em `https://guiacomararaquara.com.br/anunciante/`; o backoffice usa `/backoffice/` no mesmo domínio. O endereço técnico anterior e as entradas por subdomínios encaminham a autenticação ao domínio principal, preservando caminho, parâmetros e fragmento. Sair, voltar ao guia e abrir a administração também usam o domínio público.

No domínio principal, o frontend usa `/api/` no mesmo domínio, através do proxy existente. Os cookies ficam restritos ao domínio principal. Foi acrescentada somente a origem exata `https://guiacomararaquara.com.br` a `DJANGO_CSRF_TRUSTED_ORIGINS` no ambiente da API. Antes, o login anônimo aceitava a conta, mas o logout autenticado retornava 403 por origem não autorizada. A proteção CSRF permanece ativa e rejeita origens não autorizadas.

## Verificação

- TypeScript e build passaram. Os 30 casos de navegador com API simulada passaram, somando a execução geral e a reexecução do caso que tinha porta fixa. Após corrigir também os links de saída, os três casos de autenticação/domínio/sessão foram reexecutados e passaram.
- Em produção, a conta `sol.automotivo` entrou pelo endereço técnico anterior e chegou ao domínio principal; login e painel responderam 200. Confirmadas as seis abas e acesso apenas ao anunciante 9, empresa 8, sem privilégio administrativo (403).
- Sessão persistiu após recarregar. Após remover cookies somente do contexto de teste, o painel voltou ao login e aceitou nova entrada.
- Logout respondeu 200, voltou ao guia no domínio público e o painel exigiu login novamente. Tentativa de logout com origem não autorizada foi recusada com 403.
- Cookie de sessão Secure e HttpOnly restrito a `guiacomararaquara.com.br`. Não foram alterados dados empresariais ou financeiros nos testes. As sessões de teste finais foram encerradas. Nenhuma senha foi registrada no repositório.
- Monitor externo de HTTPS, API e ausência de página técnica de depuração passou. Os certificados e o Nginx não foram modificados.

Evidência: `records/2026-09-10/domain-2.0.5-browser.json`; captura local em `output/backoffice-v2/domain-2.0.5/production-sol-overview.png`.

## Publicação e backups

Pacote estático `output/backoffice-v2/domain-2.0.5/gca-domain-2.0.5.zip`, SHA256 `52f7d6f8888c22034ffac01b2f24a573738642b71e996b1b4e511be35f231056`. Build isolado da versão 2.0.4 com somente os ajustes de domínio e versão; funcionalidades do backlog em desenvolvimento não foram publicadas. Bundle `index-Dery-zi2.js`, CSS `index-Dcovr0F6.css`. Instalados três arquivos estáticos em cada aplicação, sem migração ou alteração do código backend. O aviso de tamanho do bundle permanece.

- Ambiente CSRF: backup `/home/gca-backend/deploy-backups/gca-domain-csrf-64rye_t3`, alteração às 20h45 e recarga apenas do mestre uWSGI 332558.
- Site: backup `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/gca-public-2.0.5-o1czswxn`; registro `/home/guia_comercial_araraquara/gca-domain-2.0.5-9nlzrd75/result.json`.
- Interface da API: backup `/srv/gca-backend.2d4f02a0.configr.cloud/www/gca-public-2.0.5-gefndn0h`; registro `/home/gca-backend/gca-domain-2.0.5-qh3fi5k5/result.json`.

Para reverter a interface, restaurar o `index.html` de cada backup; assets anteriores foram preservados. Não restaurar o arquivo de ambiente inteiro se houver alterações posteriores: remover apenas a origem adicionada, quando necessário, e recarregar a API.
