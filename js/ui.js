function barras() {
    // Barra de vida P1
    ctx.fillStyle = "#333";
    ctx.fillRect(50, 20, 200, 25);
    ctx.fillStyle = p1.corSapato === "cyan" ? "cyan" : p1.cor;
    ctx.fillRect(50, 20, p1.vida * 2, 25);
    
    // Barra de vida P2
    ctx.fillStyle = "#333";
    ctx.fillRect(650, 20, 200, 25);
    ctx.fillStyle = p2.corSapato === "red" ? "red" : p2.cor;
    ctx.fillRect(650, 20, p2.vida * 2, 25);
    
    // Nome do personagem
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`${p1.tipo.toUpperCase()}: ${p1.vida}`, 50, 50);
    ctx.fillText(`${p2.tipo.toUpperCase()}: ${p2.vida}`, 650, 50);
    
    // Controles
    ctx.font = "14px Arial";
    ctx.fillText("Soco: F | Chute: C | Abaixar: S | Deslizar: S+C", 50, 70);
    ctx.fillText("Soco: Enter | Chute: . | Abaixar: ↓ | Deslizar: ↓+.", 650, 70);
    
    // Instrução do poder
    ctx.font = "12px Arial";
    ctx.fillText("Pular + Baixo no ar = Bomba de Cocô! (Cocozin apenas)", 350, 390);
    
    // Bordas
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 20, 200, 25);
    ctx.strokeRect(650, 20, 200, 25);
    
    // Desenha ícone do personagem
    ctx.font = "20px Arial";
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
