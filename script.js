const io = require('socket.io')(3000)

const socket = io('http://localhost:3000')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

socket.on('chat-message', data => {
    console.log(data)
})

messageForm.addEventListener('submit', e => {
     e.preventDefault()
     const message = messageInput.value
     socket.emit('send-chat-message', message)
     messageInputl.value = ''
})
