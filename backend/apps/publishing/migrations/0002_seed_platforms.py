from django.db import migrations

def seed_platforms(apps, schema_editor):
    PublishPlatform = apps.get_model('publishing', 'PublishPlatform')
    
    platforms = [
        {"name": "Blog Article", "icon": "BookOpen", "color": "#10b981", "api_capability": False, "scheduling_capability": True},
        {"name": "YouTube Video", "icon": "Youtube", "color": "#ef4444", "api_capability": False, "scheduling_capability": True},
        {"name": "Instagram Post", "icon": "Instagram", "color": "#ec4899", "api_capability": False, "scheduling_capability": True},
        {"name": "Instagram Reel", "icon": "PlaySquare", "color": "#db2777", "api_capability": False, "scheduling_capability": True},
        {"name": "Facebook Post", "icon": "Facebook", "color": "#1877f2", "api_capability": False, "scheduling_capability": True},
        {"name": "LinkedIn Post", "icon": "Linkedin", "color": "#0a66c2", "api_capability": False, "scheduling_capability": True},
        {"name": "X (Twitter) Post", "icon": "Twitter", "color": "#1da1f2", "api_capability": False, "scheduling_capability": True},
        {"name": "Pinterest Pin", "icon": "Bookmark", "color": "#bd081c", "api_capability": False, "scheduling_capability": True},
        {"name": "Newsletter", "icon": "Mail", "color": "#f59e0b", "api_capability": False, "scheduling_capability": True},
        {"name": "Podcast Episode", "icon": "Mic", "color": "#8b5cf6", "api_capability": False, "scheduling_capability": True},
        {"name": "Generic Content", "icon": "FileText", "color": "#6b7280", "api_capability": False, "scheduling_capability": True},
    ]

    for plat in platforms:
        PublishPlatform.objects.get_or_create(
            name=plat["name"],
            defaults={
                "icon": plat["icon"],
                "color": plat["color"],
                "enabled": True,
                "api_capability": plat["api_capability"],
                "scheduling_capability": plat["scheduling_capability"]
            }
        )

def remove_platforms(apps, schema_editor):
    PublishPlatform = apps.get_model('publishing', 'PublishPlatform')
    PublishPlatform.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('publishing', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_platforms, reverse_code=remove_platforms),
    ]
