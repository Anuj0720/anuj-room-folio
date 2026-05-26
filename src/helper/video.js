import * as THREE from "three";

let pokemonVideoTexture;
let pokemonVideoElement;

export function getPokemonVideoTexture() {
  if (pokemonVideoTexture) return pokemonVideoTexture;
  if (typeof window === "undefined") return null;

  pokemonVideoElement = document.createElement("video");
  pokemonVideoElement.src = "/videos/pokemon.mp4";
  pokemonVideoElement.muted = true;
  pokemonVideoElement.loop = true;
  pokemonVideoElement.playsInline = true;
  pokemonVideoElement.crossOrigin = "anonymous";
  pokemonVideoElement.preload = "auto";

  pokemonVideoTexture = new THREE.VideoTexture(pokemonVideoElement);
  pokemonVideoTexture.minFilter = THREE.LinearFilter;
  pokemonVideoTexture.magFilter = THREE.LinearFilter;
  pokemonVideoTexture.format = THREE.RGBFormat;
  pokemonVideoTexture.encoding = THREE.sRGBEncoding;
  pokemonVideoTexture.flipY = false;
  pokemonVideoTexture.needsUpdate = true;

  pokemonVideoElement
    .play()
    .catch(() => {
      // Autoplay may be blocked until user interaction; the texture will start when allowed.
    });

  return pokemonVideoTexture;
}

export function playPokemonVideo() {
  if (!pokemonVideoElement) return;
  pokemonVideoElement.play().catch(() => {});
}

export function pausePokemonVideo() {
  pokemonVideoElement?.pause();
}

export function resetPokemonVideo() {
  if (!pokemonVideoElement) return;
  pokemonVideoElement.currentTime = 0;
  pokemonVideoElement.play().catch(() => {});
}
0