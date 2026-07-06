import { Business, Category, Coupon, Event, UsefulNumber, Review } from "./types";

export const CATEGORIES: Category[] = [
  {
    slug: "gastronomia",
    name: "Alimentação & Gastronomia",
    icon: "Utensils",
    color: "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100",
    description: "Restaurantes, pizzarias, lanchonetes, cafés e docerias."
  },
  {
    slug: "lojas",
    name: "Lojas & Varejo",
    icon: "ShoppingBag",
    color: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
    description: "Roupas, calçados, eletrônicos, presentes e variedades."
  },
  {
    slug: "servicos",
    name: "Serviços Profissionais",
    icon: "Briefcase",
    color: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100",
    description: "Mecânicas, encanadores, eletricistas, chaveiros e outros."
  },
  {
    slug: "saude",
    name: "Saúde & Bem-Estar",
    icon: "HeartPulse",
    color: "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100",
    description: "Clínicas, consultórios, farmácias, estéticas e academias."
  },
  {
    slug: "automotivo",
    name: "Automotivo",
    icon: "Car",
    color: "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100",
    description: "Oficinas, lava-rápidos, concessionárias e autopeças."
  },
  {
    slug: "educacao",
    name: "Educação & Cursos",
    icon: "GraduationCap",
    color: "bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100",
    description: "Escolas, cursos de idiomas, reforço e informática."
  },
  {
    slug: "beleza",
    name: "Beleza & Barbearia",
    icon: "Sparkles",
    color: "bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100",
    description: "Salões de beleza, barbearias, manicures e maquiadoras."
  },
  {
    slug: "construcao",
    name: "Construção & Reformas",
    icon: "Hammer",
    color: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100",
    description: "Depósitos de materiais, marcenarias e prestadores."
  }
];

