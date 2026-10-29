
document.addEventListener("DOMContentLoaded", () => {
    const message = document.getElementById("practice-page-message");
    const container = document.getElementById("practice-page-questions");

    if (!message || !container) return;

    async function getJSON(url, options = {}) {
        const headers = {
            ...(options.headers || {})
        };

        const csrfToken = document.cookie
            .split("; ")
            .find(cookie => cookie.startsWith("csrftoken="))
            ?.split("=")
            .slice(1)
            .join("=");

        if (csrfToken && options.method === "POST") {
            headers["X-CSRFToken"] = decodeURIComponent(csrfToken);
        }

        const response = await fetch(url, {
            ...options,
            headers
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Request failed (${response.status})`);
        }
        return data;
    }

    async function loadStats() {
        const stats = await getJSON("/api/practice/stats/");
        document.getElementById("practice-attempts").textContent = stats.total_attempts;
        document.getElementById("practice-correct").textContent = stats.solved_attempts;
        document.getElementById("practice-accuracy").textContent =
            `${stats.accuracy_percent}%`;
    }

    async function loadQuestions() {
        try {
            const data = await getJSON("/api/practice/questions/");
            container.replaceChildren();

            if (!data.questions.length) {
                message.textContent = "No active questions found. Add questions in Django Admin.";
                return;
            }

            message.textContent = `${data.questions.length} question(s) available.`;

            data.questions.forEach(question => {
                const card = document.createElement("article");
                card.className = "stat-card";

                const title = document.createElement("h3");
                title.textContent = question.title;

                const description = document.createElement("p");
                description.textContent = question.description;

                const meta = document.createElement("p");
                meta.textContent =
                    `${question.difficulty.toUpperCase()} · ${question.points} points`;

                const answer = document.createElement("input");
                answer.type = "text";
                answer.placeholder = "Type your answer";
                answer.setAttribute("aria-label", `Answer for ${question.title}`);

                const submit = document.createElement("button");
                submit.type = "button";
                submit.className = "btn btn-primary";
                submit.textContent = "Submit Answer";

                const feedback = document.createElement("p");
                feedback.setAttribute("role", "status");

                submit.addEventListener("click", async () => {
                    if (!answer.value.trim()) {
                        feedback.textContent = "Please enter an answer first.";
                        return;
                    }

                    submit.disabled = true;
                    feedback.textContent = "Checking answer...";

                    try {
                        const result = await getJSON(
                            `/api/practice/questions/${question.id}/submit/`,
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ answer: answer.value })
                            }
                        );

                        feedback.textContent =
                            `${result.message} Score: ${result.score}/${result.max_score}`;
                        await loadStats();
                    } catch (error) {
                        feedback.textContent = error.message;

                        if (error.message.includes("403")) {
                            feedback.textContent +=
                                " Check the Django CSRF configuration and request headers.";
                        }
                    } finally {
                        submit.disabled = false;
                    }
                });

                card.append(title, description, meta, answer, submit, feedback);
                container.append(card);
            });
        } catch (error) {
            message.textContent = error.message;
        }
    }

    loadStats().catch(error => {
        message.textContent = `Could not load stats: ${error.message}`;
    });

    loadQuestions();
});
