
from django.shortcuts import render


def dashboard(request):
    return render(request, "dashboard.html", {
        "active_page": "dashboard",
    })


def learning_page(request):
    return render(request, "learning.html", {
        "active_page": "learning",
    })


def practice_page(request):
    return render(request, "practice.html", {
        "active_page": "practice",
    })


def planner_page(request):
    return render(request, "planner.html", {
        "active_page": "planner",
    })


def achievements_page(request):
    return render(request, "achievements.html", {
        "active_page": "achievements",
    })


def analytics_page(request):
    return render(request, "analytics.html", {
        "active_page": "analytics",
    })
