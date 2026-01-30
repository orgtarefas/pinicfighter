// ============================================
// SISTEMA MULTIPLAYER DE SALAS - AJUSTADO
// ============================================

// Variáveis globais para multiplayer
let salaAtualGame = null;
let meuPlayerIdGame = null;
let meuPersonagemGame = null;
let jogadores = {}; // { p1: {tipo, x, y, vida, vivo}, p2: {...}, p3: {...}, p4: {...} }
let controlesPorPlayer = {};
let p1, p2, p3, p4; // Agora temos 4 jogadores possíveis
let jogadorLocal = null;

// Mapeamento de controles por player - ATUALIZADO
const MAPEAMENTO_CONTROLES = {
    '1': { esq: "KeyA", dir: "KeyD", pulo: "KeyW", atk: "KeyF", chute: "KeyC", baixo: "KeyS" },
    '2': { esq: "ArrowLeft", dir: "ArrowRight", pulo: "ArrowUp", atk: "Enter", chute: "Period", baixo: "ArrowDown" },
    '3': { esq: "KeyJ", dir: "KeyL", pulo: "KeyI", atk: "KeyH", chute: "KeyN", baixo: "KeyK" },
    '4': { esq: "Numpad4", dir: "Numpad6", pulo: "Numpad8", atk: "Numpad0", chute: "NumpadDecimal", baixo: "Numpad5" }
};

// Mapeamento para o sistema de teclas
const MAPEAMENTO_TECLAS = {
    'KeyA': 'a', 'KeyD': 'd', 'KeyW': 'w', 'KeyF': 'f', 'KeyC': 'c', 'KeyS': 's',
    'ArrowLeft': 'ArrowLeft', 'ArrowRight': 'ArrowRight', 'ArrowUp': 'ArrowUp', 
    'Enter': 'Enter', 'Period': '.', 'ArrowDown': 'ArrowDown',
    'KeyJ': 'j', 'KeyL': 'l', 'KeyI': 'i', 'KeyH': 'h', 'KeyN': 'n', 'KeyK': 'k',
    'Numpad4': 'Numpad4', 'Numpad6': 'Numpad6', 'Numpad8': 'Numpad8',
    'Numpad0': 'Numpad0', 'NumpadDecimal': 'NumpadDecimal', 'Numpad5': 'Numpad5'
};

// Inicializar jogo multiplayer (chamado pelo firebase-config.js)
window.inicializarJogoMultiplayer = function(nomeSala, playerNum, personagem) {
    console.log(`🎮 INICIANDO JOGO MULTIPLAYER`);
    console.log(`📍 Sala: ${nomeSala}`);
    console.log(`👤 Player: ${playerNum}`);
    console.log(`🎭 Personagem: ${personagem}`);
    
    salaAtualGame = nomeSala;
    meuPlayerIdGame = `p${playerNum}`;
    meuPersonagemGame = personagem;
    
    // Configurar controles do jogador local
    controlesPorPlayer[playerNum] = MAPEAMENTO_CONTROLES[playerNum];
    
    // Configurar jogador local
    const playerNumInt = parseInt(playerNum);
    const posicaoX = 150 + (playerNumInt - 1) * 200; // Distribuir na tela
    
    // Criar jogador local
    const jogador = criarPersonagem(
        personagem,
        posicaoX,
        MAPEAMENTO_CONTROLES[playerNum],
        playerNumInt <= 2 ? 1 : -1, // Direção inicial
        meuPlayerIdGame
    );
    
    // Armazenar no objeto de jogadores
    jogadores[meuPlayerIdGame] = {
        instancia: jogador,
        tipo: personagem,
        vivo: true,
        playerNum: playerNum,
        ativo: true // Flag indicando que é um jogador ativo na sala
    };
    
    // Atribuir ao jogador local
    switch(playerNum) {
        case '1': p1 = jogador; break;
        case '2': p2 = jogador; break;
        case '3': p3 = jogador; break;
        case '4': p4 = jogador; break;
    }
    
    jogadorLocal = jogador;
    
    console.log(`✓ Jogador local configurado: ${meuPlayerIdGame} (${personagem})`);
    
    // Iniciar loop do jogo
    iniciarLoopJogoMultiplayer();
};

