
from django.contrib import admin
from .models import PracticeQuestion, PracticeSubmission


@admin.register(PracticeQuestion)
class PracticeQuestionAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "difficulty",
        "points",
        "is_active",
    )
    list_filter = ("difficulty", "is_active")
    search_fields = ("title", "description")
    list_editable = ("difficulty", "points", "is_active")


@admin.register(PracticeSubmission)
class PracticeSubmissionAdmin(admin.ModelAdmin):
    list_display = (
        "question",
        "submitted_answer",
        "is_correct",
        "score",
        "submitted_at",
    )
    list_filter = ("is_correct", "question__difficulty")
    search_fields = ("question__title", "submitted_answer")
    readonly_fields = ("submitted_at",)
    ordering = ("-submitted_at",)
