from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .models import Course


@require_GET
def courses_api(request):
    courses = Course.objects.filter(is_active=True)

    data = [
        {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "instructor": course.instructor,
            "duration_hours": course.duration_hours,
            "lessons_count": course.lessons.count(),
        }
        for course in courses
    ]

    return JsonResponse({"courses": data})


@require_GET
def course_detail_api(request, course_id):
    try:
        course = Course.objects.get(id=course_id, is_active=True)
    except Course.DoesNotExist:
        return JsonResponse({"error": "Course not found"}, status=404)

    lessons = [
        {
            "id": lesson.id,
            "title": lesson.title,
            "content": lesson.content,
            "order": lesson.order,
            "duration_minutes": lesson.duration_minutes,
            "is_completed": lesson.is_completed,
        }
        for lesson in course.lessons.all()
    ]

    return JsonResponse({
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "instructor": course.instructor,
        "duration_hours": course.duration_hours,
        "lessons": lessons,
    })
