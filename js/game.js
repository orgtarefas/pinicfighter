// ============================================
// PINIC FIGHTER - GAME.JS COMPLETO
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

if (typeof window.efeitos === 'undefined') {
    window.efeitos = [];
}

// CONFIGURAÇÕES DO JOGO
const GAME_CONFIG = {
    WIDTH: 900,
    HEIGHT: 400,
    GRAVITY: 0.8,
    FLOOR: 340,
    FRICTION: 0.85,
    JUMP_FORCE: -16,
    MAX_JUMP: 2
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
    gameTime: 0,
    donoDaSala: false,
    criadorSala: '',
    partidaAtiva: true,
    tempoPartida: 180, // 3 minutos
    placar: {}
};

// IMAGENS DOS PERSONAGENS (Spritesheets)
const SPRITES = {
    cocozin: { width: 64, height: 64, frames: 8, idleFrames: 4, walkFrames: 8, punchFrames: 6, kickFrames: 6, jumpFrames: 8 },
    ratazana: { width: 48, height: 64, frames: 8, idleFrames: 4, walkFrames: 8, punchFrames: 6, kickFrames: 6, jumpFrames: 8 },
    peidovélio: { width: 64, height: 64, frames: 8, idleFrames: 4, walkFrames: 8, punchFrames: 6, kickFrames: 6, jumpFrames: 8 }
};

// CORES E DETALHES DOS PERSONAGENS
const PERSONAGEM_DETAILS = {
    cocozin: {
        color: '#8B7355',
        detailColor: '#654321',
        specialColor: '#A0522D',
        name: 'Cocozin',
        icon: '💩',
        abilities: ['Bomba de Cocô']
    },
    ratazana: {
        color: '#696969',
        detailColor: '#4A4A4A',
        specialColor: '#808080',
        name: 'Ratazana',
        icon: '🐀',
        abilities: ['Mordida Rápida', 'Cauda Giratória']
    },
    peidovélio: {
        color: '#808080',
        detailColor: '#A9A9A9',
        specialColor: '#D3D3D3',
        name: 'Peidovélio',
        icon: '💨',
        abilities: ['Nuvem Tóxica', 'Tornado de Peido']
    }
};

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

// FUNÇÃO PARA INICIAR JOGO MULTIPLAYER
window.inicializarJogoMultiplayer = function(nomeSala, playerNum, personagem, criador = null) {
    console.log('🎮 [GAME.JS] Iniciando jogo multiplayer:', { 
        sala: nomeSala, 
        player: playerNum, 
        personagem: personagem,
        criador: criador
    });
    
    // Verificar se é o criador da sala
    const isCriador = (criador && criador === `p${playerNum}`) || (playerNum === '1' && !criador);
    
    // Atualizar estado
    gameState.salaAtual = nomeSala;
    gameState.playerAtual = playerNum;
    gameState.personagemAtual = personagem;
    gameState.criadorSala = criador || `p${playerNum}`;
    gameState.donoDaSala = isCriador;
    gameState.isRunning = true;
    gameState.partidaAtiva = true;
    gameState.tempoPartida = 180;
    gameState.placar = {};
    
    // Mostrar/ocultar botão de excluir sala
    atualizarBotaoExcluirSala();
    
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
    window.efeitos = [];
    
    // Adicionar jogador principal à lista de fighters
    window.fighters.push(gameState.jogadorPrincipal);
    
    // Iniciar loop do jogo
    iniciarGameLoop();
    
    // Conectar ao Firebase (se disponível)
    if (typeof firebase !== 'undefined') {
        conectarFirebaseSala(nomeSala, playerNum, personagem, isCriador);
    } else {
        console.warn('⚠️ Firebase não disponível - Modo Single Player');
        criarOponentesDemo();
    }
    
    // Mostrar instruções
    mostrarInstrucoes();
    
    // Configurar botão de excluir sala
    document.getElementById('btnExcluirSala')?.addEventListener('click', excluirSala);
    document.getElementById('btnExcluirSalaFooter')?.addEventListener('click', excluirSala);
};

// FUNÇÃO PARA ATUALIZAR BOTÃO EXCLUIR SALA
function atualizarBotaoExcluirSala() {
    const btnExcluir = document.getElementById('btnExcluirSala');
    const btnExcluirFooter = document.getElementById('btnExcluirSalaFooter');
    
    if (btnExcluir && btnExcluirFooter) {
        if (gameState.donoDaSala) {
            btnExcluir.style.display = 'block';
            btnExcluirFooter.style.display = 'block';
            console.log('👑 Você é o dono da sala - Botão excluir visível');
        } else {
            btnExcluir.style.display = 'none';
            btnExcluirFooter.style.display = 'none';
            console.log('👤 Você não é o dono da sala');
        }
    }
}

// FUNÇÃO PARA EXCLUIR SALA
window.excluirSala = async function() {
    if (!gameState.donoDaSala) {
        alert('⚠️ Apenas o criador da sala pode excluí-la!');
        return;
    }
    
    if (!confirm('🚨 TEM CERTEZA QUE DESEJA EXCLUIR ESTA SALA?\n\nTodos os jogadores serão desconectados e a sala será permanentemente removida.')) {
        return;
    }
    
    console.log('🗑️ Excluindo sala:', gameState.salaAtual);
    
    try {
        // Parar o jogo primeiro
        window.pararJogo();
        
        // Remover do Firebase
        if (typeof firebase !== 'undefined' && gameState.salaAtual) {
            const db = firebase.database();
            const salaRef = db.ref(`salas/${gameState.salaAtual}`);
            
            // Primeiro notificar todos os jogadores
            const jogadoresRef = db.ref(`salas/${gameState.salaAtual}/jogadores`);
            jogadoresRef.once('value').then((snapshot) => {
                const jogadores = snapshot.val() || {};
                Object.keys(jogadores).forEach(jogadorId => {
                    const notificacaoRef = db.ref(`salas/${gameState.salaAtual}/notificacoes/${jogadorId}`);
                    notificacaoRef.set({
                        tipo: 'sala_excluida',
                        mensagem: 'A sala foi excluída pelo criador',
                        timestamp: Date.now()
                    });
                });
            });
            
            // Depois remover a sala
            await salaRef.remove();
            console.log('✅ Sala removida do Firebase');
        }
        
        // Feedback para o usuário
        alert('✅ Sala excluída com sucesso!\n\nTodos os jogadores foram desconectados.');
        
        // Resetar estado
        gameState.salaAtual = '';
        gameState.donoDaSala = false;
        
        // Voltar ao menu principal
        mostrarTelaMenu();
        
    } catch (error) {
        console.error('❌ Erro ao excluir sala:', error);
        alert('❌ Erro ao excluir sala. Tente novamente.');
    }
};

