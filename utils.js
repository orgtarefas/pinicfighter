// Constantes do jogo
const CONFIG = {
    GRAVIDADE: 0.8,
    CHAO: 320,
    LIM_ESQ: 40,
    LIM_DIR: 860,
    VELOCIDADE: 4,
    TAMANHO_COCO: 80,
    DANO_SOCO: 8,
    DANO_CHUTE: 15,
    DANO_BOMBA: 20,
    ALTURA_PULO: -18,
    VELOCIDADE_DESCIDA: 25,
    CD_PODER: 60,
    MAX_CARGA: 30
};

// Utilitários
class Utils {
    // Verifica colisão entre dois retângulos
    static colisao(a, b) {
        return a.x < b.x + b.w && 
               a.x + a.w > b.x && 
               a.y < b.y + b.h && 
               a.y + a.h > b.y;
    }
    
    // Cria partículas de efeito
    static criarParticulas(ctx, x, y, quantidade, cor) {
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
    }
    
    // Desenha uma barra (vida, carga, etc)
    static desenharBarra(ctx, x, y, largura, altura, valor, valorMax, corFundo, corBarra, texto = '') {
        // Fundo
        ctx.fillStyle = corFundo;
        ctx.fillRect(x, y, largura, altura);
        
        // Barra
        ctx.fillStyle = corBarra;
        const larguraAtual = Math.max(0, (valor / valorMax) * largura);
        ctx.fillRect(x, y, larguraAtual, altura);
        
        // Borda
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, largura, altura);
        
        // Texto
        if (texto) {
            ctx.fillStyle = "white";
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillText(texto, x + largura / 2, y + altura / 2 + 4);
        }
    }
    
    // Desenha texto
    static desenharTexto(ctx, texto, x, y, tamanho = 16, cor = "white", alinhamento = "left") {
        ctx.fillStyle = cor;
        ctx.font = `${tamanho}px Arial`;
        ctx.textAlign = alinhamento;
        ctx.fillText(texto, x, y);
    }
    
    // Desenha círculo
    static desenharCirculo(ctx, x, y, raio, cor, linha = false, larguraLinha = 1) {
        if (linha) {
            ctx.strokeStyle = cor;
            ctx.lineWidth = larguraLinha;
            ctx.beginPath();
            ctx.arc(x, y, raio, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.fillStyle = cor;
            ctx.beginPath();
            ctx.arc(x, y, raio, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Desenha elipse
    static desenharElipse(ctx, x, y, raioX, raioY, cor) {
        ctx.fillStyle = cor;
        ctx.beginPath();
        ctx.ellipse(x, y, raioX, raioY, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Desenha retângulo arredondado
    static desenharRetanguloArredondado(ctx, x, y, largura, altura, raio, cor) {
        ctx.fillStyle = cor;
        ctx.beginPath();
        ctx.roundRect(x, y, largura, altura, raio);
        ctx.fill();
    }
    
    // Formata número para 2 dígitos
    static formatarNumero(num) {
        return num < 10 ? '0' + num : num;
    }
    
    // Carrega uma imagem
    static carregarImagem(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
}

// Exportar configurações e utilitários
window.CONFIG = CONFIG;
window.Utils = Utils;