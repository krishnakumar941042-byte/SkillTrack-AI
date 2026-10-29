
from django.urls import include, path
from . import views

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("learning/", views.learning_page, name="learning_page"),
    path("practice/", views.practice_page, name="practice_page"),
    path("planner/", views.planner_page, name="planner_page"),
    path("achievements/", views.achievements_page, name="achievements_page"),
    path("analytics/", views.analytics_page, name="analytics_page"),
    path("analytics/", include("analytics.urls")),
]
