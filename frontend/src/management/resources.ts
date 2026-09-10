export type RecordData = Record<string, any>;
export type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  initial?: any;
  options?: [string, string][];
  resource?: string;
  valueKey?: string;
  nullable?: boolean;
  section?: string;
  hint?: string;
  maxLength?: number;
  privileged?: boolean;
};
export type Resource = {
  key: string;
  title: string;
  singular: string;
  group: string;
  description: string;
  fields: Field[];
  columns: string[];
  labelKey: string;
  lookup?: string;
  filter?: string;
  noDelete?: boolean;
  privileged?: boolean;
};
const f = (
  key: string,
  label: string,
  type = "text",
  extra: Partial<Field> = {},
): Field => ({ key, label, type, ...extra });
const choice = (
  key: string,
  label: string,
  options: string[][],
  initial: string,
  extra: Partial<Field> = {},
) =>
  f(key, label, "select", {
    options: options as [string, string][],
    initial,
    ...extra,
  });
const ref = (
  key: string,
  label: string,
  resource: string,
  extra: Partial<Field> = {},
) => f(key, label, "reference", { resource, required: true, ...extra });
const active = () => f("is_active", "Ativo", "checkbox", { initial: true });
const notes = () => f("notes", "Observações internas", "textarea");
const text = (key = "description", label = "Descrição") =>
  f(key, label, "textarea");
const name = (key = "name", label = "Nome") =>
  f(key, label, "text", { required: true });
const date = (key: string, label: string, required = false) =>
  f(key, label, "date", { required, nullable: !required });
const money = (key: string, label: string) =>
  f(key, label, "money", { required: true, initial: "0.00" });
const plan = () =>
  choice(
    "plan_type",
    "Modalidade",
    [
      ["free", "Gratuito"],
      ["paid", "Pago"],
    ],
    "free",
  );
const slug = () =>
  f("slug", "Identificador", "text", {
    hint: "Usado nos links. Ao criar, deixe vazio para gerar pelo nome.",
  });
