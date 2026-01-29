// coco-projetil.js
class CocoProjetil {
    constructor(x, y, direcao, cor, donoId) {
        this.x = x;
        this.y = y;
        this.direcao = direcao;
        this.cor = cor;
        this.donoId = donoId;
        this.velX = direcao * 8;
        this.velY = -15;
        this.raio = 12;
        this.ativo = true;
        this.tempoVida = 100;
        this.dano = CONFIG.DANO_BOMBA;
    }
    
    atualizar() {
        if (!this.ativo) return;
        
        this.x += this.velX;
        this.y += this.velY;
        this.velY += CONFIG.GRAVIDADE;
        this.tempoVida--;
        
        // Se sair da tela ou tempo acabar, desativa
        if (this.x < 0 || this.x > CONFIG.WIDTH || this.y > CONFIG.CHAO + 50 || this.tempoVida <= 0) {
            this.ativo = false;
        }
    }
    
    desenhar(ctx) {
        if (!this.ativo) return;
        
        // Coco
        ctx.fillStyle = this.cor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.raio, 0, Math.PI * 2);
        ctx.fill();
        
        // Detalhes
        ctx.fillStyle = "#8B4513";
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 4, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x, this.y + 4, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Efeito de trajetória
        ctx.strokeStyle = "rgba(255, 255, 0, 0.3)";
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.velX * 2, this.y - this.velY * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    hitbox() {
        return {
            x: this.x - this.raio,
            y: this.y - this.raio,
            w: this.raio * 2,
            h: this.raio * 2
        };
    }
    
    verificarColisao(jogador) {
        if (!this.ativo || !jogador.vivo) return false;
        return Utils.colisao(this.hitbox(), jogador.hitbox());
    }
}

window.CocoProjetil = CocoProjetil;