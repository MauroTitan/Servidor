let username = '';
let ws;
let touchStartX = 0;
let touchEndX = 0;

// Elementos del DOM
const loginScreen = document.getElementById('login-screen');
const chatInterface = document.getElementById('chat-interface');
const nicknameInput = document.getElementById('nickname-input');
const loginButton = document.getElementById('login-button');
const userNickname = document.getElementById('user-nickname');
const chatArea = document.getElementById('chat-area');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const usersList = document.getElementById('users-list');
const usersCount = document.getElementById('users-count');
const usersPanel = document.getElementById('users-panel');
const toggleUsersBtn = document.getElementById('toggle-users');
const closeUsersBtn = document.getElementById('close-users');

let lastMessageAuthor = null;

// Funciones para el panel de usuarios móvil
function toggleUsersPanel() {
    usersPanel.classList.toggle('users-panel-visible');
}

function hideUsersPanel() {
    usersPanel.classList.remove('users-panel-visible');
}

// Manejadores de eventos táctiles
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
}

function handleTouchMove(e) {
    touchEndX = e.touches[0].clientX;
}

function handleTouchEnd() {
    const swipeDistance = touchEndX - touchStartX;
    const threshold = 100; // Distancia mínima para considerar un swipe

    if (Math.abs(swipeDistance) >= threshold) {
        if (swipeDistance > 0) { // Swipe derecha
            hideUsersPanel();
        } else { // Swipe izquierda
            toggleUsersPanel();
        }
    }
}

function formatUsername(name) {
    return `+${name}`;
}

function startChat(nickname) {
    username = nickname;
    userNickname.textContent = nickname;
    loginScreen.classList.add('hidden');
    chatInterface.classList.remove('hidden');

    ws = new WebSocket('https://websocket-chat-u0fd.onrender.com');

    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: 'login',
            username: nickname
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'userList') {
            updateUsersList(data.users);
        } else if (data.type === 'message') {
            addMessage(data);
        }
    };
}

function addMessage(message, isSelf = false) {
    const lastMessage = chatArea.lastElementChild;
    const author = isSelf ? username : message.username;

    if (lastMessage && lastMessageAuthor === author) {
        const lastMessageContent = lastMessage.querySelector('.message-content');
        const newP = document.createElement('p');
        newP.classList.add('text-gray-300', 'mt-1');
        newP.textContent = message.text || message;
        lastMessageContent.appendChild(newP);
    } else {
        const messageElement = document.createElement('div');
        messageElement.classList.add('hover:bg-gray-700', 'border-b', 'border-gray-700');
        
        messageElement.innerHTML = `
            <div class="p-4">
                <div class="flex items-start space-x-3">
                    <div class="message-profile-pic flex-shrink-0 mt-2 rounded-full overflow-hidden">
                        <i class="fas fa-user-circle text-gray-400"></i>
                    </div>
                    <div class="message-content flex flex-col">
                        <span class="${isSelf ? 'text-blue-400' : 'text-pink-400'} font-medium mb-1">${formatUsername(author)}</span>
                        <p class="text-gray-300">${message.text || message}</p>
                    </div>
                </div>
            </div>
        `;

        chatArea.appendChild(messageElement);
    }

    lastMessageAuthor = author;
    chatArea.scrollTop = chatArea.scrollHeight;
}

function updateUsersList(users) {
    usersList.innerHTML = '';
    usersCount.textContent = users.length;
    users.forEach(user => {
        const userElement = document.createElement('div');
        userElement.classList.add('flex', 'items-center', 'justify-between');
        userElement.innerHTML = `
            <div class="flex items-center">
                <div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>${formatUsername(user)}</span>
            </div>
        `;
        usersList.appendChild(userElement);
    });
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (message && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'message',
            text: message
        }));
        addMessage({ username, text: message }, true);
        chatInput.value = '';
    }
}

// Event Listeners
loginButton.addEventListener('click', () => {
    const nickname = nicknameInput.value.trim();
    if (nickname) {
        startChat(nickname);
    }
});

nicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const nickname = nicknameInput.value.trim();
        if (nickname) {
            startChat(nickname);
        }
    }
});

sendButton.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Event listeners para el panel de usuarios móvil
toggleUsersBtn.addEventListener('click', toggleUsersPanel);
closeUsersBtn.addEventListener('click', hideUsersPanel);

// Event listeners para gestos táctiles
document.addEventListener('touchstart', handleTouchStart);
document.addEventListener('touchmove', handleTouchMove);
document.addEventListener('touchend', handleTouchEnd);