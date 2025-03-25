/*******************************************************
 *  Simple Chatbot with Fallback Response System
 *  Tries the backend first, uses predefined answers if offline
 *******************************************************/

const BACKEND_CHAT_URL = "http://localhost:5000/chat";

// Grab references to all important DOM elements
const chatWindow    = document.getElementById("chatWindow");
const userInput     = document.getElementById("userInput");
const sendButton    = document.getElementById("sendButton");
const themeToggle   = document.getElementById("themeToggle");
const clearChatBtn  = document.getElementById("clearChat");
const offlineToggle = document.getElementById("offlineToggle");

// Store chat history and limit how many past messages are kept
let chatHistory = [];
const maxHistoryLength = 10;

// Control whether we connect to backend or use fallback (offline) mode
let isOfflineMode = false;

// Predefined responses for various topics, used if backend isn't available
const fallbackResponses = {
  greeting: [
    "Hello! How can I help you today?",
    "Hi there! What can I do for you?",
    "Greetings! Feel free to ask any question.",
    "Welcome! How may I assist you?"
  ],
  farewell: [
    "Goodbye! Have a great day!",
    "Take care! Come back anytime you have more questions.",
    "Farewell! It was nice chatting with you.",
    "Until next time! Stay safe."
  ],
  thanks: [
    "You're welcome! Need anything else?",
    "Happy to help! Feel free to ask another question.",
    "My pleasure! What else would you like to know?",
    "Glad I could assist you!"
  ],
  unknown: [
    "I'm not sure I understand. Can you rephrase?",
    "Could you provide more details, please?",
    "I didn't quite catch that. Could you clarify?",
    "I need more information to help you with that."
  ],
  technical: [
    "This might be a setup or configuration issue. Check your settings.",
    "A quick check of your network connection could help fix this.",
    "This type of issue can sometimes be fixed by restarting the app.",
    "Try these steps: 1) Clear cache, 2) Restart, 3) Update to the latest version."
  ],
  coding: [
    "Remember to handle asynchronous tasks properly (Promises or async/await).",
    "A design pattern like Observer or Factory might help in this situation.",
    "CSS flexbox could be a good choice for laying out your page.",
    "Have you considered using a framework like React or Vue?"
  ],
  project: [
    "User authentication adds security to your project. Consider it.",
    "Showcasing both front-end and back-end work is great for a portfolio.",
    "Always include a README to document your project's setup and features.",
    "Try adding unit tests to show your testing skills."
  ],
  career: [
    "A diverse project portfolio stands out to employers.",
    "Keep learning—new frameworks and languages can boost your career.",
    "Networking is just as important as coding. Join developer communities.",
    "Soft skills like communication and teamwork are highly valued."
  ],
  weather: [
    "I don't have real-time weather data. A dedicated weather service can help.",
    "Apps like AccuWeather or The Weather Channel might be what you need.",
    "Local conditions vary, so check a reputable forecast source.",
    "Your local meteorological department's website is often reliable."
  ]
};

// This function runs right after the page loads
function initChat() {
  // Load the user's theme preference (light or dark)
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggle.checked = (savedTheme === "dark");

  // Show a welcome message from the bot
  addChatBubble("Hello! I'm here to chat. Ask me anything!", "bot");
}

// Creates and appends a chat bubble to the chat window
function addChatBubble(message, sender) {
  const bubble = document.createElement("div");
  bubble.classList.add("chat-bubble", sender);
  bubble.textContent = message;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Keep a record of each message in the chat history
  const newHistoryItem = {
    role: sender === "user" ? "user" : "assistant",
    content: message,
    timestamp: new Date().toLocaleString()
  };
  chatHistory.push(newHistoryItem);

  // If the history gets too big, cut off the oldest entries
  if (chatHistory.length > maxHistoryLength * 2) {
    chatHistory = chatHistory.slice(-maxHistoryLength * 2);
  }
}

// Shows a typing indicator (3 dots) while the bot "thinks"
function showTypingIndicator() {
  const typingIndicator = document.createElement("div");
  typingIndicator.classList.add("typing-indicator");
  typingIndicator.innerHTML = "<span></span><span></span><span></span>";
  chatWindow.appendChild(typingIndicator);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return typingIndicator;
}

