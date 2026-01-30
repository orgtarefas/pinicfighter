// ============================================
// PINIC FIGHTER - GAME.JS
// ============================================

// VARIÁVEIS GLOBAIS (com verificação para evitar duplicação)
if (typeof window.canvas === 'undefined') {
    window.canvas = document.getElementById('game');
}

if (typeof window.ctx === 'undefined') {
    window.ctx = window.canvas ? window.canvas.getContext('2d') : null;
}

if (typeof window.keys === 'undefined') {
    window.keys = {};
}

if (typeof window.fighters === 'undefined') {
    window.fighters = [];
}

if (typeof window.projectiles === 'undefined') {
    window.projectiles = [];
}

// CONFIGURAÇÕES DO JOGO
const GAME_CONFIG = {
    WIDTH: 900,
    HEIGHT: 400,
    GRAVITY: 0.8,
    FLOOR: 340,
    FRICTION: 0.9,
    JUMP_FORCE: -15
};

// ESTADOS DO JOGO
let gameState = {
    isRunning: false,
    gameLoopId: null,
    salaAtual: '',
    playerAtual: '',
    personagemAtual: '',
    jogadorPrincipal: null,
    outrosJogadores: {},
    gameTime: 0
};

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

// FUNÇÃO PARA INICIAR JOGO MULTIPLAYER
window.inicializarJogoMultiplayer = function(nomeSala, playerNum, personagem) {
    console.log('🎮 [GAME.JS] Iniciando jogo multiplayer:', { 
        sala: nomeSala, 
        player: playerNum, 
        personagem: personagem 
    });
    
    // Atualizar estado
    gameState.salaAtual = nomeSala;
    gameState.playerAtual = playerNum;
    gameState.personagemAtual = personagem;
    gameState.isRunning = true;
    
    // Configurar canvas
    if (window.canvas) {
        window.canvas.width = GAME_CONFIG.WIDTH;
        window.canvas.height = GAME_CONFIG.HEIGHT;
    }
    
    // Configurar controles
    configurarControles(playerNum);
    
    // Criar jogador principal
    criarJogadorPrincipal(playerNum, personagem);
    
    // Limpar arrays
    window.fighters = [];
    window.projectiles = [];
    
    // Adicionar jogador principal à lista de fighters
    window.fighters.push(gameState.jogadorPrincipal);
    
    // Iniciar loop do jogo
    iniciarGameLoop();
    
    // Conectar ao Firebase (se disponível)
    if (typeof firebase !== 'undefined') {
        conectarFirebaseSala(nomeSala, playerNum, personagem);
    } else {
        console.warn('⚠️ Firebase não disponível - Modo Single Player');
    }
    
    // Mostrar instruções
    mostrarInstrucoes();
};

// FUNÇÃO PARA CONFIGURAR CONTROLES
function configurarControles(playerNum) {
    console.log(`🎮 Configurando controles para Player ${playerNum}`);
    
    // Mapeamento de teclas por player
    const controlesMap = {
        '1': {
            left: 'a',
            right: 'd', 
            up: 'w',
            punch: 'f',
            kick: 'c',
            special: 'v'
        },
        '2': {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            up: 'ArrowUp',
            punch: 'Enter',
            kick: '.',
            special: '/'
        },
        '3': {
            left: 'j',
            right: 'l',
            up: 'i',
            punch: 'h',
            kick: 'n',
            special: 'm'
        },
        '4': {
            left: 'Numpad4',
            right: 'Numpad6',
            up: 'Numpad8',
            punch: 'Numpad0',
            kick: 'NumpadDecimal',
            special: 'NumpadAdd'
        }
    };
    
    const controles = controlesMap[playerNum] || controlesMap['1'];
    
    // Armazenar controles
    gameState.controles = controles;
    
    // Configurar event listeners
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        
        // Player 1
        if (playerNum === '1') {
            if (key === controles.left) gameState.jogadorPrincipal.vx = -5;
            if (key === controles.right) gameState.jogadorPrincipal.vx = 5;
            if (key === controles.up && gameState.jogadorPrincipal.isGrounded) {
                gameState.jogadorPrincipal.vy = GAME_CONFIG.JUMP_FORCE;
                gameState.jogadorPrincipal.isGrounded = false;
            }
            if (key === controles.punch) realizarSoco(gameState.jogadorPrincipal);
            if (key === controles.kick) realizarChute(gameState.jogadorPrincipal);
            if (key === controles.special) realizarEspecial(gameState.jogadorPrincipal);
        }
        
        window.keys[key] = true;
    });
    
    document.addEventListener('keyup', (e) => {
        const key = e.key;
        
        // Player 1
        if (playerNum === '1') {
            if (key === controles.left || key === controles.right) {
                gameState.jogadorPrincipal.vx = 0;
            }
        }
        
        window.keys[key] = false;
    });
}