// Atualizar jogadores do game (chamado pelo firebase-config.js) - AJUSTADO
window.atualizarJogadoresGame = function(jogadoresSala) {
    // console.log('🔄 Atualizando jogadores da sala:', Object.keys(jogadoresSala));
    
    // Primeiro: marcar todos os jogadores existentes como inativos
    for (const playerId in jogadores) {
        if (playerId !== meuPlayerIdGame) {
            // Marcar como inativo se não está mais na sala
            if (!jogadoresSala[playerId]) {
                if (jogadores[playerId] && jogadores[playerId].instancia) {
                    jogadores[playerId].instancia.vivo = false;
                    jogadores[playerId].instancia.vida = 0;
                    jogadores[playerId].ativo = false;
                }
            }
        }
    }
    
    // Segundo: processar jogadores na sala atual
    for (const [playerId, dados] of Object.entries(jogadoresSala)) {
        if (playerId === meuPlayerIdGame) {
            // Ignorar jogador local (já está configurado)
            jogadores[playerId].ativo = true;
            continue;
        }
        
        // Se jogador já existe e está ativo, atualizar dados
        if (jogadores[playerId] && jogadores[playerId].ativo) {
            const jogador = jogadores[playerId].instancia;
            
            // Atualizar dados básicos
            if (jogador) {
                jogador.vida = dados.vida || jogador.vida;
                jogador.vivo = dados.vivo !== undefined ? dados.vivo : jogador.vivo;
                jogadores[playerId].vivo = jogador.vivo;
                jogadores[playerId].ativo = true;
                
                // Atualizar posição se for diferente
                if (dados.x !== undefined && Math.abs(dados.x - jogador.x) > 5) {
                    jogador.x = dados.x;
                }
                if (dados.y !== undefined && Math.abs(dados.y - jogador.y) > 5) {
                    jogador.y = dados.y;
                }
                if (dados.dir !== undefined) {
                    jogador.dir = dados.dir;
                }
            }
        } else {
            // Criar novo jogador - APENAS se houver dados do personagem
            if (dados.personagem) {
                // console.log(`➕ Criando novo jogador: ${playerId} (${dados.personagem})`);
                
                const playerNum = playerId.charAt(1);
                const controles = MAPEAMENTO_CONTROLES[playerNum] || MAPEAMENTO_CONTROLES['1'];
                const direcao = parseInt(playerNum) <= 2 ? 1 : -1;
                const posicaoX = 150 + (parseInt(playerNum) - 1) * 200;
                
                const jogador = criarPersonagem(
                    dados.personagem || 'cocozin',
                    posicaoX,
                    controles,
                    direcao,
                    playerId
                );
                
                jogador.vida = dados.vida || 100;
                jogador.vivo = dados.vivo !== undefined ? dados.vivo : true;
                jogador.x = dados.x || posicaoX;
                jogador.y = dados.y || CHAO;
                jogador.dir = dados.dir || direcao;
                
                jogadores[playerId] = {
                    instancia: jogador,
                    tipo: dados.personagem || 'cocozin',
                    vivo: jogador.vivo,
                    playerNum: playerNum,
                    ativo: true
                };
                
                // Atribuir à variável global
                switch(playerNum) {
                    case '1': p1 = jogador; break;
                    case '2': p2 = jogador; break;
                    case '3': p3 = jogador; break;
                    case '4': p4 = jogador; break;
                }
            }
        }
    }
    
    // Terceiro: remover completamente jogadores que saíram (após um tempo)
    for (const playerId in jogadores) {
        if (playerId !== meuPlayerIdGame && !jogadoresSala[playerId] && jogadores[playerId] && !jogadores[playerId].ativo) {
            // Jogador inativo por muito tempo - remover completamente
            delete jogadores[playerId];
            
            // Limpar variável global
            const playerNum = playerId.charAt(1);
            switch(playerNum) {
                case '1': p1 = null; break;
                case '2': p2 = null; break;
                case '3': p3 = null; break;
                case '4': p4 = null; break;
            }
        }
    }
};

// Sincronizar dados do jogo (chamado pelo firebase-config.js)
window.sincronizarDadosJogo = function(dadosJogo) {
    // console.log('📡 Dados do jogo sincronizados:', dadosJogo);
};

// ============================================
// LOOP DO JOGO MULTIPLAYER - AJUSTADO
// ============================================

function iniciarLoopJogoMultiplayer() {
    console.log('🎬 Iniciando loop do jogo multiplayer...');
    
    // Iniciar o loop
    if (fundo.complete) {
        setTimeout(() => {
            loopMultiplayer();
        }, 1000); // Pequeno delay para carregar tudo
    } else {
        fundo.onload = () => {
            setTimeout(() => {
                loopMultiplayer();
            }, 1000);
        };
    }
}

