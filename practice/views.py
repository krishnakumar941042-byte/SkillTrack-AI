from django.shortcuts import render


import json

from django.db.models import Sum, Count, Q
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST

from .models import PracticeQuestion, PracticeSubmission


@require_GET
def question_list(request):
    questions = PracticeQuestion.objects.filter(is_active=True)

    difficulty = request.GET.get("difficulty", "").lower()
    if difficulty in {"easy", "medium", "hard"}:
        questions = questions.filter(difficulty=difficulty)

    return JsonResponse({
        "questions": [{
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "difficulty": q.difficulty,
            "points": q.points,
        } for q in questions]
    })


@require_GET
def question_detail(request, question_id):
    try:
        q = PracticeQuestion.objects.get(id=question_id, is_active=True)
    except PracticeQuestion.DoesNotExist:
        return JsonResponse({"error": "Question not found"}, status=404)

    return JsonResponse({
        "id": q.id,
        "title": q.title,
        "description": q.description,
        "difficulty": q.difficulty,
        "hint": q.hint,
        "points": q.points,
    })


@require_POST
def submit_answer(request, question_id):
    try:
        q = PracticeQuestion.objects.get(id=question_id, is_active=True)
    except PracticeQuestion.DoesNotExist:
        return JsonResponse({"error": "Question not found"}, status=404)

    try:
        data = json.loads(request.body or b"{}")
        answer = data.get("answer", "")
        if not isinstance(answer, str) or not answer.strip():
            return JsonResponse({"error": "Answer is required"}, status=400)
    except (ValueError, UnicodeDecodeError, AttributeError):
        return JsonResponse({"error": "Invalid request"}, status=400)

    # Never execute submitted Python code.
    correct = answer.strip().casefold() == q.expected_answer.strip().casefold()
    score = q.points if correct else 0

    submission = PracticeSubmission.objects.create(
        question=q,
        submitted_answer=answer,
        is_correct=correct,
        score=score,
    )

    return JsonResponse({
        "correct": correct,
        "score": score,
        "max_score": q.points,
        "submission_id": submission.id,
        "message": "Correct answer!" if correct else "Not quite. Review the question and hint.",
    })



@require_GET
def practice_history(request):
    submissions = (
        PracticeSubmission.objects
        .select_related("question")
        .order_by("-submitted_at")[:100]
    )

    return JsonResponse({
        "history": [{
            "question_title": s.question.title,
            "submitted_answer": s.submitted_answer,
            "is_correct": s.is_correct,
            "score": s.score,
            "submitted_at": s.submitted_at.isoformat(),
        } for s in submissions]
    })


@require_GET
def practice_stats(request):
    submissions = PracticeSubmission.objects.all()
    total = submissions.count()
    correct = submissions.filter(is_correct=True).count()

    return JsonResponse({
        "total_attempts": total,
        "solved_attempts": correct,
        "total_score": submissions.aggregate(
            total=Sum("score")
        )["total"] or 0,
        "accuracy_percent": round(correct * 100 / total) if total else 0,
        "unique_questions_solved": submissions.filter(
            is_correct=True
        ).values("question_id").distinct().count(),
        "by_difficulty": [{
            "difficulty": level,
            "attempts": submissions.filter(
                question__difficulty=level
            ).count(),
            "correct": submissions.filter(
                question__difficulty=level,
                is_correct=True,
            ).count(),
        } for level in ("easy", "medium", "hard")],
    })
