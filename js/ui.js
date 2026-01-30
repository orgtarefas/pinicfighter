// ============================================
// UI.JS - ATUALIZADO PARA SISTEMA MULTIPLAYER
// ============================================

// Função para excluir sala no Firebase
window.excluirSalaFirebase = function(nomeSala) {
    if (!nomeSala || typeof firebase === 'undefined') {
        return Promise.reject('Firebase não configurado ou nome de sala inválido');
    }
    
    return new Promise((resolve, reject) => {
        try {
            const db = firebase.database();
            const salaRef = db.ref(`salas/${nomeSala}`);
            
            // Primeiro notificar todos os jogadores
            const jogadoresRef = salaRef.child('jogadores');
            jogadoresRef.once('value').then((snapshot) => {
                const jogadores = snapshot.val() || {};
                
                // Enviar notificação para cada jogador
                Object.keys(jogadores).forEach(jogadorId => {
                    const notificacaoRef = db.ref(`salas/${nomeSala}/notificacoes/${jogadorId}`);
                    notificacaoRef.set({
                        tipo: 'sala_excluida',
                        mensagem: 'O criador excluiu a sala',
                        timestamp: Date.now()
                    });
                });
                
                // Depois remover a sala
                salaRef.remove()
                    .then(() => {
                        console.log('✅ Sala excluída do Firebase');
                        resolve(true);
                    })
                    .catch(error => {
                        console.error('❌ Erro ao excluir sala:', error);
                        reject(error);
                    });
            }).catch(error => {
                console.error('❌ Erro ao buscar jogadores:', error);
                salaRef.remove()
                    .then(() => resolve(true))
                    .catch(err => reject(err));
            });
            
        } catch (error) {
            console.error('❌ Erro ao excluir sala:', error);
            reject(error);
        }
    });
};

// Variáveis globais para UI
let p1 = null, p2 = null;
let jogoTerminou = false;
let salaAtualGame = '';
let jogadores = {};

// ============================================
// SISTEMA DE BARRAS DE VIDA MULTIPLAYER
// ============================================

function barras() {
    // Verifica se estamos em modo multiplayer
    if (salaAtualGame) {
        // Usar sistema de barras multiplayer
        barrasMultiplayer();
        return;
    }
    
    // Fallback para modo single player
    if (!p1 || !p2) {
        // Fallback se jogadores não estiverem inicializados
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Carregando jogadores...", 450, 200);
        return;
    }
    
    // Barra de vida P1
    ctx.fillStyle = "#333";
    ctx.fillRect(50, 20, 200, 25);
    
    // Cor da barra baseada no personagem
    let corBarraP1;
    if (p1.tipo === "cocozin") {
        corBarraP1 = "cyan";
    } else if (p1.tipo === "ratazana") {
        corBarraP1 = "#8B0000"; // Vermelho escuro
    } else if (p1.tipo === "peidovélio") {
        corBarraP1 = "#808080"; // Cinza
    } else {
        corBarraP1 = p1.corSapato || "#8B7355";
    }
    
    ctx.fillStyle = corBarraP1;
    ctx.fillRect(50, 20, p1.vida * 2, 25);
    
    // Barra de vida P2
    ctx.fillStyle = "#333";
    ctx.fillRect(650, 20, 200, 25);
    
    // Cor da barra baseada no personagem
    let corBarraP2;
    if (p2.tipo === "cocozin") {
        corBarraP2 = "red";
    } else if (p2.tipo === "ratazana") {
        corBarraP2 = "#8B0000"; // Vermelho escuro
    } else if (p2.tipo === "peidovélio") {
        corBarraP2 = "#808080"; // Cinza
    } else {
        corBarraP2 = p2.corSapato || "#8B7355";
    }
    
    ctx.fillStyle = corBarraP2;
    ctx.fillRect(650, 20, p2.vida * 2, 25);
    
    // Nome do personagem e vida
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    
    // Formata o nome do personagem
    function formatarNome(tipo) {
        if (tipo === "cocozin") return "COCOZIN";
        if (tipo === "ratazana") return "RATAZANA";
        if (tipo === "peidovélio") return "PEIDOVÉLIO";
        return tipo.toUpperCase();
    }
    
    ctx.fillText(`${formatarNome(p1.tipo)}: ${Math.max(0, p1.vida)}`, 50, 50);
    ctx.fillText(`${formatarNome(p2.tipo)}: ${Math.max(0, p2.vida)}`, 650, 50);
    
    // Controles
    ctx.font = "12px Arial";
    ctx.fillText("Soco: F | Chute: C | Abaixar: S | Deslizar: S+C", 50, 70);
    ctx.fillText("Soco: Enter | Chute: . | Abaixar: ↓ | Deslizar: ↓+.", 650, 70);
    
    // Instruções especiais por personagem
    ctx.font = "11px Arial";
    let especialP1 = "";
    if (p1.tipo === "cocozin") {
        especialP1 = "Poder: Pular + Baixo = Bomba de Cocô!";
    } else if (p1.tipo === "ratazana") {
        especialP1 = "Especial: Soco poderoso!";
    } else if (p1.tipo === "peidovélio") {
        especialP1 = "Especial: Ataque envenena!";
    }
    
    let especialP2 = "";
    if (p2.tipo === "cocozin") {
        especialP2 = "Poder: Pular + Baixo = Bomba de Cocô!";
    } else if (p2.tipo === "ratazana") {
        especialP2 = "Especial: Soco poderoso!";
    } else if (p2.tipo === "peidovélio") {
        especialP2 = "Especial: Ataque envenena!";
    }
    
    ctx.fillText(especialP1, 50, 85);
    ctx.fillText(especialP2, 650, 85);
    
    // Instrução de reinício quando jogo terminar
    if (jogoTerminou) {
        ctx.font = "14px Arial";
        ctx.fillStyle = "yellow";
        ctx.textAlign = "center";
        ctx.fillText("Pressione R para jogar novamente", 450, 380);
        ctx.textAlign = "left";
    }
    
    // Bordas das barras
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 20, 200, 25);
    ctx.strokeRect(650, 20, 200, 25);
    
    // Desenha ícone do personagem
    ctx.font = "24px Arial";
    if (p1.tipo === "cocozin") {
        ctx.fillText("💩", 20, 40);
    } else if (p1.tipo === "ratazana") {
        ctx.fillText("🐀", 20, 40);
    } else if (p1.tipo === "peidovélio") {
        ctx.fillText("💨", 20, 40);
    }
    
    if (p2.tipo === "cocozin") {
        ctx.fillText("💩", 860, 40);
    } else if (p2.tipo === "ratazana") {
        ctx.fillText("🐀", 860, 40);
    } else if (p2.tipo === "peidovélio") {
        ctx.fillText("💨", 860, 40);
    }
}

