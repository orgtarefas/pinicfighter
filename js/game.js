// ============================================
// SISTEMA MULTIPLAYER DE SALAS
// ============================================

// Variáveis globais para multiplayer
let salaAtualGame = null;
let meuPlayerIdGame = null;
let meuPersonagemGame = null;
let jogadores = {}; // { p1: {tipo, x, y, vida, vivo}, p2: {...}, p3: {...}, p4: {...} }
let controlesPorPlayer = {};
let p1, p2, p3, p4; // Agora temos 4 jogadores possíveis
let jogadorLocal = null;

// Mapeamento de controles por player
const MAPEAMENTO_CONTROLES = {
    '1': { esq: "a", dir: "d", pulo: "w", atk: "f", chute: "c", baixo: "s" },
    '2': { esq: "ArrowLeft", dir: "ArrowRight", pulo: "ArrowUp", atk: "Enter", chute: ".", baixo: "ArrowDown" },
    '3': { esq: "j", dir: "l", pulo: "i", atk: "h", chute: "n", baixo: "k" },
    '4': { esq: "Numpad4", dir: "Numpad6", pulo: "Numpad8", atk: "Numpad0", chute: "NumpadDecimal", baixo: "Numpad5" }
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
    
    // Inicializar todos os jogadores como vazios inicialmente
    inicializarTodosJogadores();
    
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
        playerNum: playerNum
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

// Atualizar jogadores do game (chamado pelo firebase-config.js)
window.atualizarJogadoresGame = function(jogadoresSala) {
    console.log('🔄 Atualizando jogadores da sala:', Object.keys(jogadoresSala));
    
    for (const [playerId, dados] of Object.entries(jogadoresSala)) {
        if (playerId === meuPlayerIdGame) {
            // Ignorar jogador local (já está configurado)
            continue;
        }
        
        // Se jogador já existe, atualizar dados
        if (jogadores[playerId]) {
            const jogador = jogadores[playerId].instancia;
            
            // Atualizar dados do personagem se mudou
            if (dados.personagem && dados.personagem !== jogador.tipo) {
                console.log(`🎭 ${playerId} mudou para ${dados.personagem}`);
                
                // Recriar personagem
                const playerNum = playerId.charAt(1);
                const controles = MAPEAMENTO_CONTROLES[playerNum] || MAPEAMENTO_CONTROLES['1'];
                const direcao = parseInt(playerNum) <= 2 ? 1 : -1;
                const posicaoX = 150 + (parseInt(playerNum) - 1) * 200;
                
                const novoJogador = criarPersonagem(
                    dados.personagem,
                    posicaoX,
                    controles,
                    direcao,
                    playerId
                );
                
                // Copiar estado atual
                novoJogador.x = jogador.x;
                novoJogador.y = jogador.y;
                novoJogador.vida = dados.vida || jogador.vida;
                novoJogador.vivo = dados.vivo !== undefined ? dados.vivo : jogador.vivo;
                
                // Substituir instância
                jogadores[playerId].instancia = novoJogador;
                jogadores[playerId].tipo = dados.personagem;
                
                // Atualizar variável global
                switch(playerNum) {
                    case '1': p1 = novoJogador; break;
                    case '2': p2 = novoJogador; break;
                    case '3': p3 = novoJogador; break;
                    case '4': p4 = novoJogador; break;
                }
            } else {
                // Apenas atualizar dados básicos
                jogador.vida = dados.vida || jogador.vida;
                jogador.vivo = dados.vivo !== undefined ? dados.vivo : jogador.vivo;
                jogadores[playerId].vivo = jogador.vivo;
            }
        } else {
            // Criar novo jogador
            console.log(`➕ Criando novo jogador: ${playerId} (${dados.personagem || 'cocozin'})`);
            
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
            
            jogadores[playerId] = {
                instancia: jogador,
                tipo: dados.personagem || 'cocozin',
                vivo: jogador.vivo,
                playerNum: playerNum
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
    
    // Remover jogadores que saíram da sala
    for (const playerId in jogadores) {
        if (playerId !== meuPlayerIdGame && !jogadoresSala[playerId]) {
            console.log(`➖ Removendo jogador: ${playerId}`);
            
            // Marcar como morto/removido
            const jogador = jogadores[playerId].instancia;
            if (jogador) {
                jogador.vivo = false;
                jogador.vida = 0;
            }
            
            // Não remover completamente, apenas marcar como inativo
            // para evitar problemas de referência
        }
    }
};

// Sincronizar dados do jogo (chamado pelo firebase-config.js)
window.sincronizarDadosJogo = function(dadosJogo) {
    // Implementar sincronização de estado do jogo se necessário
    // Por exemplo: tempo restante, power-ups, etc.
    console.log('📡 Dados do jogo sincronizados:', dadosJogo);
};

// ============================================
// INICIALIZAÇÃO DOS JOGADORES
// ============================================

function inicializarTodosJogadores() {
    // Inicializar todos os 4 jogadores como personagens vazios
    for (let i = 1; i <= 4; i++) {
        const playerId = `p${i}`;
        const controles = MAPEAMENTO_CONTROLES[i] || MAPEAMENTO_CONTROLES['1'];
        const direcao = i <= 2 ? 1 : -1;
        const posicaoX = 150 + (i - 1) * 200;
        
        // Criar personagem placeholder
        const jogador = criarPersonagem(
            'cocozin',
            posicaoX,
            controles,
            direcao,
            playerId
        );
        
        jogador.vivo = false; // Inicialmente não está ativo
        jogador.vida = 0;
        
        jogadores[playerId] = {
            instancia: jogador,
            tipo: 'cocozin',
            vivo: false,
            playerNum: i.toString()
        };
        
        // Atribuir às variáveis globais
        switch(i) {
            case 1: p1 = jogador; break;
            case 2: p2 = jogador; break;
            case 3: p3 = jogador; break;
            case 4: p4 = jogador; break;
        }
    }
}

// ============================================
// LOOP DO JOGO MULTIPLAYER
// ============================================

function iniciarLoopJogoMultiplayer() {
    console.log('🎬 Iniciando loop do jogo multiplayer...');
    
    // Configurar listeners do Firebase para esta sala
    configurarFirebaseMultiplayer();
    
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

function configurarFirebaseMultiplayer() {
    if (!salaAtualGame || !meuPlayerIdGame) {
        console.error('Não é possível configurar Firebase: sala ou player não definidos');
        return;
    }
    
    console.log('🔗 Configurando Firebase para multiplayer...');
    
    // Escutar atualizações dos outros jogadores
    for (let i = 1; i <= 4; i++) {
        const playerId = `p${i}`;
        
        if (playerId === meuPlayerIdGame) continue;
        
        // Configurar listener para cada jogador
        // (Isso será implementado com o sistema de salas do firebase-config.js)
    }
}

// Loop principal multiplayer
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

    // Desenha barras de vida (atualizada para 4 jogadores)
    barrasMultiplayer();

    // Verificar se o jogo terminou (todos os outros jogadores mortos)
    let jogadoresVivos = 0;
    for (const playerId in jogadores) {
        if (jogadores[playerId].instancia && jogadores[playerId].instancia.vivo) {
            jogadoresVivos++;
        }
    }
    
    if (jogadoresVivos <= 1 && !jogoTerminou) {
        jogoTerminou = true;
        console.log('⚡ JOGO TERMINADO!');
        
        // Determinar vencedor
        let vencedor = null;
        for (const playerId in jogadores) {
            if (jogadores[playerId].instancia && jogadores[playerId].instancia.vivo) {
                vencedor = playerId;
                break;
            }
        }
        
        console.log(`🏆 Vencedor: ${vencedor || 'Ninguém'}`);
    }
    
    // Controles só funcionam se o jogo não terminou
    if (!jogoTerminou && jogadorLocal.vivo) {
        // Atualizar jogador local
        jogadorLocal.mover(keys);
        jogadorLocal.pular(keys);
        
        // Atacar todos os outros jogadores vivos
        for (const playerId in jogadores) {
            if (playerId !== meuPlayerIdGame) {
                const inimigo = jogadores[playerId].instancia;
                if (inimigo && inimigo.vivo) {
                    jogadorLocal.atacar(keys, inimigo);
                }
            }
        }
        
        jogadorLocal.fisica();
        
        // Atualizar cocôs ativos do jogador local
        for (const playerId in jogadores) {
            if (playerId !== meuPlayerIdGame) {
                const inimigo = jogadores[playerId].instancia;
                if (inimigo) {
                    jogadorLocal.atualizarCocos(inimigo);
                }
            }
        }
        
        // Atualizar cocôs ativos de todos os inimigos
        for (const playerId in jogadores) {
            if (playerId !== meuPlayerIdGame) {
                const jogador = jogadores[playerId].instancia;
                if (jogador && jogador.vivo) {
                    jogador.atualizarCocos(jogadorLocal);
                    jogador.fisica();
                }
            }
        }
        
        // Enviar dados do jogador local para Firebase
        enviarDadosJogadorMultiplayer();
    }
    
    // Desenhar todos os jogadores
    for (let i = 1; i <= 4; i++) {
        const jogador = jogadores[`p${i}`]?.instancia;
        if (jogador) {
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
        sapatoX: jogadorLocal.sapatoX,
        sapatoY: jogadorLocal.sapatoY,
        olhosAbertos: jogadorLocal.olhosAbertos,
        descendoRapido: jogadorLocal.descendoRapido,
        cdPoder: jogadorLocal.cdPoder,
        cargaPoder: jogadorLocal.cargaPoder,
        tipo: jogadorLocal.tipo
    };
    
    // Enviar via Firebase (usando função do firebase-config.js)
    if (window.firebaseSala && window.firebaseSala.enviarDadosJogador) {
        window.firebaseSala.enviarDadosJogador(dados);
    }
}

// ============================================
// FUNÇÕES DE UI PARA MULTIPLAYER
// ============================================

function barrasMultiplayer() {
    // Desenhar barras de vida para até 4 jogadores
    const posicoes = [
        { x: 50, player: 'p1' },
        { x: 650, player: 'p2' },
        { x: 50, y: 60, player: 'p3' },
        { x: 650, y: 60, player: 'p4' }
    ];
    
    for (let i = 0; i < posicoes.length; i++) {
        const pos = posicoes[i];
        const playerId = pos.player;
        const jogador = jogadores[playerId]?.instancia;
        
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
        if (jogador && jogador.vivo) {
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
        if (jogador) {
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
    
    // Reiniciar todos os jogadores
    for (const playerId in jogadores) {
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
    
    jogoTerminou = false;
    
    // Enviar estado inicial para Firebase
    enviarDadosJogadorMultiplayer();
}

// ============================================
// INICIALIZAÇÃO
// ============================================

console.log('🎮 game.js multiplayer carregado');
console.log('✅ Aguardando criação/entrada em sala...');
