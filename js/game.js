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
        descendoRapido: jogador.descendoRapido
