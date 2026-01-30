// Declaração única de p1 e p2
let p1, p2;

// Variáveis globais (serão setadas pelo firebase-config.js)
let meuIdGlobal = null;
let meuPersonagemGlobal = null;
let inimigoIdGlobal = null;
let inimigoPersonagemGlobal = null;
let jogoInicializado = false;

// Função chamada pelo firebase-config.js após seleção
window.inicializarJogadoresComPersonagens = function(meuId, meuPersonagem, inimigoId, inimigoPersonagem) {
    meuIdGlobal = meuId;
    meuPersonagemGlobal = meuPersonagem;
    inimigoIdGlobal = inimigoId;
    inimigoPersonagemGlobal = inimigoPersonagem;
    
    console.log("=== INICIALIZANDO JOGO ===");
    console.log("Eu:", meuIdGlobal, "- Personagem:", meuPersonagemGlobal);
    console.log("Inimigo:", inimigoIdGlobal, "- Personagem:", inimigoPersonagemGlobal);
    
    inicializarJogadores();
    iniciarLoopJogo();
    jogoInicializado = true;
};

function inicializarJogadores() {
    if (!meuIdGlobal || !meuPersonagemGlobal) {
        console.error("Dados de seleção não disponíveis!");
        return;
    }
    
    // Cria jogador local
    const jogadorLocal = criarPersonagem(
        meuPersonagemGlobal, 
        meuIdGlobal === "p1" ? 250 : 650,
        meuIdGlobal === "p1" ? {esq:"a", dir:"d", pulo:"w", atk:"f"} : {esq:"ArrowLeft", dir:"ArrowRight", pulo:"ArrowUp", atk:"Enter"},
        meuIdGlobal === "p1" ? 1 : -1,
        meuIdGlobal
    );
    
    // Cria inimigo
    const jogadorInimigo = criarPersonagem(
        inimigoPersonagemGlobal || "cocozin",
        inimigoIdGlobal === "p1" ? 250 : 650,
        inimigoIdGlobal === "p1" ? {esq:"a", dir:"d", pulo:"w", atk:"f"} : {esq:"ArrowLeft", dir:"ArrowRight", pulo:"ArrowUp", atk:"Enter"},
        inimigoIdGlobal === "p1" ? 1 : -1,
        inimigoIdGlobal
    );
    
    // Atribui aos jogadores globais
    if (meuIdGlobal === "p1") {
        p1 = jogadorLocal;
        p2 = jogadorInimigo;
    } else {
        p1 = jogadorInimigo;
        p2 = jogadorLocal;
    }
    
    console.log("✓ Jogadores criados:");
    console.log(`  P1: ${p1.tipo} (${p1.vivo ? 'VIVO' : 'MORTO'})`);
    console.log(`  P2: ${p2.tipo} (${p2.vivo ? 'VIVO' : 'MORTO'})`);
}

function iniciarLoopJogo() {
    console.log("✓ Iniciando loop do jogo...");
    
    // Configura listeners do Firebase
    configurarFirebaseListeners();
    
    // Inicializa o jogo
    if (fundo.complete) {
        setTimeout(() => {
            reiniciarJogo();
            loop();
        }, 500); // Pequeno delay para garantir tudo está carregado
    } else {
        fundo.onload = () => {
            setTimeout(() => {
                reiniciarJogo();
                loop();
            }, 500);
        };
    }
}

