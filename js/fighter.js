// Declaração global dos jogadores (serão inicializados em game.js)
let p1, p2;

// CLASSE BASE PARA TODOS OS PERSONAGENS
class PersonagemBase {
    constructor(x, cor, corSapato, controles, direcao, id, tipo) {
        this.id = id;
        this.tipo = tipo; // "cocozin", "ratazana", "peidovélio"
        this.inicialX = x;
        this.x = x;
        this.y = CHAO;
        this.vy = 0;
        this.cor = cor;
        this.corSapato = corSapato;
        this.tamanho = 80;
        this.vel = 4;
        this.dir = direcao;
        this.pulando = false;
        this.atacando = false;
        this.chutando = false;
        this.abaixado = false; // NOVO: estado abaixado
        this.deslizando = false; // NOVO: estado deslizando
        this.tempoAtaque = 0;
        this.tempoChute = 0;
        this.vida = 100;
        this.vivo = true;
        this.ctrl = controles;
        this.ultimoDano = 0;
        this.olhosAbertos = true;
        this.tempoPiscar = 0;
        this.sapatoX = 0;
        this.sapatoY = 0;
        
        this.descendoRapido = false;
        this.cdPoder = 0;
        this.cocosAtivos = [];
        this.cargaPoder = 0;
        this.maxCarga = 30;
        
        // NOVO: controle do deslize
        this.tempoDeslize = 0;
        this.velDeslize = 10;
    }

    mover(keys) {
        if (!this.vivo || jogoTerminou) return;
        
        // NOVO: Se estiver deslizando, movimento especial
        if (this.deslizando) {
            this.x += this.dir * this.velDeslize;
            this.tempoDeslize--;
            if (this.tempoDeslize <= 0) {
                this.deslizando = false;
                this.abaixado = false;
            }
            return;
        }
        
        // NOVO: Sistema de abaixar
        const teclaBaixo = this.id === "p1" ? "s" : "ArrowDown";
        if (keys[teclaBaixo] && !this.pulando && !this.chutando && !this.atacando) {
            this.abaixado = true;
            // NOVO: Chutar enquanto abaixado = deslizar
            const teclaChute = this.id === "p1" ? "c" : ".";
            if (keys[teclaChute] && !this.deslizando) {
                this.deslizar();
                return;
            }
        } else {
            this.abaixado = false;
        }
        
        // Movimento normal (só se não estiver abaixado)
        if (!this.abaixado) {
            if (keys[this.ctrl.esq]) { 
                this.x -= this.vel; 
                this.dir = -1;
            }
            if (keys[this.ctrl.dir]) { 
                this.x += this.vel; 
                this.dir = 1;
            }
        } else {
            // Movimento reduzido quando abaixado
            if (keys[this.ctrl.esq]) { 
                this.x -= this.vel * 0.5; 
                this.dir = -1;
            }
            if (keys[this.ctrl.dir]) { 
                this.x += this.vel * 0.5; 
                this.dir = 1;
            }
        }
        
        this.x = Math.max(LIM_ESQ, Math.min(LIM_DIR, this.x));
    }
    
    // NOVO: Método para deslizar
    deslizar() {
        this.deslizando = true;
        this.tempoDeslize = 15; // 15 frames de deslize
        this.abaixado = true;
        
        // Efeito visual
        this.criarParticulas(this.x, this.y + 20, 10);
    }

    pular(keys) {
        if (this.abaixado || this.deslizando) return; // Não pode pular abaixado
        
        if (keys[this.ctrl.pulo] && !this.pulando && this.vivo && !this.chutando && !jogoTerminou) {
            this.vy = -18;
            this.pulando = true;
            this.descendoRapido = false;
        }
        
        const teclaBaixo = this.id === "p1" ? "s" : "ArrowDown";
        if (this.pulando && keys[teclaBaixo] && this.cdPoder <= 0) {
            this.descendoRapido = true;
            this.vy = 20;
            this.cargaPoder++;
            
            if (this.cargaPoder % 5 === 0) {
                this.criarParticulas(this.x, this.y, 3);
            }
        } else {
            this.descendoRapido = false;
            this.cargaPoder = 0;
        }
    }

    atacar(keys, inimigo) {
        if (!this.vivo || !inimigo.vivo || jogoTerminou) return;

        if (keys[this.ctrl.atk] && !this.atacando && !this.chutando && !this.deslizando) {
            this.atacando = true;
            this.tempoAtaque = 8;
            this.olhosAbertos = false;

            const hit = {
                x: this.x + this.dir * 50,
                y: this.y - 40,
                w: 45,
                h: 35
            };
            
            // Ajuste para abaixado
            if (this.abaixado && !this.pulando) {
                hit.y = this.y - 20;
                hit.h = 25;
            }

            if (colisao(hit, inimigo.hitbox())) {
                inimigo.receberDano(8);
            }
        }

        const teclaChute = this.id === "p1" ? "c" : ".";
        if (keys[teclaChute] && !this.chutando && !this.atacando && !this.deslizando && !this.abaixado) {
            this.chutando = true;
            this.tempoChute = 12;
            
            this.sapatoX = this.x + this.dir * 20;
            this.sapatoY = this.y + 10;

            const hit = {
                x: this.x + this.dir * 60,
                y: this.y + 5,
                w: 50,
                h: 30
            };

            if (colisao(hit, inimigo.hitbox())) {
                inimigo.receberDano(15);
            }
        }

        if (this.chutando) {
            this.tempoChute--;
            if (this.tempoChute > 8) {
                this.sapatoX += this.dir * 8;
                this.sapatoY -= 2;
            } else if (this.tempoChute > 4) {
                this.sapatoY += 1;
            } else if (this.tempoChute > 0) {
                this.sapatoX -= this.dir * 6;
                this.sapatoY += 3;
            } else {
                this.chutando = false;
            }
        }
        
        if (this.atacando && --this.tempoAtaque <= 0) {
            this.atacando = false;
            this.olhosAbertos = true;
        }
    }
    
