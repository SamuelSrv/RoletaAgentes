document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAÇÃO ---
    const agents = [
        { name: 'Brimstone', image: 'img/agents/Brimstone_icon.webp', role: 'Controlador' },
        { name: 'Phoenix', image: 'img/agents/Phoenix_icon.webp', role: 'Duelista' },
        { name: 'Sage', image: 'img/agents/Sage_icon.webp', role: 'Sentinela' },
        { name: 'Sova', image: 'img/agents/Sova_icon.webp', role: 'Iniciador' },
        { name: 'Viper', image: 'img/agents/Viper_icon.webp', role: 'Controlador' },
        { name: 'Cypher', image: 'img/agents/Cypher_icon.webp', role: 'Sentinela' },
        { name: 'Reyna', image: 'img/agents/Reyna_icon.webp', role: 'Duelista' },
        { name: 'Killjoy', image: 'img/agents/Killjoy_icon.webp', role: 'Sentinela' },
        { name: 'Breach', image: 'img/agents/Breach_icon.webp', role: 'Iniciador' },
        { name: 'Omen', image: 'img/agents/Omen_icon.webp', role: 'Controlador' },
        { name: 'Jett', image: 'img/agents/Jett_icon.webp', role: 'Duelista' },
        { name: 'Raze', image: 'img/agents/Raze_icon.webp', role: 'Duelista' },
        { name: 'Skye', image: 'img/agents/Skye_icon.webp', role: 'Iniciador' },
        { name: 'Yoru', image: 'img/agents/Yoru_icon.webp', role: 'Duelista' },
        { name: 'Astra', image: 'img/agents/Astra_icon.webp', role: 'Controlador' },
        { name: 'KAY/O', image: 'img/agents/KAYO_icon.webp', role: 'Iniciador' },
        { name: 'Chamber', image: 'img/agents/Chamber_icon.webp', role: 'Sentinela' },
        { name: 'Neon', image: 'img/agents/Neon_icon.webp', role: 'Duelista' },
        { name: 'Fade', image: 'img/agents/Fade_icon.webp', role: 'Iniciador' },
        { name: 'Harbor', image: 'img/agents/Harbor_icon.webp', role: 'Controlador' },
        { name: 'Gekko', image: 'img/agents/Gekko_icon.webp', role: 'Iniciador' },
        { name: 'Deadlock', image: 'img/agents/Deadlock_icon.webp', role: 'Sentinela' },
        { name: 'Iso', image: 'img/agents/Iso_icon.webp', role: 'Duelista' },
        { name: 'Clove', image: 'img/agents/Clove_icon.webp', role: 'Controlador' }
    ];

    const players = [
        { name: 'Tavin', photo: 'img/players/player1.jpg' },
        { name: 'Nandin', photo: 'img/players/player2.jpg' },
        { name: 'Dryco', photo: 'img/players/player3.jpg' },
        { name: 'Japa', photo: 'img/players/player4.jpg' }
    ];
    // --- FIM DA CONFIGURAÇÃO ---

    // Elementos do DOM
    const roulette = document.getElementById('roulette');
    const spinButton = document.getElementById('spinButton');
    const playersList = document.getElementById('playersList');
    const agentBlockList = document.getElementById('agentBlockList');
    const toggleBlockListBtn = document.getElementById('toggleBlockListBtn');
    const filterButtonsContainer = document.getElementById('filterButtons');
    const historySection = document.getElementById('historySection');
    const historyList = document.getElementById('historyList');

    const agentImageHeight = 75;

    // Variáveis de Estado
    let isRoundInProgress = false;
    let availableAgents = [];
    let currentPlayerIndex = 0;
    let currentTeam = {}; // Guarda o agente de cada player na rodada
    let teamHistory = []; // Guarda o histórico de times
    let rerollsLeft = {}; // Guarda os rerolls de cada player

    // --- FUNÇÕES DE INICIALIZAÇÃO ---

    function initialize() {
        createPlayerCards();
        populateBlockList();
        setupEventListeners();
        setupRoulette();
    }

    function createPlayerCards() {
        playersList.innerHTML = '';
        players.forEach((player, index) => {
            const card = document.createElement('div');
            card.className = 'player-card';
            card.id = `player-card-${index}`;
            card.innerHTML = `
                <div class="player-info">
                    <img src="${player.photo}" alt="Foto de ${player.name}" class="player-photo">
                    <span class="player-name">${player.name}</span>
                </div>
                <div id="player-result-${index}" class="agent-result"></div>
            `;
            playersList.appendChild(card);
        });
    }
    
    function populateBlockList() {
        agents.forEach(agent => {
            const item = document.createElement('div');
            item.className = 'block-item';
            item.innerHTML = `
                <input type="checkbox" id="block-${agent.name}" name="block-${agent.name}" data-agent-name="${agent.name}">
                <label for="block-${agent.name}">${agent.name}</label>
            `;
            agentBlockList.appendChild(item);
        });
    }
    
    function setupEventListeners() {
        spinButton.addEventListener('click', startRound);
        toggleBlockListBtn.addEventListener('click', () => agentBlockList.classList.toggle('hidden'));
        filterButtonsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                document.querySelector('.filter-btn.active').classList.remove('active');
                e.target.classList.add('active');
            }
        });
    }

    function setupRoulette() {
        const allAgentsForRoulette = [...agents, ...agents, ...agents, ...agents];
        roulette.innerHTML = allAgentsForRoulette.map(agent => `<img src="${agent.image}" alt="${agent.name}">`).join('');
    }

    // --- LÓGICA DA RODADA ---

    function startRound() {
        if (isRoundInProgress) return;

        // 1. Montar a lista de agentes disponíveis baseada nos filtros
        const activeFilter = document.querySelector('.filter-btn.active').dataset.role;
        const blockedAgents = Array.from(document.querySelectorAll('#agentBlockList input:checked')).map(cb => cb.dataset.agentName);
        
        let filteredAgents = agents.filter(agent => !blockedAgents.includes(agent.name));
        if (activeFilter !== 'Todos') {
            filteredAgents = filteredAgents.filter(agent => agent.role === activeFilter);
        }

        if (filteredAgents.length < players.length) {
            alert("Erro: Não há agentes suficientes para todos os players com os filtros atuais!");
            return;
        }

        // 2. Iniciar o estado da rodada
        isRoundInProgress = true;
        spinButton.disabled = true;
        spinButton.textContent = 'GIRANDO...';
        clearPlayerResults();
        
        availableAgents = [...filteredAgents];
        currentPlayerIndex = 0;
        currentTeam = {};
        players.forEach((_, index) => rerollsLeft[index] = 1); // 1 reroll por jogador

        // 3. Iniciar o primeiro giro
        spinForCurrentPlayer();
    }
    
    function spinForCurrentPlayer(isReroll = false, playerIndexToReroll = -1) {
        const targetPlayerIndex = isReroll ? playerIndexToReroll : currentPlayerIndex;

        // Destaque do jogador ativo
        document.getElementById(`player-card-${targetPlayerIndex}`).classList.add('active');
        
        // Sorteia o agente
        const winnerIndex = Math.floor(Math.random() * availableAgents.length);
        const winner = availableAgents[winnerIndex];
        availableAgents.splice(winnerIndex, 1);
        currentTeam[targetPlayerIndex] = winner;

        // Animação da Roleta
        const allRouletteImages = Array.from(roulette.querySelectorAll('img'));
        const targetImgIndex = allRouletteImages.findIndex((img, index) => index >= agents.length && img.alt === winner.name);
        const finalPosition = (targetImgIndex * agentImageHeight);
        
        roulette.style.transition = 'none';
        roulette.style.transform = `translateY(0)`;
        
        setTimeout(() => {
            roulette.style.transition = 'transform 5s cubic-bezier(.15,.9,.32,1)';
            roulette.style.transform = `translateY(-${finalPosition}px)`;
        }, 50);

        // Após a animação
        setTimeout(() => {
            displayResult(targetPlayerIndex, winner);
            
            if (!isReroll) {
                currentPlayerIndex++;
                if (currentPlayerIndex < players.length) {
                    setTimeout(spinForCurrentPlayer, 1000); // Próximo jogador
                } else {
                    finishRound();
                }
            }
        }, 5500); // Tempo um pouco maior que a animação
    }

    function rerollForPlayer(playerIndex) {
        if (rerollsLeft[playerIndex] <= 0 || !isRoundInProgress) return;

        rerollsLeft[playerIndex]--;
        
        // Devolve o agente antigo para a lista de disponíveis
        const oldAgent = currentTeam[playerIndex];
        availableAgents.push(oldAgent);

        // Limpa o resultado antigo e gira novamente
        const resultDisplay = document.getElementById(`player-result-${playerIndex}`);
        resultDisplay.innerHTML = '';
        resultDisplay.classList.remove('visible');
        
        spinForCurrentPlayer(true, playerIndex);
    }

    function finishRound() {
        isRoundInProgress = false;
        spinButton.disabled = false;
        spinButton.textContent = 'INICIAR NOVA RODADA';
        saveAndDisplayHistory();
        document.querySelectorAll('.reroll-btn').forEach(btn => btn.disabled = true);
    }
    
    // --- FUNÇÕES DE EXIBIÇÃO E UTILIDADE ---

    function displayResult(playerIndex, agent) {
        const resultDisplay = document.getElementById(`player-result-${playerIndex}`);
        resultDisplay.innerHTML = `
            <img src="${agent.image}" alt="${agent.name}">
            <div class="agent-details">
                <span class="agent-name">${agent.name}</span>
                <span class="agent-role">${agent.role}</span>
            </div>
            <button class="reroll-btn" id="reroll-btn-${playerIndex}" title="1 reroll restante">↻</button>
        `;
        resultDisplay.classList.add('visible');

        document.getElementById(`reroll-btn-${playerIndex}`).addEventListener('click', (event) => {
            rerollForPlayer(playerIndex);
            event.target.disabled = true;
            event.target.title = "Sem rerolls restantes";
        });

        // Remove o destaque do jogador anterior (se houver)
        if (playerIndex > 0 && !document.getElementById(`player-card-${playerIndex}`).classList.contains('rerolling')) {
            document.getElementById(`player-card-${playerIndex - 1}`).classList.remove('active');
        }
    }

    function saveAndDisplayHistory() {
        const teamString = players.map((player, index) => `${player.name}: ${currentTeam[index].name}`).join(', ');
        teamHistory.unshift(teamString); // Adiciona no início
        if(teamHistory.length > 5) teamHistory.pop(); // Mantém apenas os últimos 5

        historyList.innerHTML = teamHistory.map(entry => `<div class="history-entry"><p>${entry}</p></div>`).join('');
        historySection.classList.remove('hidden');
    }

    function clearPlayerResults() {
        document.querySelectorAll('.player-card').forEach(card => card.classList.remove('active'));
        players.forEach((_, index) => {
            const resultDisplay = document.getElementById(`player-result-${index}`);
            if(resultDisplay) {
                resultDisplay.innerHTML = '';
                resultDisplay.classList.remove('visible');
            }
        });
    }

    // --- INICIA A APLICAÇÃO ---
    initialize();
});