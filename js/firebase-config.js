// Configuração SIMPLIFICADA do Firebase
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

// ============================================
// FUNÇÕES PARA O SISTEMA DE SALAS
// ============================================

// Verificar e criar sala
window.verificarECriarSala = function(nomeSala, callback) {
    const refSala = db.ref(`salas/${nomeSala}`);
    
    refSala.once('value').then(snapshot => {
        if (snapshot.exists()) {
            callback(false, 'Esta sala já existe!');
        } else {
            // Criar nova sala
            const dadosSala = {
                nome: nomeSala,
                criadoEm: Date.now(),
                status: 'ativa'
            };
            
            refSala.set(dadosSala).then(() => {
                callback(true, 'Sala criada com sucesso!');
            }).catch(error => {
                callback(false, 'Erro ao criar sala: ' + error.message);
            });
        }
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
                    
                    salas.push({
                        nome: nome,
                        jogadores: jogadoresCount,
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
        const ocupados = Object.keys(jogadores).map(p => p.charAt(1));
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
        
        // Registrar jogador
        const dadosJogador = {
            personagem: personagem,
            entrada: Date.now(),
            vida: 100,
            vivo: true
        };
        
        db.ref(`salas/${nomeSala}/jogadores/${playerId}`).set(dadosJogador).then(() => {
            salaAtual = nomeSala;
            meuPlayerId = playerId;
            meuPersonagem = personagem;
            
            // Configurar listener para esta sala
            configurarListenerSala(nomeSala);
            
            // Configurar eventos para quando a página for fechada/atualizada
            configurarEventosSaida();
            
            callback(true, 'Entrou na sala com sucesso!');
        }).catch(error => {
            callback(false, 'Erro ao entrar na sala: ' + error.message);
        });
    });
};

// ============================================
// REMOVER JOGADOR AO SAIR/ATUALIZAR
// ============================================

// Função para remover jogador da sala
function removerJogadorDaSala() {
    if (!salaAtual || !meuPlayerId) return;
    
    console.log('🗑️ Removendo jogador da sala:', meuPlayerId);
    
    // Remover jogador do Firebase
    db.ref(`salas/${salaAtual}/jogadores/${meuPlayerId}`).remove().then(() => {
        console.log('✅ Jogador removido com sucesso');
        
        // Verificar se sala ficou vazia
        db.ref(`salas/${salaAtual}/jogadores`).once('value').then(snapshot => {
            const jogadores = snapshot.val() || {};
            if (Object.keys(jogadores).length === 0) {
                // Sala vazia - marcar como inativa após 30 segundos
                setTimeout(() => {
                    db.ref(`salas/${salaAtual}/status`).set('inativa');
                    console.log(`🏁 Sala ${salaAtual} marcada como inativa`);
                }, 30000);
            }
        });
    }).catch(error => {
        console.error('❌ Erro ao remover jogador:', error);
    });
    
    // Limpar listeners e variáveis
    db.ref(`salas/${salaAtual}/jogadores`).off();
    salaAtual = null;
    meuPlayerId = null;
    meuPersonagem = null;
}

// Configurar eventos para quando a página for fechada/atualizada
function configurarEventosSaida() {
    // Evento antes de fechar a página
    window.addEventListener('beforeunload', function(e) {
        removerJogadorDaSala();
        
        // Alguns navegadores exigem returnValue
        e.preventDefault();
        e.returnValue = '';
    });
    
    // Evento quando a página está sendo descarregada
    window.addEventListener('unload', function() {
        removerJogadorDaSala();
    });
    
    // Evento quando a página está ficando visível/invisível (mudança de aba)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Página não está visível (usuário mudou de aba)
            // Podemos remover após um tempo se quiser
            // console.log('Página não está visível');
        }
    });
    
    // Evento personalizado para sair da sala (botão de sair)
    window.addEventListener('sairSala', function() {
        removerJogadorDaSala();
    });
}

// Remover jogador da sala (chamado pelo HTML)
window.removerJogadorSala = function(nomeSala, playerNum) {
    if (salaAtual === nomeSala && meuPlayerId === `p${playerNum}`) {
        removerJogadorDaSala();
    }
};

// ============================================
// LISTENER DA SALA
// ============================================

function configurarListenerSala(nomeSala) {
    // Escutar mudanças nos jogadores da sala
    db.ref(`salas/${nomeSala}/jogadores`).on('value', snapshot => {
        const jogadores = snapshot.val() || {};
        
        // Sincronizar com game.js
        if (typeof window.atualizarJogadoresGame === 'function') {
            window.atualizarJogadoresGame(jogadores);
        }
    });
}

// Inicializar jogo na sala
window.inicializarJogoSala = function(nomeSala, playerNum, personagem) {
    console.log(`🎮 Inicializando jogo na sala: ${nomeSala}, Player: ${playerNum}, Personagem: ${personagem}`);
    
    if (typeof window.inicializarJogoMultiplayer === 'function') {
        window.inicializarJogoMultiplayer(nomeSala, playerNum, personagem);
    }
};

// Exportar funções para game.js
window.firebaseSala = {
    getSalaAtual: () => salaAtual,
    getMeuPlayerId: () => meuPlayerId,
    getMeuPersonagem: () => meuPersonagem
};

console.log('✅ Sistema de salas com remoção automática carregado!');