    criarParticulas(x, y, quantidade, corPersonalizada = null) {
        for (let i = 0; i < quantidade; i++) {
            setTimeout(() => {
                const particula = {
                    x: x + Math.random() * 20 - 10,
                    y: y + Math.random() * 20 - 10,
                    vx: Math.random() * 4 - 2,
                    vy: Math.random() * -3 - 1,
                    tamanho: Math.random() * 3 + 1,
                    vida: 20,
                    cor: corPersonalizada || this.cor
                };
                
                ctx.fillStyle = particula.cor;
                ctx.beginPath();
                ctx.arc(particula.x, particula.y, particula.tamanho, 0, Math.PI * 2);
                ctx.fill();
            }, i * 10);
        }
    }
    
    atualizarCocos(inimigo) {
        for (let i = this.cocosAtivos.length - 1; i >= 0; i--) {
            const coco = this.cocosAtivos[i];
            coco.atualizar();
            
            if (coco.ativo && inimigo.vivo && colisao(coco.hitbox(), inimigo.hitbox())) {
                inimigo.receberDano(20);
                coco.ativo = false;
                this.criarParticulas(coco.x, coco.y, 10);
            }
            
            if (!coco.ativo) {
                this.cocosAtivos.splice(i, 1);
            }
        }
        
        if (this.cdPoder > 0) {
            this.cdPoder--;
        }
    }

    receberDano(v) {
        if (!this.vivo || jogoTerminou) return;
        
        const agora = Date.now();
        if (agora - this.ultimoDano < 500) return;
        this.ultimoDano = agora;
        
        this.vida -= v;
        if (this.vida <= 0) {
            this.vida = 0;
            this.vivo = false;
            this.y = CHAO + 10;
            this.vy = 0;
        }
        
        this.olhosAbertos = false;
        setTimeout(() => this.olhosAbertos = true, 200);
    }

    fisica() {
        if (!this.vivo) { 
            this.y = CHAO + 10; 
            this.vy = 0;
            return; 
        }
        
        this.y += this.vy;
        
        if (!this.descendoRapido) {
            this.vy += GRAVIDADE;
        }
        
        if (this.y >= CHAO) {
            const bateuComForca = this.vy > 10 && this.descendoRapido && this.cargaPoder > 10;
            
            this.y = CHAO;
            this.vy = 0;
            this.pulando = false;
            this.descendoRapido = false;
            
            if (bateuComForca && this.cdPoder <= 0) {
                this.lancarCoco();
                this.cdPoder = 60;
                this.criarParticulas(this.x, CHAO, 15);
            }
            
            this.cargaPoder = 0;
        }
    }
    
    lancarCoco() {
        const direcao = this.dir;
        
        const coco = new CocoProjetil(
            this.x,
            this.y - 30,
            direcao,
            this.cor,
            this.id
        );
        
        this.cocosAtivos.push(coco);
        
        this.olhosAbertos = false;
        setTimeout(() => this.olhosAbertos = true, 300);
        
        if (typeof enviarCocoLancado === 'function') {
            enviarCocoLancado(this.id, coco.x, coco.y, direcao);
        }
    }

    hitbox() {
        // Hitbox ajustada para abaixado
        if (this.abaixado && !this.pulando) {
            return { 
                x: this.x - this.tamanho/2, 
                y: this.y - this.tamanho * 0.6, 
                w: this.tamanho, 
                h: this.tamanho * 0.6
            };
        }
        
        return { 
            x: this.x - this.tamanho/2, 
            y: this.y - this.tamanho, 
            w: this.tamanho, 
            h: this.tamanho + 20
        };
    }

    desenhar() {
        this.tempoPiscar++;
        if (this.tempoPiscar > 100) {
            this.olhosAbertos = !this.olhosAbertos;
            this.tempoPiscar = 0;
        }
        if (Math.random() < 0.005) {
            this.olhosAbertos = false;
            setTimeout(() => this.olhosAbertos = true, 100);
        }

        if (!this.vivo) {
            this.desenharMorto();
            return;
        }

        this.desenharVivo();
    }
    
    desenharVivo() {
        // Método implementado nas classes filhas
    }
    
    desenharSapatos() {
        // Método implementado nas classes filhas
    }

    desenharSapato(x, y, chutando) {
        // Método implementado nas classes filhas
    }

    desenharBracos() {
        // Método implementado nas classes filhas
    }

    desenharOlhos() {
        // Método implementado nas classes filhas
    }

    desenharBoca() {
        // Método implementado nas classes filhas
    }

    desenharMorto() {
        // Método implementado nas classes filhas
    }

    desenharCocosAtivos() {
        for (const coco of this.cocosAtivos) {
            coco.desenhar();
        }
    }
    
