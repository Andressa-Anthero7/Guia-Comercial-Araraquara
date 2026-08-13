# Guia Comercial Araraquara

Projeto separado em dois diretórios principais:

- `frontend/`: aplicação React + Vite.
- `backend/`: API Django REST Framework.

## Frontend

**Pré-requisito:** Node.js.

```bash
cd frontend
npm install
npm run dev
```

O frontend roda em `http://localhost:3000`.

Backoffice do portal:

- `http://localhost:3000/backoffice`
- `http://localhost:3000/backoffice/cadastro`

## Backend

**Pré-requisito:** Python 3.11+.

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

A API roda em `http://127.0.0.1:8000`.

Backoffice:

- `http://127.0.0.1:8000/admin/`

Endpoint inicial:

- `GET /api/health/`

Endpoints REST iniciais:

- `GET /api/categories/`
- `GET /api/businesses/`
- `GET /api/reviews/`
- `GET /api/coupons/`
- `GET /api/events/`
- `GET /api/useful-numbers/`

Endpoint protegido para o backoffice:

- `/api/backoffice/businesses/`

### PostgreSQL

Em producao, configure a conexao pela variavel `DATABASE_URL`:

```text
postgresql://usuario:senha@host:5432/nome_do_banco
```

Sem essa variavel, o projeto usa SQLite apenas para desenvolvimento local.

Variaveis recomendadas para producao:

```text
DJANGO_DATA_UPLOAD_MAX_MEMORY_SIZE=52428800
DJANGO_FILE_UPLOAD_MAX_MEMORY_SIZE=10485760
DJANGO_SECURE_COOKIES=true
```

O limite do proxy da hospedagem deve ser igual ou superior a 50 MB.

### Build do backoffice

O Django publica o frontend compilado a partir de
`backend/backoffice_frontend/`. Antes do deploy:

```bash
cd frontend
npm ci
npm run lint
npm run build
```

Copie o conteudo de `frontend/dist/` para
`backend/backoffice_frontend/` e execute:

```bash
cd backend
python manage.py check
python manage.py test
python manage.py migrate
```

### Páginas de clientes por subdomínio

Empresas do plano pago podem receber uma página própria, por exemplo:

```text
https://pizzaria-do-joao.guiacomararaquara.com.br
```

No backoffice, selecione um plano pago que inclua página personalizada e informe
somente o prefixo (`pizzaria-do-joao`). O sistema impede nomes reservados e
endereços repetidos.

Antes de publicar, configure no provedor do domínio um registro DNS curinga
(`*.guiacomararaquara.com.br`) apontando para a mesma hospedagem do frontend do
guia. Essa hospedagem deve responder qualquer subdomínio com o `index.html` da
aplicação (fallback de SPA) e possuir certificado HTTPS que cubra o wildcard.

No backend de produção, inclua o domínio curinga nas variáveis de ambiente:

```text
DJANGO_ALLOWED_HOSTS=webapp415078.ip-45-79-2-160.cloudezapp.io,.guiacomararaquara.com.br
DJANGO_CORS_ALLOWED_ORIGIN_REGEXES=^https://([a-z0-9-]+\.)?guiacomararaquara\.com\.br$
```

### Teste local de subdomínios

Sem alterar DNS público, abra dois terminais:

```powershell
# terminal 1
cd backend
$env:DJANGO_CORS_ALLOWED_ORIGIN_REGEXES='^http://([a-z0-9-]+\.)?localhost(:3000)?$'
.\gca_venv\Scripts\python.exe manage.py runserver
```

```powershell
# terminal 2
cd frontend
npm run dev
```

No backoffice local, crie uma empresa publicada, de plano pago, com o endereço
`pizzaria-do-joao`. Para testar imediatamente, acesse:

```text
http://localhost:3000/?subdomain=pizzaria-do-joao
```

Para testar também pelo endereço idêntico ao de produção, abra o Bloco de Notas
como administrador e adicione esta linha ao arquivo
`C:\Windows\System32\drivers\etc\hosts`:

```text
127.0.0.1 pizzaria-do-joao.localhost
```

Então abra `http://pizzaria-do-joao.localhost:3000`. Remova essa linha após o
teste. Em produção, o DNS curinga substitui esse mapeamento local.
