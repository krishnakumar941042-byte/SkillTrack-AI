from django.shortcuts import render

import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import StudyTask, StudySession


@csrf_exempt
@require_http_methods(["GET", "POST"])
def tasks_api(request):
    if request.method == "GET":
        tasks = list(
            StudyTask.objects.values(
                "id", "title", "description",
                "due_date", "is_completed"
            )
        )
        return JsonResponse({"tasks": tasks})

    try:
        data = json.loads(request.body)
        task = StudyTask.objects.create(
            title=data["title"],
            description=data.get("description", ""),
            due_date=data.get("due_date") or None,
        )
        return JsonResponse({"id": task.id, "title": task.title}, status=201)
    except (ValueError, KeyError, TypeError):
        return JsonResponse({"error": "Invalid task data"}, status=400)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def sessions_api(request):
    if request.method == "GET":
        sessions = list(
            StudySession.objects.values(
                "id", "subject", "duration_minutes",
                "session_date", "notes"
            )
        )
        return JsonResponse({"sessions": sessions})

    try:
        data = json.loads(request.body)
        session = StudySession.objects.create(
            subject=data["subject"],
            duration_minutes=data.get("duration_minutes", 30),
            notes=data.get("notes", ""),
        )
        return JsonResponse(
            {"id": session.id, "subject": session.subject},
            status=201,
        )
    except (ValueError, KeyError, TypeError):
        return JsonResponse({"error": "Invalid session data"}, status=400)


@csrf_exempt
@require_http_methods(["PATCH", "DELETE"])
def task_detail_api(request, task_id):
    try:
        task = StudyTask.objects.get(id=task_id)
    except StudyTask.DoesNotExist:
        return JsonResponse({"error": "Task not found"}, status=404)

    if request.method == "DELETE":
        task.delete()
        return JsonResponse({"message": "Task deleted"})

    try:
        data = json.loads(request.body)
        if "title" in data:
            task.title = data["title"]
        if "description" in data:
            task.description = data["description"]
        if "is_completed" in data:
            task.is_completed = bool(data["is_completed"])
        task.save()
        return JsonResponse({"message": "Task updated"})
    except (ValueError, TypeError):
        return JsonResponse({"error": "Invalid data"}, status=400)
