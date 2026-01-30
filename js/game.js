
// ============================================
// INICIALIZAÇÃO BÁSICA DO JOGO
// ============================================

// Variáveis básicas do jogo
let canvas, ctx;
let fundo;
let p1, p2; // Para compatibilidade com modo single player

// Inicializar elementos básicos quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Inicializando sistema básico do jogo...');
    
    // Obter referências do canvas
    canvas = document.getElementById('game');
    if (!canvas) {
        console.error('❌ Canvas não encontrado!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    
    // Carregar imagem de fundo
    fundo = new Image();
    fundo.src = "imagens/fundo.png";
    
    console.log('✅ Sistema básico inicializado');
});

// Função para iniciar jogo single player (fallback)
window.iniciarJogoSinglePlayer = function(personagem1, personagem2) {
    console.log('👤 Iniciando modo single player...');
    
    // Criar personagens
    p1 = criarPersonagem(personagem1 || 'cocozin', 200, 'p1');
    p2 = criarPersonagem(personagem2 || 'ratazana', 700, 'p2');
    
    // Iniciar loop
    loopSinglePlayer();
};

// Loop para single player
function loopSinglePlayer() {
    if (!ctx || !p1 || !p2) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, 900, 400);
    
    // Desenhar fundo
    if (fundo.complete) {
        ctx.drawImage(fundo, 0, 200, 900, 180);
    }
    
    // Atualizar e desenhar personagens
    p1.mover();
    p1.pular();
    p1.atacar(p2);
    p1.fisica();
    p1.desenhar();
    
    p2.mover();
    p2.pular();
    p2.atacar(p1);
    p2.fisica();
    p2.desenhar();
    
    // Chamar novamente
    requestAnimationFrame(loopSinglePlayer);
}

// ============================================
// SISTEMA MULTIPLAYER SIMPLIFICADO
// ============================================

// Variáveis globais para multiplayer
let salaAtualGame = null;
let meuPlayerIdGame = null;
let meuPersonagemGame = null;
let jogadores = {};
let jogadorLocal = null;

// Inicializar jogo multiplayer (chamado pelo firebase-config.js)
window.inicializarJogoMultiplayer = function(nomeSala, playerNum, personagem) {
    console.log(`🎮 INICIANDO JOGO MULTIPLAYER`);
    console.log(`📍 Sala: ${nomeSala}`);
    console.log(`👤 Player: ${playerNum}`);
    console.log(`🎭 Personagem: ${personagem}`);
    
    salaAtualGame = nomeSala;
    meuPlayerIdGame = `p${playerNum}`;
    meuPersonagemGame = personagem;
    
    const playerNumInt = parseInt(playerNum);
    const posicaoX = 150 + (playerNumInt - 1) * 200;
    
    // Criar jogador local
    const jogador = criarPersonagem(personagem, posicaoX, meuPlayerIdGame);
    
    // Armazenar no objeto de jogadores
    jogadores[meuPlayerIdGame] = {
        instancia: jogador,
        tipo: personagem,
        vivo: true,
        playerNum: playerNum,
        ativo: true
    };
    
    jogadorLocal = jogador;
    
    console.log(`✓ Jogador local configurado: ${meuPlayerIdGame} (${personagem})`);
    
    // Iniciar loop do jogo
    iniciarLoopJogoMultiplayer();
};

// Atualizar jogadores do game (chamado pelo firebase-config.js)
window.atualizarJogadoresGame = function(jogadoresSala) {
    // Processar jogadores na sala atual
    for (const [playerId, dados] of Object.entries(jogadoresSala)) {
        if (playerId === meuPlayerIdGame) {
            // Ignorar jogador local
            continue;
        }
        
        // Se jogador já existe, atualizar vida
        if (jogadores[playerId]) {
            const jogador = jogadores[playerId].instancia;
            if (jogador) {
                jogador.vida = dados.vida || jogador.vida;
                jogador.vivo = dados.vivo !== undefined ? dados.vivo : jogador.vivo;
                jogadores[playerId].vivo = jogador.vivo;
            }
        } else {
            // Criar novo jogador
            if (dados.personagem) {
                const playerNum = playerId.charAt(1);
                const posicaoX = 150 + (parseInt(playerNum) - 1) * 200;
                
                const jogador = criarPersonagem(
                    dados.personagem || 'cocozin',
                    posicaoX,
                    playerId
                );
                
                jogador.vida = dados.vida || 100;
                jogador.vivo = dados.vivo !== undefined ? dados.vivo : true;
                
                jogadores[playerId] = {
                    instancia: jogador,
                    tipo: dados.personagem || 'cocozin',
                    vivo: jogador.vivo,
                    playerNum: playerNum,
                    ativo: true
                };
            }
        }
    }
    
    // Remover jogadores que saíram
    for (const playerId in jogadores) {
        if (playerId !== meuPlayerIdGame && !jogadoresSala[playerId]) {
            delete jogadores[playerId];
        }
    }
};

// ============================================
// LOOP DO JOGO SIMPLIFICADO
// ============================================

