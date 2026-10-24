
from django.urls import path
from . import views

urlpatterns = [
    path("questions/", views.question_list, name="practice_questions"),
    path("questions/<int:question_id>/", views.question_detail, name="practice_question_detail"),
    path("questions/<int:question_id>/submit/", views.submit_answer, name="practice_submit"),
    path("history/", views.practice_history, name="practice_history"),
    path("stats/", views.practice_stats, name="practice_stats"),
]
