
document.addEventListener("DOMContentLoaded", () => {
    const taskForm = document.getElementById("planner-task-form");
    const taskList = document.getElementById("planner-task-list");
    const taskMessage = document.getElementById("planner-task-message");

    const sessionForm = document.getElementById("planner-session-form");
    const sessionList = document.getElementById("planner-session-list");
    const sessionMessage = document.getElementById("planner-session-message");

    if (!taskForm || !taskList || !sessionForm || !sessionList) return;

    async function requestJSON(url, options = {}) {
        const response = await fetch(url, options);
        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            throw new Error(`Server returned an unexpected response (${response.status}).`);
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Request failed (${response.status}).`);
        }

        return data;
    }

    function makeElement(tag, text, className = "") {
        const element = document.createElement(tag);
        element.textContent = text;

        if (className) element.className = className;
        return element;
    }

    function makeButton(text, action) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-primary";
        button.textContent = text;
        button.addEventListener("click", action);
        return button;
    }

    async function loadTasks() {
        try {
            const data = await requestJSON("/api/tasks/");
            const tasks = data.tasks || [];

            taskList.replaceChildren();

            document.getElementById("planner-total").textContent = tasks.length;
            document.getElementById("planner-completed").textContent =
                tasks.filter(task => task.is_completed).length;

            if (!tasks.length) {
                taskList.append(makeElement("p", "No tasks yet. Add your first study task above."));
                return;
            }

            tasks.forEach(task => {
                const card = document.createElement("article");
                card.className = "lesson-row";

                const title = makeElement(
                    "h3",
                    `${task.is_completed ? "✓ " : ""}${task.title}`
                );

                const description = makeElement(
                    "p",
                    task.description || "No description"
                );

                const priority = makeElement(
                    "p",
                    `Priority: ${task.priority} · Due: ${task.due_date || "Not set"}`
                );

                const status = makeElement(
                    "p",
                    task.is_completed ? "Completed" : "In progress"
                );

                const toggleButton = makeButton(
                    task.is_completed ? "Mark Incomplete" : "Mark Complete",
                    async () => {
                        toggleButton.disabled = true;

                        try {
                            const result = await requestJSON(
                                `/api/tasks/${task.id}/`,
                                {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        is_completed: !task.is_completed
                                    })
                                }
                            );

                            taskMessage.textContent =
                                `${result.message || "Task updated."}` +
                                (result.xp_earned ? ` You earned ${result.xp_earned} XP!` : "");

                            await loadTasks();
                        } catch (error) {
                            taskMessage.textContent = error.message;
                            toggleButton.disabled = false;
                        }
                    }
                );

                const deleteButton = makeButton("Delete", async () => {
                    if (!window.confirm(`Delete "${task.title}"?`)) return;

                    deleteButton.disabled = true;

                    try {
                        await requestJSON(`/api/tasks/${task.id}/`, {
                            method: "DELETE"
                        });

                        taskMessage.textContent = "Task deleted.";
                        await loadTasks();
                    } catch (error) {
                        taskMessage.textContent = error.message;
                        deleteButton.disabled = false;
                    }
                });

                card.append(title, description, priority, status, toggleButton, deleteButton);
                taskList.append(card);
            });
        } catch (error) {
            taskList.textContent = `Could not load tasks: ${error.message}`;
        }
    }

    taskForm.addEventListener("submit", async event => {
        event.preventDefault();

        const title = document.getElementById("planner-task-title").value.trim();
        const description =
            document.getElementById("planner-task-description").value.trim();
        const dueDate = document.getElementById("planner-task-date").value;
        const priority = document.getElementById("planner-task-priority").value;
        const submitButton = taskForm.querySelector('button[type="submit"]');

        if (!title) {
            taskMessage.textContent = "Please enter a task title.";
            return;
        }

        submitButton.disabled = true;
        taskMessage.textContent = "Adding task...";

        try {
            await requestJSON("/api/tasks/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    due_date: dueDate || null,
                    priority
                })
            });

            taskForm.reset();
            document.getElementById("planner-task-priority").value = "medium";
            taskMessage.textContent = "Task added successfully.";
            await loadTasks();
        } catch (error) {
            taskMessage.textContent = error.message;
        } finally {
            submitButton.disabled = false;
        }
    });

    async function loadSessions() {
        try {
            const data = await requestJSON("/api/study-sessions/");
            const sessions = data.sessions || [];

            sessionList.replaceChildren();
            document.getElementById("planner-sessions-count").textContent =
                sessions.length;

            if (!sessions.length) {
                sessionList.append(makeElement("p", "No study sessions saved yet."));
                return;
            }

            sessions.slice().reverse().forEach(session => {
                const card = document.createElement("article");
                card.className = "lesson-row";

                card.append(
                    makeElement("h3", session.subject),
                    makeElement("p", `Duration: ${session.duration_minutes} minutes`),
                    makeElement("p", `Date: ${session.session_date}`),
                    makeElement("p", session.notes || "No notes")
                );

                sessionList.append(card);
            });
        } catch (error) {
            sessionList.textContent = `Could not load sessions: ${error.message}`;
        }
    }

    sessionForm.addEventListener("submit", async event => {
        event.preventDefault();

        const subject =
            document.getElementById("planner-session-subject").value.trim();
        const duration = Number(
            document.getElementById("planner-session-duration").value
        );
        const notes =
            document.getElementById("planner-session-notes").value.trim();
        const submitButton = sessionForm.querySelector('button[type="submit"]');

        if (!subject || !Number.isInteger(duration) || duration < 1 || duration > 1440) {
            sessionMessage.textContent = "Enter a subject and a duration from 1 to 1440 minutes.";
            return;
        }

        submitButton.disabled = true;
        sessionMessage.textContent = "Saving session...";

        try {
            await requestJSON("/api/study-sessions/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    duration_minutes: duration,
                    notes
                })
            });

            sessionForm.reset();
            document.getElementById("planner-session-duration").value = 30;
            sessionMessage.textContent = "Study session saved successfully.";
            await loadSessions();
        } catch (error) {
            sessionMessage.textContent = error.message;
        } finally {
            submitButton.disabled = false;
        }
    });

    loadTasks();
    loadSessions();
});
