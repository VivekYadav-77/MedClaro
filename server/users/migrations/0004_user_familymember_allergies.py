from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_lifestylelog"),
    ]

    operations = [
        migrations.AddField(
            model_name="familymember",
            name="allergies",
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name="user",
            name="allergies",
            field=models.JSONField(default=list),
        ),
    ]
