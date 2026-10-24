
from django.db import models


class PracticeQuestion(models.Model):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

    DIFFICULTY_CHOICES = [
        (EASY, "Easy"),
        (MEDIUM, "Medium"),
        (HARD, "Hard"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        default=EASY,
    )
    hint = models.TextField(blank=True)
    expected_answer = models.TextField()
    points = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} ({self.difficulty})"


class PracticeSubmission(models.Model):
    question = models.ForeignKey(
        PracticeQuestion,
        on_delete=models.CASCADE,
        related_name="submissions",
    )
    submitted_answer = models.TextField()
    is_correct = models.BooleanField(default=False)
    score = models.PositiveIntegerField(default=0)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.question.title} - {self.score} points"
