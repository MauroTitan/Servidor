let username = '';
let ws;
let userColors = new Map();
let notifications = [];
let unreadNotifications = 0;

// Elementos del DOM
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const usernameInput = document.getElementById('username-input');
const loginButton = document.getElementById('login-button');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');
const usersCount = document.getElementById('users-count');
const usersList = document.getElementById('users-list');

// Función para generar un color aleatorio para usuarios
function generateUserColor() {
    const hue = Math.random() * 360;
    return `hsl(${hue}, 70%, 40%)`;
}

// Función para obtener o generar el color de un usuario
function getUserColor(username) {
    if (!userColors.has(username)) {
        userColors.set(username, generateUserColor());
    }
    return userColors.get(username);
}

// Función para iniciar el chat
function startChat(username) {
    ws = new WebSocket('https://websocketchat-two.vercel.app/');

    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: 'login',
            username: username
        }));
        
        addSystemMessage('Conectado al chat');
        loginContainer.style.display = 'none';
        chatContainer.style.display = 'flex';
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'userList') {
            updateUsersList(data.users);
            usersCount.textContent = `Usuarios en línea: ${data.count}`;
        } else if (data.type === 'message') {
            const currentUsers = Array.from(usersList.children).map(li => li.textContent);
            addMessage(data.username, data.text, currentUsers);
        }
    };

    ws.onclose = () => {
        addSystemMessage('Desconectado del chat');
        loginContainer.style.display = 'block';
        chatContainer.style.display = 'none';
    };
}

// Función para procesar menciones en el texto
function processMentions(text, users) {
    const words = text.split(' ');
    return words.map(word => {
        if (word.startsWith('@')) {
            const username = word.slice(1);
            if (users.includes(username)) {
                return `<span class="mention" style="color: ${getUserColor(username)}">@${username}</span>`;
            }
        }
        return word;
    }).join(' ');
}

// Función para actualizar la lista de usuarios
function updateUsersList(users) {
    usersList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        usersList.appendChild(li);
    });
}

// Función para agregar mensajes al chat
function addMessage(username, text, users = []) {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const processedText = processMentions(text, users);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `
        <span class="timestamp">[${time}]</span>
        <span class="username" style="color: ${getUserColor(username)}">${username}:</span>
        <span>${processedText}</span>
    `;
    
    if (text.includes(`@${username}`) && username !== window.username) {
        addNotification(username, text, time);
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system-message';
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Funciones para el sistema de notificaciones
function addNotification(fromUser, text, time) {
    notifications.push({ fromUser, text, time, read: false });
    unreadNotifications++;
    updateNotificationsBadge();
}

function updateNotificationsBadge() {
    const badge = document.getElementById('notifications-badge');
    if (unreadNotifications > 0) {
        badge.style.display = 'block';
        badge.textContent = unreadNotifications;
    } else {
        badge.style.display = 'none';
    }
}

function showNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    notificationsList.innerHTML = '';
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p>No hay menciones nuevas</p>';
        return;
    }

    notifications.forEach((notification) => {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = 'notification-item';
        notificationDiv.innerHTML = `
            <span class="timestamp">[${notification.time}]</span>
            <span class="username" style="color: ${getUserColor(notification.fromUser)}">${notification.fromUser}</span>
            <span>te mencionó: ${notification.text}</span>
        `;
        notificationsList.appendChild(notificationDiv);
    });

    notifications.forEach(n => n.read = true);
    unreadNotifications = 0;
    updateNotificationsBadge();
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (text && ws && ws.readyState === WebSocket.OPEN) {
        const currentUsers = Array.from(usersList.children).map(li => li.textContent);
        ws.send(JSON.stringify({
            type: 'message',
            text: text
        }));
        addMessage(username, text, currentUsers);
        messageInput.value = '';
    }
}

// Event Listeners
loginButton.addEventListener('click', () => {
    username = usernameInput.value.trim();
    if (username) {
        startChat(username);
    }
});

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        username = usernameInput.value.trim();
        if (username) {
            startChat(username);
        }
    }
});

sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Event listeners para notificaciones
document.getElementById('notifications-button').addEventListener('click', () => {
    document.getElementById('notifications-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
    showNotifications();
});

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('notifications-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
});

document.getElementById('modal-overlay').addEventListener('click', () => {
    document.getElementById('notifications-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
});