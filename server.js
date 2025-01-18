const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);
const players = {};

app.use("/js", express.static("./js/"));
app.use("/node_modules", express.static("./node_modules/"));
app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "index.html"));
});

// Handle new connection
io.on("connection", (socket) => {
    console.log(`Player ${socket.id} joined`);
    players[socket.id] = { x: 0, y: 2, z: 0 };
    socket.emit("initializePlayers", players);
    socket.broadcast.emit("playerJoined", { id: socket.id, position: players[socket.id] });

    // Handle position updates
    socket.on("positionUpdate", ({ id, position }) => {
        players[id] = position;
        socket.broadcast.emit("positionUpdate", { id, position });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log(`Player ${socket.id} disconnected`);
        delete players[socket.id];
        socket.broadcast.emit("playerLeft", { id: socket.id });
    });
});

server.listen(6969, () => {
    console.log("http://localhost:6969");
});
