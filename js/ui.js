function barras() {
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
        corBarraP1 = p1.corSapato;
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
        corBarraP2 = p2.corSapato;
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
    
    ctx.fillText(`${formatarNome(p1.tipo)}: ${p1.vida}`, 50, 50);
    ctx.fillText(`${formatarNome(p2.tipo)}: ${p2.vida}`, 650, 50);
    
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
    ctx.fillText(`Jogador 1: ${p1.tipo} - ${p1.vivo ? "VIVO" : "DERROTADO"}`, canvas.width / 2, 340);
    ctx.fillText(`Jogador 2: ${p2.tipo} - ${p2.vivo ? "VIVO" : "DERROTADO"}`, canvas.width / 2, 360);
}
