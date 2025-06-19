let chatHistoryList = document.getElementById("chat-history");
let newChatBtn = document.getElementById("new-chat");
let sidebar = document.getElementById('sidebar');
let mainArea = document.querySelector('.main-area');
let prompt = document.querySelector("#prompt");
let submitbtn = document.getElementById("submit");
let menuBtn = document.getElementById('menu-btn');

let chatHistory = JSON.parse(localStorage.getItem("masai_ai_chat_history") || "[]");
let currentChatIndex = chatHistory.length - 1;

function saveChatHistory() {
    localStorage.setItem("masai_ai_chat_history", JSON.stringify(chatHistory));
}

function renderChatHistory() {
    chatHistoryList.innerHTML = "";
    chatHistory.forEach((chat, idx) => {
        const li = document.createElement("li");
        li.textContent = chat.title || `Chat ${idx + 1}`;
        li.className = idx === currentChatIndex ? "active" : "";
        li.onclick = () => {
            currentChatIndex = idx;
            renderChatHistory();
            renderChatContent();
        };
        chatHistoryList.appendChild(li);
    });
}

function renderChatContent() {
    let chat = chatHistory[currentChatIndex];
    let responseContainer = document.getElementById("response-container");
    if (!chat || !chat.messages.length) {
        responseContainer.innerHTML = '<div class="bubble ai">Start a conversation...</div>';
        return;
    }
    responseContainer.innerHTML = chat.messages.map(m =>
        `<div class="message-row ${m.role}"><div class="bubble ${m.role}">${m.text}</div></div>`
    ).join("");
    responseContainer.scrollTop = responseContainer.scrollHeight;
}

function startNewChat() {
    chatHistory.push({ title: 'New Chat', messages: [] });
    currentChatIndex = chatHistory.length - 1;
    saveChatHistory();
    renderChatHistory();
    renderChatContent();
}

newChatBtn.addEventListener("click", startNewChat);

// Sidebar toggle
function closeSidebar() {
    sidebar.classList.add('closed');
    mainArea.classList.add('full');
}
function openSidebar() {
    sidebar.classList.remove('closed');
    mainArea.classList.remove('full');
}
function toggleSidebar() {
    if (sidebar.classList.contains('closed')) {
        openSidebar();
    } else {
        closeSidebar();
    }
}
menuBtn.addEventListener('click', toggleSidebar);
if (window.innerWidth < 900) closeSidebar();
window.addEventListener('resize', () => {
    if (window.innerWidth < 900) closeSidebar();
    else openSidebar();
});

const Api_Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDhDhiKFkaYAp-o0lGL4e4uJSYIJSh6paY";
let user = { message: null };

async function generateResponse() {
    let RequestOption = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            "contents": [
                { "parts": [{ text: user.message }] }
            ]
        })
    };
    try {
        let response = await fetch(Api_Url, RequestOption);
        let data = await response.json();
        let apiResponse = data.candidates[0].content.parts[0].text.trim();
        handleAIResponse(apiResponse);
    } catch (error) {
        console.log(error);
        handleAIResponse("Sorry, something went wrong.");
    }
}

function handlechatResponse(userMessage) {
    user.message = userMessage;
    prompt.value = "";
    if (!chatHistory[currentChatIndex]) startNewChat();
    chatHistory[currentChatIndex].messages.push({ role: "user", text: userMessage });
    // Update chat title if it's still 'New Chat' or default
    let chat = chatHistory[currentChatIndex];
    if (chat.title === 'New Chat' || chat.title.startsWith('Chat ')) {
        // Pick a random line from the conversation so far (user or ai)
        let allLines = chat.messages.map(m => m.text).filter(Boolean);
        if (allLines.length > 0) {
            let randomLine = allLines[Math.floor(Math.random() * allLines.length)];
            chat.title = randomLine.length > 30 ? randomLine.slice(0, 30) + '...' : randomLine;
        }
    }
    saveChatHistory();
    renderChatHistory();
    renderChatContent();
    generateResponse();
}

function handleAIResponse(responseText) {
    // Replace 'Google' with 'Narsi Jangid' in the AI response
    let filteredResponse = responseText.replace(/Google/g, 'Orbito Ai and CEO Narsi jangid');
    if (chatHistory[currentChatIndex]) {
        chatHistory[currentChatIndex].messages.push({ role: "ai", text: filteredResponse });
        saveChatHistory();
        typeWriterEffect(filteredResponse, () => {});
    }
}

function typeWriterEffect(text, callback) {
    let responseContainer = document.getElementById("response-container");
    let chat = chatHistory[currentChatIndex];
    let idx = 0;
    function type() {
        if (!chat || !chat.messages.length) return;
        let partial = text.slice(0, idx + 1);
        // Render all previous messages, but last AI message is partial
        responseContainer.innerHTML = chat.messages.slice(0, -1).map(m =>
            `<div class="message-row ${m.role}"><div class="bubble ${m.role}">${m.text}</div></div>`
        ).join("") + `<div class="message-row ai"><div class="bubble ai">${partial}</div></div>`;
        responseContainer.scrollTop = responseContainer.scrollHeight;
        if (idx < text.length - 1) {
            idx++;
            setTimeout(type, 18); // typing speed
        } else if (callback) {
            callback();
        }
    }
    type();
}

prompt.addEventListener("keydown", (e) => {
    if (e.key == "Enter") handlechatResponse(prompt.value);
});
submitbtn.addEventListener("click", () => handlechatResponse(prompt.value));

// On load
if (chatHistory.length === 0) startNewChat();
else { renderChatHistory(); renderChatContent(); }