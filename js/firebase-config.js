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
// FUNÇÕES SIMPLIFICADAS PARA O SISTEMA DE SALAS
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
            
            // Configurar listener simples para esta sala
            configurarListenerSalaSimples(nomeSala);
            
            callback(true, 'Entrou na sala com sucesso!');
        }).catch(error => {
            callback(false, 'Erro ao entrar na sala: ' + error.message);
        });
    });
};

// Remover jogador da sala
window.removerJogadorSala = function(nomeSala, playerNum) {
    const playerId = `p${playerNum}`;
    
    if (!salaAtual || !meuPlayerId) return;
    
    db.ref(`salas/${nomeSala}/jogadores/${playerId}`).remove().then(() => {
        console.log('Jogador removido da sala');
        
        // Remover listener
        db.ref(`salas/${nomeSala}/jogadores`).off();
        
        // Limpar variáveis
        salaAtual = null;
        meuPlayerId = null;
        meuPersonagem = null;
    });
};

// Inicializar jogo na sala
window.inicializarJogoSala = function(nomeSala, playerNum, personagem) {
    console.log(`Inicializando jogo na sala: ${nomeSala}, Player: ${playerNum}, Personagem: ${personagem}`);
    
    if (typeof window.inicializarJogoMultiplayer === 'function') {
        window.inicializarJogoMultiplayer(nomeSala, playerNum, personagem);
    }
};

// ============================================
// LISTENER SIMPLIFICADO DA SALA
// ============================================

function configurarListenerSalaSimples(nomeSala) {
    // Escutar mudanças nos jogadores da sala - SIMPLES
    db.ref(`salas/${nomeSala}/jogadores`).on('value', snapshot => {
        const jogadores = snapshot.val() || {};
        
        // Sincronizar com game.js
        if (typeof window.atualizarJogadoresGame === 'function') {
            window.atualizarJogadoresGame(jogadores);
        }
    });
}

// Exportar funções para game.js
window.firebaseSala = {
    getSalaAtual: () => salaAtual,
    getMeuPlayerId: () => meuPlayerId,
    getMeuPersonagem: () => meuPersonagem
};

console.log('✓ Sistema de salas multiplayer SIMPLIFICADO carregado!');
