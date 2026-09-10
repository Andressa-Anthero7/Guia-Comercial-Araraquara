# Landing pages 2.0.2 em produção

Publicação verificada em **10/09/2026 às 08:57, America/Sao_Paulo** (11:57 UTC), seguindo a autorização de publicação do usuário. A reformulação usa a apresentação do modal do portal como referência e compartilha os detalhes da empresa entre as duas telas.

## Alterações

Capa, categoria, logomarca quando cadastrada e painel branco com descrição, especialidades, serviços, galeria, cupons e avaliações. Os contatos incluem telefone comercial clicável, e-mail, site, Instagram e WhatsApp. O endereço inclui os campos cadastrados de complemento, bairro, cidade, estado e CEP, também usados na consulta do mapa.

As landing pages permitem enviar avaliações para moderação e copiar cupons. Erros de envio preservam o formulário; a confirmação da cópia depende do sucesso da operação. Os detalhes opcionais só aparecem quando cadastrados. O modal recebe os mesmos detalhes, com altura limitada à tela e rolagem interna; a landing utiliza a rolagem normal da página.

## Verificação

- TypeScript e compilação passaram. Permanece o aviso conhecido de tamanho do bundle: 1.230,78 kB, 266,53 kB comprimidos.
- 27 testes de navegador com APIs simuladas e 2 com Django e banco temporário passaram.
- A integração real confirmou que a avaliação enviada pela landing permanece pendente no gerenciador e não aparece na consulta pública antes da aprovação.
- As páginas de M Espetinhos e Alcântara Barbearia responderam HTTP 200 com o novo bundle, contatos correspondentes ao cadastro e imagens carregadas. Conferência em desktop e celular de 390 pixels, sem ultrapassar a largura da tela.
- Modal do guia e login do backoffice verificados. A consulta administrativa anônima continua recusada com HTTP 403.
- O mapa incorporado respondeu HTTP 200 no Google e renderizou após o carregamento assíncrono; captura em `production-map-loaded.png` na pasta de evidências local.
- Nenhum erro de JavaScript ou falha das APIs foi observado nas verificações normais do navegador. Não foram enviados formulários de teste em produção.
- Os sete estabelecimentos publicados permanecem disponíveis. Os checksums dos registros das 20 tabelas de aplicação foram comparados antes e depois, com igualdade; o banco passou no teste de integridade.

## Pacote e destinos

- Pacote: `output/backoffice-v2/gca-backoffice-2.0.2.zip`.
- SHA256: `ba483265060c7b07f3ff791068744c4c07ac8aa869a2ae3027cf144fca0a75d4`.
- Bundle: `index-Cuq6OrKG.js` e `index-DxuiNxW8.css`.
- API 415078: `/srv/gca-backend.2d4f02a0.configr.cloud/www`, 31 arquivos verificados.
- Site 415008: `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/www`, 8 arquivos verificados.

Antes da instalação, o código do backend e todas as migrações do pacote foram comparados com os arquivos existentes e confirmados iguais. `manage.py check` passou e `migrate core --noinput` informou que não havia migrações a aplicar. Somente o mestre uWSGI da API, PID 262201, recebeu SIGHUP após conferir sua identidade. Configurações de produção permaneceram com os mesmos checksums.

## Backups

- Banco: `/home/gca-backend/deploy-backups/backoffice-2.0.2-ba483265/before.sqlite3`.
- Arquivos da API: `/srv/gca-backend.2d4f02a0.configr.cloud/gca-api-2.0.2-zk11apqw`.
- Arquivos públicos: `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/gca-public-2.0.2-f7bz_s4m`.
- Pacote e registros no servidor: `~/releases/backoffice-2.0.2-ba483265/`, em cada conta.

Uma eventual reversão usa os manifests dos backups para restaurar os arquivos. Não há alteração nova de banco a reverter. Capturas e scripts operacionais estão em `output/backoffice-v2/release-2.0.2/`.