// FUNÇÃO PARA CRIAR JOGADOR PRINCIPAL
function criarJogadorPrincipal(playerNum, personagem) {
    console.log(`🎭 Criando personagem: ${personagem} para Player ${playerNum}`);
    
    // Posições iniciais
    const posicoes = {
        '1': { x: 150, y: GAME_CONFIG.FLOOR - 80, facing: 'right' },
        '2': { x: 450, y: GAME_CONFIG.FLOOR - 80, facing: 'left' },
        '3': { x: 300, y: GAME_CONFIG.FLOOR - 80, facing: 'right' },
        '4': { x: 600, y: GAME_CONFIG.FLOOR - 80, facing: 'left' }
    };
    
    const pos = posicoes[playerNum] || posicoes['1'];
    
    // Estatísticas por personagem
    const stats = {
        'cocozin': { vida: 120, velocidade: 3, forca: 8, defesa: 7 },
        'ratazana': { vida: 90, velocidade: 6, forca: 6, defesa: 5 },
        'peidovélio': { vida: 100, velocidade: 4, forca: 7, defesa: 6 }
    };
    
    const stat = stats[personagem] || stats['cocozin'];
    
    // Criar objeto do jogador
    gameState.jogadorPrincipal = {
        // Identificação
        id: `p${playerNum}`,
        player: playerNum,
        personagem: personagem,
        nome: personagem.charAt(0).toUpperCase() + personagem.slice(1),
        
        // Posição e movimento
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        largura: 50,
        altura: 80,
        facing: pos.facing,
        isGrounded: false,
        isJumping: false,
        
        // Status
        vida: stat.vida,
        vidaMax: stat.vida,
        velocidade: stat.velocidade,
        forca: stat.forca,
        defesa: stat.defesa,
        
        // Ataques
        isPunching: false,
        isKicking: false,
        punchCooldown: 0,
        kickCooldown: 0,
        
        // Animação
        animationFrame: 0,
        animationTimer: 0,
        state: 'idle' // idle, walking, jumping, punching, kicking, hurt
    };
    
    console.log('✅ Jogador principal criado:', gameState.jogadorPrincipal);
}

// FUNÇÃO PARA INICIAR GAME LOOP
function iniciarGameLoop() {
    console.log('🔄 Iniciando game loop');
    
    // Parar loop anterior se existir
    if (gameState.gameLoopId) {
        cancelAnimationFrame(gameState.gameLoopId);
    }
    
    // Função principal do loop
    function gameLoop() {
        // Atualizar estado do jogo
        atualizarJogo();
        
        // Renderizar
        renderizarJogo();
        
        // Atualizar tempo
        gameState.gameTime++;
        
        // Continuar loop se o jogo estiver rodando
        if (gameState.isRunning) {
            gameState.gameLoopId = requestAnimationFrame(gameLoop);
        }
    }
    
    // Iniciar loop
    gameState.gameLoopId = requestAnimationFrame(gameLoop);
}

// ============================================
// FUNÇÕES DE ATUALIZAÇÃO
// ============================================

function atualizarJogo() {
    // Atualizar jogador principal
    atualizarJogador(gameState.jogadorPrincipal);
    
    // Atualizar outros jogadores
    Object.values(gameState.outrosJogadores).forEach(jogador => {
        atualizarJogador(jogador);
    });
    
    // Atualizar projéteis
    atualizarProjeteis();
    
    // Verificar colisões
    verificarColisoes();
    
    // Atualizar cooldowns
    atualizarCooldowns();
}

