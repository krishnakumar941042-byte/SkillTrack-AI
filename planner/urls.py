from django.urls import path
from . import views

urlpatterns = [
    path("tasks/", views.tasks_api, name="tasks_api"),
    path("tasks/<int:task_id>/", views.task_detail_api, name="task_detail_api"),
    path("study-sessions/", views.sessions_api, name="sessions_api"),
    path("timer/save/",views.save_timer_session,name="save_timer_session",),
    path("study-goals/progress/", views.study_goal_progress_api, name="study_goal_progress_api"),
    path("xp/profile/", views.xp_profile_api, name="xp_profile_api"),
    path("achievements/", views.achievements_api, name="achievements_api"),
]