export const INITIAL_BUSINESSES: Business[] = [
  {
    id: "1",
    name: "Caffè di Sol",
    description: "O melhor café artesanal de Araraquara, grãos selecionados e pão de queijo quentinho assado na hora. Venha conhecer nosso espaço charmoso na Fonte Luminosa.",
    category: "gastronomia",
    address: "Av. Bento de Abreu, 1420",
    neighborhood: "Fonte Luminosa",
    phone: "(16) 99742-1234",
    whatsapp: "5516997421234",
    instagram: "caffedisol_aqa",
    rating: 4.9,
    reviewsCount: 148,
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=600",
    isFeatured: true,
    hours: "Seg - Sáb: 07:30 às 19:30",
    tags: ["Café", "Bolo", "Espresso", "Artesanal", "Ar condicionado"]
  },
  {
    id: "2",
    name: "Bella Pizza Araraquara",
    description: "Pizzas assadas no forno a lenha com ingredientes premium e massa de longa fermentação. Tradição e sabor incomparável na Morada do Sol há mais de 10 anos.",
    category: "gastronomia",
    address: "Rua Voluntários da Pátria (Rua 5), 2354",
    neighborhood: "Centro",
    phone: "(16) 3332-9876",
    whatsapp: "551633329876",
    instagram: "bellapizza_aqa",
    rating: 4.8,
    reviewsCount: 320,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600",
    isFeatured: true,
    hours: "Ter - Dom: 18:00 às 23:30",
    tags: ["Pizza", "Forno a Lenha", "Delivery", "Jantar"]
  },
  {
    id: "3",
    name: "Oficina Mecânica Centro-Oeste",
    description: "Manutenção multimarcas especializada. Diagnóstico computadorizado, suspensão, freios, injeção eletrônica e troca de óleo com rapidez e garantia de qualidade.",
    category: "automotivo",
    address: "Av. Francisco Vaz Filho, 890",
    neighborhood: "Vila Xavier",
    phone: "(16) 3337-4521",
    whatsapp: "551633374521",
    instagram: "mecanicacentrooeste",
    rating: 4.7,
    reviewsCount: 89,
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600",
    isFeatured: false,
    hours: "Seg - Sex: 08:00 às 18:00",
    tags: ["Mecânica", "Freios", "Alinhamento", "Injeção", "Troca de Óleo"]
  },
  {
    id: "4",
    name: "Clínica Sorriso & Saúde",
    description: "Tratamentos odontológicos modernos para toda a família. Aparelhos ortodônticos, implantes, clareamento a laser e reabilitação estética com profissionais qualificados.",
    category: "saude",
    address: "Av. Espanha, 455",
    neighborhood: "Centro",
    phone: "(16) 99612-4455",
    whatsapp: "5516996124455",
    instagram: "sorrisosaude_odonto",
    rating: 4.9,
    reviewsCount: 112,
    image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600",
    isFeatured: true,
    hours: "Seg - Sex: 08:00 às 19:00",
    tags: ["Dentista", "Ortodontia", "Clareamento", "Implante", "Estética"]
  },
  {
    id: "5",
    name: "Barbearia Dom Pedro",
    description: "Corte de cabelo e barba com toalha quente e navalha, acompanhado de uma boa cerveja gelada. Ambiente climatizado e estilo clássico para o homem moderno.",
    category: "beleza",
    address: "Av. Padre Francisco Salles Culturato (Av. 36), 1102",
    neighborhood: "Jardim Universal",
    phone: "(16) 99811-5500",
    whatsapp: "5516998115500",
    instagram: "barbeariadompedroaqa",
    rating: 4.8,
    reviewsCount: 195,
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600",
    isFeatured: false,
    hours: "Ter - Sáb: 09:00 às 20:00",
    tags: ["Cabelo", "Barba", "Barbearia", "Cerveja", "Navalha"]
  },
  {
    id: "6",
    name: "Espaço Fit & Pilates",
    description: "Studio completo de Pilates com atendimento personalizado para reabilitação, fortalecimento e flexibilidade. Turmas reduzidas de no máximo 3 alunos por horário.",
    category: "saude",
    address: "Rua Padre Duarte (Rua 4), 1850",
    neighborhood: "Centro",
    phone: "(16) 99723-9988",
    whatsapp: "5516997239988",
    instagram: "fitpilates_aqa",
    rating: 5.0,
    reviewsCount: 74,
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600",
    isFeatured: false,
    hours: "Seg - Sex: 06:00 às 21:00",
    tags: ["Pilates", "Fisioterapia", "Fitness", "Saúde", "Bem-estar"]
  },
  {
    id: "7",
    name: "Hype Store Moda Jovem",
    description: "As últimas tendências da moda jovem masculina e feminina. Marcas exclusivas, streetwear e acessórios modernos para expressar seu estilo único.",
    category: "lojas",
    address: "Rua São Bento (Rua 3), 1210 (Próximo à Prefeitura)",
    neighborhood: "Centro",
    phone: "(16) 3324-5566",
    whatsapp: "551633245566",
    instagram: "hypestore_aqa",
    rating: 4.6,
    reviewsCount: 132,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600",
    isFeatured: true,
    hours: "Seg - Sex: 09:00 às 18:00 | Sáb: 09:00 às 14:00",
    tags: ["Moda", "Roupas", "Streetwear", "Acessórios", "Estilo"]
  },
  {
    id: "8",
    name: "Pet Imperial Lanchonete & Petshop",
    description: "O lugar ideal para cuidar do seu pet com banho & tosa especializado, rações premium, brinquedos e medicamentos. Enquanto isso, aproveite nossa cafeteria no local!",
    category: "servicos",
    address: "Av. Maurício Galli, 2045",
    neighborhood: "Jardim Imperador",
    phone: "(16) 3397-2288",
    whatsapp: "551633972288",
    instagram: "petimperial_aqa",
    rating: 4.8,
    reviewsCount: 104,
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=600",
    isFeatured: false,
    hours: "Seg - Sáb: 08:00 às 18:30",
    tags: ["Pet Shop", "Banho e Tosa", "Ração", "Acessórios", "Veterinário"]
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "r1",
    businessId: "1",
    author: "Mariana Silva",
    rating: 5,
    comment: "Café maravilhoso e atendimento super acolhedor! O pão de queijo multigrãos com requeijão de corte é divino. Sempre que posso venho trabalhar daqui.",
    date: "2026-06-20"
  },
  {
    id: "r2",
    businessId: "1",
    author: "Rodrigo Almeida",
    rating: 5,
    comment: "Local extremamente aconchegante na Bento de Abreu. O espresso tônica deles é o melhor da cidade. Recomendo muito o bolo de cenoura com calda quente.",
    date: "2026-06-18"
  },
  {
    id: "r3",
    businessId: "2",
    author: "Ana Carolina Santos",
    rating: 5,
    comment: "Pizza sensacional, massa leve e recheio nobre. A pizza de calabresa com cebola caramelizada no forno a lenha é de outro mundo! Entrega rápida.",
    date: "2026-06-22"
  },
  {
    id: "r4",
    businessId: "2",
    author: "Felipe Mendes",
    rating: 4,
    comment: "Excelente sabor, a borda recheada de catupiry é muito boa. Só achei um pouco concorrido no sábado à noite, o delivery demorou uns 15 minutos além do previsto, mas valeu a pena.",
    date: "2026-06-15"
  },
  {
    id: "r5",
    businessId: "4",
    author: "Juliana Ferreira",
    rating: 5,
    comment: "Doutora extremamente atenciosa e equipe nota 10. Fiz um tratamento de canal sem dor nenhuma. Consultório moderno, limpo e pontual.",
    date: "2026-06-11"
  }
];

