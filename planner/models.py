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
    xp_awarded = models.BooleanField(default=False)
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


class PlayerProfile(models.Model):
    total_xp = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Level {self.level} - {self.total_xp} XP"

    def update_level(self):
        # Every 100 XP unlocks the next level.
        self.level = (self.total_xp // 100) + 1
        self.save(update_fields=["level"])


class XPTransaction(models.Model):
    profile = models.ForeignKey(
        PlayerProfile,
        on_delete=models.CASCADE,
        related_name="xp_transactions",
    )
    amount = models.PositiveIntegerField()
    reason = models.CharField(max_length=200)
    source_type = models.CharField(max_length=50, blank=True)
    source_id = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"+{self.amount} XP: {self.reason}"


class Achievement(models.Model):
    title = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255)
    xp_reward = models.PositiveIntegerField(default=0)
    required_xp = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class PlayerAchievement(models.Model):
    profile = models.ForeignKey(
        PlayerProfile,
        on_delete=models.CASCADE,
        related_name="achievements",
    )
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name="unlocked_by",
    )
    unlocked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["profile", "achievement"],
                name="unique_player_achievement",
            )
        ]

    def __str__(self):
        return f"{self.profile} - {self.achievement.title}"


class DailyMission(models.Model):
    title = models.CharField(max_length=150)
    description = models.CharField(max_length=255)
    target_count = models.PositiveIntegerField(default=1)
    xp_reward = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class PlayerMissionProgress(models.Model):
    profile = models.ForeignKey(
        PlayerProfile,
        on_delete=models.CASCADE,
        related_name="mission_progress",
    )
    mission = models.ForeignKey(
        DailyMission,
        on_delete=models.CASCADE,
        related_name="player_progress",
    )
    mission_date = models.DateField()
    progress_count = models.PositiveIntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    reward_claimed = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["profile", "mission", "mission_date"],
                name="unique_daily_player_mission",
            )
        ]

    def __str__(self):
        return f"{self.mission.title} - {self.mission_date}"


class Badge(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255)
    icon = models.CharField(max_length=50, default="star")
    xp_required = models.PositiveIntegerField(default=0)
    streak_required = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


class PlayerBadge(models.Model):
    profile = models.ForeignKey(
        PlayerProfile,
        on_delete=models.CASCADE,
        related_name="badges",
    )
    badge = models.ForeignKey(
        Badge,
        on_delete=models.CASCADE,
        related_name="owners",
    )
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["profile", "badge"],
                name="unique_player_badge",
            )
        ]

    def __str__(self):
        return f"{self.profile} - {self.badge.name}"
