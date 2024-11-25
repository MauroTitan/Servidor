// Variables globales
let username = '';
let ws;
let touchStartX = 0;
let touchEndX = 0;
let isKeyboardVisible = false;
let lastMessageAuthor = null;

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

// Detector de teclado virtual
function handleKeyboard() {
    const visualViewport = window.visualViewport;
    
    visualViewport.addEventListener('resize', () => {
        isKeyboardVisible = visualViewport.height < window.innerHeight;
        document.body.classList.toggle('keyboard-visible', isKeyboardVisible);
        
        if (isKeyboardVisible) {
            hideUsersPanel();
        }
        
        // Asegurar que el área de mensajes se desplace al fondo cuando aparece el teclado
        chatArea.scrollTop = chatArea.scrollHeight;
    });
}

// Funciones para el panel de usuarios
function toggleUsersPanel() {
    if (isKeyboardVisible) {
        chatInput.blur(); // Ocultar teclado antes de mostrar el panel
    }
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
    const threshold = 100;

    if (Math.abs(swipeDistance) >= threshold) {
        if (swipeDistance > 0 && usersPanel.classList.contains('users-panel-visible')) {
            hideUsersPanel();
        } else if (swipeDistance < 0 && !usersPanel.classList.contains('users-panel-visible')) {
            toggleUsersPanel();
        }
    }
}

// Función para conectar al WebSocket
function connectWebSocket() {
    ws = new WebSocket('ws://tu-servidor-websocket:puerto');

    ws.onopen = () => {
        console.log('Conectado al servidor');
        // Enviar mensaje de login
        ws.send(JSON.stringify({
            type: 'login',
            username: username
        }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };

    ws.onclose = () => {
        console.log('Desconectado del servidor');
        // Intenta reconectar después de 5 segundos
        setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = (error) => {
        console.error('Error de WebSocket:', error);
    };
}

// Manejar mensajes recibidos del WebSocket
function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'chat':
            addMessage(data.username, data.message);
            break;
        case 'users':
            updateUsersList(data.users);
            break;
        case 'system':
            addSystemMessage(data.message);
            break;
    }
}

// Función para añadir mensajes al chat
function addMessage(author, message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('mb-4');

    const showAuthor = lastMessageAuthor !== author;
    lastMessageAuthor = author;

    if (showAuthor) {
        const authorSpan = document.createElement('div');
        authorSpan.classList.add('text-sm', 'text-gray-400', 'mb-1');
        authorSpan.textContent = author;
        messageDiv.appendChild(authorSpan);
    }

    const messageContent = document.createElement('div');
    messageContent.classList.add('bg-gray-700', 'rounded-lg', 'p-3', 'inline-block');
    messageContent.textContent = message;
    messageDiv.appendChild(messageContent);

    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Función para añadir mensajes del sistema
function addSystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('text-center', 'text-gray-400', 'text-sm', 'my-2');
    messageDiv.textContent = message;
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Actualizar lista de usuarios
function updateUsersList(users) {
    usersList.innerHTML = '';
    usersCount.textContent = users.length;

    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.classList.add('flex', 'items-center', 'space-x-2', 'p-2', 'rounded-lg', 'hover:bg-gray-700');
        
        const profilePic = document.createElement('div');
        profilePic.classList.add('profile-container', 'rounded-full', 'overflow-hidden', 'bg-gray-700');
        profilePic.innerHTML = '<i class="fas fa-user-circle text-gray-400"></i>';
        
        const userName = document.createElement('span');
        userName.textContent = user;
        
        userDiv.appendChild(profilePic);
        userDiv.appendChild(userName);
        usersList.appendChild(userDiv);
    });
}

// Función para enviar mensaje
function sendMessage() {
    const message = chatInput.value.trim();
    if (message && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'chat',
            message: message
        }));
        chatInput.value = '';
    }
}

// Event Listeners
loginButton.addEventListener('click', () => {
    username = nicknameInput.value.trim();
    if (username) {
        loginScreen.classList.add('hidden');
        chatInterface.classList.remove('hidden');
        userNickname.textContent = username;
        connectWebSocket();
    }
});

nicknameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginButton.click();
    }
});

sendButton.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

toggleUsersBtn.addEventListener('click', toggleUsersPanel);
closeUsersBtn.addEventListener('click', hideUsersPanel);

chatInput.addEventListener('focus', () => {
    hideUsersPanel();
    setTimeout(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
    }, 100);
});

// Inicializar detectores de eventos táctiles
document.addEventListener('touchstart', handleTouchStart, { passive: true });
document.addEventListener('touchmove', handleTouchMove, { passive: true });
document.addEventListener('touchend', handleTouchEnd);

// Inicializar detector de teclado
handleKeyboard();