export const COUPONS: Coupon[] = [
  {
    id: "c1",
    businessId: "1",
    businessName: "Caffè di Sol",
    discountCode: "CAFE15",
    description: "15% de desconto em qualquer café e acompanhamento (consumo no local).",
    expiryDate: "2026-08-31"
  },
  {
    id: "c2",
    businessId: "2",
    businessName: "Bella Pizza Araraquara",
    discountCode: "BELLATERCA",
    description: "20% de desconto nas pizzas grandes de Terça e Quarta-feira (retirada ou delivery).",
    expiryDate: "2026-07-30"
  },
  {
    id: "c3",
    businessId: "7",
    businessName: "Hype Store Moda Jovem",
    discountCode: "ESTILOHYPE",
    description: "R$ 30,00 de desconto em compras acima de R$ 150,00.",
    expiryDate: "2026-08-15"
  },
  {
    id: "c4",
    businessId: "4",
    businessName: "Clínica Sorriso & Saúde",
    discountCode: "SORRISONOVO",
    description: "Avaliação inicial grátis + 10% de desconto em clareamento dental.",
    expiryDate: "2026-09-30"
  }
];

export const EVENTS: Event[] = [
  {
    id: "e1",
    title: "Feira do Sol & Artesanato",
    date: "Todo Domingo, das 16:00 às 22:00",
    location: "Praça do Sesc, Araraquara",
    description: "Tradicional feira com dezenas de expositores de artesanato local, música ao vivo, brinquedos para crianças e uma praça de alimentação variada repleta de pastel, acarajé e doces.",
    image: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "e2",
    title: "Festival Gastronômico da Morada do Sol",
    date: "10 a 13 de Julho de 2026",
    location: "Parque do Pinheirinho, Araraquara",
    description: "O maior evento gastronômico da região! Pratos exclusivos por preços promocionais, chefs convidados, workshops gratuitos de culinária e shows de MPB e Rock Nacional todas as noites.",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: "e3",
    title: "Sesc Jazz & Blues",
    date: "25 de Julho de 2026, às 20:00",
    location: "Teatro do Sesc Araraquara",
    description: "Uma noite mágica com grandes instrumentistas nacionais de Jazz e Blues se apresentando no anfiteatro do Sesc. Garanta seu ingresso antecipadamente no portal do Sesc.",
    image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=600"
  }
];

export const USEFUL_NUMBERS: UsefulNumber[] = [
  { name: "SAMU (Urgência Médica)", phone: "192", description: "Serviço de Atendimento Móvel de Urgência.", category: "emergencia" },
  { name: "Corpo de Bombeiros", phone: "193", description: "Combate a incêndios, resgates e acidentes.", category: "emergencia" },
  { name: "Polícia Militar", phone: "190", description: "Segurança pública e policiamento preventivo.", category: "emergencia" },
  { name: "DAAE (Água e Esgoto)", phone: "0800-602-2324", description: "Vazamentos, falta de água e serviços de saneamento de Araraquara.", category: "servicos" },
  { name: "Prefeitura de Araraquara", phone: "3301-5000", description: "Atendimento ao cidadão, secretarias e protocolos.", category: "servicos" },
  { name: "Guarda Civil Municipal", phone: "153", description: "Patrulhamento patrimonial e apoio comunitário.", category: "emergencia" },
  { name: "Terminal Rodoviário de Araraquara", phone: "3322-1200", description: "Informações sobre horários de ônibus e passagens.", category: "servicos" },
  { name: "Upa Central (24h)", phone: "3334-7000", description: "Unidade de Pronto Atendimento médico.", category: "emergencia" }
];

export const NEIGHBORHOODS = [
  "Centro",
  "Fonte Luminosa",
  "Vila Xavier",
  "Jardim Iguatemi",
  "Selmi Dei",
  "Yolanda Ópice",
  "Jardim Universal",
  "Jardim Imperador",
  "Jardim Martinez",
  "Melhado"
];
