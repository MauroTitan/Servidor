const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8080 });

const clients = new Map(); // Cambiamos a Map para almacenar username junto con la conexión
let userCount = 0;

server.on('connection', (ws) => {
    userCount++;
    
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        // Si es un mensaje de login, guardamos el usuario
        if (data.type === 'login') {
            clients.set(ws, data.username);
            // Enviamos la lista actualizada de usuarios a todos
            broadcastUserList();
        } else {
            // Broadcast del mensaje a todos los demás clientes
            clients.forEach((username, client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'message',
                        username: clients.get(ws),
                        text: data.text
                    }));
                }
            });
        }
    });

    ws.on('close', () => {
        userCount--;
        clients.delete(ws);
        broadcastUserList();
    });

    // Función para enviar la lista de usuarios a todos
    function broadcastUserList() {
        const userList = Array.from(clients.values());
        const userListMessage = JSON.stringify({
            type: 'userList',
            users: userList,
            count: userCount
        });
        
        clients.forEach((username, client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(userListMessage);
            }
        });
    }
});

console.log('Servidor iniciado en puerto 8080');