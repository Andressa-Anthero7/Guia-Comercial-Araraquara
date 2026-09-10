# Backoffice 2.0 — Guia Comercial Araraquara

O gerenciador reúne visão geral, estabelecimentos, anunciantes, categorias, tags,
anúncios e mídias, cupons, eventos, telefones úteis, avaliações, planos,
assinaturas, cobranças e acessos. As listas oferecem pesquisa, filtros,
paginação, exportação e edição. Cobranças e assinaturas são canceladas, e contas
de usuário são desativadas, para preservar seus vínculos.

## Liberar uma empresa como paga

1. Abra **Estabelecimentos** e clique em **Editar** na empresa.
2. Em **Plano e página da empresa**, selecione **Pago**.
3. Preencha apenas o prefixo em **Subdomínio**, por exemplo `m-espetinhos`.
4. Mantenha a situação **Ativo / publicado** e clique em **Salvar cadastro**.
5. Reabra o cadastro e use **Abrir página**.

Editar outro campo preserva plano, subdomínio, serviços, marketing e galeria.
Ao trocar para gratuito, a tela informa quais benefícios serão desativados e
exige a remoção das imagens que ultrapassam o limite. O pagamento de uma cobrança
registra o recebimento; a liberação da modalidade da empresa é uma ação separada.

O botão **Resumo** reúne os dados, os anúncios vinculados, a situação de
publicação e os links para compartilhamento.

## Contas e responsabilidades

Integrantes da equipe (`is_staff`) gerenciam cadastros, conteúdo e financeiro.
Somente superadministradores criam/alteram contas e vinculam o acesso a um
anunciante. A senha é validada, armazenada como hash e nunca retornada pela API.
Contas de superadministrador ficam protegidas neste gerenciador.

## Publicação

Esta versão foi publicada em 09/09/2026 nas duas aplicações abaixo. O M Espetinhos
já está pago e sua página foi conferida sem login, com HTTPS válido. Os caminhos
dos backups e os resultados estão no [registro da publicação](records/2026-09-09/production-deployment.md).

Para publicar novamente, os destinos são:

- **API 415078**: conteúdo da pasta `api/` do pacote na pasta que contém
  `manage.py`. Inclui o backoffice compilado e cinco arquivos de `core/`.
- **Guia público 415008**: conteúdo da pasta `public/` na pasta do `index.html`
  servido pelo site. Essa parte atualiza as categorias dinâmicas e o tratamento
  de listas vazias no guia público.

O pacote não contém banco de dados, `.env`, senhas, certificados nem configuração
do Nginx. Não há alterações de modelos ou migrações nesta versão. A atualização
não instala certificados nem altera outras aplicações do host.

Antes de aplicar, identifique no painel ou no terminal **da API** a pasta da
aplicação e seu interpretador Python. A pasta do site público é outra.
Envie o ZIP para o servidor por SFTP/gerenciador de arquivos e extraia-o em uma
pasta temporária. Confira o SHA256 com o arquivo `.sha256` fornecido.

Para localizar automaticamente a pasta do backend, execute no terminal da API,
dentro da pasta extraída: `python3 install.py --discover`. Esse comando apenas
mostra as aplicações do Guia encontradas e possíveis interpretadores Python.

O instalador exige caminhos explícitos, verifica o manifesto, confere a identidade
da API e cria um backup dos arquivos substituídos. Primeiro confira os destinos:

```bash
python3 install.py --target api --root /CAMINHO/DA/API --python /CAMINHO/DO/PYTHON --check-only
python3 install.py --target public --root /CAMINHO/DO/SITE --check-only
```

Depois execute os mesmos comandos sem `--check-only`. Para a API, o instalador
executa `manage.py check` com o Python informado e restaura os arquivos em caso
de falha. Ele não reinicia serviços. Reinicie **somente a aplicação 415078** no
painel, usando o ambiente habitual dessa aplicação.

Confirme que o rodapé do gerenciador mostra **2.0.0**, que os módulos abrem e que
o guia continua funcionando. Confira também a página já liberada:
`https://m-espetinhos.guiacomararaquara.com.br`. Os testes locais usam dados
isolados da produção.

Se houver falha após reiniciar, restaure os arquivos a partir do diretório de
backup informado pelo instalador e reinicie novamente apenas a API. Os nomes dos
arquivos e sua existência anterior constam em `backup-manifest.json`; preserve os
demais arquivos da hospedagem.

## Reproduzir a validação

```bash
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test
cd ../frontend
npm ci
npm run lint
npm run test:e2e -- --workers=1
npm run build
cd ..
python deployment/build_backoffice_release.py
```

Também foi executado um fluxo de navegador com Django e banco SQLite isolado:
liberação de página, criação de acesso, anunciante, plano, assinatura, pagamento,
cupom, evento, telefone útil, anúncio principal, avaliação e categoria pública.
Os dados dessa verificação são exclusivamente locais.