// Sistema de barras para multiplayer (até 4 jogadores)
function barrasMultiplayer() {
    if (!jogadores || Object.keys(jogadores).length === 0) {
        // Desenhar mensagem de espera
        desenharMensagemEspera();
        return;
    }
    
    // Configurações das posições das barras
    const posicoes = {
        'p1': { x: 50, y: 20, cor: '#00ff00', nome: 'P1' },
        'p2': { x: 650, y: 20, cor: '#ff0000', nome: 'P2' },
        'p3': { x: 50, y: 100, cor: '#ffff00', nome: 'P3' },
        'p4': { x: 650, y: 100, cor: '#ff00ff', nome: 'P4' }
    };
    
    // Desenhar barras para cada jogador
    Object.keys(jogadores).forEach(jogadorId => {
        const jogador = jogadores[jogadorId];
        if (!jogador || !jogador.ativo) return;
        
        const pos = posicoes[jogadorId] || { x: 50, y: 20, cor: '#ffffff', nome: jogadorId };
        
        // Barra de fundo
        ctx.fillStyle = "#333";
        ctx.fillRect(pos.x, pos.y, 200, 25);
        
        // Barra de vida
        const vidaPercent = (jogador.vida || 100) / 100;
        ctx.fillStyle = pos.cor;
        ctx.fillRect(pos.x, pos.y, 200 * vidaPercent, 25);
        
        // Borda da barra
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(pos.x, pos.y, 200, 25);
        
        // Nome e vida
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";
        const nomeFormatado = jogador.tipo ? jogador.tipo.toUpperCase() : jogadorId.toUpperCase();
        ctx.fillText(`${pos.nome}: ${nomeFormatado}`, pos.x, pos.y - 5);
        ctx.fillText(`${Math.max(0, jogador.vida || 100)} HP`, pos.x + 150, pos.y + 40);
        
        // Ícone do personagem
        ctx.font = "20px Arial";
        const icon = getIconePersonagem(jogador.tipo);
        ctx.fillText(icon, pos.x - 25, pos.y + 20);
        
        // Desenhar controles específicos se for o jogador local
        if (jogadorId === jogadorLocalId) {
            desenharControlesPlayer(jogadorId.charAt(1)); // Extrai o número do ID
            desenharInstrucoesEspeciais(jogador.tipo, jogadorId.charAt(1));
        }
    });
    
    // Desenhar status da sala
    desenharStatusSala();
    
    // Instrução para sair
    desenharInstrucaoSair();
}

