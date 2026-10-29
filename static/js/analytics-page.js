
document.addEventListener("DOMContentLoaded", async () => {
    async function getJSON(url) {
        const response = await fetch(url);
        const type = response.headers.get("content-type") || "";

        if (!type.includes("application/json")) {
            throw new Error(`Unexpected response from ${url} (${response.status}).`);
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `Request failed (${response.status}).`);
        }
        return data;
    }

    function addText(parent, tag, text) {
        const element = document.createElement(tag);
        element.textContent = text;
        parent.append(element);
        return element;
    }

    async function loadAnalytics() {
        const [practice, profile, courseData] = await Promise.all([
            getJSON("/api/practice/stats/"),
            getJSON("/api/xp/profile/"),
            getJSON("/api/courses/")
        ]);

        document.getElementById("analytics-attempts").textContent =
            practice.total_attempts;
        document.getElementById("analytics-correct").textContent =
            practice.solved_attempts;
        document.getElementById("analytics-accuracy").textContent =
            `${practice.accuracy_percent}%`;
        document.getElementById("analytics-xp").textContent =
            profile.total_xp;

        const difficultyList =
            document.getElementById("analytics-difficulty-list");
        difficultyList.replaceChildren();

        (practice.by_difficulty || []).forEach(item => {
            const card = document.createElement("article");
            card.className = "lesson-row";

            addText(card, "h3", item.difficulty.toUpperCase());
            addText(card, "p", `Attempts: ${item.attempts}`);
            addText(card, "p", `Correct: ${item.correct}`);

            const bar = document.createElement("progress");
            bar.max = Math.max(item.attempts, 1);
            bar.value = item.correct;
            bar.setAttribute("aria-label", `${item.difficulty} correct answers`);
            card.append(bar);

            difficultyList.append(card);
        });

        document.getElementById("analytics-message").textContent =
            practice.total_attempts
                ? "Practice statistics loaded successfully."
                : "No practice attempts yet. Try a question in Practice Lab.";

        const learningList = document.getElementById("analytics-learning-list");
        learningList.replaceChildren();

        const courses = courseData.courses || [];

        if (!courses.length) {
            addText(learningList, "p", "No courses available yet.");
            return;
        }

        courses.forEach(course => {
            const card = document.createElement("article");
            card.className = "lesson-row";

            const total = Number(course.total_lessons) || 0;
            const completed = Number(course.completed_lessons) || 0;
            const percent = total
                ? Math.round((completed / total) * 100)
                : 0;

            addText(card, "h3", course.title);
            addText(card, "p", `Lessons completed: ${completed}/${total} (${percent}%)`);

            const bar = document.createElement("progress");
            bar.max = 100;
            bar.value = percent;
            bar.setAttribute("aria-label", `${course.title} completion`);
            card.append(bar);

            learningList.append(card);
        });
    }

    try {
        await loadAnalytics();
    } catch (error) {
        document.getElementById("analytics-message").textContent =
            `Could not load analytics: ${error.message}`;
        document.getElementById("analytics-learning-list").textContent =
            "Check that the required APIs are available.";
    }
});
