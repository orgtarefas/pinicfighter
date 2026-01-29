class LutadorCoco {
    constructor(x, cor, corSapato, controles, direcao, id) {
        this.id = id;
        this.inicialX = x;
        this.x = x;
        this.y = CONFIG.CHAO;
        this.vy = 0;
        this.cor = cor;
        this.corSapato = corSapato;
        this.tamanho = CONFIG.TAMANHO_COCO;
        this.vel = CONFIG.VELOCIDADE;
        this.dir = direcao;
        
        // Estados do jogador
        this.pulando = false;
        this.atacando = false;
        this.chutando = false;
        this.descendoRapido = false;
        this.transformado = false;
        this.invulneravel = false;
        
        // Temporizadores
        this.tempoAtaque = 0;
        this.tempoChute = 0;
        this.tempoTransformacao = 0;
        this.tempoInvulneravel = 0;
        
        // Atributos
        this.vida = 100;
        this.vidaMaxima = 100;
        this.vivo = true;
        
        // Controles
        this.ctrl = controles;
        this.ultimoDano = 0;
        this.olhosAbertos = true;
        this.tempoPiscar = 0;
        
        // Sapatos
        this.sapatoX = 0;
        this.sapatoY = 0;
        
        // Sistema de poder
        this.cdPoder = 0;
        this.cocosAtivos = [];
        this.cargaPoder = 0;
        this.maxCarga = CONFIG.MAX_CARGA;
        
        // Animação
        this.animacao = 0;
        this.frame = 0;
    }

    // ========== CONTROLES ==========
    mover(keys, jogoTerminou) {
        if (!this.vivo || jogoTerminou || this.atacando || this.chutando) return;
        
        let seMovendo = false;
        
        if (keys[this.ctrl.esq]) { 
            this.x -= this.vel; 
            this.dir = -1;
            seMovendo = true;
        }
        if (keys[this.ctrl.dir]) { 
            this.x += this.vel; 
            this.dir = 1;
            seMovendo = true;
        }
        
        // Animação de andar
        if (seMovendo && !this.pulando) {
            this.animacao += 0.2;
            this.frame = Math.floor(this.animacao) % 4;
        }
        
        this.x = Math.max(CONFIG.LIM_ESQ, Math.min(CONFIG.LIM_DIR, this.x));
    }

    pular(keys, jogoTerminou) {
        if (!this.vivo || jogoTerminou || this.atacando || this.chutando) return;
        
        // Pulo normal
        if (keys[this.ctrl.pulo] && !this.pulando) {
            this.vy = CONFIG.ALTURA_PULO;
            this.pulando = true;
            this.descendoRapido = false;
            this.transformado = false;
            this.animacao = 0;
            this.frame = 0;
        }
        
        // Poder: Bomba de Cocô - Pular + Baixo
        const teclaBaixo = this.id === "p1" ? "s" : "ArrowDown";
        if (this.pulando && keys[teclaBaixo] && this.cdPoder <= 0) {
            this.ativarDescidaRapida();
        } else if (this.descendoRapido && !keys[teclaBaixo]) {
            this.desativarDescidaRapido();
        }
    }
    
    ativarDescidaRapida() {
        this.descendoRapido = true;
        this.transformado = true;
        this.tempoTransformacao = 15;
        this.vy = CONFIG.VELOCIDADE_DESCIDA;
        this.cargaPoder = Math.min(this.cargaPoder + 1, this.maxCarga);
        
        // Olhos sempre abertos durante transformação
        this.olhosAbertos = true;
    }
    
    desativarDescidaRapido() {
        this.descendoRapido = false;
        this.cargaPoder = 0;
    }

    atacar(keys, inimigo, jogoTerminou) {
        if (!this.vivo || !inimigo.vivo || jogoTerminou) return;

        // ATAQUE DE SOCO
        if (keys[this.ctrl.atk] && !this.atacando && !this.chutando && !this.descendoRapido) {
            this.atacando = true;
            this.tempoAtaque = 10;
            this.olhosAbertos = false;

            // Hitbox do soco
            const hit = {
                x: this.x + this.dir * 50,
                y: this.y - 40,
                w: 45,
                h: 35
            };

            // Verifica colisão
            if (Utils.colisao(hit, inimigo.hitbox())) {
                inimigo.receberDano(CONFIG.DANO_SOCO);
            }
        }

        // ATAQUE DE CHUTE
        const teclaChute = this.id === "p1" ? "c" : ".";
        if (keys[teclaChute] && !this.chutando && !this.atacando && !this.descendoRapido) {
            this.chutando = true;
            this.tempoChute = 15;
            
            // Posição inicial do sapato no chute
            this.sapatoX = this.x + this.dir * 20;
            this.sapatoY = this.y + 10;

            // Hitbox do chute
            const hit = {
                x: this.x + this.dir * 60,
                y: this.y + 5,
                w: 50,
                h: 30
            };

            // Verifica colisão
            if (Utils.colisao(hit, inimigo.hitbox())) {
                inimigo.receberDano(CONFIG.DANO_CHUTE);
            }
        }

        // Atualiza temporizadores
        this.atualizarTemporizadores();
    }
    
    atualizarTemporizadores() {
        // Atualiza temporizador de transformação
        if (this.transformado && this.tempoTransformacao > 0) {
            this.tempoTransformacao--;
            if (this.tempoTransformacao <= 0) {
                this.transformado = false;
            }
        }
        
        // Atualiza ataque
        if (this.atacando && --this.tempoAtaque <= 0) {
            this.atacando = false;
            this.olhosAbertos = true;
        }
        
        // Atualiza chute
        if (this.chutando) {
            this.tempoChute--;
            if (this.tempoChute > 10) {
                this.sapatoX += this.dir * 10;
                this.sapatoY -= 3;
            } else if (this.tempoChute > 5) {
                this.sapatoY += 2;
            } else if (this.tempoChute > 0) {
                this.sapatoX -= this.dir * 8;
                this.sapatoY += 4;
            } else {
                this.chutando = false;
            }
        }
        
        // Invulnerabilidade após dano
        if (this.invulneravel && this.tempoInvulneravel > 0) {
            this.tempoInvulneravel--;
            if (this.tempoInvulneravel <= 0) {
                this.invulneravel = false;
            }
        }
        
        // Cooldown do poder
        if (this.cdPoder > 0) {
            this.cdPoder--;
        }
    }

    // ========== SISTEMA DE PODER ==========
    atualizarCocos(inimigo) {
        // Atualiza cocôs existentes
        for (let i = this.cocosAtivos.length - 1; i >= 0; i--) {
            const coco = this.cocosAtivos[i];
            coco.atualizar();
            
            // Verifica colisão com inimigo
            if (coco.verificarColisao(inimigo)) {
                inimigo.receberDano(coco.dano);
                coco.ativo = false;
                // Efeito de impacto
                Utils.criarParticulas(window.ctx, coco.x, coco.y, 15, this.cor);
            }
            
            // Remove cocôs inativos
            if (!coco.ativo) {
                this.cocosAtivos.splice(i, 1);
            }
        }
    }
    
    lancarCoco() {
        if (this.cdPoder > 0) return null;
        
        const forca = this.cargaPoder / this.maxCarga;
        const coco = new CocoProjetil(
            this.x,
            this.y - 30,
            this.dir,
            this.cor,
            this.id
        );
        
        // Ajusta força baseado na carga
        coco.velX = this.dir * (8 + forca * 4);
        coco.velY = -15 + forca * -5;
        coco.dano = CONFIG.DANO_BOMBA + Math.floor(forca * 10);
        
        this.cocosAtivos.push(coco);
        this.cdPoder = CONFIG.CD_PODER;
        this.cargaPoder = 0;
        
        // Efeito visual
        this.olhosAbertos = false;
        setTimeout(() => this.olhosAbertos = true, 200);
        
        return coco;
    }

    // ========== FÍSICA ==========
    fisica() {
        if (!this.vivo) { 
            this.y = CONFIG.CHAO + 10; 
            this.vy = 0;
            return null;
        }
        
        this.y += this.vy;
        
        // Aplica gravidade normal ou descida rápida
        if (!this.descendoRapido) {
            this.vy += CONFIG.GRAVIDADE;
        }
        
        // Verifica se bateu no chão
        if (this.y >= CONFIG.CHAO) {
            const bateuComForca = this.vy > 12 && this.descendoRapido && this.cargaPoder > 15;
            
            this.y = CONFIG.CHAO;
            this.vy = 0;
            this.pulando = false;
            this.descendoRapido = false;
            
            // Efeito de aterrissagem
            if (bateuComForca) {
                Utils.criarParticulas(window.ctx, this.x, CONFIG.CHAO, 20, this.cor);
            }
            
            // Lança cocô se bateu com força
            if (bateuComForca && this.cdPoder <= 0) {
                const coco = this.lancarCoco();
                return coco;
            }
            
            this.cargaPoder = 0;
        }
        
        return null;
    }

    // ========== DANO ==========
    receberDano(v) {
        if (!this.vivo || this.invulneravel) return;
        
        const agora = Date.now();
        if (agora - this.ultimoDano < 500) return;
        this.ultimoDano = agora;
        
        this.vida -= v;
        if (this.vida <= 0) {
            this.vida = 0;
            this.morrer();
        } else {
            // Efeito de dano
            this.invulneravel = true;
            this.tempoInvulneravel = 30;
            this.olhosAbertos = false;
            setTimeout(() => this.olhosAbertos = true, 100);
            
            // Efeito visual
            Utils.criarParticulas(window.ctx, this.x, this.y - 30, 10, this.cor);
        }
    }
    
    morrer() {
        this.vivo = false;
        this.y = CONFIG.CHAO + 10;
        this.vy = 0;
        this.atacando = false;
        this.chutando = false;
        this.descendoRapido = false;
        this.transformado = false;
        
        // Efeito de morte
        Utils.criarParticulas(window.ctx, this.x, this.y, 30, this.cor);
    }

    // ========== DESENHO ==========
    desenhar(ctx) {
        // Atualiza piscar de olhos
        this.atualizarPiscar();
        
        if (!this.vivo) {
            this.desenharMorto(ctx);
            return;
        }
        
        // Desenha transformado ou normal
        if (this.transformado) {
            this.desenharTransformado(ctx);
        } else {
            this.desenharNormal(ctx);
        }
        
        // Desenha elementos extras
        this.desenharExtras(ctx);
    }
    
    atualizarPiscar() {
        this.tempoPiscar++;
        if (this.tempoPiscar > 100) {
            this.olhosAbertos = !this.olhosAbertos;
            this.tempoPiscar = 0;
        }
        
        // Pisca aleatoriamente
        if (Math.random() < 0.003) {
            this.olhosAbertos = false;
            setTimeout(() => this.olhosAbertos = true, 100);
        }
        
        // Pisca rápido se invulnerável
        if (this.invulneravel) {
            this.olhosAbertos = (this.tempoInvulneravel % 10) < 5;
        }
    }
    
    desenharNormal(ctx) {
        // Efeito de invulnerabilidade
        if (this.invulneravel) {
            ctx.globalAlpha = 0.7;
        }
        
        // Corpo do cocô (4 partes)
        ctx.fillStyle = this.cor;
        const raioBase = this.tamanho / 2;
        const offsetAnimacao = this.frame * 2;
        
        // Base
        Utils.desenharElipse(ctx, this.x, this.y - 10 + offsetAnimacao, 
                            raioBase, raioBase * 0.6, this.cor);
        
        // Parte média
        Utils.desenharElipse(ctx, this.x, this.y - raioBase + offsetAnimacao * 0.8, 
                            raioBase * 0.7, raioBase * 0.5, this.cor);
        
        // Parte superior
        Utils.desenharElipse(ctx, this.x, this.y - raioBase * 1.5 + offsetAnimacao * 0.6, 
                            raioBase * 0.5, raioBase * 0.4, this.cor);
        
        // Topo
        Utils.desenharElipse(ctx, this.x, this.y - raioBase * 1.8 + offsetAnimacao * 0.4, 
                            raioBase * 0.3, raioBase * 0.25, this.cor);
        
        // Detalhes da textura
        this.desenharDetalhes(ctx, raioBase, offsetAnimacao);
        
        // Sapatos
        this.desenharSapatos(ctx, offsetAnimacao);
        
        // Braços
        this.desenharBracos(ctx, offsetAnimacao);
        
        // Face
        this.desenharFace(ctx, offsetAnimacao);
        
        ctx.globalAlpha = 1.0;
    }
    
    // Desenha transformado em bola
    desenharTransformado(ctx) {
        const raioBola = this.tamanho * 0.7;
        
        // Corpo esférico (bola de cocô)
        ctx.fillStyle = this.cor;
        ctx.beginPath();
        ctx.arc(this.x, this.y - raioBola * 0.8, raioBola, 0, Math.PI * 2);
        ctx.fill();
        
        // Detalhes da bola (textura)
        ctx.fillStyle = "#8B4513";
        for(let i = 0; i < 10; i++) {
            const angulo = (i / 10) * Math.PI * 2;
            const detalheX = this.x + Math.cos(angulo) * raioBola * 0.6;
            const detalheY = this.y - raioBola * 0.8 + Math.sin(angulo) * raioBola * 0.6;
            Utils.desenharCirculo(ctx, detalheX, detalheY, 5, "#8B4513");
        }
        
        // Sapatos (menores e mais próximos)
        const sapatoY = this.y + 5;
        const sapatoX1 = this.x - raioBola * 0.3;
        const sapatoX2 = this.x + raioBola * 0.3;
        this.desenharSapatoUnico(ctx, sapatoX1, sapatoY, false);
        this.desenharSapatoUnico(ctx, sapatoX2, sapatoY, false);
        
        // Olhos (sempre abertos durante transformação)
        this.desenharOlhosTransformados(ctx, raioBola);
        
        // Boca
        this.desenharBocaTransformada(ctx, raioBola);
        
        // Efeito de velocidade durante descida
        if (this.descendoRapido) {
            this.desenharEfeitoVelocidade(ctx);
        }
    }
    
    desenharOlhosTransformados(ctx, raioBola) {
        const olhoY = this.y - raioBola * 1.5;
        
        // Olhos sempre abertos e grandes (expressão de determinação)
        Utils.desenharCirculo(ctx, this.x - raioBola * 0.25, olgoY, raioBola * 0.18, "white");
        Utils.desenharCirculo(ctx, this.x + raioBola * 0.25, olgoY, raioBola * 0.18, "white");
        
        // Pupilas (olhando para baixo durante descida)
        ctx.fillStyle = "black";
        const pupilaOffset = this.descendoRapido ? 3 : 0;
        ctx.beginPath();
        ctx.arc(this.x - raioBola * 0.25, olgoY + pupilaOffset, raioBola * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + raioBola * 0.25, olgoY + pupilaOffset, raioBola * 0.09, 0, Math.PI * 2);
        ctx.fill();
        
        // Brilho nos olhos
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(this.x - raioBola * 0.25 - 2, olgoY + pupilaOffset - 2, raioBola * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + raioBola * 0.25 - 2, olgoY + pupilaOffset - 2, raioBola * 0.04, 0, Math.PI * 2);
        ctx.fill();
    }
    
    desenharBocaTransformada(ctx, raioBola) {
        const bocaY = this.y - raioBola * 1.1;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        
        if (this.descendoRapido) {
            // Boca de esforço/determinação durante descida
            ctx.beginPath();
            ctx.arc(this.x, bocaY, raioBola * 0.15, 0.1, Math.PI - 0.1);
            ctx.stroke();
            
            // Linhas de esforço
            ctx.beginPath();
            ctx.moveTo(this.x - raioBola * 0.1, bocaY - 3);
            ctx.lineTo(this.x - raioBola * 0.25, bocaY - 8);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x + raioBola * 0.1, bocaY - 3);
            ctx.lineTo(this.x + raioBola * 0.25, bocaY - 8);
            ctx.stroke();
        } else {
            // Boca normal de bola
            ctx.beginPath();
            ctx.arc(this.x, bocaY, raioBola * 0.2, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
    }
    
    desenharEfeitoVelocidade(ctx) {
        // Linhas de velocidade atrás da bola
        ctx.strokeStyle = "rgba(255, 255, 0, 0.7)";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        
        for(let i = 0; i < 4; i++) {
            const offset = i * 6;
            ctx.beginPath();
            ctx.moveTo(this.x - 25 - offset, this.y + 10);
            ctx.lineTo(this.x - 60 - offset, this.y + 30);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x + 25 + offset, this.y + 10);
            ctx.lineTo(this.x + 60 + offset, this.y + 30);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        
        // Partículas de velocidade
        for(let i = 0; i < 3; i++) {
            const particulaX = this.x + (Math.random() * 40 - 20);
            const particulaY = this.y + 20 + Math.random() * 10;
            Utils.desenharCirculo(ctx, particulaX, particulaY, 2, "yellow");
        }
    }
    
    desenharDetalhes(ctx, raioBase, offset) {
        ctx.fillStyle = "#8B4513";
        const detalhes = [
            {x: -0.7, y: -0.4},
            {x: -0.4, y: -0.2},
            {x: 0, y: -0.3},
            {x: 0.4, y: -0.2},
            {x: 0.7, y: -0.4},
            {x: -0.5, y: 0.1},
            {x: 0.5, y: 0.1}
        ];
        
        detalhes.forEach(det => {
            const detalheX = this.x + det.x * raioBase * 0.7;
            const detalheY = this.y - 10 + det.y * raioBase * 0.4 + offset * 0.5;
            Utils.desenharElipse(ctx, detalheX, detalheY, 4, 3, "#8B4513");
        });
    }
    
    desenharSapatos(ctx, offset) {
        if (this.chutando) {
            this.desenharSapatoUnico(ctx, this.sapatoX, this.sapatoY, true);
            const sapatoNormalX = this.x + (this.dir > 0 ? -15 : 15);
            this.desenharSapatoUnico(ctx, sapatoNormalX, this.y + 15 + offset, false);
        } else {
            const sapatoEsqX = this.x - 15;
            const sapatoDirX = this.x + 15;
            const sapatoY = this.y + 15 + offset;
            
            if (this.pulando) {
                // Pernas flexionadas no pulo
                this.desenharSapatoUnico(ctx, sapatoEsqX + 5, sapatoY - 10, false);
                this.desenharSapatoUnico(ctx, sapatoDirX - 5, sapatoY - 10, false);
            } else {
                this.desenharSapatoUnico(ctx, sapatoEsqX, sapatoY, false);
                this.desenharSapatoUnico(ctx, sapatoDirX, sapatoY, false);
            }
        }
    }
    
    desenharSapatoUnico(ctx, x, y, chutando) {
        const tamanho = chutando ? 28 : 22;
        const altura = chutando ? 14 : 11;
        
        // Sapato principal
        Utils.desenharElipse(ctx, x, y, tamanho, altura, this.corSapato);
        
        // Detalhe (cadarço/decoração)
        const corDetalhe = this.corSapato === "cyan" ? "#00aaff" : "#ff4444";
        Utils.desenharElipse(ctx, x + (this.dir > 0 ? 10 : -10), y, 
                           tamanho * 0.65, altura * 0.75, corDetalhe);
        
        // Sola
        ctx.fillStyle = "#222";
        ctx.beginPath();
        ctx.ellipse(x, y + altura - 1, tamanho * 0.95, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Efeito de chute
        if (chutando) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            for(let i = 0; i < 4; i++) {
                ctx.moveTo(x - this.dir * 25 - i * 6, y);
                ctx.lineTo(x - this.dir * 50 - i * 12, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    
    desenharBracos(ctx, offset) {
        ctx.strokeStyle = this.cor;
        ctx.lineWidth = 12;
        
        if (this.atacando) {
            // Braço atacante estendido
            const bracoX = this.x + this.dir * 65;
            const bracoY = this.y - 40 + offset * 0.5;
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.dir * 25, this.y - 40 + offset * 0.5);
            ctx.lineTo(bracoX, bracoY);
            ctx.stroke();
            
            // Punho
            Utils.desenharCirculo(ctx, bracoX, bracoY, 18, this.cor);
            
            // Outro braço (recuado)
            ctx.beginPath();
            ctx.moveTo(this.x - this.dir * 20, this.y - 35 + offset * 0.5);
            ctx.lineTo(this.x - this.dir * 50, this.y - 25 + offset * 0.5);
            ctx.stroke();
        } else {
            // Braços normais
            const offsetBraco = this.pulando ? -20 : offset * 0.3;
            ctx.beginPath();
            ctx.moveTo(this.x - 25, this.y - 40 + offsetBraco);
            ctx.lineTo(this.x - 55, this.y - 25 + offsetBraco);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x + 25, this.y - 40 + offsetBraco);
            ctx.lineTo(this.x + 55, this.y - 25 + offsetBraco);
            ctx.stroke();
        }
    }
    
    desenharFace(ctx, offset) {
        this.desenharOlhos(ctx, offset);
        this.desenharBoca(ctx, offset);
    }
    
    desenharOlhos(ctx, offset) {
        const olhoY = this.y - this.tamanho * 0.9 + offset * 0.2;
        
        if (this.olhosAbertos) {
            // Olhos brancos
            Utils.desenharCirculo(ctx, this.x - 18, olhoY, 10, "white");
            Utils.desenharCirculo(ctx, this.x + 18, olgoY, 10, "white");
            
            // Pupilas (seguem direção ou ação)
            ctx.fillStyle = "black";
            let pupilaX = this.dir * 3;
            if (this.atacando) pupilaX = this.dir * 5;
            if (this.chutando) pupilaX = this.dir * 4;
            if (this.pulando) pupilaX = 0;
            
            ctx.beginPath();
            ctx.arc(this.x - 18 + pupilaX, olgoY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 18 + pupilaX, olgoY, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Brilho nos olhos
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.beginPath();
            ctx.arc(this.x - 18 + pupilaX - 3, olgoY - 3, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + 18 + pupilaX - 3, olgoY - 3, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Olhos fechados (linhas)
            ctx.strokeStyle = "black";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(this.x - 25, olgoY);
            ctx.lineTo(this.x - 11, olgoY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x + 11, olgoY);
            ctx.lineTo(this.x + 25, olgoY);
            ctx.stroke();
        }
    }
    
    desenharBoca(ctx, offset) {
        const bocaY = this.y - this.tamanho * 0.7 + offset * 0.1;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        
        if (this.atacando) {
            // Boca gritando
            ctx.beginPath();
            ctx.arc(this.x, bocaY, 15, 0, Math.PI);
            ctx.stroke();
        } else if (this.chutando) {
            // Boca de esforço no chute
            ctx.beginPath();
            ctx.moveTo(this.x - 12, bocaY);
            ctx.lineTo(this.x + 12, bocaY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x - 10, bocaY + 4);
            ctx.lineTo(this.x + 10, bocaY + 4);
            ctx.stroke();
        } else if (this.pulando) {
            // Boca redonda de surpresa
            ctx.beginPath();
            ctx.arc(this.x, bocaY, 10, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Boca normal (sorriso)
            ctx.beginPath();
            ctx.arc(this.x, bocaY, 12, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
    }
    
    desenharExtras(ctx) {
        // Desenha cocôs ativos
        for (const coco of this.cocosAtivos) {
            coco.desenhar(ctx);
        }
        
        // Indicador de carregamento (quando descendo)
        if (this.descendoRapido && this.cargaPoder > 0) {
            this.desenharIndicadorPoder(ctx);
        }
        
        // Indicador de cooldown
        if (this.cdPoder > 0) {
            this.desenharCooldown(ctx);
        }
    }
    
    desenharIndicadorPoder(ctx) {
        const porcentagem = this.cargaPoder / this.maxCarga;
        const largura = 50;
        const altura = 8;
        const x = this.x - largura / 2;
        const y = this.y - this.tamanho - 40;
        
        // Barra de carga com gradiente
        const gradient = ctx.createLinearGradient(x, y, x + largura, y);
        gradient.addColorStop(0, "#00ff00");
        gradient.addColorStop(0.5, "#ffff00");
        gradient.addColorStop(1, "#ff0000");
        
        Utils.desenharBarra(ctx, x, y, largura, altura, 
                           this.cargaPoder, this.maxCarga, "#333", gradient);
        
        // Texto
        Utils.desenharTexto(ctx, "BOMBA!", this.x, y - 8, 11, "white", "center");
        
        // Partículas de carregamento
        if (this.cargaPoder % 5 === 0) {
            Utils.desenharCirculo(ctx, 
                x + (porcentagem * largura), 
                y - 5, 
                3, 
                porcentagem >= 1 ? "#ff00ff" : "#00ff00"
            );
        }
    }
    
    desenharCooldown(ctx) {
        const porcentagem = this.cdPoder / CONFIG.CD_PODER;
        const raio = 20;
        const x = this.x;
        const y = this.y - this.tamanho - 65;
        
        // Círculo de cooldown
        ctx.strokeStyle = "#ff4444";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, raio, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * (1 - porcentagem)), true);
        ctx.stroke();
        
        // Texto do tempo
        const segundos = Math.ceil(this.cdPoder / 60);
        Utils.desenharTexto(ctx, `${segundos}s`, x, y + 4, 12, "white", "center");
        
        // Ícone dentro do círculo
        ctx.fillStyle = "#ff4444";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("💩", x, y - 5);
    }
    
    desenharMorto(ctx) {
        // Corpo achatado
        const raioMorto = this.tamanho / 2;
        Utils.desenharElipse(ctx, this.x, this.y - 5, raioMorto * 1.2, raioMorto * 0.3, this.cor);
        
        // Detalhes
        ctx.fillStyle = "#8B4513";
        for(let i = 0; i < 7; i++) {
            const detalheX = this.x - 30 + i * 10;
            Utils.desenharElipse(ctx, detalheX, this.y - 5, 6, 4, "#8B4513");
        }
        
        // Sapatos caídos
        this.desenharSapatoUnico(ctx, this.x - 30, this.y + 20, false);
        this.desenharSapatoUnico(ctx, this.x + 30, this.y + 20, false);
        
        // Olhos em X (morto)
        ctx.strokeStyle = "black";
        ctx.lineWidth = 5;
        const olgoY = this.y - this.tamanho * 0.5;
        
        // Olho esquerdo (X)
        ctx.beginPath();
        ctx.moveTo(this.x - 25, olgoY - 8);
        ctx.lineTo(this.x - 15, olgoY + 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x - 15, olgoY - 8);
        ctx.lineTo(this.x - 25, olgoY + 2);
        ctx.stroke();
        
        // Olho direito (X)
        ctx.beginPath();
        ctx.moveTo(this.x + 15, olgoY - 8);
        ctx.lineTo(this.x + 25, olgoY + 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 25, olgoY - 8);
        ctx.lineTo(this.x + 15, olgoY + 2);
        ctx.stroke();
        
        // Boca caída
        ctx.beginPath();
        ctx.arc(this.x, olgoY + 20, 10, Math.PI - 0.3, 0.3);
        ctx.stroke();
        
        // Crânio (opcional)
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("💀", this.x, olgoY);
    }

    // ========== UTILIDADES ==========
    hitbox() {
        const largura = this.transformado ? this.tamanho * 0.7 : this.tamanho;
        const altura = this.transformado ? this.tamanho * 0.7 : this.tamanho + 20;
        const yOffset = this.transformado ? -this.tamanho * 0.4 : -this.tamanho;
        
        return { 
            x: this.x - largura/2, 
            y: this.y + yOffset, 
            w: largura, 
            h: altura
        };
    }
    
    reset() {
        this.x = this.inicialX;
        this.y = CONFIG.CHAO;
        this.vy = 0;
        this.vida = this.vidaMaxima;
        this.vivo = true;
        
        // Estados
        this.pulando = false;
        this.atacando = false;
        this.chutando = false;
        this.descendoRapido = false;
        this.transformado = false;
        this.invulneravel = false;
        
        // Temporizadores
        this.tempoAtaque = 0;
        this.tempoChute = 0;
        this.tempoTransformacao = 0;
        this.tempoInvulneravel = 0;
        
        // Outros
        this.olhosAbertos = true;
        this.tempoPiscar = 0;
        this.sapatoX = 0;
        this.sapatoY = 0;
        this.cdPoder = 0;
        this.cocosAtivos = [];
        this.cargaPoder = 0;
        this.animacao = 0;
        this.frame = 0;
    }
    
    // Retorna dados para sincronização
    getDadosSync() {
        return {
            x: this.x,
            y: this.y,
            vida: this.vida,
            dir: this.dir,
            atacando: this.atacando,
            chutando: this.chutando,
            vivo: this.vivo,
            pulando: this.pulando,
            sapatoX: this.sapatoX,
            sapatoY: this.sapatoY,
            olhosAbertos: this.olhosAbertos,
            descendoRapido: this.descendoRapido,
            transformado: this.transformado,
            cdPoder: this.cdPoder,
            cargaPoder: this.cargaPoder
        };
    }
    
    // Atualiza com dados recebidos
    atualizarComDados(dados) {
        if (!dados) return;
        
        Object.assign(this, {
            x: dados.x || this.x,
            y: dados.y || this.y,
            dir: dados.dir || this.dir,
            atacando: dados.atacando || false,
            chutando: dados.chutando || false,
            pulando: dados.pulando || false,
            sapatoX: dados.sapatoX || 0,
            sapatoY: dados.sapatoY || 0,
            olhosAbertos: dados.olhosAbertos !== undefined ? dados.olhosAbertos : this.olhosAbertos,
            descendoRapido: dados.descendoRapido || false,
            transformado: dados.transformado || false,
            cdPoder: dados.cdPoder || 0,
            cargaPoder: dados.cargaPoder || 0
        });
        
        // Vida (só atualiza se for menor)
        if (dados.vida !== undefined && dados.vida < this.vida) {
            this.vida = dados.vida;
        }
        
        // Estado de vida
        if (dados.vivo !== undefined) {
            this.vivo = dados.vivo;
            if (!dados.vivo) {
                this.vida = 0;
            }
        }
    }
}

window.LutadorCoco = LutadorCoco;