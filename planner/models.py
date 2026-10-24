from django.db import models


class StudyTask(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
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