// game.js - Lógica principal do jogo
const Game = {
    canvas: null,
    ctx: null,
    keys: {},
    jogoTerminou: false,
    p1: null,
    p2: null,
    meuId: null,
    inimigoId: null,
    firebase: null,
    db: null,
    
    init: function() {
        // Configura canvas
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.WIDTH;
        this.canvas.height = CONFIG.HEIGHT;
        
        // Inicializa Firebase
        this.firebase = new FirebaseManager();
        this.db = this.firebase.getDB();
        
        // Inicializa UI
        GameUI.init(this.ctx);
        
        // Configura controles
        this.setupControls();
        
        // Pega qual jogador
        this.perguntarJogador();
        
        // Cria jogadores
        this.criarJogadores();
        
        // Inicia o loop do jogo
        this.loop();
    },
    
    setupControls: function() {
        window.addEventListener("keydown", e => {
            this.keys[e.key] = true;
            
            // Reiniciar jogo
            if ((e.key === 'r' || e.key === 'R') && this.jogoTerminou) {
                this.reiniciarJogo();
            }
        });
        
        window.addEventListener("keyup", e => {
            this.keys[e.key] = false;
        });
    },
    
    perguntarJogador: function() {
        const meuPlayer = prompt("Digite 1 para Player 1 ou 2 para Player 2");
        this.meuId = meuPlayer === "1" ? "p1" : "p2";
        this.inimigoId = this.meuId === "p1" ? "p2" : "p1";
        
        // Se não escolher nada, assume Player 1
        if (!this.meuId) {
            this.meuId = "p1";
            this.inimigoId = "p2";
        }
    },
    
    criarJogadores: function() {
        const controlesP1 = {
            esq: "a", dir: "d", pulo: "w", atk: "f", chute: "c", baixo: "s"
        };
        const controlesP2 = {
            esq: "ArrowLeft", dir: "ArrowRight", pulo: "ArrowUp", 
            atk: "Enter", chute: ".", baixo: "ArrowDown"
        };
        
        this.p1 = new LutadorCoco(250, "#8B7355", "cyan", controlesP1, 1, "p1");
        this.p2 = new LutadorCoco(650, "#8B7355", "red", controlesP2, -1, "p2");
        
        // Configura sincronização Firebase
        this.configurarSincronizacao();
        
        // Envia dados iniciais
        this.enviarDados();
    },
    
    configurarSincronizacao: function() {
        if (!this.db) return;
        
        // Escuta dados do inimigo
        this.db.ref("jogo/" + this.inimigoId).on("value", snapshot => {
            const dados = snapshot.val();
            if (!dados) return;
            
            const inimigo = this.inimigoId === "p1" ? this.p1 : this.p2;
            inimigo.atualizarComDados(dados);
        });
        
        // Escuta por cocôs lançados
        this.db.ref("cocoLancado").on("value", snapshot => {
            const dados = snapshot.val();
            if (!dados || dados.jogador === this.meuId || this.jogoTerminou) return;
            
            const jogador = dados.jogador === "p1" ? this.p1 : this.p2;
            const coco = new CocoProjetil(
                dados.x,
                dados.y,
                dados.direcao,
                jogador.cor,
                dados.jogador
            );
            jogador.cocosAtivos.push(coco);
        });
        
        // Sistema de reinício
        this.db.ref("reinicio").on("value", snapshot => {
            const dados = snapshot.val();
            if (dados) {
                this.reiniciarJogo();
            }
        });
    },
    
    enviarDados: function() {
        if (this.jogoTerminou || !this.db) return;
        
        const jogador = this.meuId === "p1" ? this.p1 : this.p2;
        this.db.ref("jogo/" + this.meuId).set(jogador.getDadosSync());
    },
    
    enviarCocoLancado: function(jogadorId, x, y, direcao) {
        if (this.jogoTerminou || !this.db) return;
        
        this.db.ref("cocoLancado").set({
            jogador: jogadorId,
            x: x,
            y: y,
            direcao: direcao,
            tempo: Date.now()
        });
    },
    
    atualizar: function() {
        if (this.jogoTerminou) return;
        
        const jogador = this.meuId === "p1" ? this.p1 : this.p2;
        const inimigo = this.meuId === "p1" ? this.p2 : this.p1;
        
        // Controles do jogador local
        if (jogador.vivo) {
            jogador.mover(this.keys, this.jogoTerminou);
            jogador.pular(this.keys, this.jogoTerminou);
            jogador.atacar(this.keys, inimigo, this.jogoTerminou);
            
            const cocoLancado = jogador.fisica();
            if (cocoLancado) {
                this.enviarCocoLancado(jogador.id, cocoLancado.x, cocoLancado.y, cocoLancado.direcao);
            }
            
            jogador.atualizarCocos(inimigo);
        }
        
        // Atualiza inimigo
        inimigo.atualizarCocos(jogador);
        inimigo.fisica();
        
        // Verifica fim do jogo
        if (!this.p1.vivo || !this.p2.vivo) {
            this.jogoTerminou = true;
        }
        
        // Sincroniza dados
        this.enviarDados();
    },
    
    render: function() {
        // Limpa canvas
        this.ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
        
        // Desenha jogo
        GameUI.desenharJogo(this.p1, this.p2, this.jogoTerminou);
    },
    
    loop: function() {
        this.atualizar();
        this.render();
        requestAnimationFrame(() => this.loop());
    },
    
    reiniciarJogo: function() {
        this.p1.reset();
        this.p2.reset();
        this.jogoTerminou = false;
        
        // Envia dados para Firebase
        this.enviarDados();
        
        // Força atualização do inimigo
        if (this.db) {
            setTimeout(() => {
                this.db.ref("jogo").set({
                    p1: this.p1.getDadosSync(),
                    p2: this.p2.getDadosSync()
                });
                this.db.ref("cocoLancado").remove();
            }, 100);
        }
    }
};

window.Game = Game;