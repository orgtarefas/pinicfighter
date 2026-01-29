// config.js - Configurações globais do jogo
const CONFIG = {
    // Canvas
    WIDTH: 900,
    HEIGHT: 400,
    
    // Física
    GRAVIDADE: 0.8,
    CHAO: 320,
    LIM_ESQ: 40,
    LIM_DIR: 860,
    
    // Jogador
    VELOCIDADE: 4,
    TAMANHO_COCO: 80,
    ALTURA_PULO: -18,
    VELOCIDADE_DESCIDA: 25,
    
    // Dano
    DANO_SOCO: 8,
    DANO_CHUTE: 15,
    DANO_BOMBA: 20,
    
    // Poder
    CD_PODER: 60,
    MAX_CARGA: 30,
    
    // Jogo
    TEMPO_ROUND: 99,
    MAX_ROUNDS: 3,
    MAX_VIDA: 100
};

// Exportar para uso global
window.CONFIG = CONFIG;