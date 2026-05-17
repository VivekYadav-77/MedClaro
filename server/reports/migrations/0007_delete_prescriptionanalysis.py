from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("reports", "0006_prescriptionanalysis"),
    ]

    operations = [
        migrations.DeleteModel(
            name="PrescriptionAnalysis",
        ),
    ]
