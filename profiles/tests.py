
import json

from django.test import TestCase
from django.urls import reverse


class ProfileSettingsTests(TestCase):
    def test_settings_page_loads(self):
        response = self.client.get(reverse("profile_settings"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Learning preferences")

    def test_default_preferences_are_displayed(self):
        response = self.client.get(reverse("profile_settings"))
        self.assertEqual(response.context["preferences"]["language"], "en")
        self.assertEqual(response.context["preferences"]["theme"], "light")

    def test_save_preferences(self):
        response = self.client.post(
            reverse("save_settings"),
            data=json.dumps({
                "skill_level": "intermediate",
                "daily_goal": 90,
                "language": "hi",
                "theme": "dark",
                "study_reminders": False,
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])

        saved = self.client.get(
            reverse("profile_settings")
        ).context["preferences"]

        self.assertEqual(saved["skill_level"], "intermediate")
        self.assertEqual(saved["daily_goal"], 90)
        self.assertEqual(saved["language"], "hi")
        self.assertEqual(saved["theme"], "dark")
        self.assertFalse(saved["study_reminders"])

    def test_invalid_daily_goal_is_rejected(self):
        response = self.client.post(
            reverse("save_settings"),
            data=json.dumps({"daily_goal": 999}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_invalid_language_is_rejected(self):
        response = self.client.post(
            reverse("save_settings"),
            data=json.dumps({"language": "xx"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_invalid_json_is_rejected(self):
        response = self.client.post(
            reverse("save_settings"),
            data="{invalid",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_export_returns_json_attachment(self):
        self.client.post(
            reverse("save_settings"),
            data=json.dumps({"language": "hi"}),
            content_type="application/json",
        )

        response = self.client.get(reverse("export_settings"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("application/json", response["Content-Type"])
        self.assertIn("attachment;", response["Content-Disposition"])

        exported = json.loads(response.content)
        self.assertEqual(exported["preferences"]["language"], "hi")

    def test_clear_preferences_resets_to_defaults(self):
        self.client.post(
            reverse("save_settings"),
            data=json.dumps({"language": "hi", "theme": "dark"}),
            content_type="application/json",
        )

        response = self.client.post(reverse("clear_preferences"))
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])

        page = self.client.get(reverse("profile_settings"))
        self.assertEqual(page.context["preferences"]["language"], "en")
        self.assertEqual(page.context["preferences"]["theme"], "light")
