// Inicializa os jogadores
p1 = new LutadorCoco(250, "#8B7355", "cyan", {esq:"a", dir:"d", pulo:"w", atk:"f"}, 1, "p1");
p2 = new LutadorCoco(650, "#8B7355", "red", {esq:"ArrowLeft", dir:"ArrowRight", pulo:"ArrowUp", atk:"Enter"}, -1, "p2");

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
        vivo: jogador.vivo,
        pulando: jogador.pulando,
        sapatoX: jogador.sapatoX,
        sapatoY: jogador.sapatoY,
        olhosAbertos: jogador.olhosAbertos,
        descendoRapido: jogador.descendoRapido,
        cdPoder: jogador.cdPoder,
        cargaPoder: jogador.cargaPoder
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
db.ref("jogo/" + inimigoId).on("value", s => {
    const dados = s.val();
    if (!dados) return;
    
    const inimigo = inimigoId === "p1" ? p1 : p2;
    
    inimigo.x = dados.x || inimigo.x;
    inimigo.y = dados.y || inimigo.y;
    inimigo.dir = dados.dir || inimigo.dir;
    inimigo.atacando = dados.atacando || false;
    inimigo.chutando = dados.chutando || false;
    inimigo.pulando = dados.pulando || false;
    inimigo.sapatoX = dados.sapatoX || 0;
    inimigo.sapatoY = dados.sapatoY || 0;
    inimigo.olhosAbertos = dados.olhosAbertos !== undefined ? dados.olhosAbertos : inimigo.olhosAbertos;
    inimigo.descendoRapido = dados.descendoRapido || false;
    inimigo.cdPoder = dados.cdPoder || 0;
    inimigo.cargaPoder = dados.cargaPoder || 0;
    
    if (dados.vida !== undefined && dados.vida < inimigo.vida) {
        inimigo.vida = dados.vida;
    }
    
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
    p1.reset();
    p2.reset();
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
                vivo: true,
                pulando: false,
                sapatoX: 0,
                sapatoY: 0,
                olhosAbertos: true,
                descendoRapido: false,
                cdPoder: 0,
                cargaPoder: 0
            },
            p2: {
                x: p2.x,
                y: p2.y,
                vida: p2.vida,
                dir: p2.dir,
                atacando: false,
                chutando: false,
                vivo: true,
                pulando: false,
                sapatoX: 0,
                sapatoY: 0,
                olhosAbertos: true,
                descendoRapido: false,
                cdPoder: 0,
                cargaPoder: 0
            }
        });
        
        db.ref("cocoLancado").remove();
    }, 100);
}

// Loop principal do jogo
function loop() {
    ctx.clearRect(0, 0, 900, 400);
    ctx.drawImage(fundo, 0, CHAO - 40, 900, 180);

    barras();

    const jogadorLocal = meuId === "p1" ? p1 : p2;
    const inimigoLocal = meuId === "p1" ? p2 : p1;
    
    if (!p1.vivo || !p2.vivo) {
        jogoTerminou = true;
    }
    
    if (!jogoTerminou) {
        if (jogadorLocal.vivo) {
            jogadorLocal.mover(keys);
            jogadorLocal.pular(keys);
            jogadorLocal.atacar(keys, inimigoLocal);
            jogadorLocal.fisica();
        }
        
        jogadorLocal.atualizarCocos(inimigoLocal);
        inimigoLocal.atualizarCocos(jogadorLocal);
        inimigoLocal.fisica();
        
        enviarDados();
    }
    
    p1.desenhar();
    p2.desenhar();
    
    if (jogoTerminou) {
        desenharTelaFim();
        
        if (keys["r"] || keys["R"]) {
            db.ref("reinicio").set({
                tempo: Date.now(),
                jogador: meuId
            });
            
            reiniciarJogo();
            
            setTimeout(() => {
                db.ref("reinicio").remove();
            }, 1000);
        }
    }

    requestAnimationFrame(loop);
}

// Inicializa o jogo
fundo.onload = () => {
    reiniciarJogo();
    loop();
};
