
from django.contrib import admin
from .models import StudyTask, StudySession, StudyGoal


@admin.register(StudyTask)
class StudyTaskAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "due_date",
        "priority",
        "is_completed",
        "created_at",
    )
    list_filter = ("is_completed", "due_date", "priority")
    search_fields = ("title", "description")


@admin.register(StudySession)
class StudySessionAdmin(admin.ModelAdmin):
    list_display = ("subject", "duration_minutes", "session_date")
    list_filter = ("session_date",)
    search_fields = ("subject", "notes")


@admin.register(StudyGoal)
class StudyGoalAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "goal_type",
        "target_minutes",
        "start_date",
        "end_date",
        "is_completed",
    )
    list_filter = ("goal_type", "is_completed")
    search_fields = ("title",)
