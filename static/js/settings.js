
(() => {
    const form = document.getElementById("settings-form");
    if (!form) return;

    const notice = document.getElementById("notice");
    const saveStatus = document.getElementById("save-status");
    const goal = form.elements.daily_goal;
    const goalValue = document.getElementById("goal-value");
    const themeSelect = form.elements.theme;

    function showNotice(message, isError = false) {
        notice.textContent = message;
        notice.className = `notice show ${isError ? "error" : "success"}`;
    }

    function csrfToken() {
        const input = form.querySelector(
            'input[name="csrfmiddlewaretoken"]'
        );
        return input ? input.value : "";
    }

    function collectSettings() {
        const data = {};

        for (const name of [
            "skill_level",
            "learning_style",
            "language",
            "theme",
        ]) {
            data[name] = form.elements[name].value;
        }

        data.daily_goal = Number(goal.value);

        for (const name of [
            "study_reminders",
            "learning_updates",
            "achievement_notifications",
            "analytics_enabled",
        ]) {
            data[name] = form.elements[name].checked;
        }

        return data;
    }

    function previewTheme(theme) {
        document.body.dataset.theme = theme;
    }

    goal.addEventListener("input", () => {
        goalValue.textContent = goal.value;
        saveStatus.textContent = "Unsaved changes";
    });

    form.addEventListener("change", (event) => {
        saveStatus.textContent = "Unsaved changes";

        if (event.target === themeSelect) {
            previewTheme(themeSelect.value);
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = "Saving…";

        try {
            const response = await fetch("/settings/save/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken(),
                },
                credentials: "same-origin",
                body: JSON.stringify(collectSettings()),
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.error || "Could not save settings.");
            }

            showNotice("Settings saved successfully.");
            saveStatus.textContent = "All changes saved";
        } catch (error) {
            showNotice(error.message || "A network error occurred.", true);
            saveStatus.textContent = "Save failed";
        } finally {
            button.disabled = false;
            button.textContent = "Save settings";
        }
    });

    document.getElementById("clear-button").addEventListener(
        "click",
        async () => {
            const confirmed = window.confirm(
                "Clear the saved preferences in this session? " +
                "This will not delete your courses or lessons."
            );

            if (!confirmed) return;

            try {
                const response = await fetch("/settings/privacy/clear/", {
                    method: "POST",
                    headers: { "X-CSRFToken": csrfToken() },
                    credentials: "same-origin",
                });

                const data = await response.json();

                if (!response.ok || !data.ok) {
                    throw new Error(data.error || "Could not clear settings.");
                }

                showNotice("Saved preferences cleared. Reloading defaults…");
                window.location.reload();
            } catch (error) {
                showNotice(error.message || "Could not clear preferences.", true);
            }
        }
    );

    // Preview the saved theme as soon as the page loads.
    previewTheme(themeSelect.value);
})();
