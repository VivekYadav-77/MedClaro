from django.urls import path

from .views import (
    ChildGrowthMeasurementListCreateView,
    ChildGrowthProfileListCreateView,
    EcosystemStrategyView,
    HealthEducationLibraryView,
    InsurancePolicyListCreateView,
    IntegrationBoundaryView,
    RoadmapView,
    SecondOpinionRequestListCreateView,
    VaccinationRecordListCreateView,
    WearableIntegrationPlanListCreateView,
    WearableStrategyView,
    WomensHealthRecordListCreateView,
)

urlpatterns = [
    path("strategy/", EcosystemStrategyView.as_view(), name="future-ecosystem-strategy"),
    path("roadmap/", RoadmapView.as_view(), name="future-roadmap"),
    path("vaccinations/", VaccinationRecordListCreateView.as_view(), name="vaccination-records"),
    path("womens-health/", WomensHealthRecordListCreateView.as_view(), name="womens-health-records"),
    path("children/", ChildGrowthProfileListCreateView.as_view(), name="child-growth-profiles"),
    path(
        "children/<int:child_id>/measurements/",
        ChildGrowthMeasurementListCreateView.as_view(),
        name="child-growth-measurements",
    ),
    path("insurance/", InsurancePolicyListCreateView.as_view(), name="insurance-policies"),
    path("second-opinions/", SecondOpinionRequestListCreateView.as_view(), name="second-opinions"),
    path("education-library/", HealthEducationLibraryView.as_view(), name="education-library"),
    path("wearables/", WearableIntegrationPlanListCreateView.as_view(), name="wearable-plans"),
    path("wearables/strategy/", WearableStrategyView.as_view(), name="wearable-strategy"),
    path("integration-boundaries/", IntegrationBoundaryView.as_view(), name="integration-boundaries"),
]
