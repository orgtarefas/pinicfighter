// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDy_gqNrFR7KmMonXp7KfgRc15UVj0g3Nw",
    authDomain: "pinico-fighter.firebaseapp.com",
    databaseURL: "https://pinico-fighter-default-rtdb.firebaseio.com",
    projectId: "pinico-fighter",
    storageBucket: "pinico-fighter.firebasestorage.app",
    messagingSenderId: "152199667347",
    appId: "1:152199667347:web:9c74188c88bdee8633f766"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Variáveis globais para a sala atual
let salaAtual = null;
let meuPlayerId = null;
let meuPersonagem = null;
let jogadoresSala = {};
let meuNome = "";
let ultimoEnvio = 0; // Controle de rate limiting
const MIN_TEMPO_ENTRE_ENVIOS = 100; // 100ms entre envios

// ============================================
// FUNÇÕES PARA O SISTEMA DE SALAS (chamadas pelo HTML)
// ============================================

// Verificar e criar sala
window.verificarECriarSala = function(nomeSala, callback) {
    const refSala = db.ref(`salas/${nomeSala}`);
    
    refSala.once('value').then(snapshot => {
        if (snapshot.exists()) {
            callback(false, 'Esta sala já existe!');
        } else {
            // Perguntar nome antes de criar
            meuNome = prompt("Digite seu nome (apelido):") || "Anônimo";
            if (!meuNome) {
                meuNome = "Anônimo";
            }
            
            // Criar nova sala
            const dadosSala = {
                nome: nomeSala,
                criador: meuNome,
                criadoEm: Date.now(),
                status: 'ativa',
                maxJogadores: 4,
                ultimaAtividade: Date.now()
            };
            
            refSala.set(dadosSala).then(() => {
                callback(true, 'Sala criada com sucesso!');
            }).catch(error => {
                callback(false, 'Erro ao criar sala: ' + error.message);
            });
        }
    }).catch(error => {
        callback(false, 'Erro ao verificar sala: ' + error.message);
    });
};

// Carregar salas disponíveis
window.carregarSalasFirebase = function(callback) {
    db.ref('salas').once('value').then(snapshot => {
        const salas = [];
        const dados = snapshot.val();
        
        if (dados) {
            for (const [nome, info] of Object.entries(dados)) {
                if (info.status !== 'inativa') {
                    // Contar jogadores ativos
                    let jogadoresCount = 0;
                    if (info.jogadores) {
                        jogadoresCount = Object.keys(info.jogadores).length;
                    }
                    
                    // Verificar se sala não está muito antiga (mais de 2 horas)
                    const duasHorasAtras = Date.now() - (2 * 60 * 60 * 1000);
                    if (info.criadoEm && info.criadoEm < duasHorasAtras && jogadoresCount === 0) {
                        // Marcar sala antiga vazia como inativa
                        db.ref(`salas/${nome}/status`).set('inativa');
                        continue;
                    }
                    
                    salas.push({
                        nome: nome,
                        jogadores: jogadoresCount,
                        criador: info.criador || 'Desconhecido',
                        criadoEm: info.criadoEm || Date.now()
                    });
                }
            }
        }
        
        // Ordenar por mais recente
        salas.sort((a, b) => b.criadoEm - a.criadoEm);
        callback(salas);
    }).catch(error => {
        console.error('Erro ao carregar salas:', error);
        callback([]);
    });
};

// Verificar jogadores ocupados na sala
window.verificarJogadoresSala = function(nomeSala, callback) {
    db.ref(`salas/${nomeSala}/jogadores`).once('value').then(snapshot => {
        const jogadores = snapshot.val() || {};
        const ocupados = Object.keys(jogadores).map(p => p.charAt(1)); // Extrair número do player
        callback(ocupados);
    }).catch(error => {
        console.error('Erro ao verificar jogadores:', error);
        callback([]);
    });
};