// Configura listeners do Firebase
function configurarFirebaseListeners() {
    if (!inimigoIdGlobal) return;
    
    console.log("✓ Configurando listeners Firebase...");
    
    // Recebe dados do inimigo
    db.ref("jogo/"+inimigoIdGlobal).on("value", s => {
        const dados = s.val();
        if (!dados || !p1 || !p2 || jogoTerminou) return;
        
        const inimigo = inimigoIdGlobal === "p1" ? p1 : p2;
        
        // Atualiza dados básicos
        if (dados.x !== undefined) inimigo.x = dados.x;
        if (dados.y !== undefined) inimigo.y = dados.y;
        if (dados.dir !== undefined) inimigo.dir = dados.dir;
        if (dados.atacando !== undefined) inimigo.atacando = dados.atacando;
        if (dados.chutando !== undefined) inimigo.chutando = dados.chutando;
        if (dados.abaixado !== undefined) inimigo.abaixado = dados.abaixado;
        if (dados.deslizando !== undefined) inimigo.deslizando = dados.deslizando;
        if (dados.pulando !== undefined) inimigo.pulando = dados.pulando;
        if (dados.sapatoX !== undefined) inimigo.sapatoX = dados.sapatoX;
        if (dados.sapatoY !== undefined) inimigo.sapatoY = dados.sapatoY;
        if (dados.olhosAbertos !== undefined) inimigo.olhosAbertos = dados.olhosAbertos;
        if (dados.descendoRapido !== undefined) inimigo.descendoRapido = dados.descendoRapido;
        if (dados.cdPoder !== undefined) inimigo.cdPoder = dados.cdPoder;
        if (dados.cargaPoder !== undefined) inimigo.cargaPoder = dados.cargaPoder;
        
        // Atualiza vida (só se for menor, para não regenerar)
        if (dados.vida !== undefined && dados.vida < inimigo.vida) {
            inimigo.vida = dados.vida;
        }
        
        // Atualiza estado de vida
        if (dados.vivo !== undefined) {
            inimigo.vivo = dados.vivo;
            if (!dados.vivo) {
                inimigo.vida = 0;
            }
        }
        
        // Atualiza tipo se mudou
        if (dados.tipo && dados.tipo !== inimigo.tipo) {
            console.log(`Inimigo mudou para: ${dados.tipo}`);
            // Você pode adicionar lógica para mudar o personagem em tempo real se quiser
        }
    });
    
    // Escuta por cocôs lançados
    db.ref("cocoLancado").on("value", s => {
        const dados = s.val();
        if (!dados || dados.jogador === meuIdGlobal || jogoTerminou || !p1 || !p2) return;
        
        const jogador = dados.jogador === "p1" ? p1 : p2;
        
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
    db.ref("reinicio").on("value", s => {
        const dados = s.val();
        if (dados && jogoInicializado) {
            console.log("✓ Recebido sinal para reiniciar jogo");
            reiniciarJogo();
        }
    });
}

// Funções Firebase
function enviarDados() {
    if (jogoTerminou || !meuIdGlobal || !p1 || !p2) return;
    
    const jogador = meuIdGlobal === "p1" ? p1 : p2;
    
    db.ref("jogo/" + meuIdGlobal).set({
        x: jogador.x,
        y: jogador.y,
        vida: jogador.vida,
        dir: jogador.dir,
        atacando: jogador.atacando,
        chutando: jogador.chutando,
        abaixado: jogador.abaixado,
        deslizando: jogador.deslizando,
        vivo: jogador.vivo,
        pulando: jogador.pulando,
        sapatoX: jogador.sapatoX,
        sapatoY: jogador.sapatoY,
        olhosAbertos: jogador.olhosAbertos,
        descendoRapido: jogador.descendoRapido,
        cdPoder: jogador.cdPoder,
        cargaPoder: jogador.cargaPoder,
        tipo: jogador.tipo
    }).catch(error => {
        console.error("Erro ao enviar dados:", error);
    });
}

function enviarCocoLancado(jogadorId, x, y, direcao) {
    if (jogoTerminou || !meuIdGlobal) return;
    
    db.ref("cocoLancado").set({
        jogador: jogadorId,
        x: x,
        y: y,
        direcao: direcao,
        tempo: Date.now()
    }).catch(error => {
        console.error("Erro ao enviar coco:", error);
    });
}

// Sistema de reinício
function reiniciarJogo() {
    if (!p1 || !p2) {
        console.error("Não é possível reiniciar: jogadores não inicializados");
        return;
    }
    
    console.log("✓ Reiniciando jogo...");
    
    // Mantém os tipos originais
    const tipoP1 = p1.tipo;
    const tipoP2 = p2.tipo;
    
    // Recria os jogadores
    p1 = criarPersonagem(tipoP1, 250, 
        {esq:"a", dir:"d", pulo:"w", atk:"f"}, 1, "p1");
    p2 = criarPersonagem(tipoP2, 650, 
        {esq:"ArrowLeft", dir:"ArrowRight", pulo:"ArrowUp", atk:"Enter"}, -1, "p2");
    
    jogoTerminou = false;
    
    // Envia dados iniciais
    enviarDados();
    
    // Sincroniza estado inicial via Firebase
    setTimeout(() => {
        const dadosIniciais = {
            p1: {
                x: p1.x,
                y: p1.y,
                vida: p1.vida,
                dir: p1.dir,
                atacando: false,
                chutando: false,
                abaixado: false,
                deslizando: false,
                vivo: true,
                pulando: false,
                sapatoX: 0,
                sapatoY: 0,
                olhosAbertos: true,
                descendoRapido: false,
                cdPoder: 0,
                cargaPoder: 0,
                tipo: p1.tipo
            },
            p2: {
                x: p2.x,
                y: p2.y,
                vida: p2.vida,
                dir: p2.dir,
                atacando: false,
                chutando: false,
                abaixado: false,
                deslizando: false,
                vivo: true,
                pulando: false,
                sapatoX: 0,
                sapatoY: 0,
                olhosAbertos: true,
                descendoRapido: false,
                cdPoder: 0,
                cargaPoder: 0,
                tipo: p2.tipo
            }
        };
        
        db.ref("jogo").set(dadosIniciais).then(() => {
            console.log("✓ Estado inicial sincronizado");
        }).catch(error => {
            console.error("Erro ao sincronizar estado:", error);
        });
        
        // Limpa cocôs lançados
        db.ref("cocoLancado").remove();
        
    }, 100);
}

// Loop principal do jogo
function loop() {
    if (!jogoInicializado || !p1 || !p2) {
        // Aguarda inicialização
        requestAnimationFrame(loop);
        return;
    }
    
    // Limpa canvas
    ctx.clearRect(0, 0, 900, 400);
    
    // Desenha fundo
    if (fundo.complete) {
        ctx.drawImage(fundo, 0, CHAO - 40, 900, 180);
    } else {
        // Fallback se a imagem não carregar
        ctx.fillStyle = "#222";
        ctx.fillRect(0, CHAO - 40, 900, 180);
    }

    // Desenha barras de vida
    barras();

    const jogadorLocal = meuIdGlobal === "p1" ? p1 : p2;
    const inimigoLocal = meuIdGlobal === "p1" ? p2 : p1;
    
    // Verifica se o jogo terminou
    if ((!p1.vivo || !p2.vivo) && !jogoTerminou) {
        jogoTerminou = true;
        console.log("⚡ JOGO TERMINADO!");
        console.log(`Vencedor: ${p1.vivo ? "P1 (" + p1.tipo + ")" : "P2 (" + p2.tipo + ")"}`);
    }
    
    // Controles só funcionam se o jogo não terminou
    if (!jogoTerminou) {
        if (jogadorLocal.vivo) {
            // Atualiza jogador local
            jogadorLocal.mover(keys);
            jogadorLocal.pular(keys);
            jogadorLocal.atacar(keys, inimigoLocal);
            jogadorLocal.fisica();
        }
        
        // Atualiza cocôs ativos do jogador local
        jogadorLocal.atualizarCocos(inimigoLocal);
        
        // Atualiza cocôs ativos do inimigo
        inimigoLocal.atualizarCocos(jogadorLocal);
        
        // Atualiza física do inimigo
        inimigoLocal.fisica();
        
        // Envia dados para Firebase
        enviarDados();
    }
    
    // Desenha os personagens
    p1.desenhar();
    p2.desenhar();
    
    // Se o jogo terminou, mostra tela de fim
    if (jogoTerminou) {
        desenharTelaFim();
        
        // Sistema de reinício
        if (keys["r"] || keys["R"]) {
            console.log("✓ Jogador pressionou R para reiniciar");
            
            // Envia sinal para reiniciar
            db.ref("reinicio").set({
                tempo: Date.now(),
                jogador: meuIdGlobal
            }).then(() => {
                console.log("✓ Sinal de reinício enviado para Firebase");
            }).catch(error => {
                console.error("Erro ao enviar sinal de reinício:", error);
            });
            
            // Reinicia localmente
            reiniciarJogo();
            
            // Limpa o sinal de reinício depois de um tempo
            setTimeout(() => {
                db.ref("reinicio").remove();
            }, 1000);
        }
    }

    requestAnimationFrame(loop);
}

// Inicialização segura
console.log("✓ game.js carregado");
console.log("✓ Aguardando seleção de personagens...");

// Função auxiliar para debug
function debugInfo() {
    if (!p1 || !p2) {
        console.log("Jogadores não inicializados");
        return;
    }
    
    console.log("=== DEBUG INFO ===");
    console.log(`P1: ${p1.tipo} | Vida: ${p1.vida} | Vivo: ${p1.vivo} | X: ${p1.x.toFixed(1)}`);
    console.log(`P2: ${p2.tipo} | Vida: ${p2.vida} | Vivo: ${p2.vivo} | X: ${p2.x.toFixed(1)}`);
    console.log(`Jogo terminou: ${jogoTerminou}`);
    console.log(`Meu ID: ${meuIdGlobal} | Personagem: ${meuPersonagemGlobal}`);
    console.log(`Teclas pressionadas: ${Object.keys(keys).filter(k => keys[k]).join(', ')}`);
    console.log("==================");
}

// Adiciona listener para debug (Shift+D)
addEventListener("keydown", e => {
    if (e.key === "D" && e.shiftKey) {
        e.preventDefault();
        debugInfo();
    }
});
