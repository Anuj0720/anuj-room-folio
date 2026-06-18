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
  pokemonVideoTexture.colorSpace = THREE.SRGBColorSpace;
  pokemonVideoTexture.flipY = false;
  pokemonVideoTexture.needsUpdate = true;

  pokemonVideoElement.play().catch(() => {
    // Autoplay may be blocked until user interaction; the texture will start when allowed.
  });

  return pokemonVideoTexture;
}

export function getPokemonVideoElement() {
  if (!pokemonVideoElement) {
    getPokemonVideoTexture();
  }
  return pokemonVideoElement;
}

let spidermanVideoTexture;
let spidermanVideoElement;

export function getSpidermanVideoTexture() {
  if (spidermanVideoTexture) return spidermanVideoTexture;
  if (typeof window === "undefined") return null;

  spidermanVideoElement = document.createElement("video");
  spidermanVideoElement.src = "/videos/spiderman.mp4";
  spidermanVideoElement.muted = true;
  spidermanVideoElement.loop = true;
  spidermanVideoElement.playsInline = true;
  spidermanVideoElement.crossOrigin = "anonymous";
  spidermanVideoElement.preload = "auto";

  spidermanVideoTexture = new THREE.VideoTexture(spidermanVideoElement);
  spidermanVideoTexture.minFilter = THREE.LinearFilter;
  spidermanVideoTexture.magFilter = THREE.LinearFilter;
  spidermanVideoTexture.colorSpace = THREE.SRGBColorSpace;
  spidermanVideoTexture.flipY = false;
  spidermanVideoTexture.needsUpdate = true;

  spidermanVideoElement.play().catch(() => {
    // Autoplay may be blocked until user interaction; the texture will start when allowed.
  });

  return spidermanVideoTexture;
}

export function getSpidermanVideoElement() {
  if (!spidermanVideoElement) {
    getSpidermanVideoTexture();
  }
  return spidermanVideoElement;
}

let onepieceVideoTexture;
let onepieceVideoElement;

export function getOnepieceVideoTexture() {
  if (onepieceVideoTexture) return onepieceVideoTexture;
  if (typeof window === "undefined") return null;

  onepieceVideoElement = document.createElement("video");
  onepieceVideoElement.src = "/videos/onepiece.mp4";
  onepieceVideoElement.muted = true;
  onepieceVideoElement.loop = true;
  onepieceVideoElement.playsInline = true;
  onepieceVideoElement.crossOrigin = "anonymous";
  onepieceVideoElement.preload = "auto";

  onepieceVideoTexture = new THREE.VideoTexture(onepieceVideoElement);
  onepieceVideoTexture.minFilter = THREE.LinearFilter;
  onepieceVideoTexture.magFilter = THREE.LinearFilter;
  onepieceVideoTexture.colorSpace = THREE.SRGBColorSpace;
  onepieceVideoTexture.flipY = false;
  onepieceVideoTexture.needsUpdate = true;

  onepieceVideoElement.play().catch(() => {
    // Autoplay may be blocked until user interaction; the texture will start when allowed.
  });

  return onepieceVideoTexture;
}

export function getOnepieceVideoElement() {
  if (!onepieceVideoElement) {
    getOnepieceVideoTexture();
  }
  return onepieceVideoElement;
}