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

// Variáveis globais
let meuId = null;
let inimigoId = null;
let meuPersonagem = null;
let inimigoPersonagem = null;
let aguardandoInimigo = false;

// Função chamada pela tela de seleção
window.iniciarJogoComSelecao = function(playerSelecionado, personagemSelecionado) {
    // Define os IDs baseados na seleção
    if (playerSelecionado === "1") {
        meuId = "p1";
        inimigoId = "p2";
    } else {
        meuId = "p2";
        inimigoId = "p1";
    }
    
    meuPersonagem = personagemSelecionado;
    
    console.log(`Você é Player ${playerSelecionado} (${meuId})`);
    console.log(`Personagem escolhido: ${meuPersonagem}`);
    
    // Envia escolha para Firebase
    enviarEscolhaParaFirebase();
    
    // Aguarda escolha do inimigo
    aguardarEscolhaInimigo();
};

// Envia escolha para Firebase
function enviarEscolhaParaFirebase() {
    db.ref("selecoes/" + meuId).set({
        personagem: meuPersonagem,
        tempo: Date.now(),
        pronto: true
    });
}

// Aguarda escolha do inimigo
function aguardarEscolhaInimigo() {
    db.ref("selecoes/" + inimigoId).on("value", s => {
        const dados = s.val();
        if (dados && dados.pronto) {
            inimigoPersonagem = dados.personagem;
            console.log(`Inimigo escolheu: ${inimigoPersonagem}`);
            
            // Remove os listeners para evitar chamadas múltiplas
            db.ref("selecoes/" + inimigoId).off();
            
            // Inicia o jogo
            iniciarJogo();
        }
    });
}

// Inicia o jogo principal
function iniciarJogo() {
    // Chama função do game.js para inicializar os jogadores
    if (typeof window.inicializarJogadoresComPersonagens === 'function') {
        window.inicializarJogadoresComPersonagens(meuId, meuPersonagem, inimigoId, inimigoPersonagem);
    }
    
    // Mostra a tela do jogo
    if (typeof window.mostrarJogoPrincipal === 'function') {
        window.mostrarJogoPrincipal();
    }
}

// Limpa seleções antigas ao carregar
db.ref("selecoes").remove();
