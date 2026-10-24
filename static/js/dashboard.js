function getCookie(name) {
    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {
        const trimmed = cookie.trim();

        if (trimmed.startsWith(name + "=")) {
            return decodeURIComponent(
                trimmed.substring(name.length + 1)
            );
        }
    }

    return null;
}
const themeToggle = document.getElementById("theme-toggle");

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark-theme");

        themeToggle.textContent = isDark ? "☀" : "☾";
        themeToggle.setAttribute(
            "aria-label",
            isDark ? "Switch to light theme" : "Switch to dark theme"
        );
    });
}


const dashboardSearch = document.getElementById("dashboard-search");

if (dashboardSearch) {
    dashboardSearch.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;

        const query = dashboardSearch.value.trim().toLowerCase();

        const sections = [
            { name: "dashboard", id: null },
            { name: "my learning", id: "learning" },
            { name: "practice lab", id: "practice" },
            { name: "study planner", id: "planner" },
            { name: "achievements", id: "achievements" },
            { name: "analytics", id: "analytics" }
        ];

        const match = sections.find(section =>
            section.name.includes(query)
        );

        if (match) {
            if (match.id) {
                document.getElementById(match.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            } else {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        } else if (query) {
            alert("Section nahi mila. Dashboard, Practice Lab, Study Planner ya Analytics search karo.");
        }
    });
}


const notificationToggle = document.getElementById("notification-toggle");

if (notificationToggle) {
    notificationToggle.addEventListener("click", () => {
        alert("You're all caught up! No new notifications.");
    });
}

const sidebarToggle = document.getElementById("sidebarToggle");

if (sidebarToggle) {
    sidebarToggle.addEventListener("click", function () {
        document.body.classList.toggle("sidebar-collapsed");

        const isOpen = !document.body.classList.contains("sidebar-collapsed");

        sidebarToggle.setAttribute("aria-expanded", String(isOpen));
        sidebarToggle.setAttribute(
            "aria-label",
            isOpen ? "Hide sidebar" : "Show sidebar"
        );
    });
}


/* SkillTrack AI - Learning Management */

const learningSection = document.getElementById("learning");

