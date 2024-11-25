let username = '';
let ws;
let touchStartX = null;
let touchEndX = null;
const SWIPE_THRESHOLD = 50;

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
const toggleUsersBtn = document.getElementById('toggle-users');
const usersPanel = document.getElementById('users-panel');
const mainChat = document.getElementById('main-chat');

let lastMessageAuthor = null;
let isPanelOpen = false;

// Función para formatear username
function formatUsername(name) {
    return `+${name}`;
}

// Manejadores de gestos táctiles
function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
}

function handleTouchMove(event) {
    if (!touchStartX) return;
    touchEndX = event.touches[0].clientX;
}

function handleTouchEnd() {
    if (!touchStartX || !touchEndX) return;
    
    const diffX = touchStartX - touchEndX;
    
    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
        if (diffX > 0 && !isPanelOpen) {
            // Swipe izquierda - abrir panel
            openUsersPanel();
        } else if (diffX < 0 && isPanelOpen) {
            // Swipe derecha - cerrar panel
            closeUsersPanel();
        }
    }
    
    touchStartX = null;
    touchEndX = null;
}

// Funciones para manejar el panel de usuarios
function openUsersPanel() {
    usersPanel.classList.add('show');
    isPanelOpen = true;
}

function closeUsersPanel() {
    usersPanel.classList.remove('show');
    isPanelOpen = false;
}

function toggleUsersPanel() {
    if (isPanelOpen) {
        closeUsersPanel();
    } else {
        openUsersPanel();
    }
}

// Función para iniciar el chat
function startChat(nickname) {
    username = nickname;
    userNickname.textContent = nickname;
    loginScreen.classList.add('hidden');
    chatInterface.classList.remove('hidden');

    // Conectar WebSocket
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
        userElement.classList.add('flex', 'items-center', 'space-x-2', 'p-2', 'hover:bg-gray-700', 'rounded');
        userElement.innerHTML = `
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>${formatUsername(user)}</span>
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
        
        // En móvil, cerrar el panel de usuarios al enviar un mensaje
        if (window.innerWidth < 768 && isPanelOpen) {
            closeUsersPanel();
        }
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

toggleUsersBtn.addEventListener('click', toggleUsersPanel);

// Eventos táctiles para el swipe
document.addEventListener('touchstart', handleTouchStart);
document.addEventListener('touchmove', handleTouchMove);
document.addEventListener('touchend', handleTouchEnd);

// Cerrar panel al hacer clic en el chat principal en móvil
chatArea.addEventListener('click', (e) => {
    if (window.innerWidth < 768 && isPanelOpen) {
        closeUsersPanel();
    }
});

// Manejar el foco del input y scroll automático
let isKeyboardVisible = false;

// Cuando el input recibe el foco (el teclado se abrirá)
chatInput.addEventListener('focus', () => {
    if (window.innerWidth < 768) {
        isKeyboardVisible = true;
        setTimeout(() => {
            chatArea.scrollTop = chatArea.scrollHeight;
        }, 300);
    }
});

// Cuando el input pierde el foco (el teclado podría cerrarse)
chatInput.addEventListener('blur', () => {
    if (window.innerWidth < 768) {
        isKeyboardVisible = false;
    }
});

// Detectar cambios de altura de ventana para el teclado virtual
const originalWindowHeight = window.innerHeight;
window.addEventListener('resize', () => {
    // Solo proceder si estamos en un dispositivo móvil
    if (window.innerWidth < 768) {
        const currentWindowHeight = window.innerHeight;
        
        // Si la altura actual es menor que la original, el teclado probablemente está visible
        if (currentWindowHeight < originalWindowHeight) {
            isKeyboardVisible = true;
            setTimeout(() => {
                chatArea.scrollTop = chatArea.scrollHeight;
            }, 100);
        } else {
            isKeyboardVisible = false;
        }
    }
});

// Asegurarse de que los mensajes nuevos sean visibles
const observer = new MutationObserver((mutations) => {
    if (isKeyboardVisible) {
        chatArea.scrollTop = chatArea.scrollHeight;
    }
});

observer.observe(chatArea, {
    childList: true,
    subtree: true
});