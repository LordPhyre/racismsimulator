import { io } from "socket.io-client"

const joinRoomButton = document.getElementById("room-button")
const messageInput = document.getElementById("message-input")
const roomInput = document.getElementById("room-input")
const form = document.getElementById("form")

// Connect to server
const socket = io('http://localhost:3000')
socket.on('connect', () => {
  displayMessage(`You connected with id: ${socket.id}`)
})


// Listen for message from server (which will be messages from other clients)
socket.on('pass-down-message', message => {
  displayMessage(message)
})


// On room join button press, save room to variable
var room = roomInput.value
joinRoomButton.addEventListener("click", () => {
  room = roomInput.value
  socket.emit('join-room', socket.id, room, message => { // Pass callback of function to server (idk ab this)
    displayMessage(message)
  })
})


// On send message button click, do stuff
form.addEventListener("submit", e => {
  e.preventDefault()
  const message = messageInput.value
  if (message === "") return // If message empty, dont do anything
  
  displayMessage(message) // Call our display message function
  socket.emit('send-message', message, room) // Send server the message and room
  messageInput.value = "" // Clear message box after sending
})


// Function that displays messages in chat
function displayMessage(message) {
  const div = document.createElement("div")
  div.textContent = message
  document.getElementById("message-container").append(div)
}