// Registrar jogador na sala
window.registrarJogadorSala = function(nomeSala, playerNum, personagem, callback) {
    const playerId = `p${playerNum}`;
    
    // Verificar se player já está ocupado
    db.ref(`salas/${nomeSala}/jogadores/${playerId}`).once('value').then(snapshot => {
        if (snapshot.exists()) {
            callback(false, 'Este player já está ocupado!');
            return;
        }
        
        // Pegar nome se ainda não tem
        if (!meuNome) {
            meuNome = prompt("Digite seu nome (apelido):") || `Player ${playerNum}`;
            if (!meuNome) {
                meuNome = `Player ${playerNum}`;
            }
        }
        
        // Registrar jogador
        const dadosJogador = {
            nome: meuNome,
            personagem: personagem,
            entrada: Date.now(),
            vida: 100,
            vivo: true,
            ultimaAtualizacao: Date.now(),
            x: 150 + (parseInt(playerNum) - 1) * 200, // Posição inicial
            y: 320, // CHAO
            dir: parseInt(playerNum) <= 2 ? 1 : -1
        };
        
        db.ref(`salas/${nomeSala}/jogadores/${playerId}`).set(dadosJogador).then(() => {
            salaAtual = nomeSala;
            meuPlayerId = playerId;
            meuPersonagem = personagem;
            
            // Atualizar timestamp da sala
            db.ref(`salas/${nomeSala}/ultimaAtividade`).set(Date.now());
            
            // Configurar listeners para esta sala
            configurarListenersSala(nomeSala);
            
            callback(true, 'Entrou na sala com sucesso!');
        }).catch(error => {
            callback(false, 'Erro ao entrar na sala: ' + error.message);
        });
    }).catch(error => {
        callback(false, 'Erro ao verificar sala: ' + error.message);
    });
};

// Remover jogador da sala
window.removerJogadorSala = function(nomeSala, playerNum) {
    const playerId = `p${playerNum}`;
    
    if (!salaAtual || !meuPlayerId) {
        console.log('Jogador já foi removido');
        return;
    }
    
    db.ref(`salas/${nomeSala}/jogadores/${playerId}`).remove().then(() => {
        console.log('Jogador removido da sala');
        
        // Atualizar timestamp da sala
        db.ref(`salas/${nomeSala}/ultimaAtividade`).set(Date.now());
        
        // Verificar se sala ficou vazia
        db.ref(`salas/${nomeSala}/jogadores`).once('value').then(snapshot => {
            const jogadores = snapshot.val() || {};
            if (Object.keys(jogadores).length === 0) {
                // Sala vazia - marcar como inativa após 30 segundos
                setTimeout(() => {
                    db.ref(`salas/${nomeSala}/status`).set('inativa');
                    console.log(`Sala ${nomeSala} marcada como inativa`);
                }, 30000);
            }
        });
    }).catch(error => {
        console.error('Erro ao remover jogador:', error);
    });
    
    // Limpar listeners e variáveis
    if (salaAtual === nomeSala) {
        db.ref(`salas/${nomeSala}/jogadores`).off();
        db.ref(`salas/${nomeSala}/jogo`).off();
        
        salaAtual = null;
        meuPlayerId = null;
        meuPersonagem = null;
        meuNome = "";
        jogadoresSala = {};
    }
};

// Inicializar jogo na sala
window.inicializarJogoSala = function(nomeSala, playerNum, personagem) {
    console.log(`Inicializando jogo na sala: ${nomeSala}, Player: ${playerNum}, Personagem: ${personagem}`);
    
    // Esta função será chamada pelo game.js
    if (typeof window.inicializarJogoMultiplayer === 'function') {
        window.inicializarJogoMultiplayer(nomeSala, playerNum, personagem);
    }
};

// ============================================
// CONFIGURAÇÃO DE LISTENERS DA SALA
// ============================================