    desenharIndicadorPoder() {
        const porcentagem = Math.min(this.cargaPoder / this.maxCarga, 1);
        const barraWidth = 40;
        const barraHeight = 6;
        const x = this.x - barraWidth / 2;
        const y = this.y - this.tamanho - 30;
        
        ctx.fillStyle = "#333";
        ctx.fillRect(x, y, barraWidth, barraHeight);
        
        ctx.fillStyle = porcentagem >= 1 ? "#ff00ff" : "#00ff00";
        ctx.fillRect(x, y, barraWidth * porcentagem, barraHeight);
        
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barraWidth, barraHeight);
        
        ctx.fillStyle = "white";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText("BOMBA!", this.x, y - 5);
    }
    
    desenharCooldown() {
        const porcentagem = this.cdPoder / 60;
        const raio = 15;
        const x = this.x;
        const y = this.y - this.tamanho - 50;
        
        ctx.strokeStyle = "#ff4444";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, raio, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * (1 - porcentagem)), true);
        ctx.stroke();
        
        ctx.fillStyle = "white";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.fillText(Math.ceil(this.cdPoder / 60 * 10) + "s", x, y + 3);
    }

    reset() {
        this.x = this.inicialX;
        this.y = CHAO;
        this.vy = 0;
        this.vida = 100;
        this.vivo = true;
        this.atacando = false;
        this.chutando = false;
        this.abaixado = false;
        this.deslizando = false;
        this.tempoDeslize = 0;
        this.tempoAtaque = 0;
        this.tempoChute = 0;
        this.ultimoDano = 0;
        this.olhosAbertos = true;
        this.tempoPiscar = 0;
        this.sapatoX = 0;
        this.sapatoY = 0;
        
        this.descendoRapido = false;
        this.cdPoder = 0;
        this.cocosAtivos = [];
        this.cargaPoder = 0;
    }
}

// CLASSE COCOZIN (PERSONAGEM ORIGINAL)
class Cocozin extends PersonagemBase {
    constructor(x, cor, corSapato, controles, direcao, id) {
        super(x, cor, corSapato, controles, direcao, id, "cocozin");
    }
    