function atualizarJogador(jogador) {
    if (!jogador) return;
    
    // Aplicar gravidade
    jogador.vy += GAME_CONFIG.GRAVITY;
    
    // Atualizar posição
    jogador.x += jogador.vx;
    jogador.y += jogador.vy;
    
    // Limitar movimento horizontal
    jogador.x = Math.max(0, Math.min(GAME_CONFIG.WIDTH - jogador.largura, jogador.x));
    
    // Colisão com o chão
    if (jogador.y >= GAME_CONFIG.FLOOR - jogador.altura) {
        jogador.y = GAME_CONFIG.FLOOR - jogador.altura;
        jogador.vy = 0;
        jogador.isGrounded = true;
        jogador.isJumping = false;
    }
    
    // Aplicar atrito
    if (jogador.isGrounded) {
        jogador.vx *= GAME_CONFIG.FRICTION;
        if (Math.abs(jogador.vx) < 0.1) jogador.vx = 0;
    }
    
    // Atualizar estado da animação
    atualizarAnimacao(jogador);
    
    // Atualizar direção (facing)
    if (jogador.vx > 0) jogador.facing = 'right';
    if (jogador.vx < 0) jogador.facing = 'left';
}

function atualizarProjeteis() {
    for (let i = window.projectiles.length - 1; i >= 0; i--) {
        const proj = window.projectiles[i];
        
        // Atualizar posição
        proj.x += proj.vx;
        proj.y += proj.vy;
        
        // Aplicar gravidade se for afetado
        if (proj.affectedByGravity) {
            proj.vy += GAME_CONFIG.GRAVITY / 2;
        }
        
        // Verificar se saiu da tela
        if (proj.x < -50 || proj.x > GAME_CONFIG.WIDTH + 50 || 
            proj.y > GAME_CONFIG.HEIGHT + 50) {
            window.projectiles.splice(i, 1);
            continue;
        }
        
        // Atualizar tempo de vida
        proj.lifeTime--;
        if (proj.lifeTime <= 0) {
            window.projectiles.splice(i, 1);
        }
    }
}

function atualizarAnimacao(jogador) {
    jogador.animationTimer++;
    
    if (jogador.animationTimer > 10) {
        jogador.animationFrame = (jogador.animationFrame + 1) % 4;
        jogador.animationTimer = 0;
    }
    
    // Determinar estado baseado nas ações
    if (jogador.isPunching) {
        jogador.state = 'punching';
    } else if (jogador.isKicking) {
        jogador.state = 'kicking';
    } else if (!jogador.isGrounded) {
        jogador.state = 'jumping';
    } else if (Math.abs(jogador.vx) > 0.5) {
        jogador.state = 'walking';
    } else {
        jogador.state = 'idle';
    }
}

function atualizarCooldowns() {
    // Atualizar jogador principal
    if (gameState.jogadorPrincipal.punchCooldown > 0) {
        gameState.jogadorPrincipal.punchCooldown--;
    }
    if (gameState.jogadorPrincipal.kickCooldown > 0) {
        gameState.jogadorPrincipal.kickCooldown--;
    }
    
    // Atualizar outros jogadores
    Object.values(gameState.outrosJogadores).forEach(jogador => {
        if (jogador.punchCooldown > 0) jogador.punchCooldown--;
        if (jogador.kickCooldown > 0) jogador.kickCooldown--;
    });
}

// ============================================
// FUNÇÕES DE ATAQUE
// ============================================

function realizarSoco(jogador) {
    if (jogador.punchCooldown > 0 || jogador.isPunching) return;
    
    jogador.isPunching = true;
    jogador.punchCooldown = 20;
    
    // Criar área de soco
    const punchArea = {
        x: jogador.facing === 'right' ? jogador.x + jogador.largura : jogador.x - 30,
        y: jogador.y + 30,
        width: 30,
        height: 30,
        owner: jogador.id,
        damage: jogador.forca * 2
    };
    
    // Verificar colisão com outros jogadores
    const todosJogadores = [gameState.jogadorPrincipal, ...Object.values(gameState.outrosJogadores)];
    todosJogadores.forEach(outro => {
        if (!outro || outro.id === jogador.id) return;
        
        if (checkCollision(punchArea, outro)) {
            aplicarDano(outro, punchArea.damage);
            // Efeito de knockback
            const dir = jogador.facing === 'right' ? 1 : -1;
            outro.vx = dir * 10;
            outro.vy = -5;
            outro.state = 'hurt';
        }
    });
    
    // Resetar soco após animação
    setTimeout(() => {
        jogador.isPunching = false;
    }, 300);
}

