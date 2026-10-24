from django.urls import path
from . import views

urlpatterns = [
    path("courses/", views.courses_api, name="courses_api"),
    path(
        "courses/<int:course_id>/",
        views.course_detail_api,
        name="course_detail_api",
    ),
]