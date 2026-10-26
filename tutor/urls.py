
from django.urls import path
from . import views

urlpatterns = [
    path("", views.tutor_page, name="tutor_page"),
    path("chat/", views.tutor_chat, name="tutor_chat"),
    path("status/", views.tutor_status, name="tutor_status"),
]
