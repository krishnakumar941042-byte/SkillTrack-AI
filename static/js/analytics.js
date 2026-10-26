
(() => {
    "use strict";

    const endpoint = "/analytics/api/";
    const charts = {};

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function renderList(id, topics) {
        const list = document.getElementById(id);
        if (!list) return;

        list.replaceChildren();

        if (!topics || topics.length === 0) {
            const item = document.createElement("li");
            item.textContent = "Abhi data nahi hai. Pehle kuch quiz questions attempt karo.";
            list.appendChild(item);
            return;
        }

        topics.forEach((topic) => {
            const item = document.createElement("li");
            item.textContent =
                `${topic.title} — ${topic.accuracy}% accuracy (${topic.attempts} attempts)`;
            list.appendChild(item);
        });
    }

    function drawChart(canvasId, type, labels, datasets, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === "undefined") return;

        if (charts[canvasId]) {
            charts[canvasId].destroy();
        }

        charts[canvasId] = new Chart(canvas, {
            type,
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: type !== "bar" },
                },
                scales: type === "doughnut" ? {} : {
                    y: { beginAtZero: true },
                },
                ...options,
            },
        });
    }

    async function loadAnalytics() {
        try {
            const response = await fetch(endpoint, {
                headers: { Accept: "application/json" },
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`Analytics request failed: ${response.status}`);
            }

            const data = await response.json();

            setText("monthly-hours", data.monthly_hours ?? 0);
            setText("monthly-minutes", `${data.monthly_minutes ?? 0} minutes studied`);
            setText("monthly-accuracy", `${data.month_accuracy ?? 0}%`);
            setText("monthly-quiz-count", `${data.month_attempts ?? 0} attempts`);
            setText("analytics-level", data.level ?? 1);
            setText("analytics-xp", data.total_xp ?? 0);
            setText("lessons-completed", data.completed_lessons ?? 0);
            setText("lessons-total", `${data.total_lessons ?? 0} total lessons`);

            drawChart(
                "weeklyProgressChart",
                "bar",
                data.weekly_labels || [],
                [{
                    label: "Study minutes",
                    data: data.weekly_minutes || [],
                    borderWidth: 1,
                }]
            );

            drawChart(
                "topicAccuracyChart",
                "bar",
                data.topic_labels || [],
                [{
                    label: "Accuracy (%)",
                    data: data.topic_accuracy || [],
                    borderWidth: 1,
                }],
                {
                    indexAxis: "y",
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 100,
                        },
                    },
                }
            );

            drawChart(
                "monthlyStudyChart",
                "line",
                data.month_labels || [],
                [{
                    label: "Study minutes",
                    data: data.month_minutes || [],
                    tension: 0.3,
                    fill: false,
                }]
            );

            renderList("strong-topics-list", data.strong_topics);
            renderList("weak-topics-list", data.weak_topics);
        } catch (error) {
            console.error("Could not load analytics:", error);
            renderList("strong-topics-list", []);
            renderList("weak-topics-list", []);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadAnalytics();

        const refreshButton = document.getElementById("refreshAnalytics");
        if (refreshButton) {
            refreshButton.addEventListener("click", loadAnalytics);
        }
    });
})();
