
from django.urls import path
from . import views

urlpatterns = [
    path("", views.settings_page, name="profile_settings"),
    path("save/", views.save_settings, name="save_settings"),
    path("export/", views.export_settings, name="export_settings"),
    path("privacy/clear/", views.clear_preferences, name="clear_preferences"),
]
