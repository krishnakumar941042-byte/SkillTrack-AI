from django.test import TestCase


import json
from unittest.mock import patch

from django.test import TestCase
from django.core.cache import cache

from learning.models import Course, Lesson
from .views import get_learning_summary


class TutorPageTests(TestCase):
    def test_tutor_page_loads(self):
        response = self.client.get("/tutor/")
        self.assertEqual(response.status_code, 200)

    def test_status_endpoint_works(self):
        response = self.client.get("/tutor/status/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("available", response.json())


class TutorChatTests(TestCase):
    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def post_message(self, message, **extra):
        data = {"message": message, **extra}
        return self.client.post(
            "/tutor/chat/",
            data=json.dumps(data),
            content_type="application/json",
        )

    @patch.dict("os.environ", {"GEMINI_API_KEY": ""})
    def test_missing_api_key_uses_fallback(self):
        response = self.post_message("What is Python?")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["mode"], "fallback")
        self.assertIn("reply", response.json())

    def test_invalid_json_is_rejected(self):
        response = self.client.post(
            "/tutor/chat/",
            data="{invalid",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_empty_message_is_rejected(self):
        response = self.post_message("   ")
        self.assertEqual(response.status_code, 400)

    def test_oversized_message_is_rejected(self):
        response = self.post_message("x" * 3001)
        self.assertEqual(response.status_code, 400)

    @patch.dict("os.environ", {"GEMINI_API_KEY": ""})
    def test_invalid_language_and_mode_are_handled(self):
        response = self.post_message(
            "Explain Python",
            language="unknown",
            mode="unknown",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["mode"], "fallback")

    @patch.dict("os.environ", {"GEMINI_API_KEY": ""})
    def test_rate_limit_returns_429(self):
        cache.set("tutor_rate_test-client", 10, 3600)

        # Django test client normally uses 127.0.0.1.
        cache.set("tutor_rate_127.0.0.1", 10, 3600)

        response = self.post_message("What is Python?")
        self.assertEqual(response.status_code, 429)


class LearningSummaryTests(TestCase):
    def test_summary_counts_courses_and_lessons(self):
        course = Course.objects.create(
            title="Test Python",
            description="Test course",
        )

        Lesson.objects.create(
            course=course,
            title="Lesson 1",
            content="Introduction",
            order=1,
            is_completed=True,
        )

        Lesson.objects.create(
            course=course,
            title="Lesson 2",
            content="Variables",
            order=2,
            is_completed=False,
        )

        summary = get_learning_summary()

        self.assertEqual(summary["active_courses"], 1)
        self.assertEqual(summary["total_lessons"], 2)
        self.assertEqual(summary["completed_lessons"], 1)
        self.assertEqual(
            summary["courses"][0]["course"],
            "Test Python",
        )

