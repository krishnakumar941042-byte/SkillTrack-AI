from django.shortcuts import render


import json

from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect
from django.views.decorators.http import require_GET, require_POST


DEFAULT_SETTINGS = {
    "skill_level": "beginner",
    "daily_goal": 60,
    "learning_style": "practice",
    "language": "en",
    "theme": "light",
    "study_reminders": True,
    "learning_updates": True,
    "achievement_notifications": True,
    "analytics_enabled": True,
}


def get_preferences(request):
    """Return saved session preferences with safe defaults."""
    saved = request.session.get("profile_preferences", {})
    preferences = DEFAULT_SETTINGS.copy()
    preferences.update(saved)

    # Validate saved values before returning them.
    if preferences["skill_level"] not in {
        "beginner", "intermediate", "advanced"
    }:
        preferences["skill_level"] = "beginner"

    if preferences["learning_style"] not in {
        "reading", "videos", "practice", "projects"
    }:
        preferences["learning_style"] = "practice"

    if preferences["language"] not in {"en", "hi"}:
        preferences["language"] = "en"

    if preferences["theme"] not in {"light", "dark"}:
        preferences["theme"] = "light"

    try:
        preferences["daily_goal"] = int(preferences["daily_goal"])
    except (TypeError, ValueError):
        preferences["daily_goal"] = 60

    preferences["daily_goal"] = max(
        15, min(preferences["daily_goal"], 480)
    )

    for key in (
        "study_reminders",
        "learning_updates",
        "achievement_notifications",
        "analytics_enabled",
    ):
        preferences[key] = bool(preferences[key])

    return preferences


@require_GET
def settings_page(request):
    return render(
        request,
        "settings.html",
        {"preferences": get_preferences(request)},
    )


@require_POST
def save_settings(request):
    """Validate and save preferences to the current Django session."""
    try:
        data = json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"ok": False, "error": "Invalid JSON data."},
            status=400,
        )

    if not isinstance(data, dict):
        return JsonResponse(
            {"ok": False, "error": "Expected a settings object."},
            status=400,
        )

    current = get_preferences(request)

    choices = {
        "skill_level": {"beginner", "intermediate", "advanced"},
        "learning_style": {"reading", "videos", "practice", "projects"},
        "language": {"en", "hi"},
        "theme": {"light", "dark"},
    }

    for field, allowed in choices.items():
        if field in data:
            value = data[field]
            if not isinstance(value, str) or value not in allowed:
                return JsonResponse(
                    {"ok": False, "error": f"Invalid value for {field}."},
                    status=400,
                )
            current[field] = value

    if "daily_goal" in data:
        try:
            goal = int(data["daily_goal"])
        except (TypeError, ValueError):
            return JsonResponse(
                {"ok": False, "error": "Daily goal must be a number."},
                status=400,
            )

        if not 15 <= goal <= 480:
            return JsonResponse(
                {"ok": False, "error": "Daily goal must be 15–480 minutes."},
                status=400,
            )
        current["daily_goal"] = goal

    boolean_fields = {
        "study_reminders",
        "learning_updates",
        "achievement_notifications",
        "analytics_enabled",
    }

    for field in boolean_fields:
        if field in data:
            if not isinstance(data[field], bool):
                return JsonResponse(
                    {"ok": False, "error": f"{field} must be true or false."},
                    status=400,
                )
            current[field] = data[field]

    request.session["profile_preferences"] = current
    request.session.modified = True

    return JsonResponse({"ok": True, "preferences": current})


@require_GET
def export_settings(request):
    """Export only the preferences currently stored in this session."""
    payload = {
        "product": "SkillTrack AI",
        "export_type": "session_preferences",
        "preferences": get_preferences(request),
    }

    response = HttpResponse(
        json.dumps(payload, indent=2, ensure_ascii=False),
        content_type="application/json; charset=utf-8",
    )
    response["Content-Disposition"] = (
        'attachment; filename="skilltrack-settings.json"'
    )
    response["Cache-Control"] = "no-store"
    return response


@require_POST
def clear_preferences(request):
    """Remove saved settings from the current session."""
    request.session.pop("profile_preferences", None)
    request.session.modified = True

    return JsonResponse({"ok": True})

