
const statusEl = document.getElementById("status");
const messageEl = document.getElementById("message");
const replyEl = document.getElementById("reply");
const sendButton = document.getElementById("send");
const newChatButton = document.getElementById("new-chat");
const clearHistoryButton = document.getElementById("clear-history");
const historyList = document.getElementById("history-list");
const copyAnswerButton = document.getElementById("copy-answer");

const HISTORY_KEY = "skilltrack_tutor_history";
const MAX_HISTORY = 30;

let chatHistory = loadHistory();

function getCookie(name) {
    const prefix = name + "=";
    const item = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(prefix));

    return item ? decodeURIComponent(item.slice(prefix.length)) : "";
}

function loadHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

function saveHistory() {
    try {
        localStorage.setItem(
            HISTORY_KEY,
            JSON.stringify(chatHistory.slice(0, MAX_HISTORY))
        );
    } catch {
        statusEl.textContent = "Could not save chat history in this browser.";
    }
}

function renderHistory() {
    historyList.replaceChildren();

    if (!chatHistory.length) {
        const empty = document.createElement("p");
        empty.className = "history-empty";
        empty.textContent = "Your recent chats will appear here.";
        historyList.appendChild(empty);
        return;
    }

    chatHistory.forEach((chat) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "history-item";
        button.textContent = chat.question.slice(0, 65);
        button.title = chat.question;

        button.addEventListener("click", () => {
            messageEl.value = chat.question;
            renderAnswer(chat.answer);
            statusEl.textContent = "Previous answer loaded from chat history.";
        });

        historyList.appendChild(button);
    });
}

function renderAnswer(answer) {
    if (window.marked && window.DOMPurify) {
        replyEl.innerHTML = DOMPurify.sanitize(marked.parse(answer));
        addCopyCodeButtons();
    } else {
        replyEl.textContent = answer;
    }
}

function addCopyCodeButtons() {
    replyEl.querySelectorAll("pre").forEach((pre) => {
        if (pre.querySelector(".copy-code")) return;

        const code = pre.querySelector("code");
        if (!code) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "copy-code";
        button.textContent = "Copy code";

        button.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(code.innerText);
                button.textContent = "Copied!";
                setTimeout(() => {
                    button.textContent = "Copy code";
                }, 1500);
            } catch {
                button.textContent = "Copy failed";
            }
        });

        pre.appendChild(button);
    });
}

async function copyAnswer() {
    const text = replyEl.innerText || replyEl.textContent || "";

    if (!text.trim()) {
        statusEl.textContent = "There is no answer to copy yet.";
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        statusEl.textContent = "Answer copied.";
    } catch {
        statusEl.textContent = "Copy failed. Please select and copy manually.";
    }
}

async function checkStatus() {
    try {
        const response = await fetch("/tutor/status/", {
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) throw new Error("Status check failed.");

        const data = await response.json();

        statusEl.textContent = data.available
            ? "Gemini API key detected."
            : "Gemini key not detected. Check your .env file.";
    } catch {
        statusEl.textContent = "Could not check the AI connection.";
    }
}

function startNewChat() {
    if (sendButton.disabled) return;

    messageEl.value = "";
    renderAnswer("Your answer will appear here.");
    statusEl.textContent = "New chat ready.";
    messageEl.focus();
}

async function sendMessage() {
    const message = messageEl.value.trim();

    if (!message) {
        replyEl.textContent = "Please type a question first.";
        messageEl.focus();
        return;
    }

    if (message.length > 3000) {
        replyEl.textContent = "Message must be 3000 characters or less.";
        return;
    }

    sendButton.disabled = true;
    replyEl.textContent = "Gemini is thinking...";
    statusEl.textContent = "Sending your question...";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
        const response = await fetch("/tutor/chat/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify({
                message,
                language: document.getElementById("language").value,
                mode: document.getElementById("mode").value
            }),
            signal: controller.signal
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || data.reply ||
                `Request failed (${response.status}).`
            );
        }

        const answer = data.reply || "No answer received.";
        renderAnswer(answer);

        chatHistory.unshift({
            question: message,
            answer,
            date: new Date().toISOString()
        });

        chatHistory = chatHistory.slice(0, MAX_HISTORY);
        saveHistory();
        renderHistory();

        statusEl.textContent = data.mode === "ai"
            ? "Connected to Gemini."
            : "Fallback response — check API settings.";
    } catch (error) {
        replyEl.textContent = error.name === "AbortError"
            ? "AI is taking too long. Please try again."
            : error.message || "Something went wrong. Please try again.";

        statusEl.textContent = "Request failed. Check the VS Code terminal.";
    } finally {
        clearTimeout(timeoutId);
        sendButton.disabled = false;
    }
}

sendButton.addEventListener("click", sendMessage);
newChatButton.addEventListener("click", startNewChat);
copyAnswerButton.addEventListener("click", copyAnswer);

clearHistoryButton.addEventListener("click", () => {
    if (!confirm("Clear all saved tutor chat history from this browser?")) {
        return;
    }

    chatHistory = [];
    saveHistory();
    renderHistory();
    statusEl.textContent = "Chat history cleared.";
});

messageEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (!sendButton.disabled) sendMessage();
    }
});

renderHistory();
checkStatus();