    desenharVivo() {
        const raioBase = this.tamanho/2;
        const alturaAjustada = this.abaixado ? 0.7 : 1;
        
        ctx.fillStyle = this.cor;
        
        // Corpo ajustado para abaixado
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 10 * alturaAjustada, raioBase, raioBase * 0.6 * alturaAjustada, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (!this.abaixado) {
            ctx.beginPath();
            ctx.ellipse(this.x, this.y - raioBase, raioBase * 0.7, raioBase * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(this.x, this.y - raioBase * 1.5, raioBase * 0.5, raioBase * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(this.x, this.y - raioBase * 1.8, raioBase * 0.3, raioBase * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = "#8B4513";
        
        if (!this.abaixado) {
            for(let i = 0; i < 7; i++) {
                const angulo = (i / 7) * Math.PI * 2;
                const detalheX = this.x + Math.cos(angulo) * raioBase * 0.7;
                const detalheY = this.y - 10 + Math.sin(angulo) * raioBase * 0.4;
                ctx.beginPath();
                ctx.ellipse(detalheX, detalheY, 4, 3, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            for(let i = 0; i < 5; i++) {
                const angulo = (i / 5) * Math.PI * 2;
                const detalheX = this.x + Math.cos(angulo) * raioBase * 0.5;
                const detalheY = this.y - raioBase + Math.sin(angulo) * raioBase * 0.3;
                ctx.beginPath();
                ctx.ellipse(detalheX, detalheY, 4, 3, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            for(let i = 0; i < 3; i++) {
                const angulo = (i / 3) * Math.PI * 2;
                const detalheX = this.x + Math.cos(angulo) * raioBase * 0.3;
                const detalheY = this.y - raioBase * 1.5 + Math.sin(angulo) * raioBase * 0.2;
                ctx.beginPath();
                ctx.ellipse(detalheX, detalheY, 3, 2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        this.desenharSapatos();
        this.desenharBracos();
        this.desenharOlhos();
        this.desenharBoca();
        this.desenharCocosAtivos();
        
        // Efeito de deslize
        if (this.deslizando) {
            ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
            ctx.beginPath();
            ctx.ellipse(this.x - this.dir * 20, this.y + 5, 30, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (this.descendoRapido && this.cargaPoder > 0) {
            this.desenharIndicadorPoder();
        }
        
        if (this.cdPoder > 0) {
            this.desenharCooldown();
        }
    }
    
    desenharSapatos() {
        const ajusteY = this.abaixado ? 25 : 15;
        
        if (this.chutando) {
            this.desenharSapato(this.sapatoX, this.sapatoY, true);
            
            const sapatoNormalX = this.x + (this.dir > 0 ? -15 : 15);
            this.desenharSapato(sapatoNormalX, this.y + ajusteY, false);
        } else {
            const sapatoEsqX = this.x - 15;
            const sapatoDirX = this.x + 15;
            
            if (this.pulando) {
                this.desenharSapato(sapatoEsqX + 5, this.y + 5, false);
                this.desenharSapato(sapatoDirX - 5, this.y + 5, false);
            } else {
                this.desenharSapato(sapatoEsqX, this.y + ajusteY, false);
                this.desenharSapato(sapatoDirX, this.y + ajusteY, false);
            }
        }
    }

    desenharSapato(x, y, chutando) {
        const tamanhoSapato = chutando ? 25 : 20;
        const alturaSapato = chutando ? 12 : 10;
        
        ctx.fillStyle = this.corSapato;
        ctx.beginPath();
        ctx.ellipse(x, y, tamanhoSapato, alturaSapato, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const corDetalhe = this.corSapato === "cyan" ? "#00aaff" : "#ff4444";
        ctx.fillStyle = corDetalhe;
        ctx.beginPath();
        ctx.ellipse(x + (this.dir > 0 ? 8 : -8), y, tamanhoSapato * 0.6, alturaSapato * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.ellipse(x, y + alturaSapato - 2, tamanhoSapato * 0.9, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (chutando) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            for(let i = 0; i < 3; i++) {
                ctx.moveTo(x - this.dir * 20 - i * 5, y);
                ctx.lineTo(x - this.dir * 40 - i * 10, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    desenharBracos() {
        ctx.strokeStyle = this.cor;
        ctx.lineWidth = 10;
        
        const ajusteY = this.abaixado ? 20 : 0;
        
        if (this.atacando) {
            const bracoX = this.x + this.dir * 60;
            const bracoY = this.y - 40 + ajusteY;
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.dir * 20, this.y - 40 + ajusteY);
            ctx.lineTo(bracoX, bracoY);
            ctx.stroke();
            
            ctx.fillStyle = this.cor;
            ctx.beginPath();
            ctx.arc(bracoX, bracoY, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(this.x - this.dir * 20, this.y - 40 + ajusteY);
            ctx.lineTo(this.x - this.dir * 45, this.y - 35 + ajusteY);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(this.x - 20, this.y - 40 + ajusteY);
            ctx.lineTo(this.x - 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x + 20, this.y - 40 + ajusteY);
            ctx.lineTo(this.x + 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY);
            ctx.stroke();
        }
    }

    desenharOlhos() {
        const olgoY = this.y - this.tamanho * (this.abaixado ? 0.6 : 0.9);
        
        if (this.olhosAbertos) {
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(this.x - 15, olgoY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 15, olgoY, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = "black";
            let pupilaX = 0;
            if (this.atacando || this.chutando || this.descendoRapido) {
                pupilaX = this.dir * 4;
            } else if (this.pulando) {
                pupilaX = 0;
            } else {
                pupilaX = this.dir * 2;
            }
            
            ctx.beginPath();
            ctx.arc(this.x - 15 + pupilaX, olgoY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 15 + pupilaX, olgoY, 4, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            ctx.arc(this.x - 15 + pupilaX - 2, olgoY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 15 + pupilaX - 2, olgoY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = "black";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(this.x - 23, olgoY);
            ctx.lineTo(this.x - 7, olgoY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + 7, olgoY);
            ctx.lineTo(this.x + 23, olgoY);
            ctx.stroke();
        }
    }

    desenharBoca() {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        const bocaY = this.y - this.tamanho * (this.abaixado ? 0.5 : 0.7);
        
        if (this.atacando) {
            ctx.beginPath();
            ctx.arc(this.x, bocaY, 12, 0, Math.PI);
            ctx.stroke();
        } else if (this.chutando) {
            ctx.beginPath();
            ctx.moveTo(this.x - 10, bocaY);
            ctx.lineTo(this.x + 10, bocaY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x - 8, bocaY + 3);
            ctx.lineTo(this.x + 8, bocaY + 3);
            ctx.stroke();
        } else if (this.pulando) {
            ctx.beginPath();
            ctx.arc(this.x, bocaY, 8, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.descendoRapido) {
            ctx.beginPath();
            ctx.moveTo(this.x - 8, bocaY);
            ctx.lineTo(this.x + 8, bocaY);
            ctx.lineTo(this.x + 4, bocaY + 6);
            ctx.lineTo(this.x - 4, bocaY + 6);
            ctx.closePath();
            ctx.stroke();
        } else if (this.abaixado) {
            ctx.beginPath();
            ctx.moveTo(this.x - 8, bocaY);
            ctx.lineTo(this.x + 8, bocaY);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, bocaY, 10, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
    }

    desenharMorto() {
        ctx.fillStyle = this.cor;
        const raioMorto = this.tamanho/2;
        
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 10, raioMorto, raioMorto * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#8B4513";
        for(let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.ellipse(this.x - 20 + i * 10, this.y - 10, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        this.desenharSapato(this.x - 25, this.y + 25, false);
        this.desenharSapato(this.x + 25, this.y + 25, false);
        
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        const olgoY = this.y - this.tamanho * 0.6;
        
        ctx.beginPath();
        ctx.moveTo(this.x - 20, olgoY - 5);
        ctx.lineTo(this.x - 10, olgoY + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x - 10, olgoY - 5);
        ctx.lineTo(this.x - 20, olgoY + 5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 10, olgoY - 5);
        ctx.lineTo(this.x + 20, olgoY + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 20, olgoY - 5);
        ctx.lineTo(this.x + 10, olgoY + 5);
        ctx.stroke();
    }
}

// CLASSE RATAZANA
class Ratazana extends PersonagemBase {
    constructor(x, cor, corSapato, controles, direcao, id) {
        super(x, "#666666", "brown", controles, direcao, id, "ratazana");
        this.corOlhos = "red";
        this.corLuvas = "#8B0000"; // Vermelho escuro para luvas
    }
    
    desenharVivo() {
        const raioBase = this.tamanho/2;
        const alturaAjustada = this.abaixado ? 0.6 : 1;
        
        // Corpo do rato
        ctx.fillStyle = this.cor;
        
        // Corpo principal
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 10 * alturaAjustada, raioBase * 0.9, raioBase * 0.6 * alturaAjustada, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeça
        if (!this.abaixado) {
            ctx.beginPath();
            ctx.ellipse(this.x, this.y - raioBase * 1.2, raioBase * 0.7, raioBase * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Orelhas
        if (!this.abaixado) {
            ctx.fillStyle = "#888888";
            ctx.beginPath();
            ctx.ellipse(this.x - raioBase * 0.5, this.y - raioBase * 1.5, raioBase * 0.3, raioBase * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.ellipse(this.x + raioBase * 0.5, this.y - raioBase * 1.5, raioBase * 0.3, raioBase * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Focinho
        if (!this.abaixado) {
            ctx.fillStyle = "#555555";
            ctx.beginPath();
            ctx.ellipse(this.x, this.y - raioBase * 0.8, raioBase * 0.4, raioBase * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Bigodes
            ctx.strokeStyle = "#333333";
            ctx.lineWidth = 2;
            for(let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - raioBase * 0.8);
                ctx.lineTo(this.x - 30 + i * 10, this.y - raioBase * 0.7);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(this.x, this.y - raioBase * 0.8);
                ctx.lineTo(this.x + 30 - i * 10, this.y - raioBase * 0.7);
                ctx.stroke();
            }
        }
        
        // Rabo
        ctx.strokeStyle = "#444444";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(this.x + (this.dir > 0 ? -raioBase : raioBase), this.y - 5);
        ctx.lineTo(this.x + (this.dir > 0 ? -raioBase * 2 : raioBase * 2), this.y - 15);
        ctx.lineTo(this.x + (this.dir > 0 ? -raioBase * 2.5 : raioBase * 2.5), this.y);
        ctx.stroke();

        this.desenharSapatos();
        this.desenharBracos();
        this.desenharOlhos();
        this.desenharBoca();
        
        // Efeito de deslize
        if (this.deslizando) {
            ctx.fillStyle = "rgba(139, 0, 0, 0.3)";
            ctx.beginPath();
            ctx.ellipse(this.x - this.dir * 20, this.y + 5, 30, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    desenharSapatos() {
        const ajusteY = this.abaixado ? 25 : 15;
        
        // Patas do rato
        ctx.fillStyle = "#444444";
        
        const sapatoEsqX = this.x - 15;
        const sapatoDirX = this.x + 15;
        
        if (this.pulando) {
            ctx.beginPath();
            ctx.ellipse(sapatoEsqX + 5, this.y + 5, 12, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(sapatoDirX - 5, this.y + 5, 12, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(sapatoEsqX, this.y + ajusteY, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(sapatoDirX, this.y + ajusteY, 15, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Unhas
        ctx.fillStyle = "#222222";
        for(let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(sapatoEsqX - 5 + i * 5, this.y + ajusteY + 3, 2, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(sapatoDirX - 5 + i * 5, this.y + ajusteY + 3, 2, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    desenharBracos() {
        // Luvas de boxe
        ctx.strokeStyle = this.corLuvas;
        ctx.lineWidth = 12;
        
        const ajusteY = this.abaixado ? 20 : 0;
        
        if (this.atacando) {
            const bracoX = this.x + this.dir * 60;
            const bracoY = this.y - 40 + ajusteY;
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.dir * 20, this.y - 40 + ajusteY);
            ctx.lineTo(bracoX, bracoY);
            ctx.stroke();
            
            // Luva
            ctx.fillStyle = this.corLuvas;
            ctx.beginPath();
            ctx.arc(bracoX, bracoY, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // Detalhes da luva
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "center";
            ctx.fillText("X", bracoX, bracoY + 4);
            
            // Outro braço
            ctx.beginPath();
            ctx.moveTo(this.x - this.dir * 20, this.y - 40 + ajusteY);
            ctx.lineTo(this.x - this.dir * 45, this.y - 35 + ajusteY);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(this.x - 20, this.y - 40 + ajusteY);
            ctx.lineTo(this.x - 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x + 20, this.y - 40 + ajusteY);
            ctx.lineTo(this.x + 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY);
            ctx.stroke();
        }
        
        // Luvas normais
        ctx.fillStyle = this.corLuvas;
        ctx.beginPath();
        ctx.arc(this.x - 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x + 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    desenharOlhos() {
        const olgoY = this.y - this.tamanho * (this.abaixado ? 0.7 : 1.0);
        
        if (this.olhosAbertos) {
            // Olhos vermelhos do rato
            ctx.fillStyle = this.corOlhos;
            ctx.beginPath();
            ctx.arc(this.x - 12, olgoY, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 12, olgoY, 7, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupilas
            ctx.fillStyle = "black";
            let pupilaX = 0;
            if (this.atacando || this.chutando || this.descendoRapido) {
                pupilaX = this.dir * 3;
            } else if (this.pulando) {
                pupilaX = 0;
            } else {
                pupilaX = this.dir * 2;
            }
            
            ctx.beginPath();
            ctx.arc(this.x - 12 + pupilaX, olgoY, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 12 + pupilaX, olgoY, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Brilho nos olhos
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            ctx.arc(this.x - 12 + pupilaX - 1, olgoY - 1, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 12 + pupilaX - 1, olgoY - 1, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = "black";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(this.x - 18, olgoY);
            ctx.lineTo(this.x - 6, olgoY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + 6, olgoY);
            ctx.lineTo(this.x + 18, olgoY);
            ctx.stroke();
        }
    }

    desenharBoca() {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        const bocaY = this.y - this.tamanho * (this.abaixado ? 0.6 : 0.8);
        
        if (this.atacando) {
            // Boca aberta agressiva
            ctx.beginPath();
            ctx.arc(this.x, bocaY, 15, 0.1, Math.PI - 0.1);
            ctx.stroke();
            
            // Dentes
            ctx.fillStyle = "white";
            for(let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(this.x - 8 + i * 5, bocaY + 5, 3, 0, Math.PI);
                ctx.fill();
            }
        } else if (this.chutando) {
            ctx.beginPath();
            ctx.moveTo(this.x - 10, bocaY);
            ctx.lineTo(this.x + 10, bocaY);
            ctx.stroke();
        } else if (this.abaixado) {
            // Boca fechada quando abaixado
            ctx.beginPath();
            ctx.moveTo(this.x - 6, bocaY);
            ctx.lineTo(this.x + 6, bocaY);
            ctx.stroke();
        } else {
            // Sorriso malicioso
            ctx.beginPath();
            ctx.arc(this.x, bocaY, 10, 0.3, Math.PI - 0.3);
            ctx.stroke();
        }
    }

    desenharMorto() {
        ctx.fillStyle = this.cor;
        const raioMorto = this.tamanho/2;
        
        // Corpo caído
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 5, raioMorto * 0.9, raioMorto * 0.4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Cabeça caída
        ctx.beginPath();
        ctx.ellipse(this.x + 20, this.y - raioMorto * 0.8, raioMorto * 0.6, raioMorto * 0.4, 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos X
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        const olgoY = this.y - raioMorto * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(this.x + 10, olgoY - 5);
        ctx.lineTo(this.x + 20, olgoY + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 20, olgoY - 5);
        ctx.lineTo(this.x + 10, olgoY + 5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 30, olgoY - 5);
        ctx.lineTo(this.x + 40, olgoY + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 40, olgoY - 5);
        ctx.lineTo(this.x + 30, olgoY + 5);
        ctx.stroke();
    }
    
    // Ratazana tem ataque especial: Soco potente
    atacar(keys, inimigo) {
        if (!this.vivo || !inimigo.vivo || jogoTerminou) return;

        if (keys[this.ctrl.atk] && !this.atacando && !this.chutando && !this.deslizando) {
            this.atacando = true;
            this.tempoAtaque = 8;
            this.olhosAbertos = false;

            const hit = {
                x: this.x + this.dir * 60, // Mais longo
                y: this.y - 40,
                w: 50, // Mais largo
                h: 35
            };
            
            // Ajuste para abaixado
            if (this.abaixado && !this.pulando) {
                hit.y = this.y - 20;
                hit.h = 25;
            }

            if (colisao(hit, inimigo.hitbox())) {
                inimigo.receberDano(12); // Dano maior do soco
            }
        }

        const teclaChute = this.id === "p1" ? "c" : ".";
        if (keys[teclaChute] && !this.chutando && !this.atacando && !this.deslizando && !this.abaixado) {
            this.chutando = true;
            this.tempoChute = 12;
            
            this.sapatoX = this.x + this.dir * 20;
            this.sapatoY = this.y + 10;

            const hit = {
                x: this.x + this.dir * 60,
                y: this.y + 5,
                w: 50,
                h: 30
            };

            if (colisao(hit, inimigo.hitbox())) {
                inimigo.receberDano(15);
            }
        }

        if (this.chutando) {
            this.tempoChute--;
            if (this.tempoChute > 8) {
                this.sapatoX += this.dir * 8;
                this.sapatoY -= 2;
            } else if (this.tempoChute > 4) {
                this.sapatoY += 1;
            } else if (this.tempoChute > 0) {
                this.sapatoX -= this.dir * 6;
                this.sapatoY += 3;
            } else {
                this.chutando = false;
            }
        }
        
        if (this.atacando && --this.tempoAtaque <= 0) {
            this.atacando = false;
            this.olhosAbertos = true;
        }
    }
}

// CLASSE PEIDOVÉLIO
class Peidovélio extends PersonagemBase {
    constructor(x, cor, corSapato, controles, direcao, id) {
        super(x, "#D3D3D3", "#808080", controles, direcao, id, "peidovélio");
        this.fumacas = [];
        this.tempoFumaca = 0;
    }
    
    desenharVivo() {
        const raioBase = this.tamanho/2;
        const alturaAjustada = this.abaixado ? 0.7 : 1;
        
        // Corpo de fumaça (nuvem)
        ctx.fillStyle = "rgba(211, 211, 211, 0.8)";
        ctx.strokeStyle = "rgba(169, 169, 169, 0.9)";
        ctx.lineWidth = 3;
        
        // Desenha várias bolhas para efeito de nuvem
        for(let i = 0; i < 5; i++) {
            const offsetX = Math.sin(Date.now()/500 + i) * 5;
            const offsetY = Math.cos(Date.now()/500 + i) * 3;
            
            ctx.beginPath();
            ctx.arc(
                this.x + offsetX + (i-2) * 15, 
                this.y - 20 * alturaAjustada + offsetY, 
                raioBase * (0.6 - i*0.1), 
                0, Math.PI * 2
            );
            ctx.fill();
            ctx.stroke();
        }
        
        // Olhos flutuantes
        const olhoOffset = Math.sin(Date.now()/300) * 3;
        this.desenharOlhos(olgoY);
        
        // Boca flutuante
        const bocaOffset = Math.cos(Date.now()/400) * 2;
        this.desenharBoca();
        
        // Fumaças ativas
        this.atualizarFumacas();
        
        // Efeito de deslize especial (deixa rastro de fumaça)
        if (this.deslizando) {
            this.criarFumaca(this.x - this.dir * 10, this.y + 10, this.dir);
            ctx.fillStyle = "rgba(169, 169, 169, 0.4)";
            ctx.beginPath();
            ctx.ellipse(this.x - this.dir * 30, this.y + 5, 40, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        this.desenharSapatos();
        this.desenharBracos();
    }
    
    desenharSapatos() {
        const ajusteY = this.abaixado ? 25 : 15;
        
        // Sapatos de fumaça
        ctx.fillStyle = "rgba(128, 128, 128, 0.8)";
        
        const sapatoEsqX = this.x - 15;
        const sapatoDirX = this.x + 15;
        
        if (this.pulando) {
            ctx.beginPath();
            ctx.arc(sapatoEsqX + 5, this.y + 5, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(sapatoDirX - 5, this.y + 5, 10, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(sapatoEsqX, this.y + ajusteY, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(sapatoDirX, this.y + ajusteY, 12, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    desenharBracos() {
        ctx.strokeStyle = "rgba(169, 169, 169, 0.9)";
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        
        const ajusteY = this.abaixado ? 20 : 0;
        const bracoOffset = Math.sin(Date.now()/400) * 2;
        
        if (this.atacando) {
            const bracoX = this.x + this.dir * 60;
            const bracoY = this.y - 40 + ajusteY + bracoOffset;
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.dir * 20, this.y - 40 + ajusteY);
            ctx.lineTo(bracoX, bracoY);
            ctx.stroke();
            
            // Mão de fumaça
            ctx.fillStyle = "rgba(211, 211, 211, 0.8)";
            ctx.beginPath();
            ctx.arc(bracoX, bracoY, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // Outro braço
            ctx.beginPath();
            ctx.moveTo(this.x - this.dir * 20, this.y - 40 + ajusteY);
            ctx.lineTo(this.x - this.dir * 45, this.y - 35 + ajusteY + bracoOffset);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(this.x - 20, this.y - 40 + ajusteY);
            ctx.lineTo(this.x - 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY + bracoOffset);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x + 20, this.y - 40 + ajusteY);
            ctx.lineTo(this.x + 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY + bracoOffset);
            ctx.stroke();
        }
        
        // Mãos
        ctx.fillStyle = "rgba(211, 211, 211, 0.8)";
        ctx.beginPath();
        ctx.arc(this.x - 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY + bracoOffset, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x + 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY + bracoOffset, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    desenharOlhos() {
        const olgoY = this.y - this.tamanho * (this.abaixado ? 0.7 : 0.9);
        const olhoOffset = Math.sin(Date.now()/300) * 3;
        
        if (this.olhosAbertos) {
            // Olhos esfumaçados
            ctx.fillStyle = "rgba(105, 105, 105, 0.9)";
            ctx.beginPath();
            ctx.arc(this.x - 15, olgoY + olhoOffset, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 15, olgoY + olhoOffset, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupilas flutuantes
            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            let pupilaX = 0;
            if (this.atacando || this.chutando || this.descendoRapido) {
                pupilaX = this.dir * 4;
            } else if (this.pulando) {
                pupilaX = 0;
            } else {
                pupilaX = this.dir * 2;
            }
            
            const pupilaOffset = Math.cos(Date.now()/350) * 2;
            ctx.beginPath();
            ctx.arc(this.x - 15 + pupilaX + pupilaOffset, olgoY + olhoOffset, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 15 + pupilaX + pupilaOffset, olgoY + olhoOffset, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = "rgba(105, 105, 105, 0.9)";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(this.x - 23, olgoY + olhoOffset);
            ctx.lineTo(this.x - 7, olgoY + olhoOffset);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + 7, olgoY + olhoOffset);
            ctx.lineTo(this.x + 23, olgoY + olhoOffset);
            ctx.stroke();
        }
    }

    desenharBoca() {
        ctx.strokeStyle = "rgba(105, 105, 105, 0.9)";
        ctx.lineWidth = 4;
        const bocaY = this.y - this.tamanho * (this.abaixado ? 0.5 : 0.7);
        const bocaOffset = Math.cos(Date.now()/400) * 2;
        
        if (this.atacando) {
            ctx.beginPath();
            ctx.arc(this.x, bocaY + bocaOffset, 15, 0, Math.PI);
            ctx.stroke();
            
            // Fumaça saindo da boca
            this.criarFumaca(this.x, bocaY + 10, this.dir);
        } else if (this.chutando) {
            ctx.beginPath();
            ctx.moveTo(this.x - 10, bocaY + bocaOffset);
            ctx.lineTo(this.x + 10, bocaY + bocaOffset);
            ctx.stroke();
        } else if (this.abaixado) {
            ctx.beginPath();
            ctx.moveTo(this.x - 8, bocaY + bocaOffset);
            ctx.lineTo(this.x + 8, bocaY + bocaOffset);
            ctx.stroke();
        } else if (this.descendoRapido) {
            // Boca aberta com fumaça
            ctx.beginPath();
            ctx.arc(this.x, bocaY + bocaOffset, 12, 0.1, Math.PI - 0.1);
            ctx.stroke();
            this.criarFumaca(this.x, bocaY, 0);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, bocaY + bocaOffset, 10, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
    }
    
    criarFumaca(x, y, direcao) {
        this.tempoFumaca++;
        if (this.tempoFumaca > 5) {
            this.fumacas.push({
                x: x,
                y: y,
                raio: 10,
                alpha: 0.8,
                vx: (Math.random() - 0.5) * 2 + direcao * 1,
                vy: Math.random() * -1 - 0.5,
                vida: 30
            });
            this.tempoFumaca = 0;
        }
    }
    
    atualizarFumacas() {
        for (let i = this.fumacas.length - 1; i >= 0; i--) {
            const f = this.fumacas[i];
            
            // Atualiza posição
            f.x += f.vx;
            f.y += f.vy;
            f.raio += 0.3;
            f.alpha -= 0.02;
            f.vida--;
            
            // Desenha fumaça
            ctx.fillStyle = `rgba(169, 169, 169, ${f.alpha})`;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.raio, 0, Math.PI * 2);
            ctx.fill();
            
            // Remove fumaça antiga
            if (f.vida <= 0 || f.alpha <= 0) {
                this.fumacas.splice(i, 1);
            }
        }
    }
    
    desenharMorto() {
        // Peidovélio desaparece em fumaça
        for(let i = 0; i < 20; i++) {
            this.criarFumaca(this.x, this.y - 30, 0);
        }
        
        // Desenha fumaça da morte
        ctx.fillStyle = "rgba(105, 105, 105, 0.6)";
        ctx.beginPath();
        ctx.arc(this.x, this.y - 20, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos X na fumaça
        ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
        ctx.lineWidth = 4;
        
        ctx.beginPath();
        ctx.moveTo(this.x - 20, this.y - 40);
        ctx.lineTo(this.x - 10, this.y - 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y - 40);
        ctx.lineTo(this.x - 20, this.y - 30);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y - 40);
        ctx.lineTo(this.x + 20, this.y - 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 20, this.y - 40);
        ctx.lineTo(this.x + 10, this.y - 30);
        ctx.stroke();
    }
    
    // Peidovélio tem ataque especial: Nuvem tóxica
    atacar(keys, inimigo) {
        if (!this.vivo || !inimigo.vivo || jogoTerminou) return;

        if (keys[this.ctrl.atk] && !this.atacando && !this.chutando && !this.deslizando) {
            this.atacando = true;
            this.tempoAtaque = 12; // Mais longo
            this.olhosAbertos = false;

            const hit = {
                x: this.x + this.dir * 40,
                y: this.y - 50,
                w: 60, // Área maior
                h: 40
            };
            
            // Ajuste para abaixado
            if (this.abaixado && !this.pulando) {
                hit.y = this.y - 30;
                hit.h = 30;
            }

            if (colisao(hit, inimigo.hitbox())) {
                inimigo.receberDano(6); // Dano menor mas...
                // Chance de envenenamento (dano contínuo)
                if (Math.random() < 0.3) {
                    setTimeout(() => {
                        if (inimigo.vivo && !jogoTerminou) {
                            inimigo.receberDano(3);
                        }
                    }, 500);
                }
            }
            
            // Cria fumaça no ataque
            this.criarFumaca(this.x + this.dir * 30, this.y - 40, this.dir);
        }

        const teclaChute = this.id === "p1" ? "c" : ".";
        if (keys[teclaChute] && !this.chutando && !this.atacando && !this.deslizando && !this.abaixado) {
            this.chutando = true;
            this.tempoChute = 12;
            
            this.sapatoX = this.x + this.dir * 20;
            this.sapatoY = this.y + 10;

            const hit = {
                x: this.x + this.dir * 60,
                y: this.y + 5,
                w: 50,
                h: 30
            };

            if (colisao(hit, inimigo.hitbox())) {
                inimigo.receberDano(15);
                // Fumaça no chute
                this.criarFumaca(this.sapatoX, this.sapatoY, this.dir);
            }
        }

        if (this.chutando) {
            this.tempoChute--;
            if (this.tempoChute > 8) {
                this.sapatoX += this.dir * 8;
                this.sapatoY -= 2;
                // Rastro de fumaça
                this.criarFumaca(this.sapatoX, this.sapatoY, this.dir);
            } else if (this.tempoChute > 4) {
                this.sapatoY += 1;
            } else if (this.tempoChute > 0) {
                this.sapatoX -= this.dir * 6;
                this.sapatoY += 3;
            } else {
                this.chutando = false;
            }
        }
        
        if (this.atacando && --this.tempoAtaque <= 0) {
            this.atacando = false;
            this.olhosAbertos = true;
        }
    }
}

// Fábrica de personagens
function criarPersonagem(tipo, x, controles, direcao, id) {
    switch(tipo) {
        case "ratazana":
            return new Ratazana(x, "#666666", "brown", controles, direcao, id);
        case "peidovélio":
            return new Peidovélio(x, "#D3D3D3", "#808080", controles, direcao, id);
        case "cocozin":
        default:
            return new Cocozin(x, "#8B7355", id === "p1" ? "cyan" : "red", controles, direcao, id);
    }
}
