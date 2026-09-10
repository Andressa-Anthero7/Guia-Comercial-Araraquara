# Portal e Backoffice 2.0.3

**Publicada em 10/09/2026 às 09:23**, com login verificado a partir do domínio público. Consulte o [registro da publicação](records/2026-09-10/authentication-2.0.3/production-deployment.md).

Corrige o acesso às áreas restritas a partir do domínio público. Antes, em `https://guiacomararaquara.com.br/anunciante/`, o login aceitava as credenciais, mas as requisições seguintes não enviavam cookies ao outro domínio da API. O painel retornava HTTP 401 e ficava preso na mensagem de sessão expirada com o botão de tentar novamente.

Agora os caminhos `/anunciante` e `/backoffice`, quando abertos fora do servidor de autenticação, encaminham para o endereço da API antes de consultar a sessão ou exibir o formulário. Caminho, parâmetros e fragmento são preservados. Desenvolvimento local e o próprio servidor de autenticação continuam usando o acesso no mesmo domínio.

Se a sessão do anunciante expirar durante o carregamento ou atualização do painel, a tela volta ao login com uma mensagem explicativa. Falhas comuns de servidor continuam permitindo tentar novamente. O usuário não precisa trocar de senha nem receber permissões administrativas.

## Validação e instalação

Executar `npm run lint`, `npm run test:e2e -- --workers=1`, `npm run test:integration` e `npm run build`. Os testes verificam o redirecionamento antes das requisições de autenticação, novo login após sessão expirada e sessão real com Django e banco temporário, incluindo recusa do acesso administrativo ao anunciante.

Gerar o pacote com `python deployment/build_backoffice_release.py`. Aplicar nas aplicações API 415078 e site público 415008, com backup e `--check-only` antes da instalação. Não há migração nova; o pacote completo deve informar que não há migrações a aplicar numa instalação 2.0.2. Recarregar somente a aplicação da API.

Conferir o login iniciando pelo domínio público, a permanência da sessão após recarregar a página e o retorno ao login após expiração. A versão não altera cookies, CORS, CSRF, configurações de produção ou permissões das contas. Para reverter, restaurar os arquivos dos backups; não há alteração nova de banco.
