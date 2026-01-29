// attacks.js - Sistema de ataques e golpes
const Attacks = {
    // Processa movimentação
    processarMovimento: function(jogador, keys, jogoTerminou) {
        if (!jogador.vivo || jogoTerminou || jogador.atacando || jogador.chutando) return;
        
        let seMovendo = false;
        
        if (keys[jogador.ctrl.esq]) { 
            jogador.x -= jogador.vel; 
            jogador.dir = -1;
            seMovendo = true;
        }
        if (keys[jogador.ctrl.dir]) { 
            jogador.x += jogador.vel; 
            jogador.dir = 1;
            seMovendo = true;
        }
        
        // Animação de andar
        if (seMovendo && !jogador.pulando) {
            jogador.animacao += 0.2;
            jogador.frame = Math.floor(jogador.animacao) % 4;
        }
        
        Physics.limitarMovimento(jogador);
    },
    
    // Processa ataque de soco
    processarSoco: function(jogador, keys, inimigo, jogoTerminou) {
        if (!jogador.vivo || !inimigo.vivo || jogoTerminou) return;
        
        if (keys[jogador.ctrl.atk] && !jogador.atacando && !jogador.chutando && !jogador.descendoRapido) {
            jogador.atacando = true;
            jogador.tempoAtaque = 10;
            jogador.olhosAbertos = false;
            
            // Hitbox do soco
            const hit = {
                x: jogador.x + jogador.dir * 50,
                y: jogador.y - 40,
                w: 45,
                h: 35
            };
            
            // Verifica colisão
            if (Utils.colisao(hit, inimigo.hitbox())) {
                inimigo.receberDano(CONFIG.DANO_SOCO);
            }
        }
    },
    
    // Processa ataque de chute
    processarChute: function(jogador, keys, inimigo, jogoTerminou) {
        if (!jogador.vivo || !inimigo.vivo || jogoTerminou) return;
        
        const teclaChute = jogador.id === "p1" ? "c" : ".";
        if (keys[teclaChute] && !jogador.chutando && !jogador.atacando && !jogador.descendoRapido) {
            jogador.chutando = true;
            jogador.tempoChute = 15;
            
            // Posição inicial do sapato
            jogador.sapatoX = jogador.x + jogador.dir * 20;
            jogador.sapatoY = jogador.y + 10;
            
            // Hitbox do chute
            const hit = {
                x: jogador.x + jogador.dir * 60,
                y: jogador.y + 5,
                w: 50,
                h: 30
            };
            
            // Verifica colisão
            if (Utils.colisao(hit, inimigo.hitbox())) {
                inimigo.receberDano(CONFIG.DANO_CHUTE);
            }
        }
    },
    
    // Atualiza animações de ataque
    atualizarAnimacoes: function(jogador) {
        // Atualiza ataque
        if (jogador.atacando && --jogador.tempoAtaque <= 0) {
            jogador.atacando = false;
            jogador.olhosAbertos = true;
        }
        
        // Atualiza chute
        if (jogador.chutando) {
            jogador.tempoChute--;
            if (jogador.tempoChute > 10) {
                jogador.sapatoX += jogador.dir * 10;
                jogador.sapatoY -= 3;
            } else if (jogador.tempoChute > 5) {
                jogador.sapatoY += 2;
            } else if (jogador.tempoChute > 0) {
                jogador.sapatoX -= jogador.dir * 8;
                jogador.sapatoY += 4;
            } else {
                jogador.chutando = false;
            }
        }
        
        // Atualiza transformação
        if (jogador.transformado && jogador.tempoTransformacao > 0) {
            jogador.tempoTransformacao--;
            if (jogador.tempoTransformacao <= 0) {
                jogador.transformado = false;
            }
        }
    }
};

window.Attacks = Attacks;