// FUNÇÃO PARA CONFIGURAR CONTROLES COM MOVIMENTOS ESPECIAIS
function configurarControles(playerNum) {
    console.log(`🎮 Configurando controles para Player ${playerNum}`);
    
    // Mapeamento completo de teclas
    const controlesMap = {
        '1': {
            left: 'a',
            right: 'd', 
            up: 'w',
            down: 's',
            punch: 'f',
            kick: 'c',
            special1: 'v',
            special2: 'b',
            block: 'shift',
            grab: 'g'
        },
        '2': {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            up: 'ArrowUp',
            down: 'ArrowDown',
            punch: 'Enter',
            kick: '.',
            special1: '/',
            special2: ';',
            block: 'ControlRight',
            grab: "'"
        },
        '3': {
            left: 'j',
            right: 'l',
            up: 'i',
            down: 'k',
            punch: 'h',
            kick: 'n',
            special1: 'm',
            special2: ',',
            block: 'space',
            grab: 'u'
        },
        '4': {
            left: 'Numpad4',
            right: 'Numpad6',
            up: 'Numpad8',
            down: 'Numpad5',
            punch: 'Numpad0',
            kick: 'NumpadDecimal',
            special1: 'NumpadAdd',
            special2: 'NumpadSubtract',
            block: 'NumpadEnter',
            grab: 'NumpadMultiply'
        }
    };
    
    const controles = controlesMap[playerNum] || controlesMap['1'];
    
    // Armazenar controles
    gameState.controles = controles;
    gameState.jumpCount = 0;
    gameState.combo = [];
    gameState.comboTimer = 0;
    
    // Configurar event listeners
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        window.keys[key] = true;
        
        // Registrar para combos
        gameState.combo.push({ key, time: Date.now() });
        gameState.comboTimer = Date.now();
        
        // Limitar tamanho do combo
        if (gameState.combo.length > 10) {
            gameState.combo.shift();
        }
        
        // Processar controles do jogador principal
        if (gameState.jogadorPrincipal && playerNum === gameState.playerAtual) {
            const jogador = gameState.jogadorPrincipal;
            
            // Movimento horizontal
            if (key === controles.left) {
                jogador.vx = -jogador.velocidade;
                jogador.facing = 'left';
                jogador.state = 'walking';
            }
            if (key === controles.right) {
                jogador.vx = jogador.velocidade;
                jogador.facing = 'right';
                jogador.state = 'walking';
            }
            
            // Pulo
            if (key === controles.up && jogador.isGrounded && gameState.jumpCount < GAME_CONFIG.MAX_JUMP) {
                jogador.vy = GAME_CONFIG.JUMP_FORCE;
                jogador.isGrounded = false;
                jogador.isJumping = true;
                gameState.jumpCount++;
                jogador.state = 'jumping';
                criarEfeito('jump', jogador.x + jogador.largura/2, jogador.y + jogador.altura);
            }
            
            // Agachar
            if (key === controles.down && jogador.isGrounded) {
                jogador.state = 'crouching';
                jogador.altura = 60; // Menor quando agachado
            }
            
            // Ataques básicos
            if (key === controles.punch) {
                realizarAtaque(jogador, 'punch');
            }
            if (key === controles.kick) {
                realizarAtaque(jogador, 'kick');
            }
            
            // Especiais
            if (key === controles.special1) {
                realizarEspecial(jogador, 1);
            }
            if (key === controles.special2) {
                realizarEspecial(jogador, 2);
            }
            
            // Bloqueio
            if (key === controles.block) {
                jogador.state = 'blocking';
                jogador.isBlocking = true;
            }
            
            // Pegar (grab)
            if (key === controles.grab && jogador.isGrounded) {
                realizarGrab(jogador);
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        window.keys[key] = false;
        
        if (gameState.jogadorPrincipal && playerNum === gameState.playerAtual) {
            const jogador = gameState.jogadorPrincipal;
            
            // Parar movimento horizontal
            if (key === controles.left || key === controles.right) {
                if (!window.keys[controles.left] && !window.keys[controles.right]) {
                    jogador.vx = 0;
                    if (jogador.isGrounded && jogador.state !== 'crouching') {
                        jogador.state = 'idle';
                    }
                }
            }
            
            // Parar de agachar
            if (key === controles.down) {
                jogador.altura = 80;
                if (jogador.isGrounded) {
                    jogador.state = 'idle';
                }
            }
            
            // Parar bloqueio
            if (key === controles.block) {
                jogador.isBlocking = false;
                if (jogador.isGrounded) {
                    jogador.state = 'idle';
                }
            }
            
            // Resetar contador de pulo quando tocar no chão
            if (key === controles.up) {
                if (jogador.isGrounded) {
                    gameState.jumpCount = 0;
                }
            }
        }
    });
    
    // Configurar combos
    setInterval(() => {
        if (Date.now() - gameState.comboTimer > 2000) { // Reset após 2 segundos
            gameState.combo = [];
        }
    }, 100);
}

// FUNÇÃO PARA CRIAR JOGADOR PRINCIPAL COM ANIMAÇÕES
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
    const details = PERSONAGEM_DETAILS[personagem] || PERSONAGEM_DETAILS.cocozin;
    
    // Estatísticas por personagem
    const stats = {
        'cocozin': { 
            vida: 120, 
            velocidade: 3, 
            forca: 8, 
            defesa: 7,
            jumpForce: -16,
            specialCooldown: 3000
        },
        'ratazana': { 
            vida: 90, 
            velocidade: 6, 
            forca: 6, 
            defesa: 5,
            jumpForce: -18,
            specialCooldown: 2000
        },
        'peidovélio': { 
            vida: 100, 
            velocidade: 4, 
            forca: 7, 
            defesa: 6,
            jumpForce: -14,
            specialCooldown: 4000
        }
    };
    
    const stat = stats[personagem] || stats.cocozin;
    
    // Criar objeto do jogador com sistema de animação
    gameState.jogadorPrincipal = {
        // Identificação
        id: `p${playerNum}`,
        player: playerNum,
        personagem: personagem,
        nome: details.name,
        icon: details.icon,
        
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
        isBlocking: false,
        
        // Status
        vida: stat.vida,
        vidaMax: stat.vida,
        velocidade: stat.velocidade,
        forca: stat.forca,
        defesa: stat.defesa,
        jumpForce: stat.jumpForce,
        
        // Sistema de animação
        animation: {
            current: 'idle',
            frame: 0,
            timer: 0,
            speed: 100, // ms por frame
            lastUpdate: Date.now(),
            
            // Sprites
            sprites: SPRITES[personagem] || SPRITES.cocozin,
            
            // Estados de animação
            states: {
                idle: { frames: 4, loop: true },
                walking: { frames: 8, loop: true },
                jumping: { frames: 8, loop: false },
                falling: { frames: 4, loop: true },
                punching: { frames: 6, loop: false },
                kicking: { frames: 6, loop: false },
                crouching: { frames: 4, loop: true },
                blocking: { frames: 3, loop: true },
                hurt: { frames: 4, loop: false },
                special: { frames: 8, loop: false }
            }
        },
        
        // Ataques e cooldowns
        isAttacking: false,
        attackType: null,
        attackFrame: 0,
        punchCooldown: 0,
        kickCooldown: 0,
        specialCooldown: 0,
        specialCooldownTime: stat.specialCooldown,
        
        // Combos
        comboCount: 0,
        lastComboTime: 0,
        
        // Efeitos visuais
        effects: [],
        hitSpark: null,
        
        // Cores
        color: details.color,
        detailColor: details.detailColor,
        specialColor: details.specialColor
    };
    
    console.log('✅ Jogador principal criado:', gameState.jogadorPrincipal);
}

// ============================================
// SISTEMA DE ANIMAÇÕES
// ============================================

// ATUALIZAR ANIMAÇÃO DO JOGADOR
function atualizarAnimacaoJogador(jogador) {
    if (!jogador || !jogador.animation) return;
    
    const now = Date.now();
    const delta = now - jogador.animation.lastUpdate;
    
    // Determinar estado de animação baseado no estado do jogador
    let targetState = jogador.state || 'idle';
    
    // Se estiver atacando, priorizar animação de ataque
    if (jogador.isAttacking) {
        targetState = jogador.attackType || 'punching';
    }
    // Se estiver no ar
    else if (!jogador.isGrounded) {
        targetState = jogador.vy < 0 ? 'jumping' : 'falling';
    }
    // Se estiver bloqueando
    else if (jogador.isBlocking) {
        targetState = 'blocking';
    }
    // Se estiver agachado
    else if (jogador.state === 'crouching') {
        targetState = 'crouching';
    }
    // Se estiver se movendo
    else if (Math.abs(jogador.vx) > 0.5) {
        targetState = 'walking';
    }
    // Padrão: idle
    else {
        targetState = 'idle';
    }
    
    // Mudar estado se necessário
    if (jogador.animation.current !== targetState) {
        jogador.animation.current = targetState;
        jogador.animation.frame = 0;
        jogador.animation.timer = 0;
    }
    
    // Atualizar frame da animação
    const stateConfig = jogador.animation.states[targetState];
    if (!stateConfig) return;
    
    jogador.animation.timer += delta;
    
    if (jogador.animation.timer >= jogador.animation.speed) {
        jogador.animation.frame++;
        jogador.animation.timer = 0;
        
        // Verificar fim da animação
        if (jogador.animation.frame >= stateConfig.frames) {
            if (stateConfig.loop) {
                jogador.animation.frame = 0;
            } else {
                jogador.animation.frame = stateConfig.frames - 1;
                
                // Se terminar animação de ataque, resetar
                if (targetState === 'punching' || targetState === 'kicking' || 
                    targetState === 'special' || targetState === 'hurt') {
                    jogador.isAttacking = false;
                    jogador.attackType = null;
                    if (jogador.isGrounded && !jogador.isBlocking) {
                        jogador.state = 'idle';
                    }
                }
            }
        }
    }
    
    jogador.animation.lastUpdate = now;
}

// DESENHAR JOGADOR COM ANIMAÇÕES DETALHADAS
function desenharJogadorAnimado(ctx, jogador) {
    if (!jogador) return;
    
    // Efeito de piscar quando tomar dano
    if (jogador.invincibleTimer > 0) {
        const blink = Math.floor(gameState.gameTime / 3) % 2;
        if (blink === 0) return;
    }
    
    const details = PERSONAGEM_DETAILS[jogador.personagem] || PERSONAGEM_DETAILS.cocozin;
    
    // Salvar contexto
    ctx.save();
    
    // Espelhar se estiver virado para esquerda
    if (jogador.facing === 'left') {
        ctx.translate(jogador.x + jogador.largura, jogador.y);
        ctx.scale(-1, 1);
        ctx.translate(-jogador.x, -jogador.y);
    }
    
    // Desenhar de acordo com o personagem
    switch(jogador.personagem) {
        case 'cocozin':
            desenharCocozin(ctx, jogador);
            break;
        case 'ratazana':
            desenharRatazana(ctx, jogador);
            break;
        case 'peidovélio':
            desenharPeidovelio(ctx, jogador);
            break;
        default:
            desenharPersonagemPadrao(ctx, jogador);
    }
    
    // Restaurar contexto
    ctx.restore();
    
    // Desenhar efeitos
    desenharEfeitosJogador(ctx, jogador);
    
    // Desenhar informações (vida, nome, etc.)
    desenharInfoJogador(ctx, jogador);
}

