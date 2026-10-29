
document.addEventListener("DOMContentLoaded", async () => {
    async function getJSON(url) {
        const response = await fetch(url);
        const type = response.headers.get("content-type") || "";

        if (!type.includes("application/json")) {
            throw new Error(`Unexpected server response (${response.status}).`);
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

    async function loadProfile() {
        const [profile, missionsData, achievementsData] = await Promise.all([
            getJSON("/api/xp/profile/"),
            getJSON("/api/daily-missions/"),
            getJSON("/api/achievements/")
        ]);

        document.getElementById("achievement-xp").textContent = profile.total_xp;
        document.getElementById("achievement-level").textContent = profile.level;
        document.getElementById("achievement-count").textContent =
            achievementsData.total_unlocked;

        // Display streak only if the API provides it.
        if (profile.current_streak !== undefined) {
            document.getElementById("achievement-streak").textContent =
                `${profile.current_streak} days`;
        } else {
            document.getElementById("achievement-streak").textContent =
                "Not available";
        }

        const missionList = document.getElementById("daily-missions-list");
        missionList.replaceChildren();

        const missions = missionsData.missions || [];
        document.getElementById("mission-message").textContent =
            missions.length ? `${missions.length} mission(s) available.` :
            "No daily missions added yet.";

        missions.forEach(mission => {
            const card = document.createElement("article");
            card.className = "lesson-row";

            addText(card, "h3", mission.title);
            addText(card, "p", mission.description);

            const target = Number(mission.target_count) || 0;
            const progress = Number(mission.progress_count) || 0;
            addText(
                card,
                "p",
                `Progress: ${progress}/${target} · Reward: ${mission.xp_reward} XP`
            );

            const bar = document.createElement("progress");
            bar.max = Math.max(target, 1);
            bar.value = Math.min(progress, bar.max);
            bar.setAttribute("aria-label", `${mission.title} progress`);
            card.append(bar);

            addText(
                card,
                "p",
                mission.is_completed ? "Completed ✓" : "Keep going!"
            );

            missionList.append(card);
        });

        const achievementList =
            document.getElementById("unlocked-achievements-list");
        achievementList.replaceChildren();

        const achievements = achievementsData.achievements || [];
        document.getElementById("achievement-message").textContent =
            achievements.length ? "Your unlocked milestones:" :
            "No achievements unlocked yet. Keep completing study tasks!";

        achievements.forEach(achievement => {
            const card = document.createElement("article");
            card.className = "lesson-row";

            addText(card, "h3", `🏆 ${achievement.title}`);
            addText(card, "p", achievement.description);
            addText(card, "p", `XP reward: ${achievement.xp_reward}`);
            addText(
                card,
                "p",
                `Unlocked: ${new Date(achievement.unlocked_at).toLocaleDateString()}`
            );

            achievementList.append(card);
        });
    }

    try {
        await loadProfile();
    } catch (error) {
        document.getElementById("achievement-message").textContent =
            `Could not load achievements: ${error.message}`;
        document.getElementById("mission-message").textContent =
            "Please check the Django server and API endpoints.";
    }
});
