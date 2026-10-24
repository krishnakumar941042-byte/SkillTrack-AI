
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
