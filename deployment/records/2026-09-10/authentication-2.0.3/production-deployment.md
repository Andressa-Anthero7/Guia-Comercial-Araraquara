# Correção de sessão 2.0.3

Publicada e verificada em **10/09/2026 às 09:23, America/Sao_Paulo** (12:23 UTC), após relato de falha ao abrir a área do anunciante pelo domínio público.

## Causa e correção

Reprodução anterior: no endereço `https://guiacomararaquara.com.br/anunciante/`, a autenticação retornava HTTP 200, mas a chamada do painel retornava HTTP 401 e o navegador não armazenava cookies. O frontend faz consultas públicas à API de outro domínio com `credentials: omit`; esse mesmo caminho era utilizado incorretamente nas áreas restritas. No endereço da API, login e painel já respondiam HTTP 200 com cookies no mesmo domínio.

Os caminhos de anunciante e backoffice agora são encaminhados para o servidor de autenticação antes das consultas de sessão. Quando o carregamento ou atualização do painel recebe erro de autenticação, o anunciante volta ao formulário de login com aviso, podendo entrar novamente.

Não foram alterados senha, vínculo, permissões, cookies ou configurações de produção. Os formulários de dados empresariais e financeiros não foram gravados durante a conferência.

## Validação

- TypeScript e build passaram. Bundle `index-DF71In71.js`, 1.231,69 kB; gzip 266,91 kB. Permanece o aviso anterior sobre tamanho do JavaScript.
- 29 testes com API simulada passaram, incluindo encaminhamento antes da autenticação e recuperação da sessão.
- Os 3 testes com Django real passaram: os 2 testes públicos passaram na execução geral; o teste novo de autenticação passou na execução específica após ajustar a espera pela resposta HTTP do login, que excedera a espera visual de 5 segundos na primeira execução.
- Em produção, login da conta da Sol iniciado pelo domínio público: encaminhamento correto, autenticação e painel HTTP 200, seis abas disponíveis e sessão mantida após recarregar.
- Cookies foram removidos somente do contexto isolado de verificação: o painel voltou ao login, exibiu o aviso e aceitou novo login com as mesmas credenciais.
- A conta continua limitada ao anunciante ID 9 e estabelecimento ID 8. Consulta administrativa recusada com HTTP 403; nenhum erro de JavaScript observado.
- Landing pages de M Espetinhos e Alcântara Barbearia e encaminhamento do backoffice público conferidos.

## Instalação e preservação

- Pacote: `gca-backoffice-2.0.3.zip`, SHA256 `a9d3ed9240440e8405d67e692101643215ce2927c4ac75ccb3055639a2aaa59f`.
- API 415078: 31 arquivos conferidos; público 415008: 8 arquivos conferidos.
- Código do backend e migrações do pacote comparados com produção e confirmados iguais antes da instalação.
- Check do Django aprovado; nenhuma migração a aplicar. Somente o mestre uWSGI da API, PID 262201, foi recarregado.
- Checksums dos registros das 20 tabelas de aplicação permaneceram iguais. Integridade do banco aprovada; configurações de produção preservadas.

Backups:

- Banco: `/home/gca-backend/deploy-backups/backoffice-2.0.3-a9d3ed92/before.sqlite3`.
- API: `/srv/gca-backend.2d4f02a0.configr.cloud/gca-api-2.0.3-b6x74h3p`.
- Público: `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/gca-public-2.0.3-go5ae6lz`.
- Pacote e registros operacionais: `~/releases/backoffice-2.0.3-a9d3ed92/` em cada conta.

Evidências sem senha: `authentication-verification.json`; scripts e captura local em `output/backoffice-v2/release-2.0.3/`. Uma reversão utiliza os arquivos salvos pelo instalador, sem alteração de banco.
