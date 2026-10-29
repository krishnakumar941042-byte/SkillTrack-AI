
document.addEventListener("DOMContentLoaded", () => {
    const message = document.getElementById("learning-page-message");
    const container = document.getElementById("learning-page-courses");

    if (!message || !container) return;

    async function loadCourses() {
        try {
            const response = await fetch("/api/courses/");
            if (!response.ok) throw new Error("Could not load courses.");

            const data = await response.json();
            container.replaceChildren();

            if (!data.courses || data.courses.length === 0) {
                message.textContent = "No courses available yet. Add a course in Django Admin.";
                return;
            }

            message.textContent = `${data.courses.length} course(s) available.`;

            data.courses.forEach(course => {
                const card = document.createElement("article");
                card.className = "stat-card";

                const title = document.createElement("h3");
                title.textContent = course.title;

                const description = document.createElement("p");
                description.textContent = course.description || "No description available.";

                const instructor = document.createElement("p");
                instructor.textContent = `Instructor: ${course.instructor}`;

                const progress = document.createElement("p");
                const percent = course.total_lessons
                    ? Math.round(course.completed_lessons * 100 / course.total_lessons)
                    : 0;
                progress.textContent =
                    `Progress: ${course.completed_lessons}/${course.total_lessons} lessons (${percent}%)`;

                const button = document.createElement("button");
                button.type = "button";
                button.className = "btn btn-primary";
                button.textContent = "View Lessons";

                const details = document.createElement("div");
                details.hidden = true;

                button.addEventListener("click", async () => {
                    if (!details.hidden) {
                        details.hidden = true;
                        button.textContent = "View Lessons";
                        return;
                    }

                    button.disabled = true;
                    button.textContent = "Loading lessons...";

                    try {
                        const result = await fetch(`/api/courses/${course.id}/`);
                        const courseData = await result.json();
                        if (!result.ok) throw new Error(courseData.error || "Unable to load lessons.");

                        details.replaceChildren();

                        if (!courseData.lessons.length) {
                            const empty = document.createElement("p");
                            empty.textContent = "No lessons added to this course yet.";
                            details.append(empty);
                        }

                        courseData.lessons.forEach(lesson => {
                            const lessonRow = document.createElement("div");
                            lessonRow.className = "lesson-row";

                            const lessonTitle = document.createElement("h4");
                            lessonTitle.textContent = `${lesson.order}. ${lesson.title}`;

                            const lessonContent = document.createElement("p");
                            lessonContent.textContent = lesson.content || "No lesson content yet.";

                            const status = document.createElement("p");
                            status.textContent = lesson.is_completed ? "Completed ✓" : "Not completed yet";

                            const completeButton = document.createElement("button");
                            completeButton.type = "button";
                            completeButton.className = "btn btn-primary";
                            completeButton.textContent = lesson.is_completed
                                ? "Mark Incomplete"
                                : "Mark Complete";

                            completeButton.addEventListener("click", async () => {
                                completeButton.disabled = true;

                                try {
                                    const update = await fetch(`/api/lessons/${lesson.id}/complete/`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            is_completed: !lesson.is_completed
                                        })
                                    });

                                    const updateData = await update.json();
                                    if (!update.ok) {
                                        throw new Error(updateData.error || "Could not update progress.");
                                    }

                                    await loadCourses();
                                } catch (error) {
                                    alert(error.message);
                                    completeButton.disabled = false;
                                }
                            });

                            lessonRow.append(lessonTitle, lessonContent, status, completeButton);
                            details.append(lessonRow);
                        });

                        details.hidden = false;
                        button.textContent = "Hide Lessons";
                    } catch (error) {
                        alert(error.message);
                        button.textContent = "View Lessons";
                    } finally {
                        button.disabled = false;
                    }
                });

                card.append(title, description, instructor, progress, button, details);
                container.append(card);
            });
        } catch (error) {
            message.textContent = `${error.message} Check that the Django server is running.`;
        }
    }

    loadCourses();
});