if (learningSection) {
    const panel = document.createElement("div");
    panel.className = "learning-api-panel";
    panel.innerHTML = `
        <h2>My Learning</h2>
        <p class="learning-status">Loading your courses...</p>
        <div class="learning-resume"></div>
        <div class="learning-courses"></div>
        <div class="learning-details"></div>
    `;
    learningSection.prepend(panel);

    const status = panel.querySelector(".learning-status");
    const coursesBox = panel.querySelector(".learning-courses");
    const detailsBox = panel.querySelector(".learning-details");
    const resumeBox = panel.querySelector(".learning-resume");

    const safe = value => String(value ?? "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;",
            '"': "&quot;", "'": "&#39;"
        })[char]
    );

    async function loadCourses() {
        try {
            const response = await fetch("/api/courses/");
            if (!response.ok) throw new Error("Could not load courses");

            const data = await response.json();
            status.textContent = `${data.courses.length} courses available`;

            coursesBox.innerHTML = data.courses.map(course => {
                const progress = course.total_lessons
                    ? Math.round(course.completed_lessons * 100 / course.total_lessons)
                    : 0;

                return `
                    <article class="learning-course">
                        <h3>${safe(course.title)}</h3>
                        <p>${safe(course.description)}</p>
                        <p>${safe(course.instructor)} · ${course.duration_hours} hours</p>
                        <p>${course.completed_lessons}/${course.total_lessons} lessons · ${progress}%</p>
                        <div class="learning-progress">
                            <div style="width:${progress}%"></div>
                        </div>
                        <button type="button" data-course="${course.id}">
                            View lessons
                        </button>
                    </article>
                `;
            }).join("") || "<p>No courses available yet.</p>";

            coursesBox.querySelectorAll("[data-course]").forEach(button => {
                button.addEventListener("click", () => {
                    loadCourse(button.dataset.course);
                });
            });

            await loadResume();
        } catch (error) {
            status.textContent = "Could not load courses. Check that Django is running.";
        }
    }

    async function loadCourse(courseId) {
        try {
            const response = await fetch(`/api/courses/${courseId}/`);
            if (!response.ok) throw new Error("Course unavailable");

            const course = await response.json();

            detailsBox.innerHTML = `
                <h3>${safe(course.title)} — Lessons</h3>
                <p>Progress: ${course.progress}%</p>
                <div class="learning-progress">
                    <div style="width:${course.progress}%"></div>
                </div>
                ${course.lessons.map(lesson => `
                    <article class="learning-lesson">
                        <div>
                            <strong>${safe(lesson.order)}. ${safe(lesson.title)}</strong>
                            <p>${safe(lesson.content)}</p>
                            <small>${lesson.duration_minutes} minutes</small>
                        </div>
                        <button type="button"
                            data-lesson="${lesson.id}"
                            data-completed="${!lesson.is_completed}">
                            ${lesson.is_completed ? "Mark incomplete" : "Complete lesson"}
                        </button>
                    </article>
                `).join("") || "<p>No lessons added yet.</p>"}
            `;

            detailsBox.querySelectorAll("[data-lesson]").forEach(button => {
                button.addEventListener("click", async () => {
                    const completed = button.dataset.completed === "true";

                    const result = await fetch(
                        `/api/lessons/${button.dataset.lesson}/complete/`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ is_completed: completed })
                        }
                    );

                    if (!result.ok) {
                        alert("Could not update lesson progress.");
                        return;
                    }

                    await loadCourse(courseId);
                    await loadCourses();
                });
            });
        } catch (error) {
            detailsBox.textContent = "Could not load course details.";
        }
    }

    async function loadResume() {
        try {
            const response = await fetch("/api/resume/");
            if (!response.ok) throw new Error();

            const data = await response.json();

            if (!data.lesson) {
                resumeBox.textContent = data.message;
                return;
            }

            resumeBox.innerHTML = `
                <h3>Resume Learning</h3>
                <p>${safe(data.course_title)} — ${safe(data.lesson.title)}</p>
                <button type="button" id="resume-course">
                    Continue learning
                </button>
            `;

            resumeBox.querySelector("#resume-course").addEventListener(
                "click",
                () => loadCourse(data.course_id)
            );
        } catch (error) {
            resumeBox.textContent = "Resume Learning is temporarily unavailable.";
        }
    }

    loadCourses();
}


