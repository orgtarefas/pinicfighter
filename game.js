<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Pinico Fighter</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="logo">
        <img src="imagens/logo.png">
    </div>
    
    <canvas id="game"></canvas>
    
    <div class="instrucoes">
        <h3>Controles</h3>
        <div class="controles">
            <div class="controle-jogador">
                <h4>Player 1 (Azul)</h4>
                <p>Movimento: <span class="tecla">A</span> <span class="tecla">D</span></p>
                <p>Pulo: <span class="tecla">W</span></p>
                <p>Soco: <span class="tecla">F</span></p>
                <p>Chute: <span class="tecla">C</span></p>
                <p>Bomba: <span class="tecla">W</span> + <span class="tecla">S</span></p>
            </div>
            <div class="controle-jogador">
                <h4>Player 2 (Vermelho)</h4>
                <p>Movimento: <span class="tecla">←</span> <span class="tecla">→</span></p>
                <p>Pulo: <span class="tecla">↑</span></p>
                <p>Soco: <span class="tecla">Enter</span></p>
                <p>Chute: <span class="tecla">.</span></p>
                <p>Bomba: <span class="tecla">↑</span> + <span class="tecla">↓</span></p>
            </div>
        </div>
        <p>Pressione P para pausar | ESC para menu | R para reiniciar</p>
    </div>
    
    <div class="loading" id="loading">
        <div class="spinner"></div>
        <p>Carregando jogo...</p>
    </div>
    
    <!-- Firebase -->
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
    
    <!-- Arquivos do jogo (mantenha os que você já tem) -->
    <script src="utils.js"></script>
    <script src="coco-projetil.js"></script>
    <script src="player.js"></script>
    
    <!-- Novo arquivo principal do jogo -->
    <script src="game.js"></script>
    
    <script>
        // Esconde tela de loading quando tudo carregar
        window.addEventListener('load', () => {
            document.getElementById('loading').classList.add('hidden');
        });
    </script>
</body>
</html>