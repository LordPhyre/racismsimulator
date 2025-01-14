// Admin function thing (https://admin.socket.io/)
//const { instrument } = require('@socket.io/admin-ui')

// Setup server and allow requests from client
const io = require("socket.io")(3000, { 
  cors: {
    //origin: ['http://localhost:8080', 'https://admin.socket.io', 'https://admin.socket.io'],
    origin: ['http://localhost:8080']
  }
})


io.on("connection", socket => {
  console.log(`${socket.id} has joined`)
  
  // Listen for sent messages from client
  socket.on('send-message', (message, room) => {
    // if no "room", send public message
    if (room === '') {
      // Send message from sender to clients (middleman ez) using socket.broadcast for no dupes
      socket.broadcast.emit('pass-down-message', message)
    } else {
      // If room, send message directly to room (this can be a DM or a custom room message)
      socket.to(room).emit('pass-down-message', message)
    }
    console.log(`${socket.id} just send ${message} to room: ${room}`)
  })
  
  
  // Custom rooms
  socket.on('join-room', (id, room, cb) => {
    socket.join(room)
    console.log(`${id} has connected to room: ${room}`)
    cb(`${id} has connected to room: ${room}`)
  })
})

instrument(io, {auth: false}) //Turn admin ui on?
