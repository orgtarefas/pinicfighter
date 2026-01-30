// Constantes globais
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GRAVIDADE = 0.8;
const CHAO = 320;
const LIM_ESQ = 40;
const LIM_DIR = canvas.width - 40;

// Variáveis globais
let jogoTerminou = false;

// Sistema de teclas SIMPLIFICADO - 4 jogadores fixos
const keys = {
    // Player 1: WASD + F/C
    'KeyA': false, 'KeyD': false, 'KeyW': false, 'KeyS': false,
    'KeyF': false, 'KeyC': false,
    
    // Player 2: Setas + Enter/Ponto
    'ArrowLeft': false, 'ArrowRight': false, 'ArrowUp': false, 'ArrowDown': false,
    'Enter': false, 'Period': false,
    
    // Player 3: JIL + H/N
    'KeyJ': false, 'KeyL': false, 'KeyI': false, 'KeyK': false,
    'KeyH': false, 'KeyN': false,
    
    // Player 4: Numpad
    'Numpad4': false, 'Numpad6': false, 'Numpad8': false, 'Numpad5': false,
    'Numpad0': false, 'NumpadDecimal': false
};

// Carrega imagem de fundo
const fundo = new Image();
fundo.src = "imagens/fundo.png";

// Sistema de input SIMPLIFICADO
addEventListener("keydown", e => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
        e.preventDefault(); // Prevenir comportamento padrão
    }
});

addEventListener("keyup", e => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
        e.preventDefault(); // Prevenir comportamento padrão
    }
});

// Função de colisão
function colisao(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

console.log('✓ Utils.js carregado com sistema de teclas SIMPLIFICADO');
