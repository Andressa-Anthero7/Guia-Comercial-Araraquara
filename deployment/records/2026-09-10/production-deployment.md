# Publicação da versão 2.0.1

Concluída e verificada em **10/09/2026 às 08:27, America/Sao_Paulo** (11:27 UTC), após autorização do usuário para publicar em produção.

- API **415078**, conta `gca-backend`, raiz `/srv/gca-backend.2d4f02a0.configr.cloud/www`.
- Guia público **415008**, conta `guia_comercial_araraquara`, raiz `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/www`.
- Host: `ip-45-79-2-160.cloudezapp.io`.
- Pacote: `gca-backoffice-2.0.1.zip`, SHA256 `913df6e0bc8bf8a0b3e9f6cd2516fa5df52883d0c567caa0afca3ce371fb500f`.
- Bundle publicado nas duas aplicações: `index-CEyB0-4C.js` e `index-6VJxrtuz.css`.
- Python da API: `/srv/gca-backend.2d4f02a0.configr.cloud/.virtualenv/3.12/bin/python`, Django 5.2.16.

## Aplicação e preservação dos dados

O código anterior da API foi comparado com a base do repositório; o histórico de migrações foi conferido antes da substituição. Foram instalados e verificados por checksum **31 arquivos da API e 8 arquivos públicos**. O instalador executou o check do Django e aplicou `core.0014_business_phone`.

A migração adicionou o campo de telefone comercial sem reescrever os números existentes. Uma comparação das colunas anteriores de todas as **20 tabelas `core`**, ordenadas por ID, confirmou a preservação integral dos registros. O banco passou no `PRAGMA integrity_check`; os sete estabelecimentos continuam publicados. O campo novo inicia vazio e a leitura dos contatos antigos mantém o comportamento de compatibilidade.

Foi enviado SIGHUP somente ao mestre uWSGI da API, PID **262201**, após conferir UID, comando e relação entre mestre e worker. A API foi validada antes da publicação do frontend público. Os checksums de `project/*.py`, `manage.py`, `.env` da aplicação e configuração uWSGI permaneceram iguais. O certificado HTTPS manteve o mesmo serial e vencimento; não houve alteração de SSL ou Nginx.

## Backups no servidor

- Banco: `/home/gca-backend/deploy-backups/backoffice-2.0.1-913df6e0/before.sqlite3`.
- Arquivos da API: `/srv/gca-backend.2d4f02a0.configr.cloud/gca-api-2.0.1-rr364c7p`.
- Arquivos públicos: `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/gca-public-2.0.1-ex6dsuzz`.
- Pacote e registros auxiliares: `~/releases/backoffice-2.0.1-913df6e0/` em cada conta.

Para uma eventual volta à versão anterior, os manifests dos backups identificam os arquivos substituídos. A coluna nova é compatível com o código anterior; restaurar arquivos não exige apagar a coluna nem restaurar um banco antigo sobre novos cadastros.

## Verificação funcional

- Guia público, login do backoffice e páginas de M Espetinhos e Alcântara Barbearia responderam normalmente com a versão nova.
- Os links de WhatsApp das duas empresas correspondem aos contatos salvos, com código de país; as imagens renderizaram no navegador.
- Os 13 recursos administrativos responderam HTTP 200 em verificações autenticadas realizadas no servidor. Requisições anônimas aos recursos protegidos foram recusadas.
- Um cadastro com telefone e WhatsApp distintos, capa, aprovação e galeria foi exercitado por `APIClient` no servidor, dentro de uma transação desfeita ao final. Não ficaram registros nem notificações de teste; a comparação das 20 tabelas foi repetida após esse procedimento.
- Falhas foram simuladas apenas em um contexto isolado do navegador: falha em eventos manteve as empresas visíveis, a nova tentativa recuperou a seção e falha nas empresas não exibiu dados de demonstração nem mensagem falsa de catálogo vazio.
- Não foram observados erros de página nem respostas de erro das APIs nas verificações normais do navegador.

Evidências: [navegador](production-verification.json), [verificação funcional no servidor](functional-verification.json) e [validação consolidada](validation.json). Capturas de tela e scripts operacionais permanecem localmente em `output/backoffice-v2/release-2.0.1/`.

## Pendências seguintes

A publicação destas prioridades está concluída. Agendamento de anúncios, integrações de marketing, resumo financeiro, automações comerciais e operação permanecem na revisão. A renovação automática do certificado wildcard continua pendente; o certificado verificado vence em **08/12/2026 às 21:53:08 UTC**.
