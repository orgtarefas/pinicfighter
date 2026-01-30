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

// Sistema de input - CORRIGIDO PARA MULTIPLAYER
addEventListener("keydown", e => {
    // Usar o código da tecla diretamente
    keys[e.code] = true;
    
    // Também manter compatibilidade com sistema antigo
    const teclaAntiga = converterTeclaParaAntigo(e.code);
    if (teclaAntiga) {
        keys[teclaAntiga] = true;
    }
});

addEventListener("keyup", e => {
    keys[e.code] = false;
    
    // Também manter compatibilidade com sistema antigo
    const teclaAntiga = converterTeclaParaAntigo(e.code);
    if (teclaAntiga) {
        keys[teclaAntiga] = false;
    }
});

// Função para converter teclas do novo formato para o antigo
function converterTeclaParaAntigo(teclaCode) {
    const mapaConversao = {
        'KeyA': 'a',
        'KeyD': 'd', 
        'KeyW': 'w',
        'KeyF': 'f',
        'KeyC': 'c',
        'KeyS': 's',
        
        'ArrowLeft': 'ArrowLeft',
        'ArrowRight': 'ArrowRight',
        'ArrowUp': 'ArrowUp',
        'Enter': 'Enter',
        'Period': '.',
        'ArrowDown': 'ArrowDown',
        
        'KeyJ': 'j',
        'KeyL': 'l',
        'KeyI': 'i',
        'KeyH': 'h',
        'KeyN': 'n',
        'KeyK': 'k',
        
        'Numpad4': 'Numpad4',
        'Numpad6': 'Numpad6',
        'Numpad8': 'Numpad8',
        'Numpad0': 'Numpad0',
        'NumpadDecimal': 'NumpadDecimal',
        'Numpad5': 'Numpad5'
    };
    
    return mapaConversao[teclaCode];
}

// Função de colisão
function colisao(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

console.log('✓ Utils.js carregado com suporte a multiplayer');
