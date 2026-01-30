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

    mover() {
        if (!this.vivo || jogoTerminou) return;
        
        // Se estiver deslizando
        if (this.deslizando) {
            this.x += this.dir * this.velDeslize;
            this.tempoDeslize--;
            if (this.tempoDeslize <= 0) {
                this.deslizando = false;
                this.abaixado = false;
            }
            return;
        }
        
        // Sistema de abaixar
        if (keys[this.ctrl.baixo] && !this.pulando && !this.chutando && !this.atacando) {
            this.abaixado = true;
            
            // Chutar enquanto abaixado = deslizar
            if (keys[this.ctrl.chute] && !this.deslizando) {
                this.deslizar();
                return;
            }
        } else {
            this.abaixado = false;
        }
        
        // Movimento normal
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
    
    pular() {
        if (this.abaixado || this.deslizando) return;
        
        if (keys[this.ctrl.pulo] && !this.pulando && this.vivo && !this.chutando && !jogoTerminou) {
            this.vy = -18;
            this.pulando = true;
            this.descendoRapido = false;
        }
        
        if (this.pulando && keys[this.ctrl.baixo] && this.cdPoder <= 0) {
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
    
    atacar(inimigo) {
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
            
            if (this.abaixado && !this.pulando) {
                hit.y = this.y - 20;
                hit.h = 25;
            }

            if (colisao(hit, inimigo.hitbox())) {
                inimigo.receberDano(8);
            }
        }

        if (keys[this.ctrl.chute] && !this.chutando && !this.atacando && !this.deslizando && !this.abaixado) {
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

    // NOVO: Verificar comandos especiais
    verificarEspeciais(keys) {
        // Implementado nas classes filhas
    }
    
    // NOVO: Executar especial
    executarEspecial(tipo, inimigo) {
        // Implementado nas classes filhas
    }

    
}

// Controles FIXOS para 4 jogadores
const CONTROLES_FIXOS = {
    'p1': {
        esq: 'KeyA',
        dir: 'KeyD',
        pulo: 'KeyW',
        atk: 'KeyF',
        chute: 'KeyC',
        baixo: 'KeyS'
    },
    'p2': {
        esq: 'ArrowLeft',
        dir: 'ArrowRight',
        pulo: 'ArrowUp',
        atk: 'Enter',
        chute: 'Period',
        baixo: 'ArrowDown'
    },
    'p3': {
        esq: 'KeyJ',
        dir: 'KeyL',
        pulo: 'KeyI',
        atk: 'KeyH',
        chute: 'KeyN',
        baixo: 'KeyK'
    },
    'p4': {
        esq: 'Numpad4',
        dir: 'Numpad6',
        pulo: 'Numpad8',
        atk: 'Numpad0',
        chute: 'NumpadDecimal',
        baixo: 'Numpad5'
    }
};


// Mapeamento de cores para os players
const CORES_PLAYERS = {
    'p1': { corSapato: "cyan", cor: "#8B7355" },
    'p2': { corSapato: "red", cor: "#8B7355" },
    'p3': { corSapato: "yellow", cor: "#8B7355" },
    'p4': { corSapato: "lime", cor: "#8B7355" }
};

// Fábrica de personagens SIMPLIFICADA
function criarPersonagem(tipo, x, playerId) {
    // Determinar cores baseadas no ID do player
    const cores = {
        'p1': { cor: "#8B7355", corSapato: "cyan" },
        'p2': { cor: "#8B7355", corSapato: "red" },
        'p3': { cor: "#8B7355", corSapato: "yellow" },
        'p4': { cor: "#8B7355", corSapato: "lime" }
    };
    
    const playerNum = playerId.charAt(1);
    const direcao = parseInt(playerNum) <= 2 ? 1 : -1;
    const controles = CONTROLES_FIXOS[playerId] || CONTROLES_FIXOS['p1'];
    const cor = cores[playerId] || cores['p1'];
    
    switch(tipo) {
        case "ratazana":
            return new Ratazana(x, "#666666", "brown", controles, direcao, playerId);
        case "peidovélio":
            return new Peidovélio(x, "#D3D3D3", "#808080", controles, direcao, playerId);
        case "cocozin":
        default:
            return new Cocozin(x, cor.cor, cor.corSapato, controles, direcao, playerId);
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

    atacar(keys, inimigo) {
        // Primeiro verificar especiais
        this.verificarEspeciaisCocozin(keys, inimigo);
        
        // Depois ataques normais (código existente)...
    }
    
    verificarEspeciaisCocozin(keys, inimigo) {
        // BOMBA DE COCÔ: Pular + Abaixar no ar
        if (this.pulando && keys[this.ctrl.baixo] && this.cdPoder <= 0) {
            this.executarBombaDeCoco(inimigo);
        }
    }
    
    executarBombaDeCoco(inimigo) {
        console.log(`${this.id} ativou BOMBA DE COCÔ!`);
        
        // Aumenta velocidade da descida
        this.descendoRapido = true;
        this.vy = 25;
        this.cdPoder = 90; // 1.5 segundos de cooldown
        
        // Efeito visual
        this.criarParticulas(this.x, this.y, 15, "#ff0");
        
        // Se atingir o chão com força, causa dano em área
        setTimeout(() => {
            if (this.y >= CHAO - 5 && this.y <= CHAO + 5) {
                this.explodirBomba(inimigo);
            }
        }, 300);
    }
    
    explodirBomba(inimigo) {
        // Dano em área
        const distancia = Math.abs(this.x - inimigo.x);
        if (distancia < 100 && inimigo.vivo) {
            inimigo.receberDano(25);
            
            // Empurra o inimigo
            inimigo.x += (inimigo.x < this.x ? -50 : 50);
            
            // Efeito de explosão
            this.criarParticulas(this.x, CHAO, 30, "#8B4513");
        }
    }
    
}

// CLASSE RATAZANA
class Ratazana extends PersonagemBase {
    constructor(x, cor, corSapato, controles, direcao, id) {
        super(x, "#666666", "brown", controles, direcao, id, "ratazana");
        this.corOlhos = "red";
        this.corLuvas = "#8B0000"; // Vermelho escuro para luvas
        
        // NOVAS VARIÁVEIS PARA ESPECIAIS
        this.mordendo = false;
        this.tempoMordida = 0;
        this.caudaGirando = false;
        this.tempoCauda = 0;
        this.cdMordida = 0;
        this.cdCauda = 0;
    }
    
    atacar(keys, inimigo) {
        if (!this.vivo || !inimigo.vivo || jogoTerminou) return;

        // PRIMEIRO: Verificar comandos especiais
        this.verificarEspeciais(keys, inimigo);
        
        // DEPOIS: Ataques normais (só se não estiver usando especial)
        if (!this.mordendo && !this.caudaGirando) {
            // ATAQUE DE SOCO NORMAL
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

            // ATAQUE DE CHUTE NORMAL
            const teclaChute = this.ctrl.chute || (this.id === "p1" ? "c" : ".");
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

            // Atualiza animação do chute
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
        }
        
        // Atualiza animação do soco
        if (this.atacando && --this.tempoAtaque <= 0) {
            this.atacando = false;
            this.olhosAbertos = true;
        }
        
        // Atualiza animações dos especiais
        this.atualizarEspeciais(inimigo);
    }
    
    // NOVO: Verificar comandos especiais
    verificarEspeciais(keys, inimigo) {
        // Atualizar cooldowns
        if (this.cdMordida > 0) this.cdMordida--;
        if (this.cdCauda > 0) this.cdCauda--;
        
        // ESPECIAL 1: MORDIDA RÁPIDA (Abaixar + Socar)
        if (this.abaixado && keys[this.ctrl.atk] && !this.mordendo && !this.caudaGirando && this.cdMordida <= 0) {
            this.executarMordida(inimigo);
        }
        
        // ESPECIAL 2: CAUDA GIRATÓRIA (Abaixar + Chutar)
        const teclaChute = this.ctrl.chute || (this.id === "p1" ? "c" : ".");
        if (this.abaixado && keys[teclaChute] && !this.mordendo && !this.caudaGirando && this.cdCauda <= 0) {
            this.executarCaudaGiratoria(inimigo);
        }
    }
    
    executarMordida(inimigo) {
        console.log(`🐀 ${this.id} ativou MORDIDA RÁPIDA!`);
        
        this.mordendo = true;
        this.tempoMordida = 20; // 20 frames de duração
        this.cdMordida = 60; // 1 segundo de cooldown
        this.olhosAbertos = false;
        
        // Efeito sonoro visual
        this.criarParticulas(this.x + this.dir * 30, this.y - 20, 10, "#ff0000");
        
        // Hitbox da mordida (rápida e precisa)
        const hit = {
            x: this.x + this.dir * 40,
            y: this.y - 25,
            w: 35,
            h: 20
        };
        
        if (colisao(hit, inimigo.hitbox())) {
            // Dano inicial maior
            inimigo.receberDano(15);
            
            // Efeito de sangramento (dano contínuo)
            this.aplicarSangramento(inimigo);
            
            // Efeito visual de mordida
            this.criarParticulas(inimigo.x, inimigo.y - 30, 15, "#8B0000");
        }
    }
    
    aplicarSangramento(inimigo) {
        // Sangramento causa dano contínuo por 3 segundos
        for (let i = 1; i <= 6; i++) {
            setTimeout(() => {
                if (inimigo.vivo && !jogoTerminou) {
                    inimigo.receberDano(2);
                    
                    // Efeito visual do sangramento
                    ctx.fillStyle = "rgba(139, 0, 0, 0.5)";
                    ctx.beginPath();
                    ctx.arc(inimigo.x, inimigo.y - 40, 15, 0, Math.PI * 2);
                    ctx.fill();
                }
            }, i * 500); // Dano a cada 0.5 segundos
        }
    }
    
    executarCaudaGiratoria(inimigo) {
        console.log(`🐀 ${this.id} ativou CAUDA GIRATÓRIA!`);
        
        this.caudaGirando = true;
        this.tempoCauda = 30; // 30 frames de duração
        this.cdCauda = 90; // 1.5 segundos de cooldown
        
        // Efeito inicial
        this.criarParticulas(this.x, this.y, 20, "#444444");
        
        // Ataque giratório (atinge em área)
        const raioAtaque = 70;
        const distancia = Math.sqrt(
            Math.pow(inimigo.x - this.x, 2) + 
            Math.pow(inimigo.y - this.y, 2)
        );
        
        if (distancia < raioAtaque && inimigo.vivo) {
            // Dano significativo
            inimigo.receberDano(25);
            
            // Empurrão forte
            const dirEmpurrao = inimigo.x < this.x ? -1 : 1;
            inimigo.x += dirEmpurrao * 100;
            inimigo.y -= 20; // Levanta o inimigo
            
            // Efeito visual
            this.criarParticulas(inimigo.x, inimigo.y, 25, "#ff6600");
        }
    }
    
    atualizarEspeciais(inimigo) {
        // Atualizar mordida
        if (this.mordendo) {
            this.tempoMordida--;
            
            // Efeito visual durante a mordida
            if (this.tempoMordida > 10) {
                this.criarParticulas(this.x + this.dir * 45, this.y - 20, 2, "#ff0000");
            }
            
            if (this.tempoMordida <= 0) {
                this.mordendo = false;
                this.olhosAbertos = true;
            }
        }
        
        // Atualizar cauda giratória
        if (this.caudaGirando) {
            this.tempoCauda--;
            
            // Efeito visual da cauda girando
            const angulo = Date.now() / 50; // Rotação rápida
            for (let i = 0; i < 4; i++) {
                const raio = 50;
                const x = this.x + Math.cos(angulo + i * Math.PI / 2) * raio;
                const y = this.y + Math.sin(angulo + i * Math.PI / 2) * raio;
                
                this.criarParticulas(x, y, 2, "#666666");
            }
            
            // Dano contínuo durante o giro
            if (this.tempoCauda > 15 && this.tempoCauda % 5 === 0) {
                const raioAtaque = 60;
                const distancia = Math.sqrt(
                    Math.pow(inimigo.x - this.x, 2) + 
                    Math.pow(inimigo.y - this.y, 2)
                );
                
                if (distancia < raioAtaque && inimigo.vivo) {
                    inimigo.receberDano(5);
                }
            }
            
            if (this.tempoCauda <= 0) {
                this.caudaGirando = false;
            }
        }
    }
    
    // Sobrescrever o método desenhar para incluir efeitos especiais
    desenharVivo() {
        const raioBase = this.tamanho/2;
        const alturaAjustada = this.abaixado ? 0.6 : 1;
        
        // EFEITOS ESPECIAIS (desenhados primeiro)
        if (this.mordendo) {
            // Efeito de mordida
            ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
            ctx.beginPath();
            ctx.arc(this.x + this.dir * 45, this.y - 20, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // Dentes brilhantes
            ctx.fillStyle = "#FFFFFF";
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(this.x + this.dir * (50 + i * 5), this.y - 25 + i * 3, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        if (this.caudaGirando) {
            // Efeito de cauda giratória
            ctx.strokeStyle = "rgba(139, 0, 0, 0.7)";
            ctx.lineWidth = 8;
            ctx.setLineDash([5, 5]);
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, 60, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // CORPO DO RATO (código original mantido)
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
        
        // Rabo (melhorado para especial)
        ctx.strokeStyle = this.caudaGirando ? "#ff6600" : "#444444";
        ctx.lineWidth = this.caudaGirando ? 12 : 8;
        ctx.lineCap = "round";
        
        const raboCurvatura = this.caudaGirando ? Math.sin(Date.now() / 100) * 0.5 : 0;
        
        ctx.beginPath();
        ctx.moveTo(this.x + (this.dir > 0 ? -raioBase : raioBase), this.y - 5);
        
        // Curva do rabo (mais expressiva durante especial)
        if (this.caudaGirando) {
            ctx.bezierCurveTo(
                this.x + (this.dir > 0 ? -raioBase * 1.5 : raioBase * 1.5),
                this.y - 25,
                this.x + (this.dir > 0 ? -raioBase * 2.2 : raioBase * 2.2),
                this.y - 10,
                this.x + (this.dir > 0 ? -raioBase * 2.8 : raioBase * 2.8),
                this.y + 15
            );
        } else {
            ctx.bezierCurveTo(
                this.x + (this.dir > 0 ? -raioBase * 1.5 : raioBase * 1.5),
                this.y - 15,
                this.x + (this.dir > 0 ? -raioBase * 2.2 : raioBase * 2.2),
                this.y - 5,
                this.x + (this.dir > 0 ? -raioBase * 2.5 : raioBase * 2.5),
                this.y + 10
            );
        }
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
        
        // Indicador de cooldown dos especiais
        this.desenharCooldowns();
    }
    
    desenharCooldowns() {
        const y = this.y - this.tamanho - 70;
        
        // Cooldown da mordida
        if (this.cdMordida > 0) {
            const porcentagem = this.cdMordida / 60;
            ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
            ctx.fillRect(this.x - 25, y, 50 * porcentagem, 8);
            
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 25, y, 50, 8);
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "10px Arial";
            ctx.textAlign = "center";
            ctx.fillText("MORDIDA", this.x, y - 5);
        }
        
        // Cooldown da cauda
        if (this.cdCauda > 0) {
            const porcentagem = this.cdCauda / 90;
            ctx.fillStyle = "rgba(139, 0, 0, 0.5)";
            ctx.fillRect(this.x - 25, y + 15, 50 * porcentagem, 8);
            
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 25, y + 15, 50, 8);
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "10px Arial";
            ctx.textAlign = "center";
            ctx.fillText("CAUDA", this.x, y + 10);
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
        
        // Braços durante mordida são diferentes
        if (this.mordendo) {
            // Braços para frente para morder
            const bracoX = this.x + this.dir * 50;
            const bracoY = this.y - 35 + ajusteY;
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.dir * 15, this.y - 40 + ajusteY);
            ctx.lineTo(bracoX, bracoY);
            ctx.stroke();
            
            // Mão de mordida
            ctx.fillStyle = this.corLuvas;
            ctx.beginPath();
            ctx.arc(bracoX, bracoY, 18, 0, Math.PI * 2);
            ctx.fill();
            
            // Efeito de mordida na luva
            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            ctx.fillText("⚔", bracoX, bracoY + 5);
            
            // Outro braço
            ctx.beginPath();
            ctx.moveTo(this.x - this.dir * 15, this.y - 40 + ajusteY);
            ctx.lineTo(this.x - this.dir * 40, this.y - 35 + ajusteY);
            ctx.stroke();
        } else if (this.atacando) {
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
        
        // Luvas normais (ou durante especiais)
        ctx.fillStyle = this.corLuvas;
        if (!this.mordendo) {
            ctx.beginPath();
            ctx.arc(this.x - 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY, 15, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x + 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY, 15, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Luvas menores durante mordida
            ctx.beginPath();
            ctx.arc(this.x - 40, this.y - 35 + ajusteY, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(this.x + 40, this.y - 35 + ajusteY, 12, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    desenharOlhos() {
        const olgoY = this.y - this.tamanho * (this.abaixado ? 0.7 : 1.0);
        
        if (this.olhosAbertos) {
            // Olhos vermelhos do rato (mais intensos durante especiais)
            const intensidade = this.mordendo || this.caudaGirando ? 1 : 0.8;
            ctx.fillStyle = this.mordendo ? "#ff0000" : this.corOlhos;
            
            ctx.beginPath();
            ctx.arc(this.x - 12, olgoY, this.mordendo ? 9 : 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 12, olgoY, this.mordendo ? 9 : 7, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupilas (menores e mais focadas durante mordida)
            ctx.fillStyle = "black";
            let pupilaX = 0;
            let pupilaY = 0;
            
            if (this.mordendo) {
                pupilaX = this.dir * 2;
                pupilaY = -2; // Olhos focados
            } else if (this.atacando || this.chutando || this.descendoRapido || this.caudaGirando) {
                pupilaX = this.dir * 3;
            } else if (this.pulando) {
                pupilaX = 0;
                pupilaY = 2;
            } else {
                pupilaX = this.dir * 2;
            }
            
            ctx.beginPath();
            ctx.arc(this.x - 12 + pupilaX, olgoY + pupilaY, this.mordendo ? 2 : 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 12 + pupilaX, olgoY + pupilaY, this.mordendo ? 2 : 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Brilho nos olhos (mais intenso durante especiais)
            ctx.fillStyle = this.mordendo ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            ctx.arc(this.x - 12 + pupilaX - 1, olgoY + pupilaY - 1, this.mordendo ? 1.2 : 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 12 + pupilaX - 1, olgoY + pupilaY - 1, this.mordendo ? 1.2 : 1.5, 0, Math.PI * 2);
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
        ctx.strokeStyle = this.mordendo ? "#ff0000" : "black";
        ctx.lineWidth = this.mordendo ? 4 : 3;
        const bocaY = this.y - this.tamanho * (this.abaixado ? 0.6 : 0.8);
        
        if (this.mordendo) {
            // Boca aberta agressiva para morder
            ctx.beginPath();
            ctx.arc(this.x, bocaY, 18, 0.1, Math.PI - 0.1);
            ctx.stroke();
            
            // Dentes afiados e brilhantes
            ctx.fillStyle = "#FFFFFF";
            for(let i = 0; i < 6; i++) {
                const xPos = this.x - 12 + i * 5;
                ctx.beginPath();
                ctx.moveTo(xPos, bocaY + 2);
                ctx.lineTo(xPos - 2, bocaY + 8);
                ctx.lineTo(xPos + 2, bocaY + 8);
                ctx.closePath();
                ctx.fill();
            }
            
            // Língua
            ctx.fillStyle = "#ff6666";
            ctx.beginPath();
            ctx.ellipse(this.x, bocaY + 10, 8, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.atacando) {
            // Boca aberta agressiva normal
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
        } else if (this.caudaGirando) {
            // Sorriso malicioso durante cauda giratória
            ctx.beginPath();
            ctx.arc(this.x, bocaY, 12, 0.4, Math.PI - 0.4);
            ctx.stroke();
        } else {
            // Sorriso malicioso normal
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
    
    // Sobrescrever método reset para limpar estados especiais
    reset() {
        super.reset();
        this.mordendo = false;
        this.tempoMordida = 0;
        this.caudaGirando = false;
        this.tempoCauda = 0;
        this.cdMordida = 0;
        this.cdCauda = 0;
    }
}

// CLASSE PEIDOVÉLIO
class Peidovélio extends PersonagemBase {
    constructor(x, cor, corSapato, controles, direcao, id) {
        super(x, "#D3D3D3", "#808080", controles, direcao, id, "peidovélio");
        
        // ESPECIAIS DO PEIDOVÉLIO
        this.fumacas = [];
        this.tempoFumaca = 0;
        this.nuvensToxicas = []; // Nuvens venenosas ativas
        this.tornados = []; // Tornados ativos
        this.cdNuvem = 0; // Cooldown da nuvem tóxica
        this.cdTornado = 0; // Cooldown do tornado
        this.usandoEspecial = false; // Flag para controle de animação
    }
    
    atacar(keys, inimigo) {
        if (!this.vivo || !inimigo.vivo || jogoTerminou) return;

        // PRIMEIRO: Verificar comandos especiais
        this.verificarEspeciais(keys, inimigo);
        
        // DEPOIS: Ataques normais (só se não estiver usando especial)
        if (!this.usandoEspecial) {
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
                        this.aplicarVenenoLeve(inimigo);
                    }
                }
                
                // Cria fumaça no ataque
                this.criarFumaca(this.x + this.dir * 30, this.y - 40, this.dir, "#4a8a4a");
            }

            const teclaChute = this.ctrl.chute || (this.id === "p1" ? "c" : ".");
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
                    this.criarFumaca(this.sapatoX, this.sapatoY, this.dir, "#696969");
                }
            }

            if (this.chutando) {
                this.tempoChute--;
                if (this.tempoChute > 8) {
                    this.sapatoX += this.dir * 8;
                    this.sapatoY -= 2;
                    // Rastro de fumaça
                    this.criarFumaca(this.sapatoX, this.sapatoY, this.dir, "#a9a9a9");
                } else if (this.tempoChute > 4) {
                    this.sapatoY += 1;
                } else if (this.tempoChute > 0) {
                    this.sapatoX -= this.dir * 6;
                    this.sapatoY += 3;
                } else {
                    this.chutando = false;
                }
            }
        }
        
        if (this.atacando && --this.tempoAtaque <= 0) {
            this.atacando = false;
            this.olhosAbertos = true;
        }
        
        // Atualizar efeitos especiais
        this.atualizarEspeciais(inimigo);
    }
    
    // NOVO: Verificar comandos especiais
    verificarEspeciais(keys, inimigo) {
        // Atualizar cooldowns
        if (this.cdNuvem > 0) this.cdNuvem--;
        if (this.cdTornado > 0) this.cdTornado--;
        
        // ESPECIAL 1: NUVEM TÓXICA (Abaixar + Socar)
        if (this.abaixado && keys[this.ctrl.atk] && !this.usandoEspecial && this.cdNuvem <= 0) {
            this.executarNuvemToxica(inimigo);
        }
        
        // ESPECIAL 2: TORNADO DE PEIDO (Pular + Abaixar + Chutar) - NO CHÃO
        const teclaChute = this.ctrl.chute || (this.id === "p1" ? "c" : ".");
        if (!this.pulando && keys[this.ctrl.pulo] && keys[this.ctrl.baixo] && keys[teclaChute] && 
            !this.usandoEspecial && this.cdTornado <= 0) {
            this.executarTornadoPeido(inimigo);
        }
    }
    
    executarNuvemToxica(inimigo) {
        console.log(`💨 ${this.id} ativou NUVEM TÓXICA!`);
        
        this.usandoEspecial = true;
        this.cdNuvem = 120; // 2 segundos de cooldown
        this.atacando = true;
        this.tempoAtaque = 25;
        
        // Cria nuvem de gás tóxico
        const nuvem = {
            x: this.x + this.dir * 40,
            y: this.y - 50,
            raio: 80,
            tempoVida: 150, // 2.5 segundos
            alpha: 0.7,
            venenoAtivo: true,
            dono: this.id
        };
        
        this.nuvensToxicas.push(nuvem);
        
        // Efeito visual inicial
        for (let i = 0; i < 25; i++) {
            this.criarFumaca(nuvem.x, nuvem.y, this.dir, "#4a8a4a");
        }
        
        // Dano inicial se inimigo estiver na área
        this.aplicarDanoNuvem(nuvem, inimigo);
    }
    
    aplicarDanoNuvem(nuvem, inimigo) {
        const distancia = Math.sqrt(
            Math.pow(inimigo.x - nuvem.x, 2) + 
            Math.pow(inimigo.y - nuvem.y, 2)
        );
        
        if (distancia < nuvem.raio && inimigo.vivo) {
            // Dano inicial significativo
            inimigo.receberDano(12);
            
            // Aplica efeito de veneno forte
            this.aplicarVenenoForte(inimigo);
            
            // Efeito visual do veneno
            ctx.fillStyle = "rgba(0, 255, 0, 0.4)";
            ctx.beginPath();
            ctx.arc(inimigo.x, inimigo.y - 50, 25, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    aplicarVenenoForte(inimigo) {
        // Veneno forte causa dano contínuo por 4 segundos
        for (let i = 1; i <= 8; i++) {
            setTimeout(() => {
                if (inimigo.vivo && !jogoTerminou) {
                    inimigo.receberDano(3);
                    
                    // Efeito visual
                    this.criarFumaca(inimigo.x, inimigo.y - 40, 0, "#00ff00");
                }
            }, i * 500); // Dano a cada 0.5 segundos
        }
    }
    
    aplicarVenenoLeve(inimigo) {
        // Veneno leve causa dano contínuo por 2.5 segundos
        for (let i = 1; i <= 5; i++) {
            setTimeout(() => {
                if (inimigo.vivo && !jogoTerminou) {
                    inimigo.receberDano(2);
                }
            }, i * 500);
        }
    }
    
    executarTornadoPeido(inimigo) {
        console.log(`💨 ${this.id} ativou TORNADO DE PEIDO!`);
        
        this.usandoEspecial = true;
        this.cdTornado = 180; // 3 segundos de cooldown
        this.chutando = true;
        this.tempoChute = 20;
        
        // Cria tornado que se move
        const tornado = {
            x: this.x,
            y: this.y - 30,
            dir: this.dir,
            velocidade: 6,
            raio: 50,
            forca: 80, // Força do empurrão
            tempoVida: 90, // 1.5 segundos
            alpha: 0.9,
            dono: this.id
        };
        
        this.tornados.push(tornado);
        
        // Efeito visual inicial poderoso
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 40;
            this.criarFumaca(
                this.x + Math.cos(angle) * radius,
                this.y - 30 + Math.sin(angle) * radius,
                this.dir * 2,
                "#d3d3d3"
            );
        }
        
        // Dano inicial se inimigo estiver perto
        const distancia = Math.sqrt(
            Math.pow(inimigo.x - this.x, 2) + 
            Math.pow(inimigo.y - (this.y - 30), 2)
        );
        
        if (distancia < 70 && inimigo.vivo) {
            inimigo.receberDano(20);
            inimigo.x += this.dir * 60; // Empurrão inicial
        }
    }
    
    atualizarEspeciais(inimigo) {
        // Atualizar nuvens tóxicas
        for (let i = this.nuvensToxicas.length - 1; i >= 0; i--) {
            const nuvem = this.nuvensToxicas[i];
            nuvem.tempoVida--;
            nuvem.alpha = nuvem.tempoVida / 150 * 0.7;
            
            // Dano periódico a cada 10 frames
            if (nuvem.tempoVida % 10 === 0 && nuvem.venenoAtivo) {
                const distancia = Math.sqrt(
                    Math.pow(inimigo.x - nuvem.x, 2) + 
                    Math.pow(inimigo.y - nuvem.y, 2)
                );
                
                if (distancia < nuvem.raio && inimigo.vivo) {
                    inimigo.receberDano(2);
                    
                    // Efeito visual
                    this.criarFumaca(inimigo.x, inimigo.y - 30, 0, "#4a8a4a");
                }
            }
            
            // Remove nuvem antiga
            if (nuvem.tempoVida <= 0) {
                this.nuvensToxicas.splice(i, 1);
            }
        }
        
        // Atualizar tornados
        for (let i = this.tornados.length - 1; i >= 0; i--) {
            const tornado = this.tornados[i];
            tornado.x += tornado.dir * tornado.velocidade;
            tornado.tempoVida--;
            tornado.alpha = tornado.tempoVida / 90 * 0.9;
            
            // Verifica colisão com inimigo
            const distancia = Math.sqrt(
                Math.pow(inimigo.x - tornado.x, 2) + 
                Math.pow(inimigo.y - tornado.y, 2)
            );
            
            if (distancia < tornado.raio && inimigo.vivo) {
                // Dano contínuo enquanto dentro do tornado
                if (tornado.tempoVida % 5 === 0) {
                    inimigo.receberDano(8);
                }
                
                // Empurra o inimigo na direção do tornado
                const empurraX = (inimigo.x < tornado.x ? 1 : -1) * 3;
                const empurraY = (inimigo.y < tornado.y ? -2 : 2);
                
                inimigo.x += empurraX;
                inimigo.y += empurraY;
                
                // Efeito visual
                this.criarFumaca(inimigo.x, inimigo.y, 0, "#a9a9a9");
            }
            
            // Cria partículas do tornado
            if (tornado.tempoVida % 3 === 0) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * tornado.raio;
                this.criarFumaca(
                    tornado.x + Math.cos(angle) * radius,
                    tornado.y + Math.sin(angle) * radius,
                    tornado.dir,
                    "#d3d3d3"
                );
            }
            
            // Remove tornado antigo
            if (tornado.tempoVida <= 0 || tornado.x < -100 || tornado.x > canvas.width + 100) {
                this.tornados.splice(i, 1);
            }
        }
        
        // Resetar flag de especial se não há mais especiais ativos
        if (this.nuvensToxicas.length === 0 && this.tornados.length === 0) {
            this.usandoEspecial = false;
        }
    }
    
    criarFumaca(x, y, direcao, cor = "#a9a9a9") {
        this.tempoFumaca++;
        if (this.tempoFumaca > 3) {
            this.fumacas.push({
                x: x,
                y: y,
                raio: 8,
                alpha: 0.9,
                vx: (Math.random() - 0.5) * 3 + direcao * 1.5,
                vy: Math.random() * -2 - 1,
                vida: 25,
                cor: cor
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
            f.raio += 0.4;
            f.alpha -= 0.03;
            f.vida--;
            
            // Desenha fumaça
            ctx.fillStyle = f.cor.replace(")", `, ${f.alpha})`).replace("rgb", "rgba");
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.raio, 0, Math.PI * 2);
            ctx.fill();
            
            // Remove fumaça antiga
            if (f.vida <= 0 || f.alpha <= 0) {
                this.fumacas.splice(i, 1);
            }
        }
    }
    
    desenharVivo() {
        const raioBase = this.tamanho/2;
        const alturaAjustada = this.abaixado ? 0.7 : 1;
        
        // PRIMEIRO: Desenhar efeitos especiais
        this.desenharEspeciais();
        
        // SEGUNDO: Corpo de fumaça (nuvem)
        const intensidade = this.usandoEspecial ? 1 : 0.8;
        ctx.fillStyle = `rgba(211, 211, 211, ${0.8 * intensidade})`;
        ctx.strokeStyle = `rgba(169, 169, 169, ${0.9 * intensidade})`;
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
        const olgoY = this.y - this.tamanho * (this.abaixado ? 0.7 : 0.9);
        const olhoOffset = Math.sin(Date.now()/300) * 3;
        this.desenharOlhos(olgoY + olhoOffset);
        
        // Boca flutuante
        const bocaY = this.y - this.tamanho * (this.abaixado ? 0.5 : 0.7);
        const bocaOffset = Math.cos(Date.now()/400) * 2;
        this.desenharBoca(bocaY + bocaOffset);
        
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
        
        // Indicador de cooldown
        this.desenharCooldowns();
    }
    
    desenharEspeciais() {
        // Desenhar nuvens tóxicas
        this.nuvensToxicas.forEach(nuvem => {
            ctx.fillStyle = `rgba(0, 255, 0, ${nuvem.alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(nuvem.x, nuvem.y, nuvem.raio, 0, Math.PI * 2);
            ctx.fill();
            
            // Efeito de pulsação
            ctx.strokeStyle = `rgba(0, 200, 0, ${nuvem.alpha * 0.7})`;
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(nuvem.x, nuvem.y, nuvem.raio * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Símbolo de veneno
            ctx.fillStyle = `rgba(255, 255, 255, ${nuvem.alpha})`;
            ctx.font = "bold 20px Arial";
            ctx.textAlign = "center";
            ctx.fillText("☠", nuvem.x, nuvem.y + 7);
        });
        
        // Desenhar tornados
        this.tornados.forEach(tornado => {
            const rotation = Date.now() / 50; // Rotação rápida
            
            // Corpo do tornado
            ctx.fillStyle = `rgba(169, 169, 169, ${tornado.alpha * 0.6})`;
            for (let i = 0; i < 3; i++) {
                const raio = tornado.raio * (0.8 - i * 0.2);
                ctx.beginPath();
                ctx.ellipse(
                    tornado.x, 
                    tornado.y, 
                    raio, 
                    raio * 0.7, 
                    rotation + i, 
                    0, Math.PI * 2
                );
                ctx.fill();
            }
            
            // Efeito de rotação
            ctx.strokeStyle = `rgba(255, 255, 255, ${tornado.alpha * 0.9})`;
            ctx.lineWidth = 4;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(
                    tornado.x, 
                    tornado.y, 
                    tornado.raio * 0.6, 
                    rotation + i * Math.PI / 2, 
                    rotation + i * Math.PI / 2 + 1
                );
                ctx.stroke();
            }
            
            // Símbolo do tornado
            ctx.fillStyle = `rgba(0, 0, 0, ${tornado.alpha})`;
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "center";
            ctx.fillText("🌀", tornado.x, tornado.y + 8);
        });
    }
    
    desenharCooldowns() {
        const y = this.y - this.tamanho - 70;
        
        // Cooldown da nuvem tóxica
        if (this.cdNuvem > 0) {
            const porcentagem = this.cdNuvem / 120;
            ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
            ctx.fillRect(this.x - 25, y, 50 * porcentagem, 8);
            
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 25, y, 50, 8);
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "10px Arial";
            ctx.textAlign = "center";
            ctx.fillText("NUVEM", this.x, y - 5);
        }
        
        // Cooldown do tornado
        if (this.cdTornado > 0) {
            const porcentagem = this.cdTornado / 180;
            ctx.fillStyle = "rgba(169, 169, 169, 0.5)";
            ctx.fillRect(this.x - 25, y + 15, 50 * porcentagem, 8);
            
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - 25, y + 15, 50, 8);
            
            ctx.fillStyle = "#ffffff";
            ctx.font = "10px Arial";
            ctx.textAlign = "center";
            ctx.fillText("TORNADO", this.x, y + 10);
        }
    }
    
    desenharSapatos() {
        const ajusteY = this.abaixado ? 25 : 15;
        
        // Sapatos de fumaça (mais definidos durante especiais)
        const intensidade = this.usandoEspecial ? 1 : 0.8;
        ctx.fillStyle = `rgba(128, 128, 128, ${0.8 * intensidade})`;
        
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
        
        // Efeito de fumaça nos pés durante especiais
        if (this.usandoEspecial) {
            this.criarFumaca(sapatoEsqX, this.y + ajusteY, -1, "#696969");
            this.criarFumaca(sapatoDirX, this.y + ajusteY, 1, "#696969");
        }
    }

    desenharBracos() {
        const intensidade = this.usandoEspecial ? 1 : 0.9;
        ctx.strokeStyle = `rgba(169, 169, 169, ${0.9 * intensidade})`;
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        
        const ajusteY = this.abaixado ? 20 : 0;
        const bracoOffset = Math.sin(Date.now()/400) * 2;
        
        // Braços mais expressivos durante especiais
        const comprimentoBraco = this.usandoEspecial ? 70 : 60;
        
        if (this.atacando || this.usandoEspecial) {
            const bracoX = this.x + this.dir * comprimentoBraco;
            const bracoY = this.y - 40 + ajusteY + bracoOffset;
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.dir * 20, this.y - 40 + ajusteY);
            ctx.lineTo(bracoX, bracoY);
            ctx.stroke();
            
            // Mão de fumaça (mais densa durante especiais)
            const tamanhoMao = this.usandoEspecial ? 18 : 15;
            ctx.fillStyle = `rgba(211, 211, 211, ${0.8 * intensidade})`;
            ctx.beginPath();
            ctx.arc(bracoX, bracoY, tamanhoMao, 0, Math.PI * 2);
            ctx.fill();
            
            // Símbolo na mão durante nuvem tóxica
            if (this.usandoEspecial && this.cdNuvem > 0) {
                ctx.fillStyle = "#00ff00";
                ctx.font = "bold 14px Arial";
                ctx.textAlign = "center";
                ctx.fillText("☣", bracoX, bracoY + 5);
            }
            
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
        const tamanhoMaoNormal = this.usandoEspecial ? 14 : 12;
        ctx.fillStyle = `rgba(211, 211, 211, ${0.8 * intensidade})`;
        ctx.beginPath();
        ctx.arc(this.x - 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY + bracoOffset, tamanhoMaoNormal, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x + 50, this.y - 30 + (this.pulando ? -15 : 0) + ajusteY + bracoOffset, tamanhoMaoNormal, 0, Math.PI * 2);
        ctx.fill();
    }

    desenharOlhos(olgoY) {
        if (this.olhosAbertos) {
            // Olhos esfumaçados (mais intensos durante especiais)
            const intensidade = this.usandoEspecial ? 1 : 0.9;
            const corOlhos = this.usandoEspecial ? "#00ff00" : "rgba(105, 105, 105, 0.9)";
            
            ctx.fillStyle = corOlhos;
            const tamanhoOlhos = this.usandoEspecial ? 10 : 8;
            ctx.beginPath();
            ctx.arc(this.x - 15, olgoY, tamanhoOlhos, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 15, olgoY, tamanhoOlhos, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupilas flutuantes (mais focadas durante especiais)
            ctx.fillStyle = this.usandoEspecial ? "#000000" : "rgba(0, 0, 0, 0.8)";
            let pupilaX = 0;
            let pupilaY = 0;
            
            if (this.usandoEspecial) {
                pupilaX = this.dir * 3;
                pupilaY = -2; // Olhos focados para cima
            } else if (this.atacando || this.chutando || this.descendoRapido) {
                pupilaX = this.dir * 4;
            } else if (this.pulando) {
                pupilaX = 0;
                pupilaY = 2;
            } else {
                pupilaX = this.dir * 2;
            }
            
            const pupilaOffset = Math.cos(Date.now()/350) * 2;
            const tamanhoPupila = this.usandoEspecial ? 5 : 4;
            ctx.beginPath();
            ctx.arc(this.x - 15 + pupilaX + pupilaOffset, olgoY + pupilaY, tamanhoPupila, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 15 + pupilaX + pupilaOffset, olgoY + pupilaY, tamanhoPupila, 0, Math.PI * 2);
            ctx.fill();
            
            // Brilho nos olhos (mais intenso durante especiais)
            ctx.fillStyle = this.usandoEspecial ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.8)";
            const tamanhoBrilho = this.usandoEspecial ? 2.5 : 1.5;
            ctx.beginPath();
            ctx.arc(this.x - 15 + pupilaX + pupilaOffset - 1, olgoY + pupilaY - 1, tamanhoBrilho, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 15 + pupilaX + pupilaOffset - 1, olgoY + pupilaY - 1, tamanhoBrilho, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = "rgba(105, 105, 105, 0.9)";
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

    desenharBoca(bocaY) {
        const intensidade = this.usandoEspecial ? 1 : 0.9;
        ctx.strokeStyle = this.usandoEspecial ? "#00ff00" : "rgba(105, 105, 105, 0.9)";
        ctx.lineWidth = this.usandoEspecial ? 5 : 4;
        
        if (this.atacando || this.usandoEspecial) {
            // Boca aberta liberando gás
            ctx.beginPath();
            ctx.arc(this.x, bocaY, this.usandoEspecial ? 18 : 15, 0, Math.PI);
            ctx.stroke();
            
            // Fumaça saindo da boca (mais intensa durante especiais)
            for (let i = 0; i < (this.usandoEspecial ? 3 : 1); i++) {
                this.criarFumaca(this.x, bocaY + 10, this.dir, this.usandoEspecial ? "#00ff00" : "#a9a9a9");
            }
        } else if (this.chutando) {
            ctx.beginPath();
            ctx.moveTo(this.x - 10, bocaY);
            ctx.lineTo(this.x + 10, bocaY);
            ctx.stroke();
        } else if (this.abaixado) {
            ctx.beginPath();
            ctx.moveTo(this.x - 8, bocaY);
            ctx.lineTo(this.x + 8, bocaY);
            ctx.stroke();
        } else if (this.descendoRapido) {
            // Boca aberta com fumaça
            ctx.beginPath();
            ctx.arc(this.x, bocaY, 12, 0.1, Math.PI - 0.1);
            ctx.stroke();
            this.criarFumaca(this.x, bocaY, 0, "#a9a9a9");
        } else {
            // Sorriso esfumaçado
            ctx.beginPath();
            ctx.arc(this.x, bocaY, 10, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
        
        // Dentes durante ataque especial
        if (this.usandoEspecial) {
            ctx.fillStyle = "#ffffff";
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(this.x - 10 + i * 5, bocaY + 5, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    desenharMorto() {
        // Peidovélio desaparece em fumaça verde tóxica
        for(let i = 0; i < 30; i++) {
            this.criarFumaca(this.x, this.y - 30, 0, "#4a8a4a");
        }
        
        // Desenha fumaça da morte
        ctx.fillStyle = "rgba(0, 255, 0, 0.6)";
        ctx.beginPath();
        ctx.arc(this.x, this.y - 20, 60, 0, Math.PI * 2);
        ctx.fill();
        
        // Olhos X na fumaça
        ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
        ctx.lineWidth = 5;
        
        ctx.beginPath();
        ctx.moveTo(this.x - 25, this.y - 40);
        ctx.lineTo(this.x - 10, this.y - 25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y - 40);
        ctx.lineTo(this.x - 25, this.y - 25);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y - 40);
        ctx.lineTo(this.x + 25, this.y - 25);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 25, this.y - 40);
        ctx.lineTo(this.x + 10, this.y - 25);
        ctx.stroke();
        
        // Símbolo de caveira
        ctx.fillStyle = "#000000";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("💀", this.x, this.y - 15);
    }
    
    // Sobrescrever método reset para limpar estados especiais
    reset() {
        super.reset();
        this.fumacas = [];
        this.nuvensToxicas = [];
        this.tornados = [];
        this.cdNuvem = 0;
        this.cdTornado = 0;
        this.usandoEspecial = false;
    }
}







