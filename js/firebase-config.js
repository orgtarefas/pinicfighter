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

// Seleção do jogador
let meuId, inimigoId;

// Pergunta ao usuário
const meuPlayer = prompt("Digite 1 para Player 1 ou 2 para Player 2");
if (meuPlayer === "1") {
    meuId = "p1";
    inimigoId = "p2";
} else if (meuPlayer === "2") {
    meuId = "p2";
    inimigoId = "p1";
} else {
    // Default para Player 1 se resposta inválida
    meuId = "p1";
    inimigoId = "p2";
    alert("Resposta inválida. Você será o Player 1.");
}
