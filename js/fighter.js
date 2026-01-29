// Declaração global dos jogadores (serão inicializados em game.js)
let p1, p2;

class LutadorCoco {
    constructor(x, cor, corSapato, controles, direcao, id) {
        this.id = id;
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
    }

    mover(keys) {
        if (!this.vivo || jogoTerminou) return;
        
        if (keys[this.ctrl.esq]) { 
            this.x -= this.vel; 
            this.dir = -1;
        }
        if (keys[this.ctrl.dir]) { 
            this.x += this.vel; 
            this.dir = 1;
        }
        
        this.x = Math.max(LIM_ESQ, Math.min(LIM_DIR, this.x));
    }

    pular(keys) {
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

        if (keys[this.ctrl.atk] && !this.atacando && !this.chutando) {
            this.atacando = true;
            this.tempoAtaque = 8;
            this.olhosAbertos = false;

            const hit = {
                x: this.x + this.dir * 50,
                y: this.y - 40,
                w: 45,
                h: 35
            };

            if (colisao(hit, inimigo.hitbox())) {
                inimigo.receberDano(8);
            }
        }

        const teclaChute = this.id === "p1" ? "c" : ".";
        if (keys[teclaChute] && !this.chutando && !this.atacando) {
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
    
    criarParticulas(x, y, quantidade) {
        for (let i = 0; i < quantidade; i++) {
            setTimeout(() => {
                const particula = {
                    x: x + Math.random() * 20 - 10,
                    y: y + Math.random() * 20 - 10,
                    vx: Math.random() * 4 - 2,
                    vy: Math.random() * -3 - 1,
                    tamanho: Math.random() * 3 + 1,
                    vida: 20,
                    cor: this.cor
                };
                
                ctx.fillStyle = this.cor;
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
        
        // Função definida em game.js
        if (typeof enviarCocoLancado === 'function') {
            enviarCocoLancado(this.id, coco.x, coco.y, direcao);
        }
    }

    hitbox() {
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
        const raioBase = this.tamanho/2;
        
        ctx.fillStyle = this.cor;
        
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 10, raioBase, raioBase * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - raioBase, raioBase * 0.7, raioBase * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - raioBase * 1.5, raioBase * 0.5, raioBase * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - raioBase * 1.8, raioBase * 0.3, raioBase * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#8B4513";
        
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

        this.desenharSapatos();
        this.desenharBracos();
        this.desenharOlhos();
        this.desenharBoca();
        this.desenharCocosAtivos();
        
        if (this.descendoRapido && this.cargaPoder > 0) {
            this.desenharIndicadorPoder();
        }
        
        if (this.cdPoder > 0) {
            this.desenharCooldown();
        }
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

    desenharSapatos() {
        if (this.chutando) {
            this.desenharSapato(this.sapatoX, this.sapatoY, true);
            
            const sapatoNormalX = this.x + (this.dir > 0 ? -15 : 15);
            this.desenharSapato(sapatoNormalX, this.y + 15, false);
        } else {
            const sapatoEsqX = this.x - 15;
            const sapatoDirX = this.x + 15;
            
            if (this.pulando) {
                this.desenharSapato(sapatoEsqX + 5, this.y + 5, false);
                this.desenharSapato(sapatoDirX - 5, this.y + 5, false);
            } else {
                this.desenharSapato(sapatoEsqX, this.y + 15, false);
                this.desenharSapato(sapatoDirX, this.y + 15, false);
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
        
        if (this.atacando) {
            const bracoX = this.x + this.dir * 60;
            const bracoY = this.y - 40;
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.dir * 20, this.y - 40);
            ctx.lineTo(bracoX, bracoY);
            ctx.stroke();
            
            ctx.fillStyle = this.cor;
            ctx.beginPath();
            ctx.arc(bracoX, bracoY, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(this.x - this.dir * 20, this.y - 40);
            ctx.lineTo(this.x - this.dir * 45, this.y - 35);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(this.x - 20, this.y - 40);
            ctx.lineTo(this.x - 50, this.y - 30 + (this.pulando ? -15 : 0));
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x + 20, this.y - 40);
            ctx.lineTo(this.x + 50, this.y - 30 + (this.pulando ? -15 : 0));
            ctx.stroke();
        }
    }

    desenharOlhos() {
        const olgoY = this.y - this.tamanho * 0.9;
        
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
        const bocaY = this.y - this.tamanho * 0.7;
        
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

    reset() {
        this.x = this.inicialX;
        this.y = CHAO;
        this.vy = 0;
        this.vida = 100;
        this.vivo = true;
        this.atacando = false;
        this.chutando = false;
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
