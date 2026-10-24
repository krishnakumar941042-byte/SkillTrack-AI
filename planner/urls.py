from django.urls import path
from . import views

urlpatterns = [
    path("tasks/", views.tasks_api, name="tasks_api"),
    path("tasks/<int:task_id>/", views.task_detail_api, name="task_detail_api"),
    path("study-sessions/", views.sessions_api, name="sessions_api"),
]