/* ===== SkillTrack AI - Practice Lab ===== */
document.addEventListener("DOMContentLoaded", () => {
    const section = document.getElementById("practice");
    if (!section || section.dataset.practiceLoaded) return;
    section.dataset.practiceLoaded = "true";

    section.insertAdjacentHTML("beforeend", `
        <div class="practice-api-panel">
            <h2>🐍 Python Practice Lab</h2>
            <p>Questions solve karo, hints lo aur apna score dekho.</p>

            <label for="practiceDifficulty">Difficulty:</label>
            <select id="practiceDifficulty">
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
            </select>

            <div id="practiceQuestions">Loading questions...</div>

            <h3>📊 Practice Statistics</h3>
            <div id="practiceStats">Loading statistics...</div>

            <h3>🕘 Recent Attempts</h3>
            <div id="practiceHistory">Loading history...</div>
        </div>
    `);

    const questionsBox = document.getElementById("practiceQuestions");
    const difficulty = document.getElementById("practiceDifficulty");

    async function loadQuestions() {
        questionsBox.textContent = "Loading questions...";

        try {
            const query = difficulty.value
                ? `?difficulty=${encodeURIComponent(difficulty.value)}`
                : "";

            const response = await fetch(
                `/api/practice/questions/${query}`
            );
            if (!response.ok) throw new Error("Questions load nahi hue.");

            const data = await response.json();

            if (!data.questions.length) {
                questionsBox.textContent =
                    "Is level par abhi questions nahi hain.";
                return;
            }

            questionsBox.replaceChildren();

            for (const question of data.questions) {
                const card = document.createElement("article");
                card.className = "practice-question";

                const title = document.createElement("h3");
                title.textContent = question.title;

                const description = document.createElement("p");
                description.textContent = question.description;

                const meta = document.createElement("p");
                meta.textContent =
                    `${question.difficulty.toUpperCase()} · ${question.points} points`;

                const hintButton = document.createElement("button");
                hintButton.textContent = "Show Hint";

                const hint = document.createElement("p");
                hint.hidden = true;

                hintButton.addEventListener("click", async () => {
                    try {
                        const r = await fetch(
                            `/api/practice/questions/${question.id}/`
                        );
                        if (!r.ok) throw new Error();
                        const detail = await r.json();
                        hint.textContent = detail.hint || "Hint available nahi hai.";
                        hint.hidden = false;
                    } catch {
                        hint.textContent = "Hint load nahi ho saka.";
                        hint.hidden = false;
                    }
                });

                const answer = document.createElement("input");
                answer.type = "text";
                answer.placeholder = "Apna answer likho";

                const submit = document.createElement("button");
                submit.textContent = "Submit Answer";

                const result = document.createElement("p");

                submit.addEventListener("click", async () => {
                    if (!answer.value.trim()) {
                        result.textContent = "Pehle answer likho.";
                        return;
                    }

                    submit.disabled = true;
                    result.textContent = "Checking answer...";

                    try {
                        const r = await fetch(
                            `/api/practice/questions/${question.id}/submit/`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-CSRFToken": getCookie("csrftoken")
                                },
                                body: JSON.stringify({
                                    answer: answer.value.trim()
                                })
                            }
                        );

                        const data = await r.json();
                        if (!r.ok) {
                            throw new Error(data.error || "Submission failed.");
                        }

                        result.textContent =
                            `${data.message} Score: ${data.score}/${data.max_score}`;

                        await loadStats();
                        await loadHistory();
                    } catch (error) {
                        result.textContent = error.message;
                    } finally {
                        submit.disabled = false;
                    }
                });

                card.append(
                    title, description, meta,
                    hintButton, hint, answer, submit, result
                );
                questionsBox.appendChild(card);
            }
        } catch (error) {
            questionsBox.textContent = error.message;
        }
    }

    async function loadStats() {
        const box = document.getElementById("practiceStats");
        try {
            const r = await fetch("/api/practice/stats/");
            if (!r.ok) throw new Error();
            const s = await r.json();

            box.textContent =
                `Attempts: ${s.total_attempts} | ` +
                `Solved attempts: ${s.solved_attempts} | ` +
                `Total score: ${s.total_score} | ` +
                `Accuracy: ${s.accuracy_percent}% | ` +
                `Unique questions solved: ${s.unique_questions_solved}`;
        } catch {
            box.textContent = "Statistics load nahi ho sake.";
        }
    }

    async function loadHistory() {
        const box = document.getElementById("practiceHistory");
        try {
            const r = await fetch("/api/practice/history/");
            if (!r.ok) throw new Error();
            const data = await r.json();

            box.replaceChildren();

            if (!data.history.length) {
                box.textContent = "Abhi koi attempt nahi hai.";
                return;
            }

            data.history.forEach(item => {
                const p = document.createElement("p");
                p.textContent =
                    `${item.question_title}: ${item.is_correct ? "Correct" : "Incorrect"} · ` +
                    `${item.score} points`;
                box.appendChild(p);
            });
        } catch {
            box.textContent = "History load nahi ho saki.";
        }
    }

    difficulty.addEventListener("change", loadQuestions);
    loadQuestions();
    loadStats();
    loadHistory();
});
