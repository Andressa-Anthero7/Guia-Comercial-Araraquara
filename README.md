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
