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


(() => {
    const display = document.getElementById("timer-display");
    const subjectInput = document.getElementById("timer-subject");
    const minutesInput = document.getElementById("timer-minutes");
    const startButton = document.getElementById("timer-start");
    const pauseButton = document.getElementById("timer-pause");
    const resetButton = document.getElementById("timer-reset");
    const message = document.getElementById("timer-message");

    if (!display || !subjectInput || !minutesInput ||
        !startButton || !pauseButton || !resetButton || !message) {
        return;
    }

    let remaining = 25 * 60;
    let interval = null;
    let running = false;
    let sessionSaved = false;

    function renderTime() {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        display.textContent =
            `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    function resetTimer() {
        clearInterval(interval);
        interval = null;
        running = false;
        sessionSaved = false;

        const minutes = Number(minutesInput.value);
        remaining = Number.isInteger(minutes) && minutes > 0
            ? minutes * 60
            : 25 * 60;

        renderTime();
        message.textContent = "";
    }

    minutesInput.addEventListener("change", resetTimer);

    startButton.addEventListener("click", () => {
        if (running || remaining <= 0) return;

        if (!subjectInput.value.trim()) {
            message.textContent = "Pehle subject enter karo.";
            subjectInput.focus();
            return;
        }

        running = true;
        message.textContent = "Study session chal raha hai...";

        interval = setInterval(async () => {
            remaining--;
            renderTime();

            if (remaining <= 0) {
                clearInterval(interval);
                interval = null;
                running = false;

                if (sessionSaved) return;
                sessionSaved = true;

                message.textContent = "Timer complete! Session save ho raha hai...";

                try {
                    const response = await fetch("/api/timer/save/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            subject: subjectInput.value.trim(),
                            duration_minutes: Number(minutesInput.value),
                            notes: "Completed using Study Timer"
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.error || "Session save failed");
                    }

                    message.textContent = "Timer complete! Study session saved.";
                } catch (error) {
                    message.textContent =
                        "Timer complete, lekin save nahi hua: " + error.message;
                }
            }
        }, 1000);
    });

    pauseButton.addEventListener("click", () => {
        clearInterval(interval);
        interval = null;
        running = false;
        message.textContent = "Timer paused.";
    });

    resetButton.addEventListener("click", resetTimer);

    renderTime();
})();


(() => {
    const historyList = document.getElementById("history-list");
    const historyMessage = document.getElementById("history-message");

    if (!historyList || !historyMessage) return;

    async function loadStudyHistory() {
        historyMessage.textContent = "Loading study sessions...";
        historyList.replaceChildren();

        try {
            const response = await fetch("/api/study-sessions/");
            if (!response.ok) throw new Error("Could not load history");

            const data = await response.json();
            const sessions = data.sessions || [];

            if (sessions.length === 0) {
                historyMessage.textContent = "Abhi koi study session nahi hai.";
                return;
            }

            historyMessage.textContent =
                `${sessions.length} study session${sessions.length === 1 ? "" : "s"} found`;

            sessions.slice().reverse().forEach((session) => {
                const card = document.createElement("article");
                card.className = "history-card";

                const details = document.createElement("div");
                details.className = "history-details";

                const subject = document.createElement("h3");
                subject.textContent = session.subject;

                const date = document.createElement("p");
                date.textContent = `Date: ${session.session_date}`;

                const notes = document.createElement("p");
                notes.textContent = session.notes || "No notes";

                const duration = document.createElement("span");
                duration.className = "history-duration";
                duration.textContent = `${session.duration_minutes} min`;

                details.append(subject, date, notes);
                card.append(details, duration);
                historyList.appendChild(card);
            });
        } catch (error) {
            historyMessage.textContent =
                "History load nahi hui. Server aur API check karo.";
        }
    }

    loadStudyHistory();
})();


async function loadGoalProgress() {
    const message = document.getElementById("goal-progress-message");
    const list = document.getElementById("goal-progress-list");

    try {
        const response = await fetch("/api/study-goals/progress/");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to load goal progress");
        }

        list.replaceChildren();

        if (!data.goals || data.goals.length === 0) {
            message.textContent = "No study goals found. Add a goal to track your progress.";
            return;
        }

        message.textContent = "Your planned vs actual study time";

        data.goals.forEach((goal) => {
            const card = document.createElement("div");
            card.className = "goal-progress-card";

            const title = document.createElement("h3");
            title.textContent = goal.title;

            const type = document.createElement("p");
            type.textContent = "Goal type: " + goal.goal_type;

            const dates = document.createElement("p");
            dates.textContent = goal.start_date + " to " + goal.end_date;

            const time = document.createElement("p");
            time.textContent =
                "Planned: " + goal.target_minutes + " min | Actual: " +
                goal.actual_minutes + " min";

            const remaining = document.createElement("p");
            remaining.textContent =
                "Remaining: " + goal.remaining_minutes + " min";

            const progress = document.createElement("p");
            progress.textContent = "Progress: " + goal.progress_percent + "%";

            const bar = document.createElement("div");
            bar.className = "goal-progress-bar";

            const fill = document.createElement("div");
            fill.className = "goal-progress-fill";
            fill.style.width = goal.progress_percent + "%";

            bar.appendChild(fill);
            card.append(title, type, dates, time, remaining, progress, bar);
            list.appendChild(card);
        });
    } catch (error) {
        message.textContent = "Could not load goal progress. Check the API and try again.";
        console.error("Goal progress error:", error);
    }
}

loadGoalProgress();


/* ===== SkillTrack AI - Study Tasks and XP ===== */
(() => {
    const form = document.getElementById("study-task-form");
    const list = document.getElementById("study-task-list");
    const message = document.getElementById("task-message");

    if (!form || !list || !message) return;

    const titleInput = document.getElementById("task-title");
    const descriptionInput = document.getElementById("task-description");
    const priorityInput = document.getElementById("task-priority");
    const submitButton = form.querySelector('button[type="submit"]');

    async function apiRequest(url, options = {}) {
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        const csrfToken = getCookie("csrftoken");
        if (csrfToken) {
            headers["X-CSRFToken"] = csrfToken;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || `Request failed (${response.status})`);
        }

        return data;
    }

    async function loadXP() {
        try {
            const profile = await apiRequest("/api/xp/profile/");
            const totalXP = document.getElementById("total-xp");
            const level = document.getElementById("player-level");
            const nextXP = document.getElementById("xp-for-next-level");

            // Update the XP card only if these elements exist.
            if (totalXP) totalXP.textContent = profile.total_xp;
            if (level) level.textContent = profile.level;
            if (nextXP) {
                nextXP.textContent = profile.xp_for_next_level;
            }

            const progressBar = document.getElementById("xp-progress-fill");

            if (progressBar) {
                const xpInLevel = profile.total_xp % 100;
                const progress = (xpInLevel / 100) * 100;

                progressBar.style.width = `${progress}%`;
            }
            if (totalXP) totalXP.textContent = profile.total_xp;
            if (level) level.textContent = profile.level;
            if (nextXP) nextXP.textContent = profile.xp_for_next_level;
        } catch (error) {
            console.error("Could not load XP profile:", error);
        }
    }

    function createTaskCard(task) {
        const card = document.createElement("article");
        card.className = "study-task-item";
        if (task.is_completed) card.classList.add("is-completed");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(task.is_completed);
        checkbox.setAttribute(
            "aria-label",
            `Complete task: ${task.title}`
        );

        const details = document.createElement("div");
        details.className = "task-details";

        const title = document.createElement("h3");
        title.className = "task-title";
        title.textContent = task.title;

        const description = document.createElement("p");
        description.className = "task-description";
        description.textContent = task.description || "No description";

        const priority = document.createElement("p");
        priority.className = "task-priority";
        priority.textContent = `Priority: ${task.priority}`;

        details.append(title, description, priority);
        card.append(checkbox, details);

        checkbox.addEventListener("change", async () => {
            checkbox.disabled = true;
            message.textContent = "Updating task...";

            try {
                const result = await apiRequest(
                    `/api/tasks/${task.id}/`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({
                            is_completed: checkbox.checked
                        })
                    }
                );

                message.textContent = result.xp_earned > 0
                    ? `Task completed! You earned ${result.xp_earned} XP.`
                    : checkbox.checked
                        ? "Task completed. No additional XP earned."
                        : "Task marked incomplete.";
                if (result.level_up) {
                    message.textContent += " 🎉 Level Up! Congratulations!";
                }

                await loadTasks();
                await loadXP();
            } catch (error) {
                checkbox.checked = !checkbox.checked;
                message.textContent = error.message;
            } finally {
                checkbox.disabled = false;
            }
        });

        return card;
    }

    async function loadTasks() {
        list.textContent = "Loading tasks...";

        try {
            const data = await apiRequest("/api/tasks/");
            const tasks = data.tasks || [];

            list.replaceChildren();

            if (tasks.length === 0) {
                list.textContent = "No tasks yet. Add your first study task!";
                return;
            }

            tasks.forEach(task => {
                list.appendChild(createTaskCard(task));
            });
        } catch (error) {
            list.textContent = "Could not load tasks: " + error.message;
        }
    }

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const title = titleInput.value.trim();
        if (!title) {
            message.textContent = "Please enter a task title.";
            return;
        }

        submitButton.disabled = true;
        message.textContent = "Creating task...";

        try {
            await apiRequest("/api/tasks/", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    description: descriptionInput.value.trim(),
                    priority: priorityInput.value
                })
            });

            form.reset();
            priorityInput.value = "medium";
            message.textContent = "Task created successfully!";

            await loadTasks();
        } catch (error) {
            message.textContent = "Could not create task: " + error.message;
        } finally {
            submitButton.disabled = false;
        }
    });

    loadTasks();
    loadXP();
})();

async function loadAchievements() {
    const container = document.getElementById("achievements-list");

    if (!container) return;

    try {
        const response = await fetch("/api/achievements/");

        if (!response.ok) {
            throw new Error("Failed to load achievements");
        }

        const data = await response.json();
        container.innerHTML = "";

        if (data.achievements.length === 0) {
            container.textContent = "No badges unlocked yet. Keep learning!";
            return;
        }

        data.achievements.forEach((achievement) => {
            const badge = document.createElement("div");
            badge.className = "achievement-item";

            const title = document.createElement("h3");
            title.textContent = `🏅 ${achievement.title}`;

            const description = document.createElement("p");
            description.textContent = achievement.description;

            const reward = document.createElement("p");
            reward.textContent = `XP Reward: ${achievement.xp_reward}`;

            badge.append(title, description, reward);
            container.appendChild(badge);
        });
    } catch (error) {
        container.textContent = "Could not load achievements. Please try again.";
        console.error("Achievement loading error:", error);
    }
}

loadAchievements();