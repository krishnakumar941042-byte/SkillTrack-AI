
import csv
import json
from datetime import timedelta
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Count, Sum
from django.db.models.functions import TruncDate, TruncMonth
from django.http import HttpResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.http import require_GET

from learning.models import Course, Lesson
from planner.models import StudySession, PlayerProfile, XPTransaction
from practice.models import PracticeSubmission


def _analytics_data():
    today = timezone.localdate()
    week_start = today - timedelta(days=6)
    month_start = today.replace(day=1)

    # Daily study minutes for the last seven days
    sessions = StudySession.objects.filter(
        session_date__gte=week_start,
        session_date__lte=today,
    )
    daily_rows = (
        sessions.values("session_date")
        .annotate(minutes=Sum("duration_minutes"))
        .order_by("session_date")
    )
    daily_map = {
        row["session_date"]: row["minutes"] or 0
        for row in daily_rows
    }

    weekly_labels = [
        (week_start + timedelta(days=i)).strftime("%a")
        for i in range(7)
    ]
    weekly_minutes = [
        daily_map.get(week_start + timedelta(days=i), 0)
        for i in range(7)
    ]

    # Quiz performance by question title
    question_rows = (
        PracticeSubmission.objects
        .values("question_id", "question__title")
        .annotate(
            attempts=Count("id"),
            correct=Count("id", filter=__import__(
                "django.db.models", fromlist=["Q"]
            ).Q(is_correct=True)),
            average_score=Avg("score"),
        )
        .order_by("-attempts")
    )

    topic_labels = []
    topic_accuracy = []
    topics = []

    for row in question_rows:
        attempts = row["attempts"] or 0
        correct = row["correct"] or 0
        accuracy = round((correct / attempts) * 100) if attempts else 0
        title = row["question__title"] or "Untitled question"

        topic_labels.append(title[:35])
        topic_accuracy.append(accuracy)
        topics.append({
            "title": title,
            "attempts": attempts,
            "correct": correct,
            "accuracy": accuracy,
            "average_score": round(row["average_score"] or 0, 1),
        })

    # Topics with at least one attempt, sorted by accuracy
    topics_sorted = sorted(topics, key=lambda item: item["accuracy"])
    weak_topics = topics_sorted[:3]
    strong_topics = list(reversed(topics_sorted[-3:]))

    # Current-month study total and quiz performance
    month_sessions = StudySession.objects.filter(
        session_date__gte=month_start,
        session_date__lte=today,
    )
    monthly_minutes = month_sessions.aggregate(
        total=Sum("duration_minutes")
    )["total"] or 0

    month_submissions = PracticeSubmission.objects.filter(
        submitted_at__date__gte=month_start,
        submitted_at__date__lte=today,
    )
    month_attempts = month_submissions.count()
    month_correct = month_submissions.filter(is_correct=True).count()
    month_accuracy = round(
        (month_correct / month_attempts) * 100
    ) if month_attempts else 0

    # Monthly study totals for the current year
    year_start = today.replace(month=1, day=1)
    monthly_rows = (
        StudySession.objects.filter(
            session_date__gte=year_start,
            session_date__lte=today,
        )
        .annotate(month=TruncMonth("session_date"))
        .values("month")
        .annotate(minutes=Sum("duration_minutes"))
        .order_by("month")
    )
    monthly_map = {
        row["month"].month: row["minutes"] or 0
        for row in monthly_rows if row["month"]
    }

    month_labels = [
        timezone.datetime(today.year, month, 1).strftime("%b")
        for month in range(1, today.month + 1)
    ]
    month_minutes = [
        monthly_map.get(month, 0)
        for month in range(1, today.month + 1)
    ]

    profile = PlayerProfile.objects.order_by("-id").first()
    total_xp = profile.total_xp if profile else 0
    level = profile.level if profile else 1
    total_courses = Course.objects.filter(is_active=True).count()
    completed_lessons = Lesson.objects.filter(is_completed=True).count()
    total_lessons = Lesson.objects.count()

    return {
        "weekly_labels": json.dumps(weekly_labels),
        "weekly_minutes": json.dumps(weekly_minutes),
        "topic_labels": json.dumps(topic_labels),
        "topic_accuracy": json.dumps(topic_accuracy),
        "month_labels": json.dumps(month_labels),
        "month_minutes": json.dumps(month_minutes),
        "monthly_minutes": monthly_minutes,
        "monthly_hours": round(monthly_minutes / 60, 1),
        "month_attempts": month_attempts,
        "month_correct": month_correct,
        "month_accuracy": month_accuracy,
        "strong_topics": strong_topics,
        "weak_topics": weak_topics,
        "topics": topics,
        "total_xp": total_xp,
        "level": level,
        "total_courses": total_courses,
        "completed_lessons": completed_lessons,
        "total_lessons": total_lessons,
        "today": today,
    }


@require_GET
def analytics_api(request):
    """JSON data for dashboard charts."""
    data = _analytics_data()
    return HttpResponse(
        json.dumps(data, default=str),
        content_type="application/json",
    )


@require_GET
def monthly_report_csv(request):
    """Download a CSV summary for the current month."""
    data = _analytics_data()
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = (
        f'attachment; filename="skilltrack-report-{data["today"]:%Y-%m}.csv"'
    )

    writer = csv.writer(response)
    writer.writerow(["SkillTrack AI - Monthly Learning Report"])
    writer.writerow(["Report month", data["today"].strftime("%B %Y")])
    writer.writerow(["Study time (minutes)", data["monthly_minutes"]])
    writer.writerow(["Study time (hours)", data["monthly_hours"]])
    writer.writerow(["Quiz attempts", data["month_attempts"]])
    writer.writerow(["Correct attempts", data["month_correct"]])
    writer.writerow(["Quiz accuracy (%)", data["month_accuracy"]])
    writer.writerow(["Total XP", data["total_xp"]])
    writer.writerow(["Current level", data["level"]])
    writer.writerow([
        "Lessons completed",
        f'{data["completed_lessons"]}/{data["total_lessons"]}',
    ])
    writer.writerow([])
    writer.writerow(["Question / Topic", "Attempts", "Correct", "Accuracy (%)"])

    for topic in data["topics"]:
        writer.writerow([
            topic["title"],
            topic["attempts"],
            topic["correct"],
            topic["accuracy"],
        ])

    return response


def analytics_page(request):
    return render(request, "dashboard.html", _analytics_data())
