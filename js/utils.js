// Constantes globais
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GRAVIDADE = 0.8;
const CHAO = 320;
const LIM_ESQ = 40;
const LIM_DIR = canvas.width - 40;

// Variáveis globais
let jogoTerminou = false;
const keys = {};

// Carrega imagem de fundo - CAMINHO CORRETO
const fundo = new Image();
fundo.src = "imagens/fundo.png";

// Sistema de input
addEventListener("keydown", e => keys[e.key] = true);
addEventListener("keyup", e => keys[e.key] = false);

// Função de colisão
function colisao(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// REMOVIDO: const p1 = new LutadorCoco(...)
// REMOVIDO: const p2 = new LutadorCoco(...)
// Agora p1 e p2 serão declarados apenas em game.js
