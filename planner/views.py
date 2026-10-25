from django.shortcuts import render
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import PlayerProfile, XPTransaction
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import StudyTask, StudySession, StudyGoal


@csrf_exempt
@require_http_methods(["GET", "POST"])
def tasks_api(request):
    if request.method == "GET":
        tasks = list(
            StudyTask.objects.values(
                "id", "title", "description",
                "due_date", "priority", "is_completed"
            )
        )
        return JsonResponse({"tasks": tasks})

    try:
        data = json.loads(request.body)
        task = StudyTask.objects.create(
            title=data["title"],
            description=data.get("description", ""),
            due_date=data.get("due_date") or None,
            priority=data.get("priority", "medium"),
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

        if "due_date" in data:
            task.due_date = data["due_date"] or None

        if "priority" in data:
            if data["priority"] not in ("low", "medium", "high"):
                return JsonResponse(
                    {"error": "Priority must be low, medium, or high"},
                    status=400,
                )
            task.priority = data["priority"]

        
        
        xp_earned = 0

        if "is_completed" in data:
            was_completed = task.is_completed
            new_completed = data["is_completed"]

            if not isinstance(new_completed, bool):
                return JsonResponse(
                    {"error": "is_completed must be true or false"},
                    status=400,
                )

            task.is_completed = new_completed

            if (
                new_completed
                and not was_completed
                and not task.xp_awarded
            ):
                profile, _ = PlayerProfile.objects.get_or_create(id=1)

                result = award_xp(
                    profile_id=profile.id,
                    amount=20,
                    reason=f"Completed task: {task.title}",
                    source_type="study_task",
                    source_id=task.id,
                )

                task.xp_awarded = True
                xp_earned = result["earned_xp"]

        task.save()

        return JsonResponse({
            "message": "Task updated",
            "xp_earned": xp_earned,
        })

    except (ValueError, TypeError):
        return JsonResponse({"error": "Invalid data"}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def save_timer_session(request):
    try:
        data = json.loads(request.body)

        subject = data.get("subject", "").strip()
        duration = int(data.get("duration_minutes", 0))

        if not subject:
            return JsonResponse(
                {"error": "Subject is required"},
                status=400,
            )

        if duration <= 0:
            return JsonResponse(
                {"error": "Duration must be greater than zero"},
                status=400,
            )

        session = StudySession.objects.create(
            subject=subject,
            duration_minutes=duration,
            notes=data.get("notes", ""),
        )

        return JsonResponse({
            "message": "Study session saved",
            "id": session.id,
            "subject": session.subject,
            "duration_minutes": session.duration_minutes,
            "session_date": session.session_date.isoformat(),
        }, status=201)

    except (ValueError, TypeError, json.JSONDecodeError):
        return JsonResponse(
            {"error": "Invalid session data"},
            status=400,
        )


@require_http_methods(["GET"])
def study_goal_progress_api(request):
    from datetime import date, timedelta
    from django.db.models import Sum

    today = date.today()
    goals = StudyGoal.objects.all().order_by("start_date")
    results = []

    for goal in goals:
        actual_minutes = StudySession.objects.filter(
            session_date__gte=goal.start_date,
            session_date__lte=min(goal.end_date, today),
        ).aggregate(total=Sum("duration_minutes"))["total"] or 0

        target_minutes = goal.target_minutes
        percentage = (
            min(round(actual_minutes / target_minutes * 100), 100)
            if target_minutes > 0
            else 0
        )

        results.append({
            "id": goal.id,
            "title": goal.title,
            "goal_type": goal.goal_type,
            "start_date": goal.start_date.isoformat(),
            "end_date": goal.end_date.isoformat(),
            "target_minutes": target_minutes,
            "actual_minutes": actual_minutes,
            "remaining_minutes": max(target_minutes - actual_minutes, 0),
            "progress_percent": percentage,
        })

    return JsonResponse({"goals": results})


@transaction.atomic
def award_xp(profile_id, amount, reason, source_type="", source_id=None):
    if amount <= 0:
        raise ValueError("XP amount must be greater than zero.")

    profile = get_object_or_404(
        PlayerProfile.objects.select_for_update(),
        id=profile_id,
    )

    profile.total_xp += amount
    profile.level = (profile.total_xp // 100) + 1
    profile.save(update_fields=["total_xp", "level"])

    reward = XPTransaction.objects.create(
        profile=profile,
        amount=amount,
        reason=reason,
        source_type=source_type,
        source_id=source_id,
    )

    return {
        "profile_id": profile.id,
        "earned_xp": reward.amount,
        "total_xp": profile.total_xp,
        "level": profile.level,
        "reason": reward.reason,
    }

@require_http_methods(["GET"])
def xp_profile_api(request):
    # Temporary single-player profile for the current project.
    profile, created = PlayerProfile.objects.get_or_create(id=1)

    return JsonResponse({
        "profile_id": profile.id,
        "total_xp": profile.total_xp,
        "level": profile.level,
        "xp_for_next_level": (profile.level * 100) - profile.total_xp,
    })