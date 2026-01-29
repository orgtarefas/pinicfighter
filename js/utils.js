// utils.js - Funções utilitárias
const Utils = {
    // Verifica colisão entre dois retângulos
    colisao: function(a, b) {
        return a.x < b.x + b.w && 
               a.x + a.w > b.x && 
               a.y < b.y + b.h && 
               a.y + a.h > b.y;
    },
    
    // Cria partículas de efeito
    criarParticulas: function(ctx, x, y, quantidade, cor) {
        for (let i = 0; i < quantidade; i++) {
            const particula = {
                x: x + Math.random() * 30 - 15,
                y: y + Math.random() * 30 - 15,
                vx: Math.random() * 6 - 3,
                vy: Math.random() * -4 - 2,
                tamanho: Math.random() * 4 + 2,
                vida: 25,
                cor: cor
            };
            
            ctx.fillStyle = particula.cor;
            ctx.beginPath();
            ctx.arc(particula.x, particula.y, particula.tamanho, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    // Formata número para 2 dígitos
    formatarNumero: function(num) {
        return num < 10 ? '0' + num : num;
    },
    
    // Desenha texto com opções
    desenharTexto: function(ctx, texto, x, y, tamanho = 16, cor = "white", alinhamento = "left") {
        ctx.fillStyle = cor;
        ctx.font = `${tamanho}px Arial`;
        ctx.textAlign = alinhamento;
        ctx.fillText(texto, x, y);
    }
};

window.Utils = Utils;