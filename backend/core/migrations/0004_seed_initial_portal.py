from django.db import migrations
from django.utils.text import slugify


CATEGORIES = [
    ("gastronomia", "Alimentação & Gastronomia", "Utensils"),
    ("lojas", "Lojas & Varejo", "ShoppingBag"),
    ("servicos", "Serviços Profissionais", "Briefcase"),
    ("saude", "Saúde & Bem-Estar", "HeartPulse"),
    ("automotivo", "Automotivo", "Car"),
    ("educacao", "Educação & Cursos", "GraduationCap"),
    ("beleza", "Beleza & Barbearia", "Sparkles"),
    ("construcao", "Construção & Reformas", "Hammer"),
]

BUSINESSES = [
    {
        "name": "Top Carros Multimarcas",
        "category": "automotivo",
        "description": "Veículos 0 km e seminovos com garantia e procedência. Compra, venda, troca, financiamento e consignação.",
        "street": "Rua Capitão José Sabino Sampaio",
        "number": "253",
        "phone_whatsapp": "(16) 98121-6655",
        "image_url": "/anuncios/top-carros.jpeg",
        "tags": ["Veículos", "Seminovos", "Financiamento"],
    },
    {
        "name": "M Espetinhos",
        "category": "gastronomia",
        "description": "Espetinhos preparados na brasa, com vários sabores. Atendimento no local e pedidos pelo WhatsApp ou iFood.",
        "street": "Rua 7 de Setembro, esquina com Carlos Gomes",
        "number": "S/N",
        "phone_whatsapp": "(16) 98196-6529",
        "image_url": "/anuncios/espetinhos.jpeg",
        "tags": ["Espetinhos", "Churrasco", "iFood"],
    },
    {
        "name": "Alcântara Barbearia",
        "category": "beleza",
        "description": "Corte masculino, barba, secagem e finalização. Agende seu horário e mantenha o corte e a barba sempre em dia.",
        "street": "Av. Duque de Caxias",
        "number": "283",
        "phone_whatsapp": "(16) 99412-1111",
        "image_url": "/anuncios/alcantara-barbearia.jpeg",
        "tags": ["Barbearia", "Cabelo", "Barba"],
    },
]


def seed_portal(apps, schema_editor):
    Category = apps.get_model("core", "Category")
    Business = apps.get_model("core", "Business")
    Tag = apps.get_model("core", "Tag")

    for order, (slug, name, icon) in enumerate(CATEGORIES):
        Category.objects.update_or_create(
            slug=slug,
            defaults={"name": name, "icon": icon, "order": order, "is_active": True},
        )

    for item in BUSINESSES:
        category = Category.objects.get(slug=item["category"])
        tag_names = item["tags"]
        business, _ = Business.objects.update_or_create(
            slug=slugify(item["name"]),
            defaults={
                "name": item["name"],
                "category": category,
                "description": item["description"],
                "street": item["street"],
                "number": item["number"],
                "neighborhood": "Centro",
                "city": "Araraquara",
                "state": "SP",
                "phone_whatsapp": item["phone_whatsapp"],
                "image_url": item["image_url"],
                "opening_hours": "Consulte pelo WhatsApp",
                "is_featured": True,
                "status": "active",
            },
        )
        tags = [
            Tag.objects.get_or_create(
                slug=slugify(name),
                defaults={"name": name},
            )[0]
            for name in tag_names
        ]
        business.tags.set(tags)


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0003_alter_business_email"),
    ]

    operations = [
        migrations.RunPython(seed_portal, migrations.RunPython.noop),
    ]
