// Vérifie la collision entre deux balises HTML
function checkCollisions(box1, box2){
	if((box2.offsetLeft >= box1.offsetLeft + box1.clientWidth)      // trop à droite
		|| (box2.offsetLeft + box2.clientWidth <= box1.offsetLeft) // trop à gauche
		|| (box2.offsetTop >= box1.offsetTop + box1.clientHeight) // trop en bas
		|| (box2.offsetTop + box2.clientHeight <= box1.offsetTop))  // trop en haut
			return false;
	else
			return true;
}


/* Pilotage du vaisseau au clavier (desktop) et au doigt/souris (mobile et desktop) */

let starship = null;
let monde = null;
let asteroidsContainer = null;
let scoreElement = null;

let shipWidth = 115;  // doit rester synchronise avec #starship dans style.css
let shipHeight = 55;
let shipX = 0;         // position du coin haut-gauche du vaisseau, en px
let shipY = 0;

let score = 0;
let gameOver = false;

let asteroids = [];         // {el, x, y, vx, vy}

let moveTimer = null;
let spawnTimer = null;

let moveIntervalMs = 30;    // frequence de la boucle de jeu (deplacement + collisions)
let spawnIntervalMs = 1500; // frequence d'apparition des asteroides
let keyboardSpeed = 6;      // px par tick quand une touche est maintenue

function clamp(value, min, max){
	return Math.max(min, Math.min(max, value));
}

function clampShipPosition(){
	shipX = clamp(shipX, 0, window.innerWidth - shipWidth);
	shipY = clamp(shipY, 0, window.innerHeight - shipHeight);
}

// Clavier : fleches ou WASD
let KEY_DIRECTIONS = {
	"ArrowUp": [0, -1], "KeyW": [0, -1],
	"ArrowDown": [0, 1], "KeyS": [0, 1],
	"ArrowLeft": [-1, 0], "KeyA": [-1, 0],
	"ArrowRight": [1, 0], "KeyD": [1, 0]
};
let keysPressed = {};

function handleKeyDown(event){
	keysPressed[event.code] = true;
}

function handleKeyUp(event){
	keysPressed[event.code] = false;
}

function moveFromKeyboard(){
	let dx = 0, dy = 0;
	for(let code in KEY_DIRECTIONS){
		if(keysPressed[code]){
			dx += KEY_DIRECTIONS[code][0];
			dy += KEY_DIRECTIONS[code][1];
		}
	}
	if(dx === 0 && dy === 0) return;

	let length = Math.sqrt(dx * dx + dy * dy);
	shipX += (dx / length) * keyboardSpeed;
	shipY += (dy / length) * keyboardSpeed;
	clampShipPosition();
}

// Souris / tactile : le vaisseau suit le pointeur (fonctionne sur desktop et mobile)
let dragging = false;
let pointerOffsetY = -40; // le vaisseau reste visible au dessus du doigt sur mobile

function handlePointerMove(event){
	if(!dragging) return;
	shipX = event.clientX - shipWidth / 2;
	shipY = event.clientY - shipHeight / 2 + pointerOffsetY;
	clampShipPosition();
}

function handlePointerDown(event){
	dragging = true;
	handlePointerMove(event);
}

function handlePointerUp(){
	dragging = false;
}

function moveStarship(){
	starship.style.left = shipX + "px";
	starship.style.top = shipY + "px";
}

function spawnAsteroid(){
	let width = window.innerWidth;
	let height = window.innerHeight;

	// L'asteroide part d'un bord au hasard et traverse l'ecran
	let side = Math.floor(Math.random() * 4); // 0 haut, 1 droite, 2 bas, 3 gauche
	let x, y;

	if(side === 0){ x = Math.random() * width; y = -60; }
	else if(side === 1){ x = width + 60; y = Math.random() * height; }
	else if(side === 2){ x = Math.random() * width; y = height + 60; }
	else { x = -60; y = Math.random() * height; }

	// Direction vers un point aleatoire du cote oppose, pour traverser l'ecran
	let targetX = Math.random() * width;
	let targetY = Math.random() * height;
	let dx = targetX - x;
	let dy = targetY - y;
	let length = Math.sqrt(dx * dx + dy * dy) || 1;
	let speed = 2 + Math.random() * 2; // px par tick

	let el = document.createElement("div");
	el.className = "asteroid";
	asteroidsContainer.appendChild(el);

	asteroids.push({
		el: el,
		x: x,
		y: y,
		vx: (dx / length) * speed,
		vy: (dy / length) * speed
	});
}

function moveAsteroids(){
	let width = window.innerWidth;
	let height = window.innerHeight;

	for(let i = asteroids.length - 1; i >= 0; i--){
		let a = asteroids[i];
		a.x += a.vx;
		a.y += a.vy;
		a.el.style.left = a.x + "px";
		a.el.style.top = a.y + "px";

		// Asteroide sorti de l'ecran : il a ete evite, on le retire et on marque un point
		if(a.x < -100 || a.x > width + 100 || a.y < -100 || a.y > height + 100){
			a.el.remove();
			asteroids.splice(i, 1);
			score++;
			scoreElement.textContent = "Score : " + score;
			continue;
		}

		if(checkCollisions(starship, a.el)){
			explode();
			return;
		}
	}
}

function explode(){
	gameOver = true;
	clearInterval(moveTimer);
	clearInterval(spawnTimer);

	starship.classList.add("exploding");

	setTimeout(function(){
		location.reload();
	}, 1200);
}

function gameLoop(){
	if(gameOver) return;
	moveFromKeyboard();
	moveStarship();
	moveAsteroids();
}

function initGame(){
	starship = document.getElementById("starship");
	monde = document.getElementById("monde");
	asteroidsContainer = document.getElementById("asteroids");
	scoreElement = document.getElementById("score");

	// Position de depart (identique aux valeurs par defaut de style.css)
	shipX = window.innerWidth * 0.38;
	shipY = window.innerHeight * 0.44;
	clampShipPosition();

	window.addEventListener("keydown", handleKeyDown);
	window.addEventListener("keyup", handleKeyUp);

	monde.addEventListener("pointerdown", handlePointerDown);
	window.addEventListener("pointermove", handlePointerMove);
	window.addEventListener("pointerup", handlePointerUp);
	window.addEventListener("pointercancel", handlePointerUp);

	moveTimer = setInterval(gameLoop, moveIntervalMs);
	spawnTimer = setInterval(spawnAsteroid, spawnIntervalMs);
}

document.addEventListener("DOMContentLoaded", initGame, false);

// Enregistrement du service worker (mise en cache pour un fonctionnement hors-ligne)
if("serviceWorker" in navigator){
	window.addEventListener("load", function(){
		navigator.serviceWorker.register("service-worker.js");
	});
}
