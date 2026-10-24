
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import Course, Lesson


@require_GET
def courses_api(request):
    courses = Course.objects.filter(is_active=True)
    return JsonResponse({
        "courses": [{
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "instructor": c.instructor,
            "duration_hours": c.duration_hours,
            "total_lessons": c.lessons.count(),
            "completed_lessons": c.lessons.filter(is_completed=True).count(),
        } for c in courses]
    })


@require_GET
def course_detail_api(request, course_id):
    try:
        course = Course.objects.get(id=course_id, is_active=True)
    except Course.DoesNotExist:
        return JsonResponse({"error": "Course not found"}, status=404)

    lessons = course.lessons.all()
    total = lessons.count()
    completed = lessons.filter(is_completed=True).count()

    return JsonResponse({
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "instructor": course.instructor,
        "duration_hours": course.duration_hours,
        "total_lessons": total,
        "completed_lessons": completed,
        "progress": round(completed * 100 / total) if total else 0,
        "lessons": [{
            "id": lesson.id,
            "title": lesson.title,
            "content": lesson.content,
            "order": lesson.order,
            "duration_minutes": lesson.duration_minutes,
            "is_completed": lesson.is_completed,
        } for lesson in lessons]
    })


@csrf_exempt
@require_POST
def complete_lesson_api(request, lesson_id):
    try:
        lesson = Lesson.objects.get(id=lesson_id)
    except Lesson.DoesNotExist:
        return JsonResponse({"error": "Lesson not found"}, status=404)

    try:
        data = json.loads(request.body or b"{}")
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    lesson.is_completed = data.get("is_completed", True)
    lesson.save(update_fields=["is_completed"])

    lessons = lesson.course.lessons.all()
    total = lessons.count()
    completed = lessons.filter(is_completed=True).count()

    return JsonResponse({
        "message": "Progress updated",
        "lesson_id": lesson.id,
        "is_completed": lesson.is_completed,
        "progress": round(completed * 100 / total) if total else 0,
        "completed_lessons": completed,
        "total_lessons": total,
    })


@require_GET
def resume_learning_api(request):
    lesson = Lesson.objects.filter(
        course__is_active=True,
        is_completed=False
    ).select_related("course").order_by("course_id", "order").first()

    if not lesson:
        return JsonResponse({
            "message": "All lessons completed!",
            "lesson": None
        })

    return JsonResponse({
        "course_id": lesson.course_id,
        "course_title": lesson.course.title,
        "lesson": {
            "id": lesson.id,
            "title": lesson.title,
            "order": lesson.order,
        }
    })
