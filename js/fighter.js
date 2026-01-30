// fighter.js - Versão simplificada
console.log('🥊 Fighter.js carregado');

// Verificar se keys já existe
if (typeof window.keys === 'undefined') {
    window.keys = {};
}

// Array global de lutadores
if (typeof window.fighters === 'undefined') {
    window.fighters = [];
}

// Array global de projéteis
if (typeof window.projectiles === 'undefined') {
    window.projectiles = [];
}

// Exportar funções básicas (se necessário)
window.getFighterStats = function(personagem) {
    const stats = {
        'cocozin': { vida: 120, velocidade: 3, forca: 8, defesa: 7 },
        'ratazana': { vida: 90, velocidade: 6, forca: 6, defesa: 5 },
        'peidovélio': { vida: 100, velocidade: 4, forca: 7, defesa: 6 }
    };
    return stats[personagem] || stats['cocozin'];
};

console.log('✅ Fighter.js pronto');
