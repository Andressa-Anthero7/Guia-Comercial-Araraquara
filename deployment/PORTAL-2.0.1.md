# Portal e Backoffice 2.0.1

Esta versão corrige o WhatsApp do cadastro, salva a capa enviada, entrega a galeria pública por URLs e exibe falhas de carregamento com nova tentativa. Telefone comercial e WhatsApp passam a ser campos separados. Os contatos antigos continuam sendo lidos pelo campo anterior quando não há telefone comercial preenchido.

**Publicada em produção em 10/09/2026 às 08:27**, nas aplicações 415078 e 415008. Consulte o [registro da publicação e dos backups](records/2026-09-10/production-deployment.md).

## Preparação e validação

No backend, execute `python manage.py check`, `python manage.py makemigrations --check --dry-run` e `python manage.py test`. No frontend, execute `npm run lint`, `npm run test:e2e -- --workers=1`, `npm run test:integration` e `npm run build`. O comando de integração inicia Django nas portas 8001/3001, com banco temporário, e valida cadastro, aprovação e página pública reais. Pode-se escolher o Python com `GCA_TEST_PYTHON`.

Execute `python deployment/build_backoffice_release.py` na raiz para gerar `output/backoffice-v2/gca-backoffice-2.0.1.zip` e seu SHA256. O pacote contém código, migrações e frontend compilado. Não contém banco, configurações de produção, credenciais ou certificados.

## Instalação

Destinos: API **415078** e site público **415008**, nas mesmas pastas da publicação anterior. Faça backup consistente do banco antes da instalação e programe uma janela para a API: o código passa a depender da coluna nova. O instalador mantém também um backup dos arquivos substituídos.

Após extrair o pacote em pasta temporária no servidor, confira os destinos:

```sh
python3 install.py --target api --root /CAMINHO/DA/API --python /CAMINHO/DO/PYTHON --check-only
python3 install.py --target public --root /CAMINHO/DO/SITE --check-only
```

Instale primeiro a API executando o respectivo comando sem `--check-only`. O instalador executa `manage.py check` e `manage.py migrate core --noinput`. Reinicie somente a aplicação 415078 e verifique sua saúde antes de aplicar a parte pública. Instale então o site público com seu comando sem `--check-only`.

A migração nova é `core.0014_business_phone`: adiciona `Business.phone` e altera o rótulo do campo antigo para WhatsApp. Não apaga nem reescreve números existentes. Não tente recuperar automaticamente WhatsApps que já haviam sido substituídos por telefone antes desta correção; esses cadastros precisam de conferência com o anunciante.

O instalador não reinicia serviços nem altera SSL ou Nginx. Se falhar, restaura os arquivos, mas não reverte o banco. A coluna adicionada é compatível com o código 2.0.0; numa volta à versão anterior, mantenha essa coluna e restaure apenas os arquivos. Confira o estado das migrações antes de repetir a instalação.

## Conferência após publicar

Confirme a versão 2.0.1 no backoffice. Cadastre uma empresa de verificação com telefone e WhatsApp distintos e uma foto; confira que fica pendente e que a imagem é preservada no gerenciador. Após aprovação, confira o contato e a foto públicos. Numa empresa paga, confira a galeria e a página por subdomínio. Uma falha em eventos deve exibir aviso e manter as empresas disponíveis; uma falha na consulta das empresas não deve mostrar dados de demonstração.

Esta entrega não altera as regras de agendamento de anúncios, marketing, resumo financeiro ou renovação de HTTPS, que permanecem na revisão de pendências.
