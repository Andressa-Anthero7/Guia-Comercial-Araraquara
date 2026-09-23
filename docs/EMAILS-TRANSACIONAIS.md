# E-mails transacionais do Guia

> **23/09 — SMTP validado:** configuração Cloudez instalada com autenticação e STARTTLS na porta 587 de `ip-45-79-2-160.cloudezapp.io`, com certificado verificado. As 16 mensagens de teste foram aceitas pelo SMTP e o responsável confirmou recebimento na caixa de entrada. Captura e envio automático continuam desativados, sem worker agendado; fila de produção vazia. Consulte [evidência SMTP](records/2026-09-23-release/smtp.json). As descrições de implantação abaixo preservam a preparação inicial.

Remetente escolhido: **nao-responda@guiacomararaquara.com.br**.

Implementação preparada em 23/09/2026. Não houve envio real, configuração de uma caixa postal, ativação do SMTP ou publicação deste módulo no servidor nesta rodada. A confirmação de DNS/SSL do site, remetente e serviço SMTP precede a ativação. O endereço escolhido precisa ser autorizado pelo provedor de envio; colocá-lo na configuração não cria uma caixa postal.

## Mensagens implementadas

| Evento | Comportamento |
| --- | --- |
| Recuperação de senha | Link HTTPS, token Django de uso único, validade configurada de uma hora; envio imediato com resposta de indisponibilidade se SMTP falhar. HTML e texto simples. |
| Boas-vindas | Ao vincular/salvar anunciante ativo com usuário ativo e e-mail; uma mensagem por vínculo. Orienta usar recuperação de senha, sem transmitir senha ou conceder acesso automaticamente. |
| Senha alterada | Aviso de segurança quando a senha de usuário comum muda, inclusive por recuperação e administração. |
| E-mail da conta alterado | Avisos ao endereço anterior e ao novo, sem incluir senha. Não equivale à verificação de propriedade do novo e-mail. |
| Cadastro de estabelecimento recebido | Confirma recebimento em situação pendente, sem prometer publicação. |
| Cadastro aprovado/suspenso/desativado | Informa transição de estado. Aprovação não ignora datas/regras de publicação de anúncios. |
| Fatura criada, paga, vencida ou cancelada | Destino financeiro do anunciante, com fallback ao e-mail de contato; link para área autenticada, sem boleto inventado nem débito automático. |
| Lembretes financeiros | Três dias antes, no vencimento e três dias depois; uma mensagem por fatura/data/etapa. Faturas pagas/canceladas não recebem lembrete pendente. |

Os eventos usam `save()` do Django, incluindo telas e admin existentes. Atualizações diretas por SQL ou `QuerySet.update()` não disparam sinais. Não há envio retroativo de boas-vindas por migração. Alterações de relacionamento não salvas pelo fluxo habitual devem ser verificadas antes de ativação. Campanhas promocionais, confirmação de e-mail por token, rastreamento de abertura e webhooks de bounce não fazem parte desta implementação.

## Configuração

Modelo sem segredos em `backend/.env.example`. A aplicação não carrega esse arquivo automaticamente: a hospedagem precisa injetar as variáveis no processo da API e no agendador.

- `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`: dados do provedor.
- `EMAIL_PORT=587`, `EMAIL_USE_TLS=true`, `EMAIL_USE_SSL=false` para STARTTLS; ou porta 465, SSL true e TLS false, conforme provedor. Nunca ativar os dois modos juntos.
- `DEFAULT_FROM_EMAIL=Guia Comercial Araraquara <nao-responda@guiacomararaquara.com.br>`.
- `GCA_AUTH_ORIGIN=https://guiacomararaquara.com.br`: origem absoluta confiável, sem caminho.
- `GCA_EMAIL_EVENTS_ENABLED=false`: desliga a captura dos novos eventos automáticos. Ativar somente após aplicar a migração 0018.
- `GCA_EMAIL_DELIVERY_ENABLED=false`: impede o worker de enviar a fila. Recuperação solicitada pelo próprio usuário continua dependendo diretamente do SMTP, como antes.

