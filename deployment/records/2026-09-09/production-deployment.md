# Backoffice 2.0.0 production deployment

Verified on 2026-09-09 at 21:44 America/Sao_Paulo (2026-09-10 00:44 UTC).

- API application: 415078, account `gca-backend`.
- Public application: 415008, account `guia_comercial_araraquara`.
- Host: `ip-45-79-2-160.cloudezapp.io`.
- Release SHA-256: `951f49cc30c0e2758aeb4053e709400bacff1802e8367c1603b9be699c460fd9`.
- Backoffice: https://webapp415078.ip-45-79-2-160.cloudezapp.io/backoffice/
- Company activated: https://m-espetinhos.guiacomararaquara.com.br/

The release installed 13 API files and 8 public files. Production settings, environment files, databases, certificate files and Nginx configuration were excluded from the package. No model migration was needed. Only the API application's verified uWSGI master received a reload signal.

## Backups on the host

- Database: `/home/gca-backend/deploy-backups/backoffice-2.0.0-951f49cc/before.sqlite3`.
- Target business snapshot: `/home/gca-backend/deploy-backups/backoffice-2.0.0-951f49cc/m-espetinhos-before.json`.
- API files: `/srv/gca-backend.2d4f02a0.configr.cloud/gca-api-2.0.0-vhgx9k1k`.
- Public files: `/srv/guia_comercial_araraquara.2d4f02a0.configr.cloud/gca-public-2.0.0-yt8exxpp`.

## Verification

All 13 administrative resources returned HTTP 200 with authorized server-side admin authentication. Protected endpoints denied anonymous requests. Both deployed entry points serve the new bundle, `index-DlCjHDwY.js`.

Business id 2, M Espetinhos, was activated through the administrative PATCH endpoint with `plan_type=paid` and `public_subdomain=m-espetinhos`. An atomic transaction guarded its expected prior state. Comparison of all 20 application tables with the backup found changes only to that business's plan, subdomain and publication/update timestamps. All other application records were preserved.

Anonymous browser checks opened the dedicated M Espetinhos and Alcântara Barbearia company pages successfully, including HTTP-to-HTTPS redirection. The public directory still contains 7 businesses. No browser page errors or failed API responses occurred. The wildcard certificate remains valid with its previous serial and expiry. Evidence is in `production-verification.json`; screenshots and the original release package remain local under `output/backoffice-v2/`.

## Retomar o trabalho

The production deployment is complete. The next session can begin with user review of the backoffice routines. Paid businesses are managed under **Estabelecimentos → Editar → Plano e página da empresa**. The two application accounts authenticate with their corresponding local SSH identities under `~/.ssh`; private keys are not stored in this repository.

The wildcard certificate was issued manually and expires on 2026-12-08 at 21:53:08 UTC. Renewal automation remains a separate future task. No SSL or Nginx changes were made during the backoffice deployment.