function configurarListenersSala(nomeSala) {
    // Escutar mudanças nos jogadores da sala - COM THROTTLE
    let ultimaAtualizacao = 0;
    const MIN_TEMPO_ENTRE_ATUALIZACOES = 500; // 500ms
    
    db.ref(`salas/${nomeSala}/jogadores`).on('value', snapshot => {
        const agora = Date.now();
        if (agora - ultimaAtualizacao < MIN_TEMPO_ENTRE_ATUALIZACOES) {
            return; // Ignorar se for muito rápido
        }
        ultimaAtualizacao = agora;
        
        const jogadores = snapshot.val() || {};
        jogadoresSala = jogadores;
        
        // Atualizar UI com lista de jogadores
        if (typeof window.atualizarJogadoresSala === 'function') {
            window.atualizarJogadoresSala(jogadores);
        }
        
        // Sincronizar com game.js
        sincronizarJogadoresComGame(jogadores);
        
        // Atualizar timestamp da sala
        db.ref(`salas/${nomeSala}/ultimaAtividade`).set(Date.now());
    });
    
    // Escutar dados do jogo na sala
    db.ref(`salas/${nomeSala}/jogo`).on('value', snapshot => {
        const dadosJogo = snapshot.val() || {};
        
        // Sincronizar com game.js
        if (typeof window.sincronizarDadosJogo === 'function') {
            window.sincronizarDadosJogo(dadosJogo);
        }
    });
    
    // Monitorar atividade dos jogadores (remover inativos)
    setInterval(() => {
        if (salaAtual && meuPlayerId) {
            // Atualizar timestamp do jogador
            db.ref(`salas/${salaAtual}/jogadores/${meuPlayerId}/ultimaAtualizacao`).set(Date.now());
            
            // Verificar jogadores inativos (mais de 10 segundos sem atualizar)
            const agora = Date.now();
            const limiteInatividade = 10000; // 10 segundos
            
            for (const [playerId, dados] of Object.entries(jogadoresSala)) {
                if (playerId !== meuPlayerId) {
                    const ultimaAtualizacao = dados.ultimaAtualizacao || dados.entrada || 0;
                    if (agora - ultimaAtualizacao > limiteInatividade) {
                        // Jogador inativo - remover
                        db.ref(`salas/${salaAtual}/jogadores/${playerId}`).remove();
                        console.log(`Removendo jogador inativo: ${playerId}`);
                    }
                }
            }
        }
    }, 10000); // Verificar a cada 10 segundos (reduzido de 5 para 10)
}

// ============================================
// FUNÇÕES DE SINCRONIZAÇÃO PARA O GAME.JS
// ============================================

function sincronizarJogadoresComGame(jogadores) {
    // Esta função será implementada no game.js
    if (typeof window.atualizarJogadoresGame === 'function') {
        window.atualizarJogadoresGame(jogadores);
    }
}

// Enviar dados do jogador para a sala - COM RATE LIMITING
function enviarDadosJogadorSala(dados) {
    if (!salaAtual || !meuPlayerId) return;
    
    const agora = Date.now();
    if (agora - ultimoEnvio < MIN_TEMPO_ENTRE_ENVIOS) {
        return; // Rate limiting
    }
    ultimoEnvio = agora;
    
    const dadosAtualizados = {
        ...dados,
        ultimaAtualizacao: Date.now()
    };
    
    db.ref(`salas/${salaAtual}/jogadores/${meuPlayerId}`).update(dadosAtualizados).catch(error => {
        console.error('Erro ao enviar dados do jogador:', error);
    });
}

// Enviar dados do jogo para a sala
function enviarDadosJogoSala(dados) {
    if (!salaAtual) return;
    
    db.ref(`salas/${salaAtual}/jogo`).set(dados).catch(error => {
        console.error('Erro ao enviar dados do jogo:', error);
    });
}

// Exportar funções para game.js
window.firebaseSala = {
    enviarDadosJogador: enviarDadosJogadorSala,
    enviarDadosJogo: enviarDadosJogoSala,
    getSalaAtual: () => salaAtual,
    getMeuPlayerId: () => meuPlayerId,
    getMeuPersonagem: () => meuPersonagem,
    getJogadoresSala: () => jogadoresSala
};

console.log('✓ Sistema de salas multiplayer carregado!');
