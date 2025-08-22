document.addEventListener('DOMContentLoaded', () => {
    // --- IMPORTANTE: COLE A SUA CONFIGURAÇÃO DO FIREBASE AQUI ---
    // Vá no seu projeto no Firebase -> Configurações do Projeto -> Geral
    // E copie o objeto 'firebaseConfig' aqui dentro.
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
    
    // Referência para a nossa "sala" no banco de dados.
    const roomRef = database.ref('roleta/sala_unica');

    // --- CONFIGURAÇÃO DO JOGO ---
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
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    const restartRoundBtn = document.getElementById('restartRoundBtn'); // ✅ NOVO: Pega o botão de reiniciar
    
    const agentImageHeight = 75;
    let localState = {};
    let currentAnimationTimeout = null;

    function initialize() {
        createPlayerCards();
        populateBlockList();
        setupRoulette();
        setupEventListeners();
        listenToRoomChanges();
        resetRoomIfNeeded();
    }

    function resetRoomIfNeeded() {
        roomRef.child('status').on('value', snapshot => {
            if (snapshot.val() === 'spinning') {
                setTimeout(() => {
                    roomRef.transaction(currentData => {
                        if (currentData && currentData.status === 'spinning') {
                            console.warn("A sala estava travada. Resetando o estado.");
                            return { ...currentData, status: 'finished' };
                        }
                        return currentData;
                    });
                }, 30000);
            }
        });
    }

    function setupEventListeners() {
        spinButton.addEventListener('click', tryStartRound);
        toggleBlockListBtn.addEventListener('click', () => agentBlockList.classList.toggle('hidden'));
        
        resetSettingsBtn.addEventListener('click', () => {
            if (localState.status !== 'spinning') {
                roomRef.update({
                    activeFilter: 'Todos',
                    blockedAgents: []
                });
            }
        });

        // ✅ NOVO: Event listener para o botão de reiniciar rodada
        restartRoundBtn.addEventListener('click', () => {
            if (localState.status === 'finished') {
                // Apenas volta o estado para 'waiting', limpando os resultados
                roomRef.update({
                    status: 'waiting',
                    teamResult: null
                });
            }
        });

        filterButtonsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn') && localState.status !== 'spinning') {
                const newFilter = e.target.dataset.role;
                roomRef.child('activeFilter').set(newFilter);
            }
        });

        agentBlockList.addEventListener('change', () => {
            if (localState.status !== 'spinning') {
                const blockedAgents = Array.from(document.querySelectorAll('#agentBlockList input:checked')).map(cb => cb.dataset.agentName);
                roomRef.child('blockedAgents').set(blockedAgents);
            }
        });
    }

    function listenToRoomChanges() {
        roomRef.on('value', (snapshot) => {
            let roomData = snapshot.val();
            if (!roomData) {
                roomData = { status: 'waiting', activeFilter: 'Todos', blockedAgents: [], teamResult: null };
                roomRef.set(roomData);
            }
            localState = roomData;
            updateUIFromState();
        });
    }

    function updateUIFromState() {
        if (document.querySelector('.filter-btn.active')) {
            document.querySelector('.filter-btn.active').classList.remove('active');
        }
        document.querySelector(`.filter-btn[data-role="${localState.activeFilter}"]`).classList.add('active');

        document.querySelectorAll('#agentBlockList input').forEach(checkbox => {
            checkbox.checked = localState.blockedAgents && localState.blockedAgents.includes(checkbox.dataset.agentName);
        });

        handleGameState();
    }
    
    function handleGameState() {
        clearTimeout(currentAnimationTimeout);
        
        const isSpinning = localState.status === 'spinning';
        const isFinished = localState.status === 'finished';

        // Desabilita os controles de configuração enquanto gira
        document.querySelectorAll('.filter-btn, #agentBlockList input, #toggleBlockListBtn, .reset-btn').forEach(el => el.disabled = isSpinning);
        spinButton.disabled = isSpinning;
        
        // Controla a visibilidade do botão de reiniciar
        restartRoundBtn.style.display = isFinished ? 'block' : 'none';

        switch(localState.status) {
            case 'waiting':
                roomStatusEl.textContent = "Aperte o botão para iniciar a rodada!";
                spinButton.textContent = 'INICIAR RODADA!';
                clearPlayerResults();
                break;
            
            case 'spinning':
                roomStatusEl.textContent = `Sorteando agentes...`;
                spinButton.textContent = 'GIRANDO...';
                clearPlayerResults();
                animateSpinning();
                break;

            case 'finished':
                roomStatusEl.textContent = `Time definido!`;
                spinButton.textContent = 'INICIAR NOVA RODADA';
                displayFinalResults();
                break;
        }
    }

    function tryStartRound() {
        roomRef.transaction(currentData => {
            if (currentData && currentData.status === 'spinning') return;

            if (!currentData || currentData.status === 'waiting' || currentData.status === 'finished') {
                const blockedAgents = currentData.blockedAgents || [];
                let filteredAgents = agents.filter(agent => !blockedAgents.includes(agent.name));
                if (currentData.activeFilter !== 'Todos') {
                    filteredAgents = filteredAgents.filter(agent => agent.role === currentData.activeFilter);
                }

                if (filteredAgents.length < players.length) {
                    alert("Erro: Não há agentes suficientes para todos os players com os filtros atuais!");
                    return;
                }
                
                const available = [...filteredAgents];
                const teamResult = {};
                players.forEach((player, index) => {
                    const winnerIndex = Math.floor(Math.random() * available.length);
                    teamResult[index] = available.splice(winnerIndex, 1)[0];
                });
                
                return { ...currentData, status: 'spinning', teamResult: teamResult };
            }
        }, (error, committed) => {
            if (error) console.error("Transação falhou: ", error);
            else if (!committed) console.log("Alguém já iniciou a rodada!");
            else console.log("Rodada iniciada com sucesso!");
        });
    }

    function animateSpinning() {
        let currentPlayerIndex = 0;
        
        function spinForNextPlayer() {
            if (localState.status !== 'spinning') return;
            if (currentPlayerIndex >= players.length) {
                roomRef.child('status').set('finished');
                return;
            }

            const card = document.getElementById(`player-card-${currentPlayerIndex}`);
            if(card) card.classList.add('active');

            const winner = localState.teamResult[currentPlayerIndex];
            if (!winner) return;

            const allRouletteImages = Array.from(roulette.querySelectorAll('img'));
            const targetImgIndex = allRouletteImages.findIndex((img, index) => index >= agents.length && img.alt === winner.name);
            const finalPosition = (targetImgIndex * agentImageHeight);
        
            roulette.style.transition = 'none';
            roulette.style.transform = `translateY(0)`;
            
            setTimeout(() => {
                roulette.style.transition = 'transform 4s cubic-bezier(.15,.9,.32,1)';
                roulette.style.transform = `translateY(-${finalPosition}px)`;
            }, 50);

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
    
    function displaySingleResult(playerIndex, agent) {
        const resultDisplay = document.getElementById(`player-result-${playerIndex}`);
        if (!resultDisplay) return;
        resultDisplay.innerHTML = `<img src="${agent.image}" alt="${agent.name}"><div class="agent-details"><span class="agent-name">${agent.name}</span><span class="agent-role">${agent.role}</span></div>`;
        resultDisplay.classList.add('visible');
    }

    function displayFinalResults() {
        clearPlayerResults();
        players.forEach((_, index) => {
            if(localState.teamResult && localState.teamResult[index]) {
                displaySingleResult(index, localState.teamResult[index]);
            }
        });
        document.querySelectorAll('.player-card').forEach(card => card.classList.remove('active'));
    }

    function clearPlayerResults() {
        document.querySelectorAll('.player-card.active').forEach(card => card.classList.remove('active'));
        players.forEach((_, index) => {
            const resultDisplay = document.getElementById(`player-result-${index}`);
            if (resultDisplay) {
                resultDisplay.classList.remove('visible');
                resultDisplay.innerHTML = '';
            }
        });
    }

    function createPlayerCards() { playersList.innerHTML = ''; players.forEach((player, index) => { const card = document.createElement('div'); card.className = 'player-card'; card.id = `player-card-${index}`; card.innerHTML = `<div class="player-info"><img src="${player.photo}" alt="Foto de ${player.name}" class="player-photo"><span class="player-name">${player.name}</span></div><div id="player-result-${index}" class="agent-result"></div>`; playersList.appendChild(card); }); }
    function populateBlockList() { agentBlockList.innerHTML = ''; agents.forEach(agent => { const item = document.createElement('div'); item.className = 'block-item'; item.innerHTML = `<input type="checkbox" id="block-${agent.name}" name="block-${agent.name}" data-agent-name="${agent.name}"><label for="block-${agent.name}">${agent.name}</label>`; agentBlockList.appendChild(item); }); }
    function setupRoulette() { const allAgentsForRoulette = [...agents, ...agents, ...agents, ...agents]; roulette.innerHTML = allAgentsForRoulette.map(agent => `<img src="${agent.image}" alt="${agent.name}">`).join(''); }

    initialize();
});