// Picks a suitable fallback response based on what the user typed
function generateFallbackResponse(userMessage) {
  const message = userMessage.toLowerCase();

  if (message.match(/hello|hi|hey|greetings/)) {
    return getRandomResponse(fallbackResponses.greeting);
  } else if (message.match(/bye|goodbye|farewell|see you/)) {
    return getRandomResponse(fallbackResponses.farewell);
  } else if (message.match(/thanks|thank you|appreciate|grateful/)) {
    return getRandomResponse(fallbackResponses.thanks);
  } else if (message.match(/code|javascript|html|css|programming|function|api/)) {
    return getRandomResponse(fallbackResponses.coding);
  } else if (message.match(/project|portfolio|website|app|application/)) {
    return getRandomResponse(fallbackResponses.project);
  } else if (message.match(/job|career|interview|resume|cv|hire|hiring/)) {
    return getRandomResponse(fallbackResponses.career);
  } else if (message.match(/weather|temperature|forecast|rain|sunny/)) {
    return getRandomResponse(fallbackResponses.weather);
  } else if (message.match(/error|bug|issue|problem|fix|troubleshoot/)) {
    return getRandomResponse(fallbackResponses.technical);
  } else {
    return getRandomResponse(fallbackResponses.unknown);
  }
}

// Picks a random string from the array of possible responses
function getRandomResponse(responseArray) {
  const randomIndex = Math.floor(Math.random() * responseArray.length);
  return responseArray[randomIndex];
}

// Makes a request to the backend. If offline or an error occurs, it falls back to predefined responses
async function fetchBackendResponse(messages) {
  try {
    if (isOfflineMode) {
      // Immediately throw an error if offline, so we use the fallback
      throw new Error("Offline mode enabled");
    }

    const response = await fetch(BACKEND_CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.warn("Falling back to predefined responses:", error);
    const lastUserMessage = messages.filter(msg => msg.role === "user").pop();
    return generateFallbackResponse(lastUserMessage?.content || "");
  }
}

// Handles sending the user's message and displaying the bot's reply
async function handleUserInput() {
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // Show user's message in the chat window
  addChatBubble(userMessage, "user");
  userInput.value = "";

  // Indicate bot is "thinking"
  const typingIndicator = showTypingIndicator();

  try {
    const messagesToSend = [
      {
        role: "system",
        content: "You are a friendly chatbot. Keep answers concise and clear."
      },
      ...chatHistory.slice(-maxHistoryLength)
    ];

    // Add a small random delay for realism
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Ask the backend for a response (or fallback if offline)
    const botResponse = await fetchBackendResponse(messagesToSend);

    // Remove typing indicator and show the bot's final answer
    typingIndicator.remove();
    addChatBubble(botResponse, "bot");
  } catch (error) {
    console.error("Error in chat process:", error);
    typingIndicator.remove();
    addChatBubble("Sorry, something went wrong. Please try again later.", "bot");
  }
}

// Clears the chat window and resets the history
function clearChatHistory() {
  while (chatWindow.firstChild) {
    chatWindow.removeChild(chatWindow.firstChild);
  }
  chatHistory = [];
  addChatBubble("Chat cleared. Feel free to start again!", "bot");
}

// Switches between online mode (backend) and offline mode (predefined responses)
function toggleOfflineMode() {
  isOfflineMode = offlineToggle.checked;
  addChatBubble(
    isOfflineMode
      ? "Switched to offline mode. Using fallback answers."
      : "Switched to online mode. Attempting backend connection.",
    "bot"
  );
}

// Event listeners for user interactions
sendButton.addEventListener("click", handleUserInput);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleUserInput();
});

themeToggle.addEventListener("change", function() {
  if (this.checked) {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  }
});

clearChatBtn.addEventListener("click", clearChatHistory);
if (offlineToggle) {
  offlineToggle.addEventListener("change", toggleOfflineMode);
}

// Initialize the chat interface when the page is fully loaded
document.addEventListener("DOMContentLoaded", initChat);
if (document.readyState === "complete") {
  initChat();
}
