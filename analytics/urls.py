
from django.urls import path
from . import views

urlpatterns = [
    path("api/", views.analytics_api, name="analytics_api"),
    path(
        "monthly-report.csv",
        views.monthly_report_csv,
        name="monthly_report_csv",
    ),
]