// ============================================
// TELA DE FIM DE JOGO
// ============================================

function desenharTelaFim() {
    // Verifica se estamos em modo multiplayer
    if (salaAtualGame) {
        // Usar sistema de fim de jogo multiplayer
        desenharTelaFimMultiplayer();
        return;
    }
    
    // Fallback para modo single player
    if (!p1 || !p2) return;
    
    // Overlay semi-transparente
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Texto do vencedor
    ctx.fillStyle = "white";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    
    const vencedor = p1.vivo ? "PLAYER 1 VENCEU! 👑" : "PLAYER 2 VENCEU! 👑";
    const personagemVencedor = p1.vivo ? p1.tipo : p2.tipo;
    
    ctx.fillText(vencedor, canvas.width / 2, 150);
    
    // Ícone do personagem vencedor
    ctx.font = "48px Arial";
    if (personagemVencedor === "cocozin") {
        ctx.fillText("💩", canvas.width / 2, 200);
    } else if (personagemVencedor === "ratazana") {
        ctx.fillText("🐀", canvas.width / 2, 200);
    } else if (personagemVencedor === "peidovélio") {
        ctx.fillText("💨", canvas.width / 2, 200);
    }
    
    // Nome do personagem vencedor
    ctx.font = "24px Arial";
    ctx.fillText(personagemVencedor.toUpperCase(), canvas.width / 2, 240);
    
    // Instrução para reiniciar
    ctx.font = "20px Arial";
    ctx.fillText("Pressione R para jogar novamente", canvas.width / 2, 280);
    
    ctx.font = "16px Arial";
    ctx.fillText("Ambos os jogadores precisam pressionar R", canvas.width / 2, 310);
    
    // Estatísticas
    ctx.font = "14px Arial";
    ctx.fillText(`Jogador 1: ${p1.tipo} - ${p1.vivo ? "VIVO" : "DERROTADO"} (${p1.vida} HP)`, canvas.width / 2, 340);
    ctx.fillText(`Jogador 2: ${p2.tipo} - ${p2.vivo ? "VIVO" : "DERROTADO"} (${p2.vida} HP)`, canvas.width / 2, 360);
}

// Tela de fim de jogo para multiplayer
function desenharTelaFimMultiplayer() {
    if (!jogadores || Object.keys(jogadores).length === 0) return;
    
    // Overlay semi-transparente
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Determinar vencedor
    let vencedor = null;
    let maiorVida = -1;
    
    Object.keys(jogadores).forEach(jogadorId => {
        const jogador = jogadores[jogadorId];
        if (jogador && jogador.ativo && jogador.vida > maiorVida) {
            maiorVida = jogador.vida;
            vencedor = { id: jogadorId, ...jogador };
        }
    });
    
    // Texto do vencedor
    ctx.fillStyle = "white";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    
    if (vencedor) {
        ctx.fillText(`${vencedor.id.toUpperCase()} VENCEU! 👑`, canvas.width / 2, 150);
        
        // Ícone do personagem vencedor
        ctx.font = "48px Arial";
        const icon = getIconePersonagem(vencedor.tipo);
        ctx.fillText(icon, canvas.width / 2, 200);
        
        // Nome do personagem vencedor
        ctx.font = "24px Arial";
        ctx.fillText(vencedor.tipo ? vencedor.tipo.toUpperCase() : "JOGADOR", canvas.width / 2, 240);
        
        // Vida restante
        ctx.fillText(`Vida: ${vencedor.vida} HP`, canvas.width / 2, 270);
    } else {
        ctx.fillText("EMPATE! 🤝", canvas.width / 2, 200);
    }
    
    // Instrução para continuar
    ctx.font = "20px Arial";
    ctx.fillText("A partida será reiniciada em 5 segundos...", canvas.width / 2, 320);
    
    // Estatísticas de todos os jogadores
    ctx.font = "16px Arial";
    let yPos = 350;
    
    Object.keys(jogadores).forEach(jogadorId => {
        const jogador = jogadores[jogadorId];
        if (jogador) {
            const status = jogador.ativo ? "VIVO" : "DERROTADO";
            const texto = `${jogadorId}: ${jogador.tipo || "Desconhecido"} - ${status} (${jogador.vida || 0} HP)`;
            ctx.fillText(texto, canvas.width / 2, yPos);
            yPos += 25;
        }
    });
}

// ============================================
// FUNÇÕES AUXILIARES PARA O MULTIPLAYER
// ============================================

