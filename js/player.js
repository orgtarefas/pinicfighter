// player.js - Classe do jogador (principal)
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
        
        // Atributos
        this.vida = CONFIG.MAX_VIDA;
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
        
        // Animação
        this.animacao = 0;
        this.frame = 0;
    }
    
    // Métodos principais (chamados de outros módulos)
    mover(keys, jogoTerminou) {
        Attacks.processarMovimento(this, keys, jogoTerminou);
    }
    
    pular(keys, jogoTerminou) {
        Physics.processarPulo(this, keys, jogoTerminou);
    }
    
    atacar(keys, inimigo, jogoTerminou) {
        Attacks.processarSoco(this, keys, inimigo, jogoTerminou);
        Attacks.processarChute(this, keys, inimigo, jogoTerminou);
        Attacks.atualizarAnimacoes(this);
        
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
    
    fisica() {
        return Physics.aplicarGravidade(this);
    }
    
    // Sistema de dano
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
            this.invulneravel = true;
            this.tempoInvulneravel = 30;
            this.olhosAbertos = false;
            setTimeout(() => this.olhosAbertos = true, 100);
            
            // Efeito visual
            if (Game.ctx) {
                Utils.criarParticulas(Game.ctx, this.x, this.y - 30, 10, this.cor);
            }
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
        
        if (Game.ctx) {
            Utils.criarParticulas(Game.ctx, this.x, this.y, 30, this.cor);
        }
    }
    
    // Sistema de poder
    lancarCoco() {
        if (this.cdPoder > 0) return null;
        
        const forca = this.cargaPoder / CONFIG.MAX_CARGA;
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
    
    atualizarCocos(inimigo) {
        for (let i = this.cocosAtivos.length - 1; i >= 0; i--) {
            const coco = this.cocosAtivos[i];
            coco.atualizar();
            
            if (coco.verificarColisao(inimigo)) {
                inimigo.receberDano(coco.dano);
                coco.ativo = false;
                
                if (Game.ctx) {
                    Utils.criarParticulas(Game.ctx, coco.x, coco.y, 15, this.cor);
                }
            }
            
            if (!coco.ativo) {
                this.cocosAtivos.splice(i, 1);
            }
        }
    }
    
    // Hitbox
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
    
    // Dados para sincronização
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
        
        if (dados.vida !== undefined && dados.vida < this.vida) {
            this.vida = dados.vida;
        }
        
        if (dados.vivo !== undefined) {
            this.vivo = dados.vivo;
            if (!dados.vivo) {
                this.vida = 0;
            }
        }
    }
    
    reset() {
        this.x = this.inicialX;
        this.y = CONFIG.CHAO;
        this.vy = 0;
        this.vida = CONFIG.MAX_VIDA;
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
}

window.LutadorCoco = LutadorCoco;