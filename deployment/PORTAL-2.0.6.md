# Portal 2.0.6 — login e área do anunciante em rotas distintas

Publicada e verificada em 10/09/2026 às 21h11, America/Sao_Paulo.

O login usa `https://guiacomararaquara.com.br/anunciante/login`. Após autenticar, a URL muda para `https://guiacomararaquara.com.br/area-do-anunciante`. Sair, perder a sessão ou acessar a área sem sessão retorna ao login. Quem já está autenticado e abre o login ou o endereço antigo vai para a área. Os aliases `/anunciante`, `/anunciante/` e variantes com barra final continuam funcionando; parâmetros e fragmentos são preservados.

A troca entre login e área usa o histórico do navegador sem refazer a autenticação a cada mudança de URL. A sessão é consultada ao entrar na seção ou recarregar a página; respostas de consultas antigas são descartadas ao sair da seção. O backoffice mantém seu fluxo. O backend ganhou uma entrada para servir a interface em `/area-do-anunciante` no host técnico, permitindo seu encaminhamento ao domínio público.

## Verificação

- TypeScript, build e verificações Django passaram.
- 32 testes de navegador com API simulada passaram, incluindo acesso direto sem sessão, sessão existente, compatibilidade dos links antigos, login, saída e expiração da sessão.
- O teste de autenticação com Django e banco temporário passou, incluindo a nova URL após login/recarregamento e a sessão encerrada após sair. A configuração desse servidor de testes passou a autorizar a origem exata do frontend local para testar operações autenticadas com CSRF.
- Em produção, login e painel da conta Sol responderam 200; seis abas exibidas, sessão mantida após recarregar, retorno ao login após perda de cookies e nova entrada bem-sucedida. Logout respondeu 200 e o acesso anônimo direto à área retornou à URL do login. Testes encerraram suas sessões sem alterar dados empresariais ou financeiros.
- Permissões preservadas: anunciante 9, empresa 8; acesso administrativo recusado com 403 e origem não autorizada recusada com 403. Cookies de sessão continuam Secure e HttpOnly no domínio do Guia.
- A entrada `/area-do-anunciante` no host técnico respondeu 200 e terminou em `/anunciante/login` no domínio público para visitante anônimo. Monitor de HTTPS, API e ausência de página técnica de depuração passou.

Evidências em `records/2026-09-10/flow-2.0.6-browser.json` e `flow-2.0.6-legacy-area.json`. Capturas locais em `output/backoffice-v2/flow-2.0.6/`.

## Pacote e operação

Build isolado da versão 2.0.5 com o novo fluxo; funcionalidades do backlog em desenvolvimento não foram publicadas. Pacote `output/backoffice-v2/flow-2.0.6/gca-flow-2.0.6.zip`, SHA256 `e78501e0f00bbb8b7208d9ebfc022284beb9381cc9d820fe5e7307a8427b19a2`. Contém os três arquivos estáticos e o script separado `enable-area-route.py` para a entrada da API. Bundle `index-TPtLvniM.js`, CSS `index-Dcovr0F6.css`. O aviso conhecido de tamanho do bundle permanece.

- Rota da API: backup `/home/gca-backend/deploy-backups/gca-area-route-2.0.6-zg9ywbdv/urls.py`. SHA256 anterior `1c9a16631e74ff86af98d356c60f57a06dd7b4282c4fa2847efeffc366bbffa6`; posterior `664c300451f3cb0044f6446cafb53fea0cecfc6617801a8137bfe3bd5beb3f4e`. Verificações antes/depois passaram; recarregado apenas o mestre uWSGI 332558.
- Site: backup `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/gca-public-2.0.6-ps13dar7`; registro `/home/guia_comercial_araraquara/gca-flow-2.0.6-49pghvrj/result.json`.
- Interface da API: backup `/srv/gca-backend.2d4f02a0.configr.cloud/www/gca-public-2.0.6-s9rq9ld1`; registro `/home/gca-backend/gca-flow-2.0.6-2qa7ywqj/result.json`.

Não houve migração, mudança nas credenciais, nos cookies, no ambiente, no Nginx ou nos certificados nesta entrega. Para reverter a interface, restaurar os respectivos `index.html`; assets antigos foram preservados. A rota adicional é compatível com a versão anterior; se necessário removê-la, revisar mudanças posteriores antes de restaurar `urls.py` e recarregar somente a API.