// DESENHAR COCOZIN (Personagem 1)
function desenharCocozin(ctx, jogador) {
    const frame = jogador.animation.frame;
    const state = jogador.animation.current;
    
    // Corpo principal (cocô)
    ctx.fillStyle = jogador.color;
    ctx.beginPath();
    ctx.ellipse(
        jogador.x + jogador.largura/2,
        jogador.y + jogador.altura/2,
        jogador.largura/2 - 5,
        jogador.altura/2 - 10,
        0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Detalhes do cocô
    ctx.fillStyle = jogador.detailColor;
    
    // "Chips" de cocô (animados)
    if (state === 'idle' || state === 'walking') {
        const chipCount = 4;
        for (let i = 0; i < chipCount; i++) {
            const angle = (frame * 0.1 + i * Math.PI * 2 / chipCount) % (Math.PI * 2);
            const radius = jogador.largura/3;
            const chipSize = 4 + Math.sin(gameState.gameTime * 0.05 + i) * 2;
            
            ctx.beginPath();
            ctx.arc(
                jogador.x + jogador.largura/2 + Math.cos(angle) * radius,
                jogador.y + jogador.altura/2 + Math.sin(angle) * radius,
                chipSize, 0, Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    // Olhos
    const eyeY = jogador.y + jogador.altura * 0.3;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(jogador.x + jogador.largura * 0.35, eyeY, 6, 0, Math.PI * 2);
    ctx.arc(jogador.x + jogador.largura * 0.65, eyeY, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilas (seguem direção)
    ctx.fillStyle = 'black';
    const pupilOffset = jogador.facing === 'right' ? 2 : -2;
    ctx.beginPath();
    ctx.arc(jogador.x + jogador.largura * 0.35 + pupilOffset, eyeY, 3, 0, Math.PI * 2);
    ctx.arc(jogador.x + jogador.largura * 0.65 + pupilOffset, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Boca (expressão baseada no estado)
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (state === 'punching' || state === 'kicking') {
        // Boca aberta (atacando)
        ctx.arc(jogador.x + jogador.largura/2, jogador.y + jogador.altura * 0.5, 10, 0, Math.PI);
    } else if (state === 'hurt') {
        // Boca em 'O' (machucado)
        ctx.arc(jogador.x + jogador.largura/2, jogador.y + jogador.altura * 0.5, 8, 0, Math.PI * 2);
    } else {
        // Sorriso normal
        ctx.arc(jogador.x + jogador.largura/2, jogador.y + jogador.altura * 0.5, 12, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();
    
    // Braços e pernas (animados)
    desenharMembrosCocozin(ctx, jogador, frame, state);
}

// DESENHAR MEMBROS DO COCOZIN (animados)
function desenharMembrosCocozin(ctx, jogador, frame, state) {
    ctx.fillStyle = jogador.detailColor;
    
    // Braços
    const armAmplitude = Math.PI / 4;
    const armSpeed = 0.2;
    
    if (state === 'walking') {
        // Animação de caminhada
        const leftArmAngle = Math.sin(frame * armSpeed) * armAmplitude;
        const rightArmAngle = Math.sin(frame * armSpeed + Math.PI) * armAmplitude;
        
        desenharBraco(ctx, jogador, leftArmAngle, 'left');
        desenharBraco(ctx, jogador, rightArmAngle, 'right');
    } else if (state === 'punching') {
        // Soco
        const punchProgress = frame / 5;
        const punchAngle = -Math.PI/2 * punchProgress;
        const armSide = jogador.facing === 'right' ? 'right' : 'left';
        desenharBraco(ctx, jogador, punchAngle, armSide);
        
        // Outro braço relaxado
        const otherArm = armSide === 'right' ? 'left' : 'right';
        desenharBraco(ctx, jogador, -Math.PI/6, otherArm);
    } else {
        // Braços relaxados
        desenharBraco(ctx, jogador, -Math.PI/6, 'left');
        desenharBraco(ctx, jogador, -Math.PI/6, 'right');
    }
    
    // Pernas
    if (state === 'walking') {
        const legAmplitude = Math.PI / 6;
        const leftLegAngle = Math.sin(frame * armSpeed + Math.PI) * legAmplitude;
        const rightLegAngle = Math.sin(frame * armSpeed) * legAmplitude;
        
        desenharPerna(ctx, jogador, leftLegAngle, 'left');
        desenharPerna(ctx, jogador, rightLegAngle, 'right');
    } else if (state === 'jumping') {
        // Pernas recolhidas no pulo
        desenharPerna(ctx, jogador, -Math.PI/3, 'left');
        desenharPerna(ctx, jogador, -Math.PI/3, 'right');
    } else {
        // Pernas em pé
        desenharPerna(ctx, jogador, 0, 'left');
        desenharPerna(ctx, jogador, 0, 'right');
    }
}

function desenharBraco(ctx, jogador, angle, side) {
    const shoulderX = side === 'left' ? jogador.x + jogador.largura * 0.3 : jogador.x + jogador.largura * 0.7;
    const shoulderY = jogador.y + jogador.altura * 0.4;
    const length = 25;
    
    const elbowX = shoulderX + Math.cos(angle) * length;
    const elbowY = shoulderY + Math.sin(angle) * length;
    
    // Braço
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.strokeStyle = jogador.detailColor;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowX, elbowY);
    ctx.stroke();
    
    // Mão
    ctx.fillStyle = jogador.color;
    ctx.beginPath();
    ctx.arc(elbowX, elbowY, 8, 0, Math.PI * 2);
    ctx.fill();
}

function desenharPerna(ctx, jogador, angle, side) {
    const hipX = side === 'left' ? jogador.x + jogador.largura * 0.4 : jogador.x + jogador.largura * 0.6;
    const hipY = jogador.y + jogador.altura * 0.8;
    const length = 30;
    
    const kneeX = hipX + Math.cos(angle) * length;
    const kneeY = hipY + Math.sin(angle) * length;
    
    // Perna
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = jogador.detailColor;
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.stroke();
    
    // Pé
    ctx.fillStyle = jogador.color;
    ctx.beginPath();
    ctx.arc(kneeX, kneeY, 10, 0, Math.PI * 2);
    ctx.fill();
}

// DESENHAR RATAZANA (Personagem 2)
function desenharRatazana(ctx, jogador) {
    const frame = jogador.animation.frame;
    const state = jogador.animation.current;
    
    // Corpo (mais alongado)
    ctx.fillStyle = jogador.color;
    ctx.beginPath();
    ctx.ellipse(
        jogador.x + jogador.largura/2,
        jogador.y + jogador.altura/2,
        jogador.largura/2 - 8,
        jogador.altura/2 - 5,
        0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Focinho
    ctx.fillStyle = jogador.detailColor;
    ctx.beginPath();
    ctx.ellipse(
        jogador.x + jogador.largura/2 + (jogador.facing === 'right' ? 15 : -15),
        jogador.y + jogador.altura * 0.4,
        12, 8, 0, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Olhos (vermelhos)
    const eyeY = jogador.y + jogador.altura * 0.3;
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(jogador.x + jogador.largura * 0.3, eyeY, 5, 0, Math.PI * 2);
    ctx.arc(jogador.x + jogador.largura * 0.7, eyeY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilas
    ctx.fillStyle = 'black';
    const pupilOffset = state === 'punching' ? 0 : (jogador.facing === 'right' ? 1 : -1);
    ctx.beginPath();
    ctx.arc(jogador.x + jogador.largura * 0.3 + pupilOffset, eyeY, 2, 0, Math.PI * 2);
    ctx.arc(jogador.x + jogador.largura * 0.7 + pupilOffset, eyeY, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Bigodes (animados)
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i += 0.5) {
        const whiskerLength = 15 + Math.sin(frame * 0.2 + i) * 3;
        const angle = i * 0.3;
        
        ctx.beginPath();
        ctx.moveTo(jogador.x + jogador.largura/2 + (jogador.facing === 'right' ? 10 : -10), 
                   jogador.y + jogador.altura * 0.4);
        ctx.lineTo(
            jogador.x + jogador.largura/2 + (jogador.facing === 'right' ? 10 : -10) + 
                Math.cos(angle) * whiskerLength,
            jogador.y + jogador.altura * 0.4 + Math.sin(angle) * whiskerLength
        );
        ctx.stroke();
    }
    
    // Orelhas
    ctx.fillStyle = jogador.detailColor;
    ctx.beginPath();
    ctx.arc(jogador.x + jogador.largura * 0.25, jogador.y + jogador.altura * 0.15, 8, 0, Math.PI * 2);
    ctx.arc(jogador.x + jogador.largura * 0.75, jogador.y + jogador.altura * 0.15, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Cauda (animada)
    desenharCaudaRatazana(ctx, jogador, frame, state);
    
    // Patas
    desenharPatasRatazana(ctx, jogador, frame, state);
}

function desenharCaudaRatazana(ctx, jogador, frame, state) {
    ctx.strokeStyle = jogador.detailColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    const tailBaseX = jogador.x + (jogador.facing === 'right' ? 5 : jogador.largura - 5);
    const tailBaseY = jogador.y + jogador.altura * 0.7;
    
    ctx.beginPath();
    ctx.moveTo(tailBaseX, tailBaseY);
    
    // Cauda ondulada
    const segments = 8;
    const segmentLength = 10;
    let currentX = tailBaseX;
    let currentY = tailBaseY;
    
    for (let i = 0; i < segments; i++) {
        const angle = Math.sin(frame * 0.1 + i * 0.5) * 0.5;
        currentX += Math.cos(angle) * segmentLength * (jogador.facing === 'right' ? 1 : -1);
        currentY += Math.sin(angle) * segmentLength;
        ctx.lineTo(currentX, currentY);
    }
    
    ctx.stroke();
}

function desenharPatasRatazana(ctx, jogador, frame, state) {
    ctx.fillStyle = jogador.detailColor;
    
    // Patas dianteiras
    const frontPawY = jogador.y + jogador.altura * 0.7;
    const frontPawOffset = state === 'walking' ? Math.sin(frame * 0.3) * 5 : 0;
    
    ctx.beginPath();
    ctx.arc(jogador.x + jogador.largura * 0.3, frontPawY + frontPawOffset, 6, 0, Math.PI * 2);
    ctx.arc(jogador.x + jogador.largura * 0.7, frontPawY - frontPawOffset, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Patas traseiras
    const hindPawY = jogador.y + jogador.altura * 0.9;
    const hindPawOffset = state === 'walking' ? Math.sin(frame * 0.3 + Math.PI) * 5 : 0;
    
    ctx.beginPath();
    ctx.arc(jogador.x + jogador.largura * 0.4, hindPawY + hindPawOffset, 7, 0, Math.PI * 2);
    ctx.arc(jogador.x + jogador.largura * 0.6, hindPawY - hindPawOffset, 7, 0, Math.PI * 2);
    ctx.fill();
}

// DESENHAR PEIDOVÉLIO (Personagem 3)
function desenharPeidovelio(ctx, jogador) {
    const frame = jogador.animation.frame;
    const state = jogador.animation.current;
    
    // Corpo gasoso (nuvem)
    const cloudRadius = jogador.largura/2 - 5;
    
    // Gradiente para efeito de fumaça
    const gradient = ctx.createRadialGradient(
        jogador.x + jogador.largura/2,
        jogador.y + jogador.altura/2,
        0,
        jogador.x + jogador.largura/2,
        jogador.y + jogador.altura/2,
        cloudRadius
    );
    gradient.addColorStop(0, 'rgba(128, 128, 128, 0.9)');
    gradient.addColorStop(0.5, 'rgba(169, 169, 169, 0.6)');
    gradient.addColorStop(1, 'rgba(211, 211, 211, 0.3)');
    
    ctx.fillStyle = gradient;
    
    // Nuvem com bordas irregulares
    ctx.beginPath();
    const centerX = jogador.x + jogador.largura/2;
    const centerY = jogador.y + jogador.altura/2;
    
    for (let i = 0; i < Math.PI * 2; i += Math.PI / 8) {
        const radius = cloudRadius + Math.sin(frame * 0.1 + i * 2) * 5;
        const x = centerX + Math.cos(i) * radius;
        const y = centerY + Math.sin(i) * radius;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fill();
    
    // Olhos flutuantes
    const eyeOffset = Math.sin(frame * 0.2) * 3;
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(centerX - 10, centerY - 10 + eyeOffset, 6, 0, Math.PI * 2);
    ctx.arc(centerX + 10, centerY - 10 - eyeOffset, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupilas
    ctx.fillStyle = 'black';
    const pupilX = state === 'punching' ? 0 : (jogador.facing === 'right' ? 2 : -2);
    ctx.beginPath();
    ctx.arc(centerX - 10 + pupilX, centerY - 10 + eyeOffset, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 10 + pupilX, centerY - 10 - eyeOffset, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Boca (vapor saindo)
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 5, 10, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Efeito de vapor saindo
    if (state === 'special' || Math.random() < 0.1) {
        for (let i = 0; i < 3; i++) {
            const bubbleX = centerX + (Math.random() - 0.5) * 20;
            const bubbleY = centerY + 15 + Math.sin(frame * 0.2 + i) * 5;
            const radius = 2 + Math.random() * 3;
            
            ctx.fillStyle = `rgba(0, 255, 0, ${0.3 + Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Membros de fumaça
    desenharMembrosPeidovelio(ctx, jogador, frame, state);
}

function desenharMembrosPeidovelio(ctx, jogador, frame, state) {
    const centerX = jogador.x + jogador.largura/2;
    const centerY = jogador.y + jogador.altura/2;
    
    // Braços de fumaça
    ctx.strokeStyle = 'rgba(169, 169, 169, 0.7)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    
    const armLength = 25;
    let leftArmAngle, rightArmAngle;
    
    if (state === 'walking') {
        leftArmAngle = Math.PI/4 + Math.sin(frame * 0.3) * 0.3;
        rightArmAngle = Math.PI/4 + Math.sin(frame * 0.3 + Math.PI) * 0.3;
    } else if (state === 'punching') {
        const punchProgress = frame / 5;
        leftArmAngle = Math.PI/4 - Math.PI/2 * punchProgress;
        rightArmAngle = Math.PI/4;
    } else {
        leftArmAngle = Math.PI/4;
        rightArmAngle = Math.PI/4;
    }
    
    // Braço esquerdo
    ctx.beginPath();
    ctx.moveTo(centerX - 15, centerY);
    ctx.lineTo(
        centerX - 15 + Math.cos(leftArmAngle) * armLength,
        centerY + Math.sin(leftArmAngle) * armLength
    );
    ctx.stroke();
    
    // Braço direito
    ctx.beginPath();
    ctx.moveTo(centerX + 15, centerY);
    ctx.lineTo(
        centerX + 15 + Math.cos(rightArmAngle) * armLength,
        centerY + Math.sin(rightArmAngle) * armLength
    );
    ctx.stroke();
    
    // Pernas de fumaça
    ctx.lineWidth = 10;
    const legLength = 30;
    
    // Perna esquerda
    const leftLegAngle = state === 'walking' ? Math.sin(frame * 0.3 + Math.PI) * 0.2 : 0;
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY + 20);
    ctx.lineTo(
        centerX - 10 + Math.cos(leftLegAngle) * legLength,
        centerY + 20 + Math.sin(leftLegAngle) * legLength
    );
    ctx.stroke();
    
    // Perna direita
    const rightLegAngle = state === 'walking' ? Math.sin(frame * 0.3) * 0.2 : 0;
    ctx.beginPath();
    ctx.moveTo(centerX + 10, centerY + 20);
    ctx.lineTo(
        centerX + 10 + Math.cos(rightLegAngle) * legLength,
        centerY + 20 + Math.sin(rightLegAngle) * legLength
    );
    ctx.stroke();
}

// DESENHAR PERSONAGEM PADRÃO (fallback)
function desenharPersonagemPadrao(ctx, jogador) {
    ctx.fillStyle = jogador.color;
    ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);
    
    // Detalhes básicos
    ctx.fillStyle = jogador.detailColor;
    ctx.fillRect(jogador.x + 10, jogador.y + 10, 30, 20); // Cabeça
}

// DESENHAR EFEITOS DO JOGADOR
function desenharEfeitosJogador(ctx, jogador) {
    if (!jogador.effects || jogador.effects.length === 0) return;
    
    jogador.effects.forEach((effect, index) => {
        switch(effect.type) {
            case 'hit':
                desenharEfeitoHit(ctx, effect);
                break;
            case 'spark':
                desenharEfeitoSpark(ctx, effect);
                break;
            case 'trail':
                desenharEfeitoTrail(ctx, effect);
                break;
        }
        
        // Atualizar tempo do efeito
        effect.timer--;
        if (effect.timer <= 0) {
            jogador.effects.splice(index, 1);
        }
    });
}

function desenharEfeitoHit(ctx, effect) {
    const alpha = effect.timer / effect.maxTimer;
    ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 20 * alpha, 0, Math.PI * 2);
    ctx.stroke();
}

function desenharEfeitoSpark(ctx, effect) {
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI/4) + effect.rotation;
        const length = 15 * (effect.timer / effect.maxTimer);
        
        ctx.strokeStyle = `rgba(255, 255, 100, ${effect.timer / effect.maxTimer})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(effect.x, effect.y);
        ctx.lineTo(
            effect.x + Math.cos(angle) * length,
            effect.y + Math.sin(angle) * length
        );
        ctx.stroke();
    }
}

// ============================================
// SISTEMA DE ATAQUES E MOVIMENTOS ESPECIAIS
// ============================================

function realizarAtaque(jogador, tipo) {
    if (jogador.isAttacking) return;
    
    // Verificar cooldown
    if (tipo === 'punch' && jogador.punchCooldown > 0) return;
    if (tipo === 'kick' && jogador.kickCooldown > 0) return;
    
    jogador.isAttacking = true;
    jogador.attackType = tipo;
    jogador.animation.current = tipo === 'punch' ? 'punching' : 'kicking';
    jogador.animation.frame = 0;
    jogador.animation.timer = 0;
    
    // Configurar cooldown
    if (tipo === 'punch') {
        jogador.punchCooldown = 20; // 20 frames de cooldown
    } else {
        jogador.kickCooldown = 30;
    }
    
    // Criar área de ataque
    const attackArea = criarAreaAtaque(jogador, tipo);
    
    // Verificar colisão com outros jogadores
    const todosJogadores = [gameState.jogadorPrincipal, ...Object.values(gameState.outrosJogadores)];
    todosJogadores.forEach(outro => {
        if (!outro || outro.id === jogador.id) return;
        
        if (verificarColisao(attackArea, outro)) {
            const dano = calcularDano(jogador, tipo, outro);
            aplicarDano(outro, dano);
            
            // Knockback
            const dir = jogador.facing === 'right' ? 1 : -1;
            const knockback = tipo === 'punch' ? 8 : 12;
            outro.vx = dir * knockback;
            outro.vy = tipo === 'punch' ? -4 : -6;
            
            // Efeito visual
            criarEfeitoHit(outro, dir);
        }
    });
}

function criarAreaAtaque(jogador, tipo) {
    const area = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };
    
    if (tipo === 'punch') {
        area.width = 30;
        area.height = 20;
        area.x = jogador.facing === 'right' ? 
            jogador.x + jogador.largura - 10 : 
            jogador.x - 20;
        area.y = jogador.y + jogador.altura * 0.4;
    } else { // kick
        area.width = 40;
        area.height = 25;
        area.x = jogador.facing === 'right' ? 
            jogador.x + jogador.largura - 15 : 
            jogador.x - 25;
        area.y = jogador.y + jogador.altura * 0.7;
    }
    
    return area;
}

function realizarEspecial(jogador, specialNum) {
    if (jogador.specialCooldown > 0) return;
    
    jogador.isAttacking = true;
    jogador.attackType = 'special';
    jogador.animation.current = 'special';
    jogador.animation.frame = 0;
    jogador.animation.timer = 0;
    
    // Cooldown baseado no personagem
    jogador.specialCooldown = jogador.specialCooldownTime / 16.67; // Converter ms para frames (60fps)
    
    // Executar especial baseado no personagem
    switch(jogador.personagem) {
        case 'cocozin':
            if (specialNum === 1) bombaDeCoco(jogador);
            break;
        case 'ratazana':
            if (specialNum === 1) mordidaRapida(jogador);
            if (specialNum === 2) caudaGiratoria(jogador);
            break;
        case 'peidovélio':
            if (specialNum === 1) nuvemToxica(jogador);
            if (specialNum === 2) tornadoPeido(jogador);
            break;
    }
}

// ESPECIAIS DO COCOZIN
function bombaDeCoco(jogador) {
    console.log('💩 Cocozin: Bomba de Cocô!');
    
    const bomba = {
        x: jogador.x + jogador.largura/2,
        y: jogador.y + 20,
        vx: jogador.facing === 'right' ? 7 : -7,
        vy: -8,
        radius: 12,
        color: '#8B7355',
        detailColor: '#654321',
        owner: jogador.id,
        damage: 25,
        lifeTime: 120,
        gravity: 0.5,
        rotation: 0,
        type: 'coco'
    };
    
    window.projectiles.push(bomba);
    
    // Efeito sonoro/visual
    criarEfeito('special', jogador.x + jogador.largura/2, jogador.y + 10);
}

// ESPECIAIS DA RATAZANA
function mordidaRapida(jogador) {
    console.log('🐀 Ratazana: Mordida Rápida!');
    
    // Ataque rápido em sequência
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const attackArea = {
                x: jogador.facing === 'right' ? 
                    jogador.x + jogador.largura - 5 : 
                    jogador.x - 25,
                y: jogador.y + jogador.altura * 0.4,
                width: 25,
                height: 15,
                owner: jogador.id,
                damage: 8
            };
            
            verificarAtaqueArea(attackArea);
            criarEfeito('spark', attackArea.x + attackArea.width/2, attackArea.y + attackArea.height/2);
        }, i * 150);
    }
    
    // Aumentar velocidade temporariamente
    jogador.velocidade *= 1.5;
    setTimeout(() => {
        jogador.velocidade /= 1.5;
    }, 1000);
}

function caudaGiratoria(jogador) {
    console.log('🐀 Ratazana: Cauda Giratória!');
    
    // Ataque giratório de área
    const spin = {
        x: jogador.x,
        y: jogador.y,
        radius: 60,
        damage: 15,
        owner: jogador.id,
        timer: 30,
        angle: 0
    };
    
    // Adicionar ao array de efeitos
    if (!window.efeitos) window.efeitos = [];
    window.efeitos.push({
        type: 'spin',
        data: spin,
        update: function() {
            this.data.angle += 0.3;
            this.data.timer--;
            
            // Verificar colisão a cada frame
            const todosJogadores = [gameState.jogadorPrincipal, ...Object.values(gameState.outrosJogadores)];
            todosJogadores.forEach(outro => {
                if (!outro || outro.id === this.data.owner) return;
                
                const dx = (outro.x + outro.largura/2) - (this.data.x + jogador.largura/2);
                const dy = (outro.y + outro.altura/2) - (this.data.y + jogador.altura/2);
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < this.data.radius + outro.largura/2) {
                    aplicarDano(outro, this.data.damage);
                    const knockbackX = dx / distance * 10;
                    const knockbackY = dy / distance * 8;
                    outro.vx = knockbackX;
                    outro.vy = knockbackY;
                }
            });
            
            return this.data.timer > 0;
        },
        draw: function(ctx) {
            ctx.strokeStyle = `rgba(255, 100, 100, 0.7)`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(
                this.data.x + jogador.largura/2,
                this.data.y + jogador.altura/2,
                this.data.radius,
                0, Math.PI * 2
            );
            ctx.stroke();
            
            // Desenhar cauda girando
            const tailX = this.data.x + jogador.largura/2 + Math.cos(this.data.angle) * this.data.radius;
            const tailY = this.data.y + jogador.altura/2 + Math.sin(this.data.angle) * this.data.radius;
            
            ctx.fillStyle = jogador.detailColor;
            ctx.beginPath();
            ctx.arc(tailX, tailY, 10, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

// ESPECIAIS DO PEIDOVÉLIO
function nuvemToxica(jogador) {
    console.log('💨 Peidovélio: Nuvem Tóxica!');
    
    const nuvem = {
        x: jogador.facing === 'right' ? jogador.x + jogador.largura : jogador.x - 80,
        y: jogador.y + 10,
        width: 80,
        height: 60,
        owner: jogador.id,
        damage: 3,
        lifeTime: 180,
        timer: 180,
        particles: []
    };
    
    // Criar partículas para a nuvem
    for (let i = 0; i < 20; i++) {
        nuvem.particles.push({
            x: Math.random() * nuvem.width,
            y: Math.random() * nuvem.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: 3 + Math.random() * 4,
            life: 100 + Math.random() * 80
        });
    }
    
    window.efeitos.push({
        type: 'cloud',
        data: nuvem,
        update: function() {
            this.data.timer--;
            this.data.lifeTime--;
            
            // Atualizar partículas
            this.data.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                
                // Manter dentro da nuvem
                if (p.x < 0 || p.x > this.data.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.data.height) p.vy *= -1;
                
                // Repor partículas que morrem
                if (p.life <= 0) {
                    p.x = Math.random() * this.data.width;
                    p.y = Math.random() * this.data.height;
                    p.life = 100 + Math.random() * 80;
                }
            });
            
            // Dano contínuo a jogadores na área
            if (this.data.timer % 10 === 0) { // Dano a cada 10 frames
                const area = {
                    x: this.data.x,
                    y: this.data.y,
                    width: this.data.width,
                    height: this.data.height
                };
                
                const todosJogadores = [gameState.jogadorPrincipal, ...Object.values(gameState.outrosJogadores)];
                todosJogadores.forEach(outro => {
                    if (!outro || outro.id === this.data.owner) return;
                    
                    if (verificarColisao(area, outro)) {
                        aplicarDano(outro, this.data.damage);
                        // Efeito de veneno (dano contínuo)
                        if (!outro.poisonTimer) outro.poisonTimer = 60;
                    }
                });
            }
            
            return this.data.lifeTime > 0;
        },
        draw: function(ctx) {
            // Desenhar nuvem
            const alpha = this.data.timer / 180 * 0.5;
            ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
            ctx.fillRect(this.data.x, this.data.y, this.data.width, this.data.height);
            
            // Desenhar partículas
            this.data.particles.forEach(p => {
                const particleAlpha = p.life / 180 * alpha;
                ctx.fillStyle = `rgba(0, 255, 100, ${particleAlpha})`;
                ctx.beginPath();
                ctx.arc(this.data.x + p.x, this.data.y + p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    });
}

function tornadoPeido(jogador) {
    console.log('💨 Peidovélio: Tornado de Peido!');
    
    const tornado = {
        x: jogador.x + jogador.largura/2,
        y: jogador.y + jogador.altura/2,
        radius: 40,
        damage: 20,
        owner: jogador.id,
        lifeTime: 90,
        timer: 90,
        rotation: 0,
        pullForce: 0.5
    };
    
    window.efeitos.push({
        type: 'tornado',
        data: tornado,
        update: function() {
            this.data.timer--;
            this.data.lifeTime--;
            this.data.rotation += 0.2;
            this.data.radius += 0.5; // Expande com o tempo
            
            // Puxar jogadores para o centro
            const todosJogadores = [gameState.jogadorPrincipal, ...Object.values(gameState.outrosJogadores)];
            todosJogadores.forEach(outro => {
                if (!outro || outro.id === this.data.owner) return;
                
                const dx = (outro.x + outro.largura/2) - this.data.x;
                const dy = (outro.y + outro.altura/2) - this.data.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                
                if (distance < 150) { // Área de influência
                    // Força de atração
                    const force = this.data.pullForce * (1 - distance/150);
                    outro.vx -= (dx / distance) * force;
                    outro.vy -= (dy / distance) * force;
                    
                    // Dano se estiver muito perto
                    if (distance < this.data.radius + outro.largura/2 && this.data.timer % 15 === 0) {
                        aplicarDano(outro, this.data.damage / 3);
                    }
                }
            });
            
            // Dano no centro
            if (this.data.timer % 5 === 0) {
                const area = {
                    x: this.data.x - this.data.radius,
                    y: this.data.y - this.data.radius,
                    width: this.data.radius * 2,
                    height: this.data.radius * 2
                };
                
                verificarAtaqueArea(area, this.data.damage / 6, this.data.owner);
            }
            
            return this.data.lifeTime > 0;
        },
        draw: function(ctx) {
            const alpha = this.data.timer / 90 * 0.7;
            
            // Desenhar espiral do tornado
            for (let i = 0; i < 3; i++) {
                const radius = this.data.radius * (0.7 + i * 0.1);
                ctx.strokeStyle = `rgba(0, 255, 100, ${alpha * (1 - i * 0.2)})`;
                ctx.lineWidth = 8 - i * 2;
                ctx.beginPath();
                
                for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                    const spiralRadius = radius + Math.sin(angle * 3 + this.data.rotation) * 10;
                    const x = this.data.x + Math.cos(angle + this.data.rotation) * spiralRadius;
                    const y = this.data.y + Math.sin(angle + this.data.rotation) * spiralRadius;
                    
                    if (angle === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.stroke();
            }
        }
    });
}

// ============================================
// FUNÇÕES AUXILIARES DE COMBATE
// ============================================

function calcularDano(atacante, tipo, defensor) {
    let baseDano = tipo === 'punch' ? atacante.forca * 2 : atacante.forca * 3;
    
    // Redução por bloqueio
    if (defensor.isBlocking) {
        baseDano *= 0.3; // 70% de redução
    }
    
    // Redução por defesa
    const danoReduzido = Math.max(1, baseDano - defensor.defesa);
    
    // Multiplicador de combo
    const comboMultiplier = 1 + (atacante.comboCount * 0.1);
    
    return Math.floor(danoReduzido * comboMultiplier);
}

function aplicarDano(jogador, dano) {
    const danoReal = Math.max(1, dano);
    jogador.vida = Math.max(0, jogador.vida - danoReal);
    
    // Efeito visual
    jogador.invincibleTimer = 30; // 30 frames de invencibilidade
    jogador.animation.current = 'hurt';
    jogador.animation.frame = 0;
    jogador.animation.timer = 0;
    
    // Criar texto de dano
    criarTextoFlutuante(jogador.x + jogador.largura/2, jogador.y, `-${danoReal}`, '#ff0000');
    
    // Verificar morte
    if (jogador.vida <= 0) {
        jogadorMorreu(jogador);
    }
    
    // Atualizar Firebase se necessário
    atualizarVidaFirebase(jogador);
}

function jogadorMorreu(jogador) {
    console.log(`💀 ${jogador.nome} morreu!`);
    
    jogador.state = 'dead';
    jogador.isDead = true;
    
    // Efeito de morte
    criarEfeito('explosion', jogador.x + jogador.largura/2, jogador.y + jogador.altura/2);
    
    // Respawn após 3 segundos (se for jogador principal)
    if (jogador === gameState.jogadorPrincipal) {
        setTimeout(() => {
            if (gameState.isRunning) {
                jogador.vida = jogador.vidaMax;
                jogador.x = 150;
                jogador.y = GAME_CONFIG.FLOOR - jogador.altura;
                jogador.state = 'idle';
                jogador.isDead = false;
                jogador.invincibleTimer = 120; // 2 segundos de invencibilidade pós-respawn
                
                criarTextoFlutuante(jogador.x + jogador.largura/2, jogador.y - 50, 'REVIVED!', '#00ff00');
            }
        }, 3000);
    }
}

// ============================================
// FUNÇÕES DO FIREBASE (ATUALIZADAS)
// ============================================

function conectarFirebaseSala(nomeSala, playerNum, personagem, isCriador) {
    console.log('🔥 Conectando ao Firebase...');
    
    try {
        const db = firebase.database();
        const salaRef = db.ref(`salas/${nomeSala}`);
        const jogadorRef = db.ref(`salas/${nomeSala}/jogadores/p${playerNum}`);
        
        // Registrar sala com informações do criador
        if (isCriador) {
            salaRef.update({
                criador: `p${playerNum}`,
                criadoEm: Date.now(),
                ativa: true
            });
        }
        
        // Registrar jogador
        jogadorRef.set({
            personagem: personagem,
            vida: gameState.jogadorPrincipal.vida,
            vidaMax: gameState.jogadorPrincipal.vidaMax,
            x: gameState.jogadorPrincipal.x,
            y: gameState.jogadorPrincipal.y,
            facing: gameState.jogadorPrincipal.facing,
            state: gameState.jogadorPrincipal.state,
            isDead: false,
            ultimaAtualizacao: Date.now()
        });
        
        // Escutar por atualizações de outros jogadores
        salaRef.child('jogadores').on('value', (snapshot) => {
            const jogadores = snapshot.val() || {};
            atualizarOutrosJogadores(jogadores, playerNum);
            
            // Verificar se sala foi excluída
            if (Object.keys(jogadores).length === 0 && gameState.donoDaSala) {
                console.log('⚠️ Todos os jogadores saíram da sala');
            }
        });
        
        // Escutar por exclusão de sala
        salaRef.on('value', (snapshot) => {
            if (!snapshot.exists()) {
                console.log('⚠️ Sala foi excluída!');
                alert('A sala foi excluída pelo criador.');
                window.pararJogo();
                mostrarTelaMenu();
            }
        });
        
        // Enviar atualizações periódicas
        const updateInterval = setInterval(() => {
            if (gameState.jogadorPrincipal && gameState.isRunning) {
                jogadorRef.update({
                    x: gameState.jogadorPrincipal.x,
                    y: gameState.jogadorPrincipal.y,
                    vida: gameState.jogadorPrincipal.vida,
                    facing: gameState.jogadorPrincipal.facing,
                    state: gameState.jogadorPrincipal.state,
                    isDead: gameState.jogadorPrincipal.isDead || false,
                    ultimaAtualizacao: Date.now()
                });
            } else {
                clearInterval(updateInterval);
            }
        }, 100);
        
        console.log('✅ Conectado ao Firebase com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao conectar Firebase:', error);
    }
}

function atualizarVidaFirebase(jogador) {
    if (!gameState.salaAtual || !jogador.id || typeof firebase === 'undefined') return;
    
    try {
        const db = firebase.database();
        const jogadorRef = db.ref(`salas/${gameState.salaAtual}/jogadores/${jogador.id}`);
        
        jogadorRef.update({
            vida: jogador.vida,
            state: jogador.state,
            ultimaAtualizacao: Date.now()
        });
    } catch (error) {
        console.error('Erro ao atualizar vida no Firebase:', error);
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
            const details = PERSONAGEM_DETAILS[data.personagem] || PERSONAGEM_DETAILS.cocozin;
            
            outros[jogadorId] = {
                id: jogadorId,
                player: jogadorId.charAt(1),
                personagem: data.personagem || 'cocozin',
                nome: details.name,
                icon: details.icon,
                x: data.x || 300,
                y: data.y || 300,
                largura: 50,
                altura: 80,
                vida: data.vida || 100,
                vidaMax: data.vidaMax || 100,
                facing: data.facing || 'right',
                state: data.state || 'idle',
                isDead: data.isDead || false,
                color: details.color,
                detailColor: details.detailColor,
                specialColor: details.specialColor,
                
                // Sistema de animação simplificado
                animation: {
                    current: data.state || 'idle',
                    frame: 0,
                    timer: 0,
                    lastUpdate: Date.now()
                }
            };
        } else {
            // Atualizar posição existente (com interpolação suave)
            const old = gameState.outrosJogadores[jogadorId];
            const lerp = 0.2; // Fator de suavização
            
            outros[jogadorId] = {
                ...old,
                x: old.x + (data.x - old.x) * lerp,
                y: old.y + (data.y - old.y) * lerp,
                vida: data.vida || old.vida,
                facing: data.facing || old.facing,
                state: data.state || old.state,
                isDead: data.isDead || false,
                animation: {
                    ...old.animation,
                    current: data.state || old.animation.current,
                    lastUpdate: Date.now()
                }
            };
        }
    });
    
    gameState.outrosJogadores = outros;
}

// ============================================
// FUNÇÕES DE EFEITOS VISUAIS
// ============================================

function criarEfeito(tipo, x, y, options = {}) {
    const efeito = {
        tipo,
        x,
        y,
        timer: 60,
        maxTimer: 60,
        ...options
    };
    
    if (!window.efeitos) window.efeitos = [];
    window.efeitos.push(efeito);
    
    return efeito;
}

function criarEfeitoHit(jogador, dir) {
    criarEfeito('hit', jogador.x + jogador.largura/2, jogador.y + jogador.altura/2, {
        color: '#ff5555',
        size: 30
    });
    
    // Criar partículas de hit
    for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 4;
        
        criarEfeito('particle', jogador.x + jogador.largura/2, jogador.y + jogador.altura/2, {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: '#ff5555',
            size: 2 + Math.random() * 3,
            life: 30 + Math.random() * 30
        });
    }
}

function criarTextoFlutuante(x, y, texto, cor) {
    const textoObj = {
        x,
        y,
        texto,
        cor,
        vy: -2,
        timer: 60,
        alpha: 1
    };
    
    if (!window.textosFlutuantes) window.textosFlutuantes = [];
    window.textosFlutuantes.push(textoObj);
}

// ============================================
// GAME LOOP PRINCIPAL (ATUALIZADO)
// ============================================

function iniciarGameLoop() {
    console.log('🔄 Iniciando game loop');
    
    // Parar loop anterior se existir
    if (gameState.gameLoopId) {
        cancelAnimationFrame(gameState.gameLoopId);
    }
    
    function gameLoop() {
        // Atualizar estado do jogo
        atualizarJogo();
        
        // Renderizar
        renderizarJogo();
        
        // Atualizar tempo
        gameState.gameTime++;
        
        // Atualizar tempo da partida
        if (gameState.partidaAtiva) {
            gameState.tempoPartida--;
            if (gameState.tempoPartida <= 0) {
                fimDaPartida();
            }
        }
        
        // Continuar loop se o jogo estiver rodando
        if (gameState.isRunning) {
            gameState.gameLoopId = requestAnimationFrame(gameLoop);
        }
    }
    
    // Iniciar loop
    gameState.gameLoopId = requestAnimationFrame(gameLoop);
}

function atualizarJogo() {
    // Atualizar jogador principal
    if (gameState.jogadorPrincipal) {
        atualizarFisicaJogador(gameState.jogadorPrincipal);
        atualizarAnimacaoJogador(gameState.jogadorPrincipal);
        
        // Atualizar cooldowns
        if (gameState.jogadorPrincipal.punchCooldown > 0) {
            gameState.jogadorPrincipal.punchCooldown--;
        }
        if (gameState.jogadorPrincipal.kickCooldown > 0) {
            gameState.jogadorPrincipal.kickCooldown--;
        }
        if (gameState.jogadorPrincipal.specialCooldown > 0) {
            gameState.jogadorPrincipal.specialCooldown--;
        }
        if (gameState.jogadorPrincipal.invincibleTimer > 0) {
            gameState.jogadorPrincipal.invincibleTimer--;
        }
    }
    
    // Atualizar outros jogadores
    Object.values(gameState.outrosJogadores).forEach(jogador => {
        atualizarFisicaJogador(jogador);
        atualizarAnimacaoJogador(jogador);
    });
    
    // Atualizar projéteis
    atualizarProjeteis();
    
    // Atualizar efeitos
    atualizarEfeitos();
    
    // Atualizar textos flutuantes
    atualizarTextosFlutuantes();
    
    // Verificar colisões
    verificarColisoesCompletas();
}

function atualizarFisicaJogador(jogador) {
    if (jogador.isDead) return;
    
    // Aplicar gravidade
    jogador.vy += GAME_CONFIG.GRAVITY;
    
    // Limitar velocidade vertical
    if (jogador.vy > 20) jogador.vy = 20;
    
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
        gameState.jumpCount = 0; // Resetar contador de pulo
    }
    
    // Aplicar atrito se estiver no chão
    if (jogador.isGrounded) {
        jogador.vx *= GAME_CONFIG.FRICTION;
        if (Math.abs(jogador.vx) < 0.1) jogador.vx = 0;
    }
}

function atualizarProjeteis() {
    for (let i = window.projectiles.length - 1; i >= 0; i--) {
        const proj = window.projectiles[i];
        
        // Atualizar posição
        proj.x += proj.vx;
        proj.y += proj.vy;
        
        // Aplicar gravidade se for afetado
        if (proj.gravity) {
            proj.vy += proj.gravity;
        }
        
        // Atualizar rotação
        if (proj.rotation !== undefined) {
            proj.rotation += 0.1;
        }
        
        // Verificar se saiu da tela
        if (proj.x < -100 || proj.x > GAME_CONFIG.WIDTH + 100 || 
            proj.y > GAME_CONFIG.HEIGHT + 100) {
            window.projectiles.splice(i, 1);
            continue;
        }
        
        // Atualizar tempo de vida
        proj.lifeTime--;
        if (proj.lifeTime <= 0) {
            // Efeito de explosão
            if (proj.type === 'coco') {
                criarEfeitoExplosao(proj.x, proj.y, 30, '#8B7355');
            }
            window.projectiles.splice(i, 1);
        }
    }
}

function atualizarEfeitos() {
    if (!window.efeitos) return;
    
    for (let i = window.efeitos.length - 1; i >= 0; i--) {
        const efeito = window.efeitos[i];
        
        if (efeito.update) {
            // Efeito com lógica de atualização personalizada
            if (!efeito.update()) {
                window.efeitos.splice(i, 1);
            }
        } else {
            // Efeito simples
            efeito.timer--;
            if (efeito.timer <= 0) {
                window.efeitos.splice(i, 1);
            }
        }
    }
}

function atualizarTextosFlutuantes() {
    if (!window.textosFlutuantes) return;
    
    for (let i = window.textosFlutuantes.length - 1; i >= 0; i--) {
        const texto = window.textosFlutuantes[i];
        
        texto.y += texto.vy;
        texto.timer--;
        texto.alpha = texto.timer / 60;
        
        if (texto.timer <= 0) {
            window.textosFlutuantes.splice(i, 1);
        }
    }
}

// ============================================
// RENDERIZAÇÃO (ATUALIZADA)
// ============================================

function renderizarJogo() {
    if (!window.ctx || !window.canvas) return;
    
    const ctx = window.ctx;
    
    // Limpar canvas
    ctx.clearRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
    
    // Desenhar fundo
    desenharFundo(ctx);
    
    // Desenhar projéteis
    desenharProjeteisCompletos(ctx);
    
    // Desenhar efeitos
    desenharEfeitosCompletos(ctx);
    
    // Desenhar outros jogadores primeiro (para ordem de camadas)
    Object.values(gameState.outrosJogadores).forEach(jogador => {
        desenharJogadorAnimado(ctx, jogador);
    });
    
    // Desenhar jogador principal por último (para ficar na frente)
    if (gameState.jogadorPrincipal) {
        desenharJogadorAnimado(ctx, gameState.jogadorPrincipal);
    }
    
    // Desenhar textos flutuantes
    desenharTextosFlutuantes(ctx);
    
    // Desenhar HUD
    desenharHUDCompleto(ctx);
    
    // Desenhar informações da sala
    desenharInfoSalaCompleta(ctx);
}

function desenharProjeteisCompletos(ctx) {
    window.projectiles.forEach(proj => {
        ctx.save();
        ctx.translate(proj.x, proj.y);
        
        if (proj.rotation) {
            ctx.rotate(proj.rotation);
        }
        
        if (proj.type === 'coco') {
            // Desenhar bomba de cocô detalhada
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Detalhes
            ctx.fillStyle = proj.detailColor;
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2 / 5) + (proj.rotation || 0);
                const chipRadius = proj.radius * 0.6;
                const chipSize = proj.radius * 0.2;
                
                ctx.beginPath();
                ctx.arc(
                    Math.cos(angle) * chipRadius,
                    Math.sin(angle) * chipRadius,
                    chipSize, 0, Math.PI * 2
                );
                ctx.fill();
            }
        } else {
            // Projétil genérico
            ctx.fillStyle = proj.color || '#ff0000';
            ctx.beginPath();
            ctx.arc(0, 0, proj.radius || 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    });
}

function desenharEfeitosCompletos(ctx) {
    if (!window.efeitos) return;
    
    window.efeitos.forEach(efeito => {
        if (efeito.draw) {
            efeito.draw(ctx);
        } else {
            // Efeito padrão
            const alpha = efeito.timer / efeito.maxTimer;
            
            switch(efeito.tipo) {
                case 'hit':
                    ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(efeito.x, efeito.y, 20 * alpha, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                    
                case 'particle':
                    ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(efeito.x, efeito.y, efeito.size || 3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'jump':
                    ctx.fillStyle = `rgba(100, 100, 255, ${alpha * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(efeito.x, efeito.y, 15 * (1 - alpha), 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'special':
                    // Anel de efeito especial
                    ctx.strokeStyle = `rgba(255, 255, 100, ${alpha})`;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(efeito.x, efeito.y, 25 + (1 - alpha) * 20, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
            }
        }
    });
}

function desenharTextosFlutuantes(ctx) {
    if (!window.textosFlutuantes) return;
    
    window.textosFlutuantes.forEach(texto => {
        ctx.save();
        ctx.globalAlpha = texto.alpha;
        ctx.fillStyle = texto.cor;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Sombra
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText(texto.texto, texto.x, texto.y);
        ctx.restore();
    });
}

function desenharHUDCompleto(ctx) {
    // Tempo da partida
    const minutos = Math.floor(gameState.tempoPartida / 3600);
    const segundos = Math.floor((gameState.tempoPartida % 3600) / 60);
    const tempoTexto = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    
    ctx.fillStyle = gameState.tempoPartida < 60 ? '#ff0000' : '#00ff00';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tempoTexto, GAME_CONFIG.WIDTH / 2, 30);
    
    // Nome do jogo
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('PINIC FIGHTER', GAME_CONFIG.WIDTH / 2, 60);
    
    // Barra de cooldown do especial
    if (gameState.jogadorPrincipal) {
        const cooldownPercent = gameState.jogadorPrincipal.specialCooldown / 
            (gameState.jogadorPrincipal.specialCooldownTime / 16.67);
        
        if (cooldownPercent > 0) {
            const barWidth = 100;
            const barHeight = 10;
            const barX = GAME_CONFIG.WIDTH - barWidth - 20;
            const barY = 30;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = cooldownPercent > 0.5 ? '#00ff00' : 
                           cooldownPercent > 0.25 ? '#ffff00' : '#ff0000';
            ctx.fillRect(barX, barY, barWidth * (1 - cooldownPercent), barHeight);
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('ESPECIAL', barX, barY - 5);
        }
    }
}

function desenharInfoSalaCompleta(ctx) {
    if (!gameState.salaAtual) return;
    
    // Fundo semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 250, 80);
    
    // Informações da sala
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    
    ctx.fillText(`SALA: ${gameState.salaAtual}`, 20, 30);
    ctx.fillText(`PLAYER: ${gameState.playerAtual}`, 20, 50);
    ctx.fillText(`PERSONAGEM: ${gameState.personagemAtual}`, 20, 70);
    
    // Indicador de dono da sala
    if (gameState.donoDaSala) {
        ctx.fillStyle = '#ffff00';
        ctx.fillText('👑 DONO DA SALA', 20, 90);
    }
    
    // Contagem de jogadores
    const totalJogadores = 1 + Object.keys(gameState.outrosJogadores).length;
    ctx.fillText(`JOGADORES: ${totalJogadores}/4`, 150, 30);
}

// ============================================
// FUNÇÕES DE CONTROLE DO JOGO (ATUALIZADAS)
// ============================================

window.pararJogo = function() {
    console.log('🛑 Parando jogo...');
    
    gameState.isRunning = false;
    gameState.partidaAtiva = false;
    
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
            
            // Se for o criador e último jogador, remover sala
            if (gameState.donoDaSala) {
                const salaRef = db.ref(`salas/${gameState.salaAtual}`);
                salaRef.once('value').then((snapshot) => {
                    const jogadores = snapshot.val()?.jogadores || {};
                    if (Object.keys(jogadores).length === 0) {
                        salaRef.remove();
                        console.log('🗑️ Sala removida (último jogador saiu)');
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao remover do Firebase:', error);
        }
    }
    
    // Resetar arrays globais
    window.fighters = [];
    window.projectiles = [];
    window.efeitos = [];
    window.textosFlutuantes = [];
    
    console.log('✅ Jogo parado');
};

function fimDaPartida() {
    gameState.partidaAtiva = false;
    
    // Determinar vencedor
    let vencedor = null;
    let maiorVida = -1;
    
    // Verificar jogador principal
    if (gameState.jogadorPrincipal && gameState.jogadorPrincipal.vida > maiorVida) {
        maiorVida = gameState.jogadorPrincipal.vida;
        vencedor = gameState.jogadorPrincipal;
    }
    
    // Verificar outros jogadores
    Object.values(gameState.outrosJogadores).forEach(jogador => {
        if (jogador.vida > maiorVida) {
            maiorVida = jogador.vida;
            vencedor = jogador;
        }
    });
    
    // Mostrar resultado
    const resultado = vencedor ? 
        `🏆 VENCEDOR: ${vencedor.nome} (${vencedor.id.toUpperCase()})` : 
        '🤝 EMPATE!';
    
    criarTextoFlutuante(GAME_CONFIG.WIDTH/2, GAME_CONFIG.HEIGHT/2, resultado, '#ffff00');
    
    // Reiniciar após 5 segundos
    setTimeout(() => {
        if (gameState.isRunning) {
            // Resetar todos os jogadores
            if (gameState.jogadorPrincipal) {
                gameState.jogadorPrincipal.vida = gameState.jogadorPrincipal.vidaMax;
                gameState.jogadorPrincipal.x = 150;
                gameState.jogadorPrincipal.y = GAME_CONFIG.FLOOR - gameState.jogadorPrincipal.altura;
                gameState.jogadorPrincipal.state = 'idle';
            }
            
            Object.values(gameState.outrosJogadores).forEach(jogador => {
                jogador.vida = jogador.vidaMax;
                jogador.state = 'idle';
            });
            
            // Resetar tempo
            gameState.tempoPartida = 180;
            gameState.partidaAtiva = true;
        }
    }, 5000);
}

function mostrarInstrucoes() {
    console.log('📋 INSTRUÇÕES DO JOGO:');
    console.log('- Use as teclas configuradas para mover e atacar');
    console.log('- Cada personagem tem 2 habilidades especiais únicas');
    console.log('- Pressione DOWN para agachar e BLOCK para defender');
    console.log('- Reduza a vida dos oponentes para zero para vencer');
    console.log('- Jogadores ressurgem após 3 segundos da morte');
}

// Função para mostrar menu (para voltar da tela de jogo)
function mostrarTelaMenu() {
    // Esta função será implementada no sistema de telas do HTML
    const telaMenu = document.getElementById('telaMenu');
    const telaJogo = document.getElementById('jogoPrincipal');
    
    if (telaMenu && telaJogo) {
        telaMenu.style.display = 'flex';
        telaJogo.style.display = 'none';
    }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function verificarColisao(rect1, rect2) {
    return rect1.x < rect2.x + rect2.largura &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.altura &&
           rect1.y + rect1.height > rect2.y;
}

function criarEfeitoExplosao(x, y, radius, color) {
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        const size = 2 + Math.random() * 4;
        const life = 30 + Math.random() * 30;
        
        criarEfeito('particle', x, y, {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            size: size,
            life: life
        });
    }
}

function verificarColisoesCompletas() {
    // Colisão entre jogadores
    const todosJogadores = [gameState.jogadorPrincipal, ...Object.values(gameState.outrosJogadores)].filter(j => j && !j.isDead);
    
    for (let i = 0; i < todosJogadores.length; i++) {
        for (let j = i + 1; j < todosJogadores.length; j++) {
            const a = todosJogadores[i];
            const b = todosJogadores[j];
            
            if (!a || !b) continue;
            
            if (verificarColisao(a, b)) {
                // Empurrar os jogadores para fora
                const dx = (a.x + a.largura/2) - (b.x + b.largura/2);
                const force = 1.5;
                
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
            
            if (verificarColisao(projRect, jogador)) {
                aplicarDano(jogador, proj.damage);
                
                // Knockback
                const dir = proj.vx > 0 ? 1 : -1;
                jogador.vx = dir * 6;
                jogador.vy = -4;
                
                // Remover projétil
                criarEfeitoExplosao(proj.x, proj.y, 20, proj.color || '#ff0000');
                window.projectiles.splice(i, 1);
            }
        });
    }
}

function verificarAtaqueArea(area, dano, owner) {
    const todosJogadores = [gameState.jogadorPrincipal, ...Object.values(gameState.outrosJogadores)];
    todosJogadores.forEach(outro => {
        if (!outro || outro.id === owner) return;
        
        if (verificarColisao(area, outro)) {
            aplicarDano(outro, dano);
        }
    });
}

// ============================================
// INICIALIZAÇÃO
// ============================================

console.log('🎮 Game.js carregado com sucesso!');
console.log('📌 Funções disponíveis:');
console.log('  - window.inicializarJogoMultiplayer(sala, player, personagem, criador)');
console.log('  - window.pararJogo()');
console.log('  - window.excluirSala()');

// Exportar para uso global
window.gameState = gameState;
window.GAME_CONFIG = GAME_CONFIG;
window.PERSONAGEM_DETAILS = PERSONAGEM_DETAILS;