Na implantação, preservar configurações específicas da hospedagem; adicionar essas opções ao settings efetivo, sem substituir o arquivo remoto inteiro. O empacotador inclui templates e worker, mas não inclui settings nem credenciais. Não utilizar um pacote com a mesma versão de uma release já publicada: preparar nova versão e ensaiar migrações primeiro.

Confirmar remetente e registros SPF/DKIM/DMARC com o provedor. Não adicionar um segundo registro SPF concorrente nem presumir que um certificado HTTPS configura autenticação de e-mail.

## Operação

Na pasta `backend`, com o ambiente da API carregado:

```bash
python manage.py migrate
python run_email.py
```

Sem argumentos, o worker apenas lista quantidades por status. Depois de habilitar captura e envio e testar SMTP:

```bash
python run_email.py --send --limit 100
python run_email.py --queue-reminders
```

Agendar o primeiro a cada minuto e lembretes uma vez ao dia no fuso de São Paulo. O agendamento de produção não foi instalado. Evitar horário próximo à virada do dia para lembretes que dizem “hoje”. Não testar com os endereços de clientes: usar conta de teste controlada e confirmar explicitamente o destinatário antes de enviar.

Histórico consultável pelo Django admin em **E-mails transacionais**, sujeito às permissões administrativas. O painel React não recebeu uma tela própria nesta etapa. Os registros são somente leitura, com exclusão restrita ao superusuário; não existe ação de envio em massa no admin.

Fila persistente, captura na mesma transação do evento, deduplicação de boas-vindas/lembretes e reserva da mensagem antes do envio. Uma edição sem mudança de status não repete o aviso. Estado de faturas/publicação é reavaliado antes do envio para descartar avisos obsoletos. SMTP indisponível mantém a fila; até cinco tentativas, com espera progressiva. Avisos expiram após sete dias; lembretes após até doze horas. Erros armazenam apenas o nome da exceção, sem detalhes SMTP ou credenciais.

**“Aceito pelo servidor de e-mail” não significa entregue na caixa de entrada.** Timeout após aceite SMTP pode resultar em duplicação numa nova tentativa; o Message-ID é estável, mas não garante deduplicação no provedor. Se o processo morrer durante o envio, a mensagem permanece `sending`: conferir logs do provedor antes de reprocessar manualmente, para não duplicar. Não há recuperação automática de estados ambíguos. Definir acompanhamento das falhas e retenção dos registros antes de produção.

## Validação e aceite pendente

Testes isolados cobrem HTML/texto, escape de conteúdo, recuperação/reutilização de token, boas-vindas sem repetição, avisos de segurança, rollback, configuração desativada, reenvio/limite de tentativas, expiração, reserva de mensagens, transições de publicação e cancelamento de lembretes após pagamento.

SMTP configurado e entrega real confirmada em 23/09. `deployment/test_smtp_communications.py` exercitou os eventos reais em banco temporário: boas-vindas, recuperação, alteração de senha, alteração de e-mail para os dois endereços (ambos redirecionados à caixa autorizada), quatro estados do estabelecimento, quatro estados de fatura e três lembretes. Todos os assuntos receberam `[TESTE GCA]`; nenhum cliente real foi alterado ou recebeu mensagens. O token de recuperação foi aceito uma vez e rejeitado na reutilização no banco temporário; o link dessa conta fictícia não funciona no portal público. Boas-vindas e lembretes não duplicaram ao repetir o evento.

A configuração da senha é feita por `deployment/configure_smtp.py`, com entrada oculta, transmissão por SSH e armazenamento privado no servidor, fora do repositório. O hostname SMTP personalizado apresentou certificado incompatível; o hostname do servidor informado pela Cloudez passou na validação TLS. Ainda faltam validação do fluxo completo de recuperação pelo navegador em uma conta controlada de produção, ativação dos eventos/worker e agendamento. Não houve ativação automática para clientes durante estes testes.