function realizarChute(jogador) {
    if (jogador.kickCooldown > 0 || jogador.isKicking) return;
    
    jogador.isKicking = true;
    jogador.kickCooldown = 25;
    
    // Criar área de chute
    const kickArea = {
        x: jogador.facing === 'right' ? jogador.x + jogador.largura : jogador.x - 40,
        y: jogador.y + 50,
        width: 40,
        height: 20,
        owner: jogador.id,
        damage: jogador.forca * 3
    };
    
    // Verificar colisão
    const todosJogadores = [gameState.jogadorPrincipal, ...Object.values(gameState.outrosJogadores)];
    todosJogadores.forEach(outro => {
        if (!outro || outro.id === jogador.id) return;
        
        if (checkCollision(kickArea, outro)) {
            aplicarDano(outro, kickArea.damage);
            // Knockback maior
            const dir = jogador.facing === 'right' ? 1 : -1;
            outro.vx = dir * 15;
            outro.vy = -8;
            outro.state = 'hurt';
        }
    });
    
    // Resetar chute
    setTimeout(() => {
        jogador.isKicking = false;
    }, 400);
}

function realizarEspecial(jogador) {
    if (jogador.personagem === 'cocozin') {
        criarProjetilCocozin(jogador);
    } else if (jogador.personagem === 'ratazana') {
        ataqueRapidoRatazana(jogador);
    } else if (jogador.personagem === 'peidovélio') {
        nuvemToxicaPeidovelio(jogador);
    }
}

function criarProjetilCocozin(jogador) {
    console.log('💩 Cocozin lançando bomba de cocô!');
    
    const proj = {
        x: jogador.facing === 'right' ? jogador.x + jogador.largura : jogador.x,
        y: jogador.y + 20,
        vx: jogador.facing === 'right' ? 8 : -8,
        vy: -5,
        radius: 15,
        color: '#8B7355',
        owner: jogador.id,
        damage: 15,
        lifeTime: 100,
        affectedByGravity: true,
        type: 'coco'
    };
    
    window.projectiles.push(proj);
}

function ataqueRapidoRatazana(jogador) {
    console.log('🐀 Ratazana usando ataque rápido!');
    
    // Aumenta velocidade temporariamente
    jogador.velocidade *= 2;
    jogador.vx *= 2;
    
    setTimeout(() => {
        jogador.velocidade /= 2;
    }, 2000);
}

function nuvemToxicaPeidovelio(jogador) {
    console.log('💨 Peidovélio criando nuvem tóxica!');
    
    const nuvem = {
        x: jogador.x,
        y: jogador.y + 20,
        width: 100,
        height: 60,
        alpha: 0.7,
        lifeTime: 150,
        damage: 2,
        owner: jogador.id,
        type: 'cloud'
    };
    
    // Efeito de área
    const todosJogadores = [gameState.jogadorPrincipal, ...Object.values(gameState.outrosJogadores)];
    todosJogadores.forEach(outro => {
        if (!outro || outro.id === jogador.id) return;
        
        if (checkCollision(nuvem, outro)) {
            aplicarDano(outro, nuvem.damage);
        }
    });
}

// ============================================
// FUNÇÕES DE COLISÃO E DANO
// ============================================

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.largura &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.altura &&
           rect1.y + rect1.height > rect2.y;
}

function aplicarDano(jogador, dano) {
    const danoReal = Math.max(1, dano - jogador.defesa);
    jogador.vida = Math.max(0, jogador.vida - danoReal);
    
    console.log(`💥 ${jogador.nome} sofreu ${danoReal} de dano! Vida: ${jogador.vida}`);
    
    // Verificar se morreu
    if (jogador.vida <= 0) {
        jogadorMorreu(jogador);
    }
}

function jogadorMorreu(jogador) {
    console.log(`💀 ${jogador.nome} morreu!`);
    
    // Efeito de morte
    jogador.state = 'dead';
    
    // Respawn após 3 segundos
    setTimeout(() => {
        if (jogador === gameState.jogadorPrincipal) {
            // Respawn do jogador principal
            jogador.vida = jogador.vidaMax;
            jogador.x = 150;
            jogador.y = GAME_CONFIG.FLOOR - jogador.altura;
            jogador.state = 'idle';
        }
    }, 3000);
}

