// cleanup.js - Sistema de limpeza para o jogo
console.log('🧹 Sistema de limpeza carregado');

// Função para limpar jogo quando sair
window.pararJogo = function() {
    console.log('🛑 Parando jogo...');
    
    // Limpar variáveis globais
    if (typeof window.jogoTerminou !== 'undefined') {
        window.jogoTerminou = true;
    }
    
    // Parar animação frame
    if (window.animationFrameId) {
        cancelAnimationFrame(window.animationFrameId);
        window.animationFrameId = null;
    }
    
    // Limpar canvas
    const canvas = document.getElementById('game');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    console.log('✅ Jogo parado');
};

// Função para remover jogador quando a página for fechada
window.addEventListener('beforeunload', function() {
    if (typeof window.pararJogo === 'function') {
        window.pararJogo();
    }
    
    // Limpar Firebase
    if (typeof window.firebaseSala !== 'undefined' && 
        typeof window.firebaseSala.getSalaAtual === 'function' &&
        typeof window.firebaseSala.getMeuPlayerId === 'function') {
        
        const sala = window.firebaseSala.getSalaAtual();
        const playerId = window.firebaseSala.getMeuPlayerId();
        
        if (sala && playerId) {
            console.log(`🗑️ Limpando jogador ${playerId} da sala ${sala}`);
            
            // Remover do Firebase se a função existir
            if (typeof window.removerJogadorSala === 'function') {
                window.removerJogadorSala(sala, playerId.replace('p', ''));
            }
        }
    }
});

console.log('✅ cleanup.js carregado com sucesso');