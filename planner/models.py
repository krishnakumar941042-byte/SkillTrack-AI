from django.db import models
from django.db.models import Sum
from datetime import date

class StudyTask(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default="medium",
    )
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class StudySession(models.Model):
    subject = models.CharField(max_length=100)
    duration_minutes = models.PositiveIntegerField(default=30)
    session_date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.subject} - {self.duration_minutes} min"


class StudyGoal(models.Model):
    DAILY = "daily"
    WEEKLY = "weekly"

    GOAL_TYPE_CHOICES = [
        (DAILY, "Daily"),
        (WEEKLY, "Weekly"),
    ]

    title = models.CharField(max_length=200)
    goal_type = models.CharField(
        max_length=10,
        choices=GOAL_TYPE_CHOICES,
        default=DAILY,
    )
    target_minutes = models.PositiveIntegerField(default=60)
    start_date = models.DateField()
    end_date = models.DateField()
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.goal_type})"
