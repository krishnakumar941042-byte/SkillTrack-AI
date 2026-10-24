
from django.urls import path
from . import views

urlpatterns = [
    path("courses/", views.courses_api, name="courses_api"),
    path("courses/<int:course_id>/", views.course_detail_api, name="course_detail_api"),
    path("lessons/<int:lesson_id>/complete/", views.complete_lesson_api, name="complete_lesson_api"),
    path("resume/", views.resume_learning_api, name="resume_learning_api"),
]