function verificarColisoes() {
    // Colisão entre jogadores
    const todosJogadores = [gameState.jogadorPrincipal, ...Object.values(gameState.outrosJogadores)];
    
    for (let i = 0; i < todosJogadores.length; i++) {
        for (let j = i + 1; j < todosJogadores.length; j++) {
            const a = todosJogadores[i];
            const b = todosJogadores[j];
            
            if (!a || !b) continue;
            
            if (checkCollision(a, b)) {
                // Empurrar os jogadores para fora
                const dx = (a.x + a.largura/2) - (b.x + b.largura/2);
                const force = 2;
                
                a.vx += dx > 0 ? force : -force;
                b.vx += dx > 0 ? -force : force;
            }
        }
    }
    
    // Colisão de projéteis com jogadores
    for (let i = window.projectiles.length - 1; i >= 0; i--) {
        const proj = window.projectiles[i];
        
        todosJogadores.forEach(jogador => {
            if (!jogador || proj.owner === jogador.id) return;
            
            const projRect = {
                x: proj.x - proj.radius,
                y: proj.y - proj.radius,
                width: proj.radius * 2,
                height: proj.radius * 2
            };
            
            if (checkCollision(projRect, jogador)) {
                aplicarDano(jogador, proj.damage);
                
                // Knockback
                const dir = proj.vx > 0 ? 1 : -1;
                jogador.vx = dir * 8;
                jogador.vy = -6;
                jogador.state = 'hurt';
                
                // Remover projétil
                window.projectiles.splice(i, 1);
            }
        });
    }
}

// ============================================
// FUNÇÕES DE RENDERIZAÇÃO
// ============================================

function renderizarJogo() {
    if (!window.ctx || !window.canvas) return;
    
    const ctx = window.ctx;
    
    // Limpar canvas
    ctx.clearRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    
    // Desenhar fundo
    desenharFundo(ctx);
    
    // Desenhar projéteis
    desenharProjeteis(ctx);
    
    // Desenhar jogadores
    desenharJogador(ctx, gameState.jogadorPrincipal);
    
    Object.values(gameState.outrosJogadores).forEach(jogador => {
        desenharJogador(ctx, jogador);
    });
    
    // Desenhar HUD
    desenharHUD(ctx);
    
    // Desenhar informações da sala
    desenharInfoSala(ctx);
}

function desenharFundo(ctx) {
    // Gradiente de fundo
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.HEIGHT);
    gradient.addColorStop(0, '#111');
    gradient.addColorStop(1, '#333');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    
    // Chão
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, GAME_CONFIG.FLOOR, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT - GAME_CONFIG.FLOOR);
    
    // Detalhes do chão
    ctx.fillStyle = '#444';
    for (let i = 0; i < GAME_CONFIG.WIDTH; i += 40) {
        ctx.fillRect(i, GAME_CONFIG.FLOOR, 20, 5);
    }
    
    // Linha do meio
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(GAME_CONFIG.WIDTH / 2, 50);
    ctx.lineTo(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.FLOOR);
    ctx.stroke();
    ctx.setLineDash([]);
}

function desenharJogador(ctx, jogador) {
    if (!jogador) return;
    
    // Cor base do personagem
    let corBase;
    switch(jogador.personagem) {
        case 'cocozin': corBase = '#8B7355'; break;
        case 'ratazana': corBase = '#696969'; break;
        case 'peidovélio': corBase = '#808080'; break;
        default: corBase = '#555';
    }
    
    // Efeito de dano (piscar)
    if (jogador.state === 'hurt') {
        const blink = Math.floor(gameState.gameTime / 5) % 2;
        if (blink === 0) return; // Piscar
    }
    
    // Desenhar corpo
    ctx.fillStyle = corBase;
    ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);
    
    // Detalhes do personagem
    ctx.fillStyle = getDetalheCor(jogador.personagem);
    
    // Cabeça
    ctx.fillRect(jogador.x + 10, jogador.y + 5, 30, 25);
    
    // Braços
    if (jogador.state === 'punching') {
        // Braço estendido para soco
        const armX = jogador.facing === 'right' ? jogador.x + jogador.largura : jogador.x - 20;
        ctx.fillRect(armX, jogador.y + 30, 20, 15);
    } else {
        // Braços normais
        ctx.fillRect(jogador.x - 5, jogador.y + 30, 15, 15);
        ctx.fillRect(jogador.x + jogador.largura - 10, jogador.y + 30, 15, 15);
    }
    
    // Pernas
    if (jogador.state === 'kicking') {
        // Perna estendida para chute
        const legX = jogador.facing === 'right' ? jogador.x + jogador.largura : jogador.x - 30;
        ctx.fillRect(legX, jogador.y + 60, 30, 15);
    } else {
        // Pernas normais
        ctx.fillRect(jogador.x + 5, jogador.y + 65, 15, 15);
        ctx.fillRect(jogador.x + jogador.largura - 20, jogador.y + 65, 15, 15);
    }
    
    // Desenhar nome e vida
    desenharInfoJogador(ctx, jogador);
}

