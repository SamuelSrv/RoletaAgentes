document.addEventListener('DOMContentLoaded', () => {
    // --- PASSO 1: COLE A SUA CONFIGURAÇÃO DO FIREBASE AQUI ---
    const firebaseConfig = {
        apiKey: "AIzaSyAmQvUnFkO0h7TcAEEoxKizmFUAzahbc34",
        authDomain: "roleta-valorant-sync.firebaseapp.com",
        databaseURL: "https://roleta-valorant-sync-default-rtdb.firebaseio.com",
        projectId: "roleta-valorant-sync",
        storageBucket: "roleta-valorant-sync.firebasestorage.app",
        messagingSenderId: "884907533630",
        appId: "1:884907533630:web:9478d68833a6b076a4786f",
        measurementId: "G-MTQRB6FYW5"
    };

    // --- FIM DA CONFIGURAÇÃO DO FIREBASE ---

    // Inicializa o Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // Referência para a nossa "sala" no banco de dados
    const roomRef = database.ref('roleta/sala_unica');

    // --- CONFIGURAÇÃO DO JOGO (Mesma de antes) ---
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
        { name: 'Tavin', photo: 'img/players/player1.png' },
        { name: 'Nandin', photo: 'img/players/player2.png' },
        { name: 'Dryco', photo: 'img/players/player3.png' },
        { name: 'Japa', photo: 'img/players/player4.png' }
    ];

    // --- Elementos do DOM ---
    const roulette = document.getElementById('roulette');
    const spinButton = document.getElementById('spinButton');
    const playersList = document.getElementById('playersList');
    const agentBlockList = document.getElementById('agentBlockList');
    const toggleBlockListBtn = document.getElementById('toggleBlockListBtn');
    const filterButtonsContainer = document.getElementById('filterButtons');
    const roomStatusEl = document.getElementById('room-status');

    const agentImageHeight = 75;
    let localState = {}; // Guarda o estado atual para evitar re-renderizações desnecessárias
    let isHost = false; // O usuário é o host da sala?
    let currentAnimationTimeout = null; // Para controlar as animações

    // --- FUNÇÕES DE INICIALIZAÇÃO ---

    function initialize() {
        createPlayerCards(); // Cria a estrutura visual dos players
        populateBlockList(); // Cria a estrutura visual dos bloqueios
        setupRoulette();     // Popula a roleta visualmente
        checkHostStatus();   // Verifica se o usuário é o primeiro a chegar
        listenToRoomChanges(); // A função mais importante: ouve as mudanças no Firebase
    }

    function checkHostStatus() {
        roomRef.transaction(currentData => {
            if (currentData === null) {
                // Se a sala não existe, este usuário é o host
                isHost = true;
                // Cria o estado inicial da sala
                return {
                    hostId: Math.random().toString(36).substr(2, 9),
                    status: 'waiting', // waiting, spinning, finished
                    activeFilter: 'Todos',
                    blockedAgents: [],
                    teamResult: null,
                    spinTimestamp: 0 // Para sincronizar a animação
                };
            }
            // Se a sala já existe, o usuário não é o host
            isHost = false;
            return; // Aborta a transação
        }).then(result => {
            if (result.committed && isHost) {
                console.log("Você é o host da sala!");
                setupHostControls();
            } else if (!isHost) {
                console.log("Você é um espectador.");
                disableHostControls();
            }
        });
    }

    // Apenas o host pode clicar nos botões de controle
    function setupHostControls() {
        spinButton.addEventListener('click', startRound);
        toggleBlockListBtn.addEventListener('click', () => agentBlockList.classList.toggle('hidden'));

        filterButtonsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                const newFilter = e.target.dataset.role;
                roomRef.child('activeFilter').set(newFilter);
            }
        });

        agentBlockList.addEventListener('change', () => {
            const blockedAgents = Array.from(document.querySelectorAll('#agentBlockList input:checked')).map(cb => cb.dataset.agentName);
            roomRef.child('blockedAgents').set(blockedAgents);
        });
    }

    // Espectadores têm os botões desabilitados
    function disableHostControls() {
        document.querySelectorAll('.filter-btn, #agentBlockList input, #toggleBlockListBtn').forEach(el => {
            el.disabled = true;
        });
        spinButton.textContent = "Aguardando o Host...";
        spinButton.disabled = true;
    }

    // --- FUNÇÃO PRINCIPAL: OUVINTE DO FIREBASE ---

    function listenToRoomChanges() {
        roomRef.on('value', (snapshot) => {
            const roomData = snapshot.val();
            if (!roomData) return; // Sala ainda não foi inicializada

            localState = roomData; // Atualiza nosso estado local

            // Atualiza a UI com os dados do Firebase
            updateUIFromState();
        });
    }

    // --- ATUALIZAÇÃO DA INTERFACE ---

    function updateUIFromState() {
        // Atualiza o filtro ativo
        document.querySelector('.filter-btn.active').classList.remove('active');
        document.querySelector(`.filter-btn[data-role="${localState.activeFilter}"]`).classList.add('active');

        // Atualiza os agentes bloqueados
        document.querySelectorAll('#agentBlockList input').forEach(checkbox => {
            checkbox.checked = localState.blockedAgents && localState.blockedAgents.includes(checkbox.dataset.agentName);
        });

        // Controla o estado do jogo (a parte mais complexa)
        handleGameState();
    }

    function handleGameState() {
        clearTimeout(currentAnimationTimeout); // Limpa qualquer animação anterior

        switch (localState.status) {
            case 'waiting':
                roomStatusEl.textContent = "Aguardando para iniciar a rodada...";
                if (isHost) {
                    spinButton.disabled = false;
                    spinButton.textContent = 'INICIAR RODADA!';
                }
                clearPlayerResults();
                break;

            case 'spinning':
                roomStatusEl.textContent = `Sorteando agentes...`;
                spinButton.disabled = true;
                spinButton.textContent = 'GIRANDO...';
                clearPlayerResults();
                animateSpinning();
                break;

            case 'finished':
                roomStatusEl.textContent = `Time definido!`;
                if (isHost) {
                    spinButton.disabled = false;
                    spinButton.textContent = 'INICIAR NOVA RODADA';
                }
                displayFinalResults();
                break;
        }
    }

    // --- LÓGICA DO JOGO (EXECUTADA APENAS PELO HOST) ---

    function startRound() {
        if (!isHost) return;

        // Monta a lista de agentes disponíveis
        let filteredAgents = agents.filter(agent => !localState.blockedAgents.includes(agent.name));
        if (localState.activeFilter !== 'Todos') {
            filteredAgents = filteredAgents.filter(agent => agent.role === localState.activeFilter);
        }

        if (filteredAgents.length < players.length) {
            alert("Erro: Não há agentes suficientes para todos os players com os filtros atuais!");
            return;
        }

        // Sorteia o time
        const available = [...filteredAgents];
        const teamResult = {};
        players.forEach((player, index) => {
            const winnerIndex = Math.floor(Math.random() * available.length);
            teamResult[index] = available.splice(winnerIndex, 1)[0];
        });

        // Atualiza o Firebase, o que vai disparar a animação para todos
        roomRef.update({
            status: 'spinning',
            teamResult: teamResult,
            spinTimestamp: firebase.database.ServerValue.TIMESTAMP // Usa o tempo do servidor para sincronia
        });
    }

    // --- ANIMAÇÕES E EXIBIÇÃO DE RESULTADOS (EXECUTADO POR TODOS) ---

    function animateSpinning() {
        let currentPlayerIndex = 0;

        function spinForNextPlayer() {
            if (currentPlayerIndex >= players.length) {
                // Quando terminar a última animação, o host atualiza o estado para 'finished'
                if (isHost) {
                    roomRef.child('status').set('finished');
                }
                return;
            }

            const card = document.getElementById(`player-card-${currentPlayerIndex}`);
            if (card) card.classList.add('active');

            const winner = localState.teamResult[currentPlayerIndex];

            // Animação da roleta
            const allRouletteImages = Array.from(roulette.querySelectorAll('img'));
            const targetImgIndex = allRouletteImages.findIndex((img, index) => index >= agents.length && img.alt === winner.name);
            const finalPosition = (targetImgIndex * agentImageHeight);

            roulette.style.transition = 'none';
            roulette.style.transform = `translateY(0)`;

            setTimeout(() => {
                roulette.style.transition = 'transform 4s cubic-bezier(.15,.9,.32,1)';
                roulette.style.transform = `translateY(-${finalPosition}px)`;
            }, 50);

            // Após a animação, mostra o resultado e chama o próximo
            currentAnimationTimeout = setTimeout(() => {
                displaySingleResult(currentPlayerIndex, winner);
                if (currentPlayerIndex > 0) {
                    document.getElementById(`player-card-${currentPlayerIndex - 1}`).classList.remove('active');
                }
                currentPlayerIndex++;
                spinForNextPlayer();
            }, 4500);
        }

        spinForNextPlayer();
    }

    // Mostra o resultado de apenas um jogador durante a animação
    function displaySingleResult(playerIndex, agent) {
        const resultDisplay = document.getElementById(`player-result-${playerIndex}`);
        resultDisplay.innerHTML = `
            <img src="${agent.image}" alt="${agent.name}">
            <div class="agent-details">
                <span class="agent-name">${agent.name}</span>
                <span class="agent-role">${agent.role}</span>
            </div>
        `;
        resultDisplay.classList.add('visible');
    }

    // Mostra todos os resultados de uma vez quando o estado é 'finished'
    function displayFinalResults() {
        clearPlayerResults();
        players.forEach((_, index) => {
            if (localState.teamResult[index]) {
                displaySingleResult(index, localState.teamResult[index]);
            }
        });
        document.querySelectorAll('.player-card').forEach(card => card.classList.remove('active'));
    }

    function clearPlayerResults() {
        document.querySelectorAll('.player-card.active').forEach(card => card.classList.remove('active'));
        players.forEach((_, index) => {
            const resultDisplay = document.getElementById(`player-result-${index}`);
            if (resultDisplay) resultDisplay.classList.remove('visible');
        });
    }


    // --- FUNÇÕES DE SETUP VISUAL (Não precisam de sincronização) ---
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

    function setupRoulette() {
        const allAgentsForRoulette = [...agents, ...agents, ...agents, ...agents];
        roulette.innerHTML = allAgentsForRoulette.map(agent => `<img src="${agent.image}" alt="${agent.name}">`).join('');
    }

    // --- INICIA A APLICAÇÃO ---
    initialize();
});