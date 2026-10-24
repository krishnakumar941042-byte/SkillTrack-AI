
from django.test import TestCase
from django.urls import reverse

from .models import PracticeQuestion


class PracticeQuestionModelTests(TestCase):
    def setUp(self):
        self.question = PracticeQuestion.objects.create(
            title="Comparison",
            description="Kya 10 > 4 ka result True hai ya False?",
            difficulty="easy",
            hint="10 is greater than 4.",
            expected_answer="True",
            points=10,
            is_active=True,
        )

    def test_question_is_created(self):
        self.assertEqual(self.question.title, "Comparison")
        self.assertEqual(self.question.points, 10)

    def test_question_string_representation(self):
        self.assertEqual(
            str(self.question),
            "Comparison (easy)",
        )

    def test_question_list_api(self):
        response = self.client.get(reverse("practice_questions"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Comparison")

    def test_question_detail_api(self):
        response = self.client.get(
            reverse(
                "practice_question_detail",
                kwargs={"question_id": self.question.id},
            )
        )

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(
            response.content,
            {
                "id": self.question.id,
                "title": "Comparison",
                "description": "Kya 10 > 4 ka result True hai ya False?",
                "difficulty": "easy",
                "hint": "10 is greater than 4.",
                "points": 10,
            },
        )
