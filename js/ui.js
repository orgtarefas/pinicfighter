// ui.js ATUALIZADO PARA SISTEMA MULTIPLAYER 1-4 JOGADORES

function barras() {
    // Esta função não é mais usada no modo multiplayer principal
    // Mantemos para compatibilidade com modo single player
    if (salaAtualGame) {
        // Se estamos em modo multiplayer, usar barrasMultiplayer do game.js
        return;
    }
    
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

function desenharTelaFim() {
    // Esta função não é mais usada no modo multiplayer principal
    // Mantemos para compatibilidade com modo single player
    if (salaAtualGame) {
        // Se estamos em modo multiplayer, usar desenharTelaFimMultiplayer do game.js
        return;
    }
    
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

// ============================================
// FUNÇÕES AUXILIARES PARA O MULTIPLAYER
// ============================================

// Função para desenhar controles específicos do player
function desenharControlesPlayer(playerNum) {
    const controles = {
        '1': {
            mover: "A / D",
            pular: "W",
            soco: "F",
            chute: "C",
            abaixar: "S",
            deslizar: "S + C"
        },
        '2': {
            mover: "← / →",
            pular: "↑",
            soco: "Enter",
            chute: ".",
            abaixar: "↓",
            deslizar: "↓ + ."
        },
        '3': {
            mover: "J / L",
            pular: "I",
            soco: "H",
            chute: "N",
            abaixar: "K",
            deslizar: "K + N"
        },
        '4': {
            mover: "NUM4 / NUM6",
            pular: "NUM8",
            soco: "NUM0",
            chute: "NUM.",
            abaixar: "NUM5",
            deslizar: "NUM5 + NUM."
        }
    };
    
    const ctrl = controles[playerNum] || controles['1'];
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";
    ctx.textAlign = "left";
    
    const posicoes = {
        '1': { x: 50, y: 70 },
        '2': { x: 650, y: 70 },
        '3': { x: 50, y: 100 },
        '4': { x: 650, y: 100 }
    };
    
    const pos = posicoes[playerNum] || { x: 50, y: 70 };
    
    ctx.fillText(`Mover: ${ctrl.mover} | Pular: ${ctrl.pular}`, pos.x, pos.y);
    ctx.fillText(`Soco: ${ctrl.soco} | Chute: ${ctrl.chute}`, pos.x, pos.y + 15);
    ctx.fillText(`Abaixar: ${ctrl.abaixar} | Deslizar: ${ctrl.deslizar}`, pos.x, pos.y + 30);
}

// Função para desenhar instruções especiais por personagem
function desenharInstrucoesEspeciais(tipo, playerNum) {
    const especial = {
        'cocozin': "ESPECIAL: Pular + Baixo = Bomba de Cocô",
        'ratazana': "ESPECIAIS: Abaixar + Soco = Mordida | Abaixar + Chute = Cauda Giratória",
        'peidovélio': "ESPECIAIS: Abaixar + Soco = Nuvem Tóxica | Pular+Baixo+Chute = Tornado"
    };
    
    const posicoes = {
        '1': { x: 50, y: 110 },
        '2': { x: 650, y: 110 },
        '3': { x: 50, y: 140 },
        '4': { x: 650, y: 140 }
    };
    
    const pos = posicoes[playerNum];
    if (!pos) return;
    
    ctx.fillStyle = "#ff0";
    ctx.font = "11px Arial";
    ctx.fillText(especial[tipo] || "ESPECIAL: Consulte o menu de seleção", pos.x, pos.y);
}

// Função para desenhar status da sala
function desenharStatusSala() {
    if (!salaAtualGame) return;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(350, 10, 200, 60);
    
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
    
    if (jogadoresAtivos === 1) {
        ctx.fillStyle = "yellow";
        ctx.fillText("Aguardando outros jogadores...", 450, 70);
    }
    
    ctx.textAlign = "left";
}

// Função para desenhar instrução de saída
function desenharInstrucaoSair() {
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Pressione ESC para voltar ao menu", 450, 390);
    ctx.textAlign = "left";
}

// Função para desenhar mensagem de espera
function desenharMensagemEspera() {
    const mensagens = [
        "Aguardando outros jogadores...",
        "Pratique seus movimentos!",
        "Outros jogadores podem entrar a qualquer momento",
        "Use este tempo para dominar seus especiais!"
    ];
    
    const index = Math.floor(Date.now() / 3000) % mensagens.length;
    
    ctx.fillStyle = "yellow";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(mensagens[index], 450, 350);
    ctx.textAlign = "left";
}

console.log('✓ UI.js carregado com funções para multiplayer');
