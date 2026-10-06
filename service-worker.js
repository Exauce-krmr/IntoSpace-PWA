const CACHE_NAME = "intospace-pwa-v2";

const ASSETS_TO_CACHE = [
	"./",
	"./index.html",
	"./manifest.webmanifest",
	"./css/style.css",
	"./js/monscript.js",
	"./img/background.jpg",
	"./img/starship.png",
	"./img/asteroid.png",
	"./img/explosion.gif",
	"./img/icon-192.png",
	"./img/icon-512.png",
	"./img/icon-512-maskable.png"
];

self.addEventListener("install", function(event){
	event.waitUntil(
		caches.open(CACHE_NAME).then(function(cache){
			return cache.addAll(ASSETS_TO_CACHE);
		})
	);
});

self.addEventListener("activate", function(event){
	event.waitUntil(
		caches.keys().then(function(keys){
			return Promise.all(
				keys.filter(function(key){ return key !== CACHE_NAME; })
					.map(function(key){ return caches.delete(key); })
			);
		})
	);
});

self.addEventListener("fetch", function(event){
	event.respondWith(
		caches.match(event.request).then(function(cached){
			return cached || fetch(event.request);
		})
	);
});
