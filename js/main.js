import { io } from "https://cdn.jsdelivr.net/npm/socket.io-client@4.4.1/dist/socket.io.esm.min.js";
import * as THREE from "three";
import { PointerLockControls } from "pointerlockcontrols";
import { snow } from "./snow.js";

const socket = io();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const controls = new PointerLockControls(camera, document.body);
const light = new THREE.HemisphereLight(0xffffff, 0x444444);

// Settings
const gravity = -0.02;
const jumpStrength = 0.3;
const moveSpeed = 0.2;
const mapSize = 100;
const snowflakes = new snow(camera, scene, {
    snowflakeCount: 4000,
    snowSpeed: 0.05,
    snowflakeSize: 0.05,
    distance: 20,
    height: 20,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);
document.addEventListener("keydown", (event) => handleKeyPress(event.key.toLowerCase(), true));
document.addEventListener("keyup", (event) => handleKeyPress(event.key.toLowerCase(), false));
document.addEventListener("click", () => controls.lock());
window.addEventListener("resize", function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Ground
const groundGeometry = new THREE.PlaneGeometry(mapSize, mapSize);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;

// Player
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x8000ff });
const playerGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
const player = new THREE.Mesh(playerGeometry, playerMaterial);

const otherPlayers = {};


// Handle new player joining
socket.on("playerJoined", ({ client_id, player_position, serverPlayers }) => {
    console.log("a new client has joined. your status is:")
    // All clients that are not the new joinee must render the new joinee
    if (client_id !== socket.id) {
        console.log("you are a client that is witnessing a new join");
        const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const playerGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
        const new_player = new THREE.Mesh(playerGeometry, playerMaterial);

        new_player.position.set(player_position.x, player_position.y, player_position.z);
        scene.add(new_player);
        otherPlayers[client_id] = new_player;
    }
    // New joinee must render all preexisting clients
    if (client_id === socket.id) {
        console.log("you are the client who just joined");
        for (const player_id in serverPlayers) {
            if (player_id !== socket.id && !otherPlayers[player_id]) {
                const playerMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
                const playerGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
                const otherPlayer = new THREE.Mesh(playerGeometry, playerMaterial);

                otherPlayer.position.set(serverPlayers[player_id].x, serverPlayers[player_id].y, serverPlayers[player_id].z);
                scene.add(otherPlayer);
                otherPlayers[player_id] = otherPlayer;
            }
        }
    };
});

// Handle player leaving
socket.on("playerLeft", ({ id }) => {
    if (otherPlayers[id]) {
        scene.remove(otherPlayers[id]);
        delete otherPlayers[id];
    }
});

// Handle player movement updates
socket.on("positionUpdate", ({ id, position }) => {
    if (id !== socket.id && otherPlayers[id]) {
        otherPlayers[id].position.set(position.x, position.y, position.z);
    }
});




// Movement
let forward = false;
let backward = false;
let left = false;
let right = false;
let onGround = true;
let playerHeight = 2;
let velocityY = 0;
let isCar = false;

function handleKeyPress(key, state) {
    if (key === "w") forward = state;
    if (key === "s") backward = state;
    if (key === "a") left = state;
    if (key === "d") right = state;
    if (key === " " && onGround) { velocityY = jumpStrength; camera.position.y += velocityY };
    if (key === "shift") { playerHeight = state ? 1 : 2; camera.position.y -= 1 };
    if (key === "p") {
        if (state) { isCar = !isCar };
        if (isCar) {
            player.scale.set(4, 1, 2);
        }
        else {
            player.scale.set(1, 1, 1);
        };
    };
}

function move() {
    if (forward) controls.moveForward(moveSpeed);
    if (backward) controls.moveForward(-moveSpeed);
    if (left) controls.moveRight(-moveSpeed);
    if (right) controls.moveRight(moveSpeed);
    if (camera.position.y <= playerHeight) { camera.position.y = playerHeight; velocityY = 0; onGround = true } else { onGround = false; };
    if (!onGround) { camera.position.y += velocityY; velocityY += gravity };

    let lastUpdateTime = 0;
    const updateInterval = 100; // Send updates every 100ms

    if (Date.now() - lastUpdateTime > updateInterval) {
        socket.emit("positionUpdate", { id: socket.id, position: { x: camera.position.x, y: camera.position.y, z: camera.position.z } });
        lastUpdateTime = Date.now();
    }
}

function preventOOB() {
    if (camera.position.x > mapSize / 2) { camera.position.x = mapSize / 2 };
    if (camera.position.x < -mapSize / 2) { camera.position.x = -mapSize / 2 };
    if (camera.position.z > mapSize / 2) { camera.position.z = mapSize / 2 };
    if (camera.position.z < -mapSize / 2) { camera.position.z = -mapSize / 2 };
}

scene.add(light, ground, player);
export function animate() {
    snowflakes.update();
    move();
    preventOOB(THREE, PointerLockControls, snow);
    player.position.x = camera.position.x;
    player.position.y = camera.position.y - 1;
    player.position.z = camera.position.z;
    renderer.render(scene, camera);
}
