// physics.js - Sistema de física
const Physics = {
    // Aplica gravidade a um jogador
    aplicarGravidade: function(jogador) {
        if (!jogador.vivo) {
            jogador.y = CONFIG.CHAO + 10;
            jogador.vy = 0;
            return null;
        }
        
        jogador.y += jogador.vy;
        
        // Aplica gravidade normal ou descida rápida
        if (!jogador.descendoRapido) {
            jogador.vy += CONFIG.GRAVIDADE;
        }
        
        // Verifica se bateu no chão
        if (jogador.y >= CONFIG.CHAO) {
            const bateuComForca = jogador.vy > 12 && jogador.descendoRapido && jogador.cargaPoder > 15;
            
            jogador.y = CONFIG.CHAO;
            jogador.vy = 0;
            jogador.pulando = false;
            jogador.descendoRapido = false;
            
            // Lança cocô se bateu com força
            if (bateuComForca && jogador.cdPoder <= 0) {
                jogador.cargaPoder = 0;
                return jogador.lancarCoco();
            }
            
            jogador.cargaPoder = 0;
        }
        
        return null;
    },
    
    // Limita movimento dentro dos limites da tela
    limitarMovimento: function(jogador) {
        jogador.x = Math.max(CONFIG.LIM_ESQ, Math.min(CONFIG.LIM_DIR, jogador.x));
    },
    
    // Processa o pulo
    processarPulo: function(jogador, keys, jogoTerminou) {
        if (!jogador.vivo || jogoTerminou || jogador.atacando || jogador.chutando) return;
        
        // Pulo normal
        if (keys[jogador.ctrl.pulo] && !jogador.pulando) {
            jogador.vy = CONFIG.ALTURA_PULO;
            jogador.pulando = true;
            jogador.descendoRapido = false;
            jogador.transformado = false;
        }
        
        // Descida rápida (poder)
        const teclaBaixo = jogador.id === "p1" ? "s" : "ArrowDown";
        if (jogador.pulando && keys[teclaBaixo] && jogador.cdPoder <= 0) {
            jogador.descendoRapido = true;
            jogador.transformado = true;
            jogador.vy = CONFIG.VELOCIDADE_DESCIDA;
            jogador.cargaPoder = Math.min(jogador.cargaPoder + 1, CONFIG.MAX_CARGA);
        } else if (jogador.descendoRapido && !keys[teclaBaixo]) {
            jogador.descendoRapido = false;
            jogador.cargaPoder = 0;
        }
    }
};

window.Physics = Physics;