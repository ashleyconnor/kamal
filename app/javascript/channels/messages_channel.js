import consumer from "channels/consumer";

class ChatApp {
  constructor() {
    this.cable = consumer;
    this.currentUserEmail = "#{j(current_user.email_address)}";
    this.typingTimeout = null;
    this.typingUsers = new Set();

    this.initializeElements();
    this.setupChannel();
    this.setupEventListeners();
  }

  initializeElements() {
    this.currentUserId = Number(
      document.getElementById("current-user-id")?.dataset?.userId
    );
    this.messagesContainer = document.getElementById("messages");
    this.messageInput = document.getElementById("message-input");
    this.sendButton = document.getElementById("send-button");
    this.onlineCount = document.getElementById("online-count");
    this.onlineUsersList = document.getElementById("online-users-list");
    this.typingIndicators = document.getElementById("typing-indicators");
  }

  setupChannel() {
    this.chatChannel = this.cable.subscriptions.create("MessagesChannel", {
      received: (data) => this.handleMessage(data),
      connected: () => console.log("Connected to chat"),
      disconnected: () => this.disconnect(),
    });
  }

  disconnect() {
    if (this.chatChannel) {
      this.chatChannel.unsubscribe();
      this.chatChannel = null;
    }
  }

  setupEventListeners() {
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendMessage();
      } else {
        this.handleTyping();
      }
    });

    this.messageInput.addEventListener("input", () => {
      this.handleTyping();
    });

    this.sendButton.addEventListener("click", () => {
      this.sendMessage();
    });
  }

  handleMessage(data) {
    switch (data.type) {
      case "message":
        this.addMessage(data);
        break;
      case "online_count":
        this.updateOnlineCount(data);
        break;
      case "user_joined":
        this.addSystemMessage(`${data.user.email} joined the chat`);
        break;
      case "user_left":
        this.addSystemMessage(`${data.user.email} left the chat`);
        break;
      case "typing":
        this.handleTypingIndicator(data);
        break;
    }
  }

  sendMessage() {
    const message = this.messageInput.value.trim();
    if (message) {
      this.chatChannel.perform("speak", { message: message });
      this.messageInput.value = "";
      this.stopTyping();
    }
  }

  addMessage(data) {
    const messageDiv = document.createElement("div");
    const isOwnMessage = data.user.id === this.currentUserId;

    messageDiv.className = `flex flex-col max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl ${
      isOwnMessage ? "self-end" : "self-start"
    }`;

    const time = new Date(data.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    messageDiv.innerHTML = `
      <div class="text-xs text-gray-500 mb-1 ${
        isOwnMessage ? "text-right" : "text-left"
      }">
        ${data.user.email} - ${time}
      </div>
      <div class="px-4 py-2 rounded-2xl break-words ${
        isOwnMessage
          ? "bg-blue-600 text-white rounded-br-sm"
          : "bg-gray-200 text-gray-800 rounded-bl-sm"
      }">
        ${this.escapeHtml(data.content)}
      </div>
    `;

    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  addSystemMessage(text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "text-center text-sm text-gray-500 italic py-2";
    messageDiv.textContent = text;
    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  updateOnlineCount(data) {
    const count = data.count;
    this.onlineCount.textContent = `${count} user${
      count !== 1 ? "s" : ""
    } online`;

    this.onlineUsersList.innerHTML = data.users
      .map(
        (user) =>
          `<div class="px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
        ${user.email} ${
            user.id === this.currentUserId
              ? '<span class="text-blue-600 font-medium">(you)</span>'
              : ""
          }
        </div>`
      )
      .join("");
  }

  handleTyping() {
    if (!this.isTyping) {
      this.isTyping = true;
      this.chatChannel.perform("typing", { is_typing: true });
    }

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 2000);
  }

  stopTyping() {
    if (this.isTyping) {
      this.isTyping = false;
      this.chatChannel.perform("typing", { is_typing: false });
    }
    clearTimeout(this.typingTimeout);
  }

  handleTypingIndicator(data) {
    if (data.user.id === this.currentUserId) return;

    if (data.is_typing) {
      this.typingUsers.add(data.user.email);
    } else {
      this.typingUsers.delete(data.user.email);
    }

    this.updateTypingIndicator();
  }

  updateTypingIndicator() {
    const typingArray = Array.from(this.typingUsers);
    let text = "";

    if (typingArray.length === 1) {
      text = `${typingArray[0]} is typing...`;
    } else if (typingArray.length === 2) {
      text = `${typingArray[0]} and ${typingArray[1]} are typing...`;
    } else if (typingArray.length > 2) {
      text = `${typingArray.length} people are typing...`;
    }

    if (text) {
      this.typingIndicators.innerHTML = `<div class="px-4 py-2 text-sm text-gray-500 italic">${text}</div>`;
    } else {
      this.typingIndicators.innerHTML = "";
    }
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener("turbo:load", () => {
  if (document.getElementById("chat") && !window.chatApp) {
    window.chatApp = new ChatApp();
  }
});

document.addEventListener("turbo:before-cache", () => {
  if (window.chatApp) {
    window.chatApp.disconnect();
    window.chatApp = null;
  }
});
