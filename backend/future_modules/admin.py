from django.contrib import admin

from .models import (
    ChildGrowthMeasurement,
    ChildGrowthProfile,
    FutureModuleRoadmap,
    HealthEducationContent,
    InsurancePolicy,
    PartnerIntegrationBoundary,
    SecondOpinionRequest,
    VaccinationRecord,
    WearableIntegrationPlan,
    WomensHealthRecord,
)


admin.site.register(FutureModuleRoadmap)
admin.site.register(VaccinationRecord)
admin.site.register(WomensHealthRecord)
admin.site.register(ChildGrowthProfile)
admin.site.register(ChildGrowthMeasurement)
admin.site.register(InsurancePolicy)
admin.site.register(SecondOpinionRequest)
admin.site.register(HealthEducationContent)
admin.site.register(WearableIntegrationPlan)
admin.site.register(PartnerIntegrationBoundary)
