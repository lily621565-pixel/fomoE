const engine = window.FomoMentorEngine;

const chatLog = document.getElementById("chat-log");
const composerForm = document.getElementById("composer-form");
const messageInput = document.getElementById("message-input");
const sendMessageButton = document.getElementById("send-message");
const restartChatButton = document.getElementById("restart-chat");
const exportTranscriptButton = document.getElementById("export-transcript");

const DEFAULT_SETUP = {
  scenario: "counter",
  persona: "young_hustler",
  objection: "ask_friends",
  context: ""
};

let state = engine.createEmptyConversation(DEFAULT_SETUP);

function autoResizeTextarea() {
  messageInput.style.height = "auto";
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 180)}px`;
}

function createMessageNode(message) {
  const wrapper = document.createElement("article");
  wrapper.className = `message ${message.role}`;

  const shell = document.createElement("div");
  shell.className = "message-shell";

  const meta = document.createElement("div");
  meta.className = "message-meta";

  const name = document.createElement("span");
  name.className = "message-name";
  name.textContent = message.role === "mentor" ? "fomoE" : "你";
  meta.appendChild(name);

  if (message.meta) {
    const role = document.createElement("span");
    role.className = "message-role";
    role.textContent = message.meta;
    meta.appendChild(role);
  }

  const body = document.createElement("p");
  body.className = "message-copy";
  body.textContent = message.text;

  shell.appendChild(meta);
  shell.appendChild(body);
  wrapper.appendChild(shell);

  return wrapper;
}

function createEmptyStateHint() {
  const hint = document.createElement("section");
  hint.className = "empty-state";
  hint.innerHTML = `
    <div class="empty-state-copy">
      <strong>直接開聊</strong>
      <p>把你的猶豫、抗拒、問題，或你想模擬的談件句子直接丟進來。這裡不會先跳預設台詞。</p>
    </div>
  `;
  return hint;
}

function renderMessages() {
  chatLog.innerHTML = "";

  if (!state.conversation.length) {
    chatLog.appendChild(createEmptyStateHint());
    return;
  }

  state.conversation.forEach((message) => {
    chatLog.appendChild(createMessageNode(message));
  });

  chatLog.scrollTop = chatLog.scrollHeight;
}

function resetConversation() {
  state = engine.createEmptyConversation(DEFAULT_SETUP);
  renderMessages();
  messageInput.value = "";
  autoResizeTextarea();
  messageInput.focus();
}

function sendCurrentMessage() {
  const trimmed = messageInput.value.trim();
  if (!trimmed) return;

  engine.advanceConversation(state, trimmed);
  messageInput.value = "";
  renderMessages();
  autoResizeTextarea();
  messageInput.focus();
}

function downloadTranscript() {
  const transcript = engine.exportTranscript(state);
  const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

  link.href = url;
  link.download = `fomoE-transcript-${stamp}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

composerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendCurrentMessage();
});

sendMessageButton.addEventListener("click", sendCurrentMessage);
restartChatButton.addEventListener("click", resetConversation);
exportTranscriptButton.addEventListener("click", downloadTranscript);

messageInput.addEventListener("input", autoResizeTextarea);
messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendCurrentMessage();
  }
});

autoResizeTextarea();
renderMessages();
