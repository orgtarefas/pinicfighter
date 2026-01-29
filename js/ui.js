function barras() {
    ctx.fillStyle = "#333";
    ctx.fillRect(50, 20, 200, 25);
    ctx.fillStyle = "cyan";
    ctx.fillRect(50, 20, p1.vida * 2, 25);
    
    ctx.fillStyle = "#333";
    ctx.fillRect(650, 20, 200, 25);
    ctx.fillStyle = "red";
    ctx.fillRect(650, 20, p2.vida * 2, 25);
    
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText(`P1: ${p1.vida}`, 50, 50);
    ctx.fillText(`P2: ${p2.vida}`, 650, 50);
    
    ctx.font = "14px Arial";
    ctx.fillText("Soco: F | Chute: C | Bomba: W+S", 50, 70);
    ctx.fillText("Soco: Enter | Chute: . | Bomba: ↑+↓", 650, 70);
    
    ctx.font = "12px Arial";
    ctx.fillText("Pular + Baixo no ar = Bomba de Cocô!", 350, 390);
    
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 20, 200, 25);
    ctx.strokeRect(650, 20, 200, 25);
}

function desenharTelaFim() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "white";
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    
    const vencedor = p1.vivo ? "Player 1 VENCEU! 💩👑" : "Player 2 VENCEU! 💩👑";
    ctx.fillText(vencedor, canvas.width / 2, 150);
    
    ctx.font = "24px Arial";
    ctx.fillText("Pressione R para jogar novamente", canvas.width / 2, 200);
    
    ctx.font = "18px Arial";
    ctx.fillText("Ambos os jogadores precisam pressionar R", canvas.width / 2, 240);
}