// Loop principal multiplayer - SIMPLIFICADO
function loopMultiplayer() {
    if (!jogadorLocal || !salaAtualGame) {
        // Aguarda inicialização
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

    // Desenha barras de vida (atualizada para jogadores ativos)
    barrasMultiplayer();

    // Verificar se há algum outro jogador vivo
    let outrosJogadoresVivos = 0;
    for (const playerId in jogadores) {
        if (playerId !== meuPlayerIdGame && 
            jogadores[playerId] && 
            jogadores[playerId].instancia && 
            jogadores[playerId].instancia.vivo) {
            outrosJogadoresVivos++;
        }
    }
    
    // Só termina o jogo se houver pelo menos 2 jogadores e apenas 1 sobreviver
    const totalJogadoresAtivos = Object.keys(jogadores).filter(id => jogadores[id].ativo).length;
    
    if (totalJogadoresAtivos > 1 && outrosJogadoresVivos === 0 && !jogoTerminou) {
        jogoTerminou = true;
        console.log('⚡ JOGO TERMINADO! Você venceu!');
    }
    
    // Controles funcionam sempre
    if (jogadorLocal.vivo && !jogoTerminou) {
        // O fighter.js agora lida diretamente com as teclas
        // Não precisa mais converter
        
        // DEBUG: Verificar teclas
        console.log('Keys:', keys);
        
        // Atualizar jogador local
        jogadorLocal.mover(keys);
        jogadorLocal.pular(keys);
        
        // Atacar todos os outros jogadores vivos
        for (const playerId in jogadores) {
            if (playerId !== meuPlayerIdGame) {
                const inimigo = jogadores[playerId]?.instancia;
                if (inimigo && inimigo.vivo) {
                    jogadorLocal.atacar(keys, inimigo);
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
        
        // Enviar dados do jogador local para Firebase
        enviarDadosJogadorMultiplayer();
    }
    
    // Desenhar todos os jogadores ATIVOS
    for (let i = 1; i <= 4; i++) {
        const jogador = jogadores[`p${i}`]?.instancia;
        if (jogador && jogadores[`p${i}`]?.ativo) {
            jogador.desenhar();
        }
    }
    
    // Se o jogo terminou, mostra tela de fim
    if (jogoTerminou) {
        desenharTelaFimMultiplayer();
        
        // Sistema de reinício
        if (keys["r"] || keys["R"]) {
            console.log('🔄 Reiniciando jogo multiplayer...');
            reiniciarJogoMultiplayer();
        }
    }

    requestAnimationFrame(loopMultiplayer);
}

// ============================================
// FUNÇÕES DE SINCRONIZAÇÃO
// ============================================

function enviarDadosJogadorMultiplayer() {
    if (!salaAtualGame || !meuPlayerIdGame || !jogadorLocal) return;
    
    const dados = {
        x: jogadorLocal.x,
        y: jogadorLocal.y,
        vida: jogadorLocal.vida,
        dir: jogadorLocal.dir,
        atacando: jogadorLocal.atacando,
        chutando: jogadorLocal.chutando,
        abaixado: jogadorLocal.abaixado,
        deslizando: jogadorLocal.deslizando,
        vivo: jogadorLocal.vivo,
        pulando: jogadorLocal.pulando,
        olhosAbertos: jogadorLocal.olhosAbertos,
        descendoRapido: jogadorLocal.descendoRapido,
        tipo: jogadorLocal.tipo
    };
    
    // Enviar via Firebase (usando função do firebase-config.js)
    if (window.firebaseSala && window.firebaseSala.enviarDadosJogador) {
        window.firebaseSala.enviarDadosJogador(dados);
    }
}

// ============================================
// FUNÇÕES DE UI PARA MULTIPLAYER - AJUSTADO
// ============================================

function barrasMultiplayer() {
    // Desenhar barras de vida apenas para jogadores ATIVOS
    const posicoes = [
        { x: 50, player: 'p1' },
        { x: 650, player: 'p2' },
        { x: 50, y: 60, player: 'p3' },
        { x: 650, y: 60, player: 'p4' }
    ];
    
    let jogadoresDesenhados = 0;
    
    for (let i = 0; i < posicoes.length; i++) {
        const pos = posicoes[i];
        const playerId = pos.player;
        
        // Verificar se jogador existe e está ativo
        if (!jogadores[playerId] || !jogadores[playerId].ativo) {
            continue;
        }
        
        const jogador = jogadores[playerId].instancia;
        if (!jogador) continue;
        
        const y = pos.y || 20;
        
        // Barra de vida
        ctx.fillStyle = "#333";
        ctx.fillRect(pos.x, y, 200, 20);
        
        // Cor da barra baseada no personagem
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
        
        // Ícone do personagem
        ctx.font = "20px Arial";
        const iconX = pos.x === 50 ? 20 : 830;
        const iconY = y + 10;
        
        if (jogador.tipo === "cocozin") {
            ctx.fillText("💩", iconX, iconY);
        } else if (jogador.tipo === "ratazana") {
            ctx.fillText("🐀", iconX, iconY);
        } else if (jogador.tipo === "peidovélio") {
            ctx.fillText("💨", iconX, iconY);
        }
        
        jogadoresDesenhados++;
    }
    
    // Se só tem um jogador, mostra mensagem
    if (jogadoresDesenhados === 1) {
        ctx.fillStyle = "yellow";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Aguardando outros jogadores... (Modo Treino)", 450, 380);
        ctx.textAlign = "left";
    }
    
    // Instrução de reinício
    if (jogoTerminou) {
        ctx.font = "16px Arial";
        ctx.fillStyle = "yellow";
        ctx.textAlign = "center";
        ctx.fillText("Pressione R para jogar novamente", 450, 380);
        ctx.textAlign = "left";
    }
}

function desenharTelaFimMultiplayer() {
    if (!jogadorLocal) return;
    
    // Encontrar vencedor
    let vencedor = null;
    let vencedorId = null;
    
    for (const playerId in jogadores) {
        const jogador = jogadores[playerId]?.instancia;
        if (jogador && jogador.vivo && jogadores[playerId]?.ativo) {
            vencedor = jogador;
            vencedorId = playerId;
            break;
        }
    }
    
    if (!vencedor) return;
    
    // Overlay semi-transparente
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Texto do vencedor
    ctx.fillStyle = "white";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    
    ctx.fillText(`${vencedorId.toUpperCase()} VENCEU! 👑`, canvas.width / 2, 150);
    
    // Ícone do personagem vencedor
    ctx.font = "48px Arial";
    if (vencedor.tipo === "cocozin") {
        ctx.fillText("💩", canvas.width / 2, 200);
    } else if (vencedor.tipo === "ratazana") {
        ctx.fillText("🐀", canvas.width / 2, 200);
    } else if (vencedor.tipo === "peidovélio") {
        ctx.fillText("💨", canvas.width / 2, 200);
    }
    
    // Nome do personagem vencedor
    ctx.font = "24px Arial";
    ctx.fillText(vencedor.tipo.toUpperCase(), canvas.width / 2, 240);
    
    // Estatísticas
    ctx.font = "18px Arial";
    ctx.fillText("ESTATÍSTICAS DA PARTIDA:", canvas.width / 2, 280);
    
    let y = 310;
    for (const playerId in jogadores) {
        const jogador = jogadores[playerId]?.instancia;
        if (jogador && jogadores[playerId]?.ativo) {
            ctx.fillText(
                `${playerId}: ${jogador.tipo} - ${jogador.vivo ? "VIVO" : "DERROTADO"} (${jogador.vida} HP)`, 
                canvas.width / 2, 
                y
            );
            y += 30;
        }
    }
    
    // Instrução para reiniciar
    ctx.font = "20px Arial";
    ctx.fillText("Pressione R para jogar novamente", canvas.width / 2, y + 20);
}

// ============================================
// FUNÇÃO DE REINÍCIO MULTIPLAYER
// ============================================

function reiniciarJogoMultiplayer() {
    if (!salaAtualGame) return;
    
    console.log('🔄 Reiniciando jogo multiplayer...');
    
    // Reiniciar todos os jogadores ativos
    for (const playerId in jogadores) {
        if (jogadores[playerId]?.ativo) {
            const jogador = jogadores[playerId].instancia;
            if (jogador) {
                const playerNum = playerId.charAt(1);
                const posicaoX = 150 + (parseInt(playerNum) - 1) * 200;
                
                jogador.x = posicaoX;
                jogador.y = CHAO;
                jogador.vida = 100;
                jogador.vivo = true;
                jogador.atacando = false;
                jogador.chutando = false;
                jogador.abaixado = false;
                jogador.deslizando = false;
                jogador.pulando = false;
                jogador.cocosAtivos = [];
                jogador.cdPoder = 0;
                jogador.cargaPoder = 0;
            }
        }
    }
    
    jogoTerminou = false;
    
    // Enviar estado inicial para Firebase
    enviarDadosJogadorMultiplayer();
}

// ============================================
// INICIALIZAÇÃO
// ============================================

console.log('🎮 game.js multiplayer carregado');
console.log('✅ Aguardando criação/entrada em sala...');


