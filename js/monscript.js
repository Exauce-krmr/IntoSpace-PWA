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


/* Pilotage du vaisseau par les capteurs de position du telephone */

let starship = null;
let monde = null;
let asteroidsContainer = null;
let scoreElement = null;

// Position de depart du vaisseau (identique aux valeurs par defaut de style.css)
let startLeftPercent = 38;
let startTopPercent = 44;

// Inclinaison de reference : capturee au demarrage, elle sert de "position de depart"
let baseBeta = null;
let baseGamma = null;

// Dernier relevé brut du capteur (mis a jour par l'evenement, applique par le timer)
let currentBeta = 0;
let currentGamma = 0;

let maxTiltDeg = 25;        // inclinaison au dela de laquelle le vaisseau ne va pas plus loin
let maxOffsetPercent = 30;  // deplacement max autour de la position de depart

let score = 0;
let gameOver = false;

let asteroids = [];         // {el, x, y, vx, vy}

let moveTimer = null;
let spawnTimer = null;

let moveIntervalMs = 30;    // frequence de la boucle de jeu (deplacement + collisions)
let spawnIntervalMs = 1500; // frequence d'apparition des asteroides

function clamp(value, min, max){
	return Math.max(min, Math.min(max, value));
}

// L'angle de l'ecran (0, 90, 180, -90) : le jeu est bloque en paysage,
// mais beta/gamma restent toujours donnes par rapport au portrait naturel du telephone
function getScreenAngle(){
	if(typeof window.orientation === "number"){
		return window.orientation;
	}
	if(screen.orientation && typeof screen.orientation.angle === "number"){
		return screen.orientation.angle === 270 ? -90 : screen.orientation.angle;
	}
	return 0;
}

function handleOrientation(event){
	if(event.beta === null || event.gamma === null) return;

	// On remet beta/gamma dans le repere de l'ecran (paysage) avant de s'en servir
	let beta = event.beta;
	let gamma = event.gamma;
	let adjBeta = beta;
	let adjGamma = gamma;

	switch(getScreenAngle()){
		case 90:
			adjBeta = -gamma;
			adjGamma = beta;
			break;
		case -90:
			adjBeta = gamma;
			adjGamma = -beta;
			break;
		case 180:
			adjBeta = -beta;
			adjGamma = -gamma;
			break;
	}

	if(baseBeta === null){
		// Le premier relevé de capteur = position de depart du telephone
		baseBeta = adjBeta;
		baseGamma = adjGamma;
	}

	currentBeta = adjBeta;
	currentGamma = adjGamma;
}

function moveStarship(){
	if(baseBeta === null) return;

	let deltaBeta = clamp(currentBeta - baseBeta, -maxTiltDeg, maxTiltDeg);
	let deltaGamma = clamp(currentGamma - baseGamma, -maxTiltDeg, maxTiltDeg);

	let offsetLeft = (deltaGamma / maxTiltDeg) * maxOffsetPercent;
	let offsetTop = (deltaBeta / maxTiltDeg) * maxOffsetPercent;

	starship.style.left = (startLeftPercent + offsetLeft) + "%";
	starship.style.top = (startTopPercent + offsetTop) + "%";
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
	window.removeEventListener("deviceorientation", handleOrientation);

	starship.classList.add("exploding");

	setTimeout(function(){
		location.reload();
	}, 1200);
}

function gameLoop(){
	if(gameOver) return;
	moveStarship();
	moveAsteroids();
}

function initGame(){
	starship = document.getElementById("starship");
	monde = document.getElementById("monde");
	asteroidsContainer = document.getElementById("asteroids");
	scoreElement = document.getElementById("score");

	window.addEventListener("deviceorientation", handleOrientation);

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