// Função para obter ícone do personagem
function getIconePersonagem(tipo) {
    switch(tipo) {
        case 'cocozin': return '💩';
        case 'ratazana': return '🐀';
        case 'peidovélio': return '💨';
        default: return '👤';
    }
}

// Função para desenhar controles específicos do player
function desenharControlesPlayer(playerNum) {
    const controles = {
        '1': {
            mover: "A / D",
            pular: "W",
            soco: "F",
            chute: "C",
            abaixar: "S",
            deslizar: "S + C",
            especial1: "V",
            especial2: "B",
            bloquear: "Shift"
        },
        '2': {
            mover: "← / →",
            pular: "↑",
            soco: "Enter",
            chute: ".",
            abaixar: "↓",
            deslizar: "↓ + .",
            especial1: "/",
            especial2: ";",
            bloquear: "Ctrl"
        },
        '3': {
            mover: "J / L",
            pular: "I",
            soco: "H",
            chute: "N",
            abaixar: "K",
            deslizar: "K + N",
            especial1: "M",
            especial2: ",",
            bloquear: "Space"
        },
        '4': {
            mover: "NUM4 / NUM6",
            pular: "NUM8",
            soco: "NUM0",
            chute: "NUM.",
            abaixar: "NUM5",
            deslizar: "NUM5 + NUM.",
            especial1: "NUM+",
            especial2: "NUM-",
            bloquear: "Enter"
        }
    };
    
    const ctrl = controles[playerNum] || controles['1'];
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "11px Arial";
    ctx.textAlign = "left";
    
    const posicoes = {
        '1': { x: 50, y: 55 },
        '2': { x: 650, y: 55 },
        '3': { x: 50, y: 135 },
        '4': { x: 650, y: 135 }
    };
    
    const pos = posicoes[playerNum];
    if (!pos) return;
    
    // Desenhar controles básicos
    ctx.fillText(`Mover: ${ctrl.mover} | Pular: ${ctrl.pular}`, pos.x, pos.y);
    ctx.fillText(`Soco: ${ctrl.soco} | Chute: ${ctrl.chute}`, pos.x, pos.y + 12);
    ctx.fillText(`Abaixar: ${ctrl.abaixar} | Bloquear: ${ctrl.bloquear}`, pos.x, pos.y + 24);
    
    // Desenhar controles especiais
    ctx.fillStyle = "#ffff00";
    ctx.fillText(`Especial 1: ${ctrl.especial1} | Especial 2: ${ctrl.especial2}`, pos.x, pos.y + 36);
}

// Função para desenhar instruções especiais por personagem
function desenharInstrucoesEspeciais(tipo, playerNum) {
    const especial = {
        'cocozin': "💩 BOMBA DE COCÔ: Pular + Abaixar (no ar)",
        'ratazana': "🐀 MORDIDA: Abaixar + Soco | 🌀 CAUDA: Abaixar + Chute",
        'peidovélio': "☁️ NUVEM: Abaixar + Soco | 🌪️ TORNADO: Pular+Abaixar+Chute"
    };
    
    const posicoes = {
        '1': { x: 50, y: 95 },
        '2': { x: 650, y: 95 },
        '3': { x: 50, y: 175 },
        '4': { x: 650, y: 175 }
    };
    
    const pos = posicoes[playerNum];
    if (!pos) return;
    
    ctx.fillStyle = "#00ff00";
    ctx.font = "10px Arial";
    ctx.fillText(especial[tipo] || "ESPECIAL: Consulte o menu de seleção", pos.x, pos.y);
}

// Função para desenhar status da sala
function desenharStatusSala() {
    if (!salaAtualGame) return;
    
    // Fundo para o status
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(350, 10, 200, 80);
    
    // Nome da sala
    ctx.fillStyle = "#0f0";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`SALA: ${salaAtualGame}`, 450, 30);
    
    // Contar jogadores ativos
    let jogadoresAtivos = 0;
    for (const playerId in jogadores) {
        if (jogadores[playerId] && jogadores[playerId].ativo) {
            jogadoresAtivos++;
        }
    }
    
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(`Jogadores: ${jogadoresAtivos}/4`, 450, 50);
    
    // Indicador de dono da sala
    if (window.playerAtual === '1') {
        ctx.fillStyle = "yellow";
        ctx.font = "11px Arial";
        ctx.fillText("👑 VOCÊ É O DONO DA SALA", 450, 70);
    }
    
    if (jogadoresAtivos === 1) {
        ctx.fillStyle = "yellow";
        ctx.fillText("Aguardando outros jogadores...", 450, 90);
    }
    
    ctx.textAlign = "left";
}