function iniciarLoopJogoMultiplayer() {
    console.log('🎬 Iniciando loop do jogo multiplayer...');
    
    // Iniciar o loop
    if (fundo.complete) {
        setTimeout(() => {
            loopMultiplayer();
        }, 1000);
    } else {
        fundo.onload = () => {
            setTimeout(() => {
                loopMultiplayer();
            }, 1000);
        };
    }
}

// Loop principal multiplayer SIMPLIFICADO
function loopMultiplayer() {
    if (!jogadorLocal || !salaAtualGame) {
        requestAnimationFrame(loopMultiplayer);
        return;
    }
    
    // Limpa canvas
    ctx.clearRect(0, 0, 900, 400);
    
    // Desenha fundo
    if (fundo.complete) {
        ctx.drawImage(fundo, 0, CHAO - 40, 900, 180);
    } else {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, CHAO - 40, 900, 180);
    }

    // Desenha barras de vida
    barrasMultiplayer();

    // Controles funcionam sempre
    if (jogadorLocal.vivo && !jogoTerminou) {
        // Atualizar jogador local
        jogadorLocal.mover();
        jogadorLocal.pular();
        
        // Atacar todos os outros jogadores vivos
        for (const playerId in jogadores) {
            if (playerId !== meuPlayerIdGame) {
                const inimigo = jogadores[playerId]?.instancia;
                if (inimigo && inimigo.vivo) {
                    jogadorLocal.atacar(inimigo);
                }
            }
        }
        
        jogadorLocal.fisica();
        
        // Atualizar cocôs ativos do jogador local
        for (const playerId in jogadores) {
            if (playerId !== meuPlayerIdGame) {
                const inimigo = jogadores[playerId]?.instancia;
                if (inimigo) {
                    jogadorLocal.atualizarCocos(inimigo);
                }
            }
        }
    }
    
    // Desenhar todos os jogadores ATIVOS
    for (let i = 1; i <= 4; i++) {
        const jogador = jogadores[`p${i}`]?.instancia;
        if (jogador && jogadores[`p${i}`]?.ativo) {
            jogador.desenhar();
        }
    }

    requestAnimationFrame(loopMultiplayer);
}

// ============================================
// FUNÇÕES DE UI SIMPLIFICADAS
// ============================================

function barrasMultiplayer() {
    // Desenhar barras de vida apenas para jogadores ATIVOS
    const posicoes = [
        { x: 50, player: 'p1' },
        { x: 650, player: 'p2' },
        { x: 50, y: 60, player: 'p3' },
        { x: 650, y: 60, player: 'p4' }
    ];
    
    for (let i = 0; i < posicoes.length; i++) {
        const pos = posicoes[i];
        const playerId = pos.player;
        
        if (!jogadores[playerId] || !jogadores[playerId].ativo) {
            continue;
        }
        
        const jogador = jogadores[playerId].instancia;
        if (!jogador) continue;
        
        const y = pos.y || 20;
        
        // Barra de vida
        ctx.fillStyle = "#333";
        ctx.fillRect(pos.x, y, 200, 20);
        
        // Cor da barra
        let corBarra;
        if (jogador.tipo === "cocozin") {
            corBarra = playerId === 'p1' ? "cyan" : "red";
        } else if (jogador.tipo === "ratazana") {
            corBarra = "#8B0000";
        } else if (jogador.tipo === "peidovélio") {
            corBarra = "#808080";
        } else {
            corBarra = jogador.corSapato || "#8B7355";
        }
        
        ctx.fillStyle = corBarra;
        ctx.fillRect(pos.x, y, jogador.vida * 2, 20);
        
        // Nome e vida
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";
        
        function formatarNome(tipo) {
            if (tipo === "cocozin") return "COCOZIN";
            if (tipo === "ratazana") return "RATAZANA";
            if (tipo === "peidovélio") return "PEIDOVÉLIO";
            return tipo.toUpperCase();
        }
        
        const nome = formatarNome(jogador.tipo);
        ctx.fillText(`${playerId}: ${nome} - ${Math.max(0, jogador.vida)}HP`, pos.x, y + 35);
        
        // Bordas da barra
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x, y, 200, 20);
    }
    
    // Mostrar controles atuais
    ctx.fillStyle = "yellow";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    
    if (meuPlayerIdGame === 'p1') {
        ctx.fillText("Controles: A/D=Mover W=Pular F=Socar C=Chutar S=Abaixar", 450, 380);
    } else if (meuPlayerIdGame === 'p2') {
        ctx.fillText("Controles: ←/→=Mover ↑=Pular Enter=Socar .=Chutar ↓=Abaixar", 450, 380);
    } else if (meuPlayerIdGame === 'p3') {
        ctx.fillText("Controles: J/L=Mover I=Pular H=Socar N=Chutar K=Abaixar", 450, 380);
    } else if (meuPlayerIdGame === 'p4') {
        ctx.fillText("Controles: NUM4/6=Mover NUM8=Pular NUM0=Socar NUM.=Chutar NUM5=Abaixar", 450, 380);
    }
    
    ctx.textAlign = "left";
}

// ============================================
// INICIALIZAÇÃO
// ============================================

console.log('🎮 game.js multiplayer SIMPLIFICADO carregado');
console.log('✅ Aguardando criação/entrada em sala...');