export const resources: Resource[] = [
  {
    key: "businesses",
    title: "Estabelecimentos",
    singular: "estabelecimento",
    group: "Cadastros",
    labelKey: "name",
    lookup: "slug",
    filter: "status",
    columns: [
      "name",
      "status",
      "plan_type",
      "public_subdomain",
      "neighborhood",
    ],
    description: "Cadastro, publicação, plano e página de cada empresa.",
    fields: [
      { ...name(), section: "Cadastro e publicação" },
      ref("category", "Categoria", "categories", {
        valueKey: "slug",
        required: false,
        nullable: true,
      }),
      choice(
        "status",
        "Situação",
        [
          ["active", "Ativo / publicado"],
          ["pending", "Pendente"],
          ["draft", "Rascunho"],
          ["suspended", "Suspenso"],
          ["inactive", "Inativo"],
        ],
        "pending",
      ),
      text(),
      text("services_products", "Serviços e produtos"),
      f("tags", "Tags", "tags", { initial: [] }),
      { ...plan(), section: "Plano e página da empresa" },
      f("public_subdomain", "Subdomínio", "text", {
        maxLength: 63,
        hint: "Somente o nome antes de .guiacomararaquara.com.br. Exemplo: m-espetinhos.",
      }),
      f("is_featured", "Destaque no guia", "checkbox"),
      f("meta_pixel_id", "Meta Pixel"),
      f("google_analytics_id", "Google Analytics"),
      f("google_ads_id", "Google Ads"),
      { ...name("street", "Rua"), section: "Endereço e contato" },
      name("number", "Número"),
      f("complement", "Complemento"),
      f("neighborhood", "Bairro"),
      f("city", "Cidade", "text", { initial: "Araraquara", required: true }),
      f("state", "UF", "text", { initial: "SP", maxLength: 2, required: true }),
      f("postal_code", "CEP"),
      name("phone_whatsapp", "Telefone / WhatsApp"),
      f("email", "E-mail", "email"),
      f("website", "Site", "url"),
      f("instagram", "Instagram"),
      f("opening_hours", "Horário de funcionamento"),
      f("logo_image", "Logomarca", "image", { section: "Imagens" }),
      f("image_url", "Imagem de capa", "image"),
      f("images", "Galeria", "gallery", {
        initial: [],
        hint: "Gratuito: 1 imagem. Pago: até 5 imagens.",
      }),
    ],
  },
  {
    key: "advertisers",
    title: "Anunciantes",
    singular: "anunciante",
    group: "Cadastros",
    labelKey: "name",
    filter: "status",
    columns: ["name", "contact_name", "email", "status"],
    description: "Responsáveis, empresas vinculadas e dados de cobrança.",
    fields: [
      name(),
      f("document", "CPF / CNPJ"),
      f("contact_name", "Responsável"),
      f("email", "E-mail", "email"),
      f("phone", "Telefone"),
      f("billing_email", "E-mail de cobrança", "email"),
      ref("businesses", "Estabelecimentos vinculados", "businesses", {
        type: "multireference",
        required: false,
        initial: [],
      }),
      ref("user", "Conta de acesso", "users", {
        required: false,
        nullable: true,
        privileged: true,
        hint: "Vincule uma conta sem acesso administrativo. A conta é criada em Acessos.",
      }),
      choice(
        "status",
        "Situação",
        [
          ["active", "Ativo"],
          ["inactive", "Inativo"],
          ["prospect", "Prospect"],
        ],
        "active",
      ),
      notes(),
    ],
  },
  {
    key: "categories",
    title: "Categorias",
    singular: "categoria",
    group: "Cadastros",
    labelKey: "name",
    filter: "is_active",
    columns: ["name", "slug", "order", "is_active"],
    description: "Organize as categorias exibidas no guia e nos cadastros.",
    fields: [
      name(),
      slug(),
      text(),
      choice(
        "icon",
        "Ícone",
        [
          ["Utensils", "Alimentação"],
          ["ShoppingBag", "Compras"],
          ["Briefcase", "Serviços"],
          ["HeartPulse", "Saúde"],
          ["Car", "Automóveis"],
          ["GraduationCap", "Educação"],
          ["Scissors", "Beleza"],
          ["Store", "Loja"],
          ["Building2", "Empresa"],
        ],
        "Store",
      ),
      choice(
        "color",
        "Cor",
        [
          [
            "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100",
            "Âmbar",
          ],
          [
            "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
            "Azul",
          ],
          [
            "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100",
            "Verde",
          ],
          [
            "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100",
            "Rosa",
          ],
        ],
        "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100",
      ),
      f("order", "Ordem", "number", { initial: 0 }),
      active(),
    ],
  },
  {
    key: "tags",
    title: "Tags",
    singular: "tag",
    group: "Cadastros",
    labelKey: "name",
    columns: ["name", "slug"],
    description: "Palavras usadas para encontrar empresas e anúncios.",
    fields: [name(), slug()],
  },
  {
    key: "advertisements",
    title: "Anúncios e mídias",
    singular: "anúncio",
    group: "Conteúdo",
    labelKey: "title",
    filter: "status",
    columns: ["title", "business", "status", "is_primary", "ends_at"],
    description:
      "Campanhas, imagens, vídeos e revisão dos anúncios. Publicar o anúncio principal atualiza o perfil da empresa.",
    fields: [
      ref("business", "Estabelecimento", "businesses"),
      name("title", "Título"),
      f("short_description", "Chamada curta"),
      text(),
      f("call_to_action", "Chamada para ação"),
      f("destination_url", "Link de destino", "url"),
      f("tags", "Tags", "tags", { initial: [] }),
      choice(
        "status",
        "Situação",
        [
          ["draft", "Rascunho"],
          ["review", "Em revisão"],
          ["published", "Publicado"],
          ["paused", "Pausado"],
          ["ended", "Encerrado"],
        ],
        "draft",
      ),
      f("is_primary", "Anúncio principal", "checkbox"),
      f("is_featured", "Destaque", "checkbox"),
      date("starts_at", "Início da publicação"),
      date("ends_at", "Fim da publicação"),
      f("logo_image", "Logomarca", "image"),
      f("cover_image", "Capa", "image"),
      f("video_url", "Link do vídeo", "url"),
      f("media", "Mídias do anúncio", "media", { initial: [] }),
    ],
  },
  {
    key: "coupons",
    title: "Cupons",
    singular: "cupom",
    group: "Conteúdo",
    labelKey: "title",
    filter: "is_active",
    columns: ["title", "business", "discount_code", "expires_at", "is_active"],
    description: "Benefícios e códigos promocionais de empresas pagas.",
    fields: [
      ref("business", "Estabelecimento", "businesses", { valueKey: "slug" }),
      name("title", "Título"),
      name("discount_code", "Código do cupom"),
      { ...text(), required: true },
      date("starts_at", "Válido a partir de"),
      date("expires_at", "Válido até"),
      active(),
    ],
  },
  {
    key: "events",
    title: "Eventos",
    singular: "evento",
    group: "Conteúdo",
    labelKey: "title",
    filter: "is_published",
    columns: ["title", "location", "starts_at", "is_published"],
    description: "Agenda, informações e publicação dos eventos da cidade.",
    fields: [
      name("title", "Título"),
      f("schedule_text", "Data e horário para exibição"),
      f("starts_at", "Início", "datetime-local", { nullable: true }),
      f("ends_at", "Término", "datetime-local", { nullable: true }),
      name("location", "Local"),
      { ...text(), required: true },
      f("image_url", "Link da imagem", "url"),
      f("is_published", "Publicado", "checkbox", { initial: true }),
    ],
  },
  {
    key: "useful-numbers",
    title: "Telefones úteis",
    singular: "telefone útil",
    group: "Conteúdo",
    labelKey: "name",
    filter: "is_active",
    columns: ["name", "phone", "category", "is_active"],
    description: "Contatos de emergência e serviços públicos.",
    fields: [
      name(),
      name("phone", "Telefone"),
      text(),
      choice(
        "category",
        "Tipo",
        [
          ["emergency", "Emergência"],
          ["service", "Serviços"],
        ],
        "service",
      ),
      f("order", "Ordem", "number", { initial: 0 }),
      active(),
    ],
  },
  {
    key: "reviews",
    title: "Avaliações",
    singular: "avaliação",
    group: "Conteúdo",
    labelKey: "author_name",
    filter: "is_approved",
    columns: ["author_name", "business", "rating", "is_approved"],
    description: "Revise os comentários recebidos e controle sua publicação.",
    fields: [
      ref("business", "Estabelecimento", "businesses"),
      name("author_name", "Autor"),
      f("author_email", "E-mail do autor", "email"),
      choice(
        "rating",
        "Nota",
        [
          ["1", "1 estrela"],
          ["2", "2 estrelas"],
          ["3", "3 estrelas"],
          ["4", "4 estrelas"],
          ["5", "5 estrelas"],
        ],
        "5",
      ),
      { ...text("comment", "Comentário"), required: true },
      f("is_approved", "Aprovada para publicação", "checkbox"),
    ],
  },
  {
    key: "plans",
    title: "Planos e benefícios",
    singular: "plano",
    group: "Comercial e financeiro",
    labelKey: "name",
    filter: "is_active",
    columns: ["name", "price", "billing_cycle", "is_active"],
    description:
      "Catálogo comercial. A liberação da página e do plano de cada empresa fica em Estabelecimentos.",
    fields: [
      name(),
      text(),
      money("price", "Preço (R$)"),
      choice(
        "billing_cycle",
        "Periodicidade",
        [
          ["monthly", "Mensal"],
          ["quarterly", "Trimestral"],
          ["semiannual", "Semestral"],
          ["annual", "Anual"],
        ],
        "monthly",
      ),
      { ...plan(), initial: "paid" },
      f("max_ads", "Limite de anúncios", "number", { initial: 1 }),
      f("max_images", "Limite de imagens", "number", { initial: 5 }),
      f("featured", "Inclui destaque", "checkbox"),
      f("includes_coupons", "Inclui cupons", "checkbox", { initial: true }),
      f("includes_marketing", "Inclui marketing", "checkbox", {
        initial: true,
      }),
      f("includes_custom_page", "Inclui página personalizada", "checkbox", {
        initial: true,
      }),
      active(),
    ],
  },
  {
    key: "subscriptions",
    title: "Assinaturas",
    singular: "assinatura",
    group: "Comercial e financeiro",
    labelKey: "business_name",
    filter: "status",
    columns: [
      "business",
      "advertiser",
      "plan",
      "agreed_price",
      "status",
      "next_due_date",
    ],
    description:
      "Contratos, valores acordados, renovação e vencimentos. Cancelar preserva o histórico de cobranças.",
    noDelete: true,
    fields: [
      ref("advertiser", "Anunciante", "advertisers"),
      ref("business", "Estabelecimento", "businesses"),
      ref("advertisement", "Anúncio vinculado", "advertisements", {
        required: false,
        nullable: true,
      }),
      ref("plan", "Plano contratado", "plans"),
      date("start_date", "Início", true),
      date("end_date", "Término"),
      date("next_due_date", "Próximo vencimento", true),
      money("agreed_price", "Valor contratado (R$)"),
      choice(
        "status",
        "Situação",
        [
          ["active", "Ativa"],
          ["pending", "Pendente"],
          ["suspended", "Suspensa"],
          ["cancelled", "Cancelada"],
          ["expired", "Vencida"],
        ],
        "active",
      ),
      f("auto_renew", "Renovação automática", "checkbox", { initial: true }),
      notes(),
    ],
  },
  {
    key: "invoices",
    title: "Cobranças",
    singular: "cobrança",
    group: "Comercial e financeiro",
    labelKey: "description",
    filter: "status",
    columns: ["description", "business_name", "due_date", "total", "status"],
    description:
      "Contas a receber, descontos, pagamentos, cancelamentos e inadimplência.",
    noDelete: true,
    fields: [
      ref("subscription", "Assinatura", "subscriptions"),
      f("description", "Descrição"),
      date("reference_month", "Competência", true),
      date("due_date", "Vencimento", true),
      money("amount", "Valor (R$)"),
      money("discount", "Desconto (R$)"),
      money("late_fee", "Multa e juros (R$)"),
      choice(
        "status",
        "Situação",
        [
          ["open", "Em aberto"],
          ["paid", "Paga"],
          ["overdue", "Vencida"],
          ["cancelled", "Cancelada"],
        ],
        "open",
      ),
      date("paid_at", "Data do pagamento"),
      choice(
        "payment_method",
        "Forma de pagamento",
        [
          ["", "Não informado"],
          ["pix", "PIX"],
          ["boleto", "Boleto"],
          ["card", "Cartão"],
          ["transfer", "Transferência"],
          ["cash", "Dinheiro"],
          ["other", "Outro"],
        ],
        "",
      ),
      f("external_reference", "Referência do pagamento"),
      notes(),
    ],
  },
  {
    key: "users",
    title: "Acessos",
    singular: "acesso",
    group: "Administração",
    labelKey: "username",
    filter: "is_active",
    columns: ["username", "first_name", "email", "is_staff", "is_active"],
    description:
      "Contas de anunciantes e da equipe. Somente superadministradores podem criar e alterar acessos. Desative contas para preservar os vínculos.",
    noDelete: true,
    privileged: true,
    fields: [
      name("username", "Usuário"),
      f("first_name", "Nome"),
      f("last_name", "Sobrenome"),
      f("email", "E-mail", "email"),
      f("password", "Nova senha", "password", {
        hint: "Obrigatória ao criar. Deixe vazia ao editar para manter a senha atual.",
      }),
      active(),
      f("is_staff", "Permitir acesso ao backoffice", "checkbox", {
        hint: "Concede gestão dos cadastros, conteúdo e financeiro.",
      }),
    ],
  },
];
export const resourceByKey = (key: string) =>
  resources.find((resource) => resource.key === key);