function getDetalheCor(personagem) {
    switch(personagem) {
        case 'cocozin': return '#654321';
        case 'ratazana': return '#4a4a4a';
        case 'peidovélio': return '#a9a9a9';
        default: return '#333';
    }
}

function desenharInfoJogador(ctx, jogador) {
    // Nome
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        `${jogador.id.toUpperCase()}: ${jogador.nome}`,
        jogador.x + jogador.largura / 2,
        jogador.y - 25
    );
    
    // Barra de vida
    const barWidth = 60;
    const barHeight = 8;
    const barX = jogador.x + jogador.largura / 2 - barWidth / 2;
    const barY = jogador.y - 40;
    
    // Fundo da barra
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Vida atual
    const vidaPercent = jogador.vida / jogador.vidaMax;
    ctx.fillStyle = vidaPercent > 0.5 ? '#0f0' : vidaPercent > 0.25 ? '#ff0' : '#f00';
    ctx.fillRect(barX, barY, barWidth * vidaPercent, barHeight);
    
    // Borda da barra
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Texto da vida
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.fillText(
        `${Math.ceil(jogador.vida)}/${jogador.vidaMax}`,
        jogador.x + jogador.largura / 2,
        barY - 2
    );
}

function desenharProjeteis(ctx) {
    window.projectiles.forEach(proj => {
        if (proj.type === 'coco') {
            // Desenhar projétil de cocô
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Detalhes
            ctx.fillStyle = '#654321';
            ctx.beginPath();
            ctx.arc(proj.x - 3, proj.y - 3, 3, 0, Math.PI * 2);
            ctx.arc(proj.x + 4, proj.y + 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function desenharHUD(ctx) {
    // Tempo de jogo
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    const minutes = Math.floor(gameState.gameTime / 3600);
    const seconds = Math.floor((gameState.gameTime % 3600) / 60);
    ctx.fillText(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        GAME_CONFIG.WIDTH / 2,
        30
    );
    
    // Nome do jogo
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('PINIC FIGHTER', GAME_CONFIG.WIDTH / 2, 55);
}

function desenharInfoSala(ctx) {
    if (!gameState.salaAtual) return;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 60);
    
    ctx.fillStyle = '#0f0';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`SALA: ${gameState.salaAtual}`, 20, 30);
    ctx.fillText(`PLAYER: ${gameState.playerAtual}`, 20, 45);
    ctx.fillText(`PERSONAGEM: ${gameState.personagemAtual}`, 20, 60);
    
    // Jogadores online
    const totalJogadores = 1 + Object.keys(gameState.outrosJogadores).length;
    ctx.fillText(`JOGADORES: ${totalJogadores}/4`, 20, 75);
}

// ============================================
// FUNÇÕES DO FIREBASE
// ============================================

function conectarFirebaseSala(nomeSala, playerNum, personagem) {
    console.log('🔥 Conectando ao Firebase...');
    
    try {
        const db = firebase.database();
        const salaRef = db.ref(`salas/${nomeSala}`);
        const jogadorRef = db.ref(`salas/${nomeSala}/jogadores/p${playerNum}`);
        
        // Registrar jogador
        jogadorRef.set({
            personagem: personagem,
            vida: 100,
            x: gameState.jogadorPrincipal.x,
            y: gameState.jogadorPrincipal.y,
            facing: gameState.jogadorPrincipal.facing,
            state: gameState.jogadorPrincipal.state,
            ultimaAtualizacao: Date.now()
        });
        
        // Escutar por atualizações de outros jogadores
        salaRef.child('jogadores').on('value', (snapshot) => {
            const jogadores = snapshot.val() || {};
            atualizarOutrosJogadores(jogadores, playerNum);
        });
        
        // Enviar atualizações periódicas
        setInterval(() => {
            if (gameState.jogadorPrincipal && gameState.isRunning) {
                jogadorRef.update({
                    x: gameState.jogadorPrincipal.x,
                    y: gameState.jogadorPrincipal.y,
                    vida: gameState.jogadorPrincipal.vida,
                    facing: gameState.jogadorPrincipal.facing,
                    state: gameState.jogadorPrincipal.state,
                    ultimaAtualizacao: Date.now()
                });
            }
        }, 100); // Atualizar a cada 100ms
        
        console.log('✅ Conectado ao Firebase com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao conectar Firebase:', error);
    }
}

function atualizarOutrosJogadores(jogadoresData, meuPlayerNum) {
    const outros = {};
    
    Object.keys(jogadoresData).forEach(jogadorId => {
        // Ignorar o próprio jogador
        if (jogadorId === `p${meuPlayerNum}`) return;
        
        const data = jogadoresData[jogadorId];
        
        // Criar ou atualizar jogador
        if (!gameState.outrosJogadores[jogadorId]) {
            outros[jogadorId] = {
                id: jogadorId,
                player: jogadorId.charAt(1),
                personagem: data.personagem || 'cocozin',
                nome: data.personagem ? data.personagem.charAt(0).toUpperCase() + data.personagem.slice(1) : 'Jogador',
                x: data.x || 300,
                y: data.y || 300,
                largura: 50,
                altura: 80,
                vida: data.vida || 100,
                vidaMax: 100,
                facing: data.facing || 'right',
                state: data.state || 'idle'
            };
        } else {
            // Atualizar posição existente
            outros[jogadorId] = {
                ...gameState.outrosJogadores[jogadorId],
                x: data.x || outros[jogadorId].x,
                y: data.y || outros[jogadorId].y,
                vida: data.vida || outros[jogadorId].vida,
                facing: data.facing || outros[jogadorId].facing,
                state: data.state || outros[jogadorId].state
            };
        }
    });
    
    gameState.outrosJogadores = outros;
}

// ============================================
// FUNÇÕES DE CONTROLE DO JOGO
// ============================================

// Função para parar o jogo
window.pararJogo = function() {
    console.log('🛑 Parando jogo...');
    
    gameState.isRunning = false;
    
    if (gameState.gameLoopId) {
        cancelAnimationFrame(gameState.gameLoopId);
        gameState.gameLoopId = null;
    }
    
    // Remover do Firebase
    if (gameState.salaAtual && gameState.playerAtual && typeof firebase !== 'undefined') {
        try {
            const db = firebase.database();
            const jogadorRef = db.ref(`salas/${gameState.salaAtual}/jogadores/p${gameState.playerAtual}`);
            jogadorRef.remove();
        } catch (error) {
            console.error('Erro ao remover do Firebase:', error);
        }
    }
    
    // Resetar estado
    gameState = {
        isRunning: false,
        gameLoopId: null,
        salaAtual: '',
        playerAtual: '',
        personagemAtual: '',
        jogadorPrincipal: null,
        outrosJogadores: {},
        gameTime: 0
    };
    
    console.log('✅ Jogo parado');
};

// Função para mostrar instruções
function mostrarInstrucoes() {
    console.log('📋 INSTRUÇÕES DO JOGO:');
    console.log('- Use as teclas configuradas para mover e atacar');
    console.log('- Cada personagem tem habilidades especiais únicas');
    console.log('- Reduza a vida dos oponentes para zero para vencer');
    console.log('- Jogadores ressurgem após 3 segundos');
}

// ============================================
// INICIALIZAÇÃO
// ============================================

console.log('🎮 Game.js carregado com sucesso!');
console.log('📌 Funções disponíveis:');
console.log('  - window.inicializarJogoMultiplayer(sala, player, personagem)');
console.log('  - window.pararJogo()');

// Exportar para uso global
window.gameState = gameState;
window.GAME_CONFIG = GAME_CONFIG;
