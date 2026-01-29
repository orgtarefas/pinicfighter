// Declaração única de p1 e p2
let p1, p2;

function inicializarJogadores() {
    // Cria jogador local
    const jogadorLocal = criarPersonagem(
        meuPersonagem, 
        meuId === "p1" ? 250 : 650,
        meuId === "p1" ? {esq:"a", dir:"d", pulo:"w", atk:"f"} : {esq:"ArrowLeft", dir:"ArrowRight", pulo:"ArrowUp", atk:"Enter"},
        meuId === "p1" ? 1 : -1,
        meuId
    );
    
    // Cria inimigo (inicialmente como Cocozin)
    const jogadorInimigo = criarPersonagem(
        "cocozin",
        inimigoId === "p1" ? 250 : 650,
        inimigoId === "p1" ? {esq:"a", dir:"d", pulo:"w", atk:"f"} : {esq:"ArrowLeft", dir:"ArrowRight", pulo:"ArrowUp", atk:"Enter"},
        inimigoId === "p1" ? 1 : -1,
        inimigoId
    );
    
    // Atribui aos jogadores globais
    if (meuId === "p1") {
        p1 = jogadorLocal;
        p2 = jogadorInimigo;
    } else {
        p1 = jogadorInimigo;
        p2 = jogadorLocal;
    }
    
    console.log(`Você escolheu: ${meuPersonagem}`);
    console.log(`Aguardando inimigo escolher personagem...`);
}

// Inicializa os jogadores
inicializarJogadores();

// Funções Firebase
function enviarDados() {
    if (jogoTerminou) return;
    
    const jogador = meuId === "p1" ? p1 : p2;
    
    db.ref("jogo/" + meuId).set({
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
    });
}

function enviarCocoLancado(jogadorId, x, y, direcao) {
    if (jogoTerminou) return;
    
    db.ref("cocoLancado").set({
        jogador: jogadorId,
        x: x,
        y: y,
        direcao: direcao,
        tempo: Date.now()
    });
}

// Recebe dados do inimigo
db.ref("jogo/"+inimigoId).on("value", s => {
    const dados = s.val();
    if (!dados) return;
    
    const inimigo = inimigoId === "p1" ? p1 : p2;
    
    // Atualiza dados básicos
    inimigo.x = dados.x || inimigo.x;
    inimigo.y = dados.y || inimigo.y;
    inimigo.dir = dados.dir || inimigo.dir;
    inimigo.atacando = dados.atacando || false;
    inimigo.chutando = dados.chutando || false;
    inimigo.abaixado = dados.abaixado || false;
    inimigo.deslizando = dados.deslizando || false;
    inimigo.pulando = dados.pulando || false;
    inimigo.sapatoX = dados.sapatoX || 0;
    inimigo.sapatoY = dados.sapatoY || 0;
    inimigo.olhosAbertos = dados.olhosAbertos !== undefined ? dados.olhosAbertos : inimigo.olhosAbertos;
    inimigo.descendoRapido = dados.descendoRapido || false;
    inimigo.cdPoder = dados.cdPoder || 0;
    inimigo.cargaPoder = dados.cargaPoder || 0;
    
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
});

// Escuta por cocôs lançados
db.ref("cocoLancado").on("value", s => {
    const dados = s.val();
    if (!dados || dados.jogador === meuId || jogoTerminou) return;
    
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
    if (dados) {
        reiniciarJogo();
    }
});

function reiniciarJogo() {
    // Reinicia os jogadores mantendo seus tipos
    const tipoP1 = p1.tipo;
    const tipoP2 = p2.tipo;
    
    p1 = criarPersonagem(tipoP1, 250, 
        {esq:"a", dir:"d", pulo:"w", atk:"f"}, 1, "p1");
    p2 = criarPersonagem(tipoP2, 650, 
        {esq:"ArrowLeft", dir:"ArrowRight", pulo:"ArrowUp", atk:"Enter"}, -1, "p2");
    
    jogoTerminou = false;
    
    enviarDados();
    
    setTimeout(() => {
        db.ref("jogo").set({
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
        });
        
        db.ref("cocoLancado").remove();
    }, 100);
}

// Loop principal do jogo
function loop() {
    ctx.clearRect(0, 0, 900, 400);
    
    // Desenha fundo
    if (fundo.complete) {
        ctx.drawImage(fundo, 0, CHAO - 40, 900, 180);
    }

    barras();

    const jogadorLocal = meuId === "p1" ? p1 : p2;
    const inimigoLocal = meuId === "p1" ? p2 : p1;
    
    // Verifica se o jogo terminou
    if (!p1.vivo || !p2.vivo) {
        jogoTerminou = true;
    }
    
    // Controles só funcionam se o jogo não terminou
    if (!jogoTerminou) {
        if (jogadorLocal.vivo) {
            jogadorLocal.mover(keys);
            jogadorLocal.pular(keys);
            jogadorLocal.atacar(keys, inimigoLocal);
            jogadorLocal.fisica();
        }
        
        // Atualiza cocôs ativos do jogador local
        jogadorLocal.atualizarCocos(inimigoLocal);
        
        // Atualiza cocôs ativos do inimigo
        inimigoLocal.atualizarCocos(jogadorLocal);
        
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
            // Envia sinal para reiniciar
            db.ref("reinicio").set({
                tempo: Date.now(),
                jogador: meuId
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

// Escuta escolha de personagem do inimigo via Firebase
db.ref("personagens/" + inimigoId).on("value", s => {
    const personagemInimigo = s.val();
    if (personagemInimigo && personagemInimigo !== inimigoPersonagem) {
        inimigoPersonagem = personagemInimigo;
        console.log(`Inimigo escolheu: ${inimigoPersonagem}`);
        
        // Atualiza o inimigo local com o personagem escolhido
        if (inimigoId === "p1") {
            p1 = criarPersonagem(
                inimigoPersonagem, 
                250,
                {esq:"a", dir:"d", pulo:"w", atk:"f"}, 
                1, 
                "p1"
            );
        } else {
            p2 = criarPersonagem(
                inimigoPersonagem, 
                650,
                {esq:"ArrowLeft", dir:"ArrowRight", pulo:"ArrowUp", atk:"Enter"}, 
                -1, 
                "p2"
            );
        }
    }
});

// Envia escolha do personagem para o Firebase
db.ref("personagens/" + meuId).set(meuPersonagem);

// Inicializa o jogo
if (fundo.complete) {
    reiniciarJogo();
    loop();
} else {
    fundo.onload = () => {
        reiniciarJogo();
        loop();
    };
}