// Função para desenhar instrução de saída
function desenharInstrucaoSair() {
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ESC: Voltar ao menu | F1: Instruções", 450, 390);
    ctx.textAlign = "left";
}

// Função para desenhar mensagem de espera
function desenharMensagemEspera() {
    const mensagens = [
        "Aguardando outros jogadores...",
        "Pratique seus movimentos!",
        "Outros jogadores podem entrar a qualquer momento",
        "Use este tempo para dominar seus especiais!",
        "Pressione ESC para sair da sala"
    ];
    
    const index = Math.floor(Date.now() / 3000) % mensagens.length;
    
    ctx.fillStyle = "yellow";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(mensagens[index], 450, 350);
    ctx.textAlign = "left";
}

// Função para desenhar tela de instruções
function desenharTelaInstrucoes() {
    // Overlay semi-transparente
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "white";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("INSTRUÇÕES DO JOGO", canvas.width / 2, 50);
    
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    
    // Controles
    ctx.fillStyle = "#0f0";
    ctx.fillText("CONTROLES BÁSICOS:", 50, 90);
    ctx.fillStyle = "white";
    ctx.fillText("• Movimentação: Setas/Teclas configuradas", 70, 115);
    ctx.fillText("• Pulo: Tecla para cima configurada", 70, 140);
    ctx.fillText("• Soco: Tecla de soco configurada", 70, 165);
    ctx.fillText("• Chute: Tecla de chute configurada", 70, 190);
    ctx.fillText("• Bloquear: Tecla de bloqueio configurada", 70, 215);
    
    // Especiais por personagem
    ctx.fillStyle = "#0f0";
    ctx.fillText("ATAQUES ESPECIAIS:", 50, 250);
    
    ctx.fillStyle = "#ff0";
    ctx.fillText("💩 COCOZIN:", 70, 275);
    ctx.fillStyle = "white";
    ctx.fillText("• Bomba de Cocô: Pular + Abaixar (no ar)", 90, 300);
    
    ctx.fillStyle = "#ff0";
    ctx.fillText("🐀 RATAZANA:", 70, 325);
    ctx.fillStyle = "white";
    ctx.fillText("• Mordida Rápida: Abaixar + Soco", 90, 350);
    ctx.fillText("• Cauda Giratória: Abaixar + Chute", 90, 375);
    
    ctx.fillStyle = "#ff0";
    ctx.fillText("💨 PEIDOVÉLIO:", 70, 400);
    ctx.fillStyle = "white";
    ctx.fillText("• Nuvem Tóxica: Abaixar + Soco", 90, 425);
    ctx.fillText("• Tornado de Peido: Pular+Abaixar+Chute", 90, 450);
    
    // Instrução para voltar
    ctx.fillStyle = "yellow";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Pressione F1 para voltar ao jogo", canvas.width / 2, 490);
    
    ctx.textAlign = "left";
}

// ============================================
// FUNÇÕES DE INICIALIZAÇÃO E GERENCIAMENTO
// ============================================

// Inicializar UI para multiplayer
window.inicializarUIMultiplayer = function(nomeSala, playerNum, personagem) {
    console.log(`🎮 [UI] Inicializando para multiplayer: ${nomeSala} - P${playerNum} - ${personagem}`);
    
    salaAtualGame = nomeSala;
    jogadorLocalId = `p${playerNum}`;
    jogadores = {};
    
    // Adicionar jogador local
    jogadores[jogadorLocalId] = {
        tipo: personagem,
        vida: 100,
        ativo: true,
        x: 0,
        y: 0
    };
    
    console.log('✅ UI inicializada para multiplayer');
};

// Atualizar dados dos jogadores (chamado pelo Firebase)
window.atualizarJogadoresUI = function(dadosJogadores) {
    jogadores = dadosJogadores || {};
    console.log(`👥 [UI] Jogadores atualizados: ${Object.keys(jogadores).length} jogadores`);
};

// Função para mostrar/ocultar instruções
let mostrarInstrucoes = false;
document.addEventListener('keydown', function(e) {
    if (e.key === 'F1' || e.key === 'f1') {
        mostrarInstrucoes = !mostrarInstrucoes;
        e.preventDefault();
    }
});

// Função principal de renderização UI
window.renderizarUI = function() {
    if (mostrarInstrucoes) {
        desenharTelaInstrucoes();
        return;
    }
    
    if (salaAtualGame) {
        barrasMultiplayer();
    } else {
        barras();
    }
};

console.log('✅ UI.js carregado com funções para multiplayer 1-4 jogadores');
