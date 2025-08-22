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
    
    const agentImageHeight = 75;
    let localState = {};
    // ✅ REMOVIDO: A variável 'isHost' não é mais necessária.
    let currentAnimationTimeout = null;

    function initialize() {
        createPlayerCards();
        populateBlockList();
        setupRoulette();
        setupEventListeners(); // ✅ ALTERADO: Configura os botões para todos.
        listenToRoomChanges();
        resetRoomIfNeeded(); // ✅ NOVO: Garante que a sala não fique travada se alguém fechar a página.
    }

    // ✅ NOVO: Reseta a sala para 'waiting' se ela estiver 'spinning' por mais de 30 segundos.
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
                }, 30000); // 30 segundos de timeout
            }
        });
    }

    // ✅ ALTERADO: Os botões de controle agora são configurados para todos os usuários.
    function setupEventListeners() {
        spinButton.addEventListener('click', tryStartRound);
        toggleBlockListBtn.addEventListener('click', () => agentBlockList.classList.toggle('hidden'));
        
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
            // Se a sala não existir, cria um estado inicial padrão.
            if (!roomData) {
                roomData = { status: 'waiting', activeFilter: 'Todos', blockedAgents: [], teamResult: null };
                roomRef.set(roomData); // Inicializa a sala no Firebase
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
    
    // ✅ ALTERADO: A lógica de habilitar/desabilitar botões agora é a mesma para todos.
    function handleGameState() {
        clearTimeout(currentAnimationTimeout);
        
        const isSpinning = localState.status === 'spinning';
        document.querySelectorAll('.filter-btn, #agentBlockList input, #toggleBlockListBtn').forEach(el => el.disabled = isSpinning);
        spinButton.disabled = isSpinning;

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

    // ✅ ALTERADO: Esta função agora usa uma 'transação' para garantir que apenas uma pessoa possa iniciar.
    function tryStartRound() {
        roomRef.transaction(currentData => {
            // Se alguém já começou a girar, a transação falha e não faz nada.
            if (currentData && currentData.status === 'spinning') {
                return; // Aborta
            }

            // Se a sala não existe ou está disponível, este usuário se torna o "host" temporário.
            if (!currentData || currentData.status === 'waiting' || currentData.status === 'finished') {
                const blockedAgents = currentData.blockedAgents || [];
                let filteredAgents = agents.filter(agent => !blockedAgents.includes(agent.name));
                if (currentData.activeFilter !== 'Todos') {
                    filteredAgents = filteredAgents.filter(agent => agent.role === currentData.activeFilter);
                }

                if (filteredAgents.length < players.length) {
                    alert("Erro: Não há agentes suficientes para todos os players com os filtros atuais!");
                    return; // Aborta
                }
                
                const available = [...filteredAgents];
                const teamResult = {};
                players.forEach((player, index) => {
                    const winnerIndex = Math.floor(Math.random() * available.length);
                    teamResult[index] = available.splice(winnerIndex, 1)[0];
                });
                
                // Retorna o novo estado que será salvo no Firebase
                return {
                    ...currentData,
                    status: 'spinning',
                    teamResult: teamResult
                };
            }
        }, (error, committed, snapshot) => {
            if (error) {
                console.error("Transação falhou: ", error);
            } else if (!committed) {
                console.log("Alguém já iniciou a rodada!");
            } else {
                console.log("Rodada iniciada com sucesso!");
            }
        });
    }

    function animateSpinning() {
        let currentPlayerIndex = 0;
        
        function spinForNextPlayer() {
            // Se o estado mudou (ex: por um reset), para a animação.
            if (localState.status !== 'spinning') {
                return;
            }

            if (currentPlayerIndex >= players.length) {
                // Apenas o clique que iniciou a transação irá efetivamente mudar o estado.
                // Mas podemos fazer isso para todos, pois não tem problema.
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
        resultDisplay.innerHTML = `
            <img src="${agent.image}" alt="${agent.name}">
            <div class="agent-details">
                <span class="agent-name">${agent.name}</span>
                <span class="agent-role">${agent.role}</span>
            </div>
        `;
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

    // Funções de setup visual que não precisam de alteração
    function createPlayerCards() { playersList.innerHTML = ''; players.forEach((player, index) => { const card = document.createElement('div'); card.className = 'player-card'; card.id = `player-card-${index}`; card.innerHTML = `<div class="player-info"><img src="${player.photo}" alt="Foto de ${player.name}" class="player-photo"><span class="player-name">${player.name}</span></div><div id="player-result-${index}" class="agent-result"></div>`; playersList.appendChild(card); }); }
    function populateBlockList() { agentBlockList.innerHTML = ''; agents.forEach(agent => { const item = document.createElement('div'); item.className = 'block-item'; item.innerHTML = `<input type="checkbox" id="block-${agent.name}" name="block-${agent.name}" data-agent-name="${agent.name}"><label for="block-${agent.name}">${agent.name}</label>`; agentBlockList.appendChild(item); }); }
    function setupRoulette() { const allAgentsForRoulette = [...agents, ...agents, ...agents, ...agents]; roulette.innerHTML = allAgentsForRoulette.map(agent => `<img src="${agent.image}" alt="${agent.name}">`).join(''); }

    // --- INICIA A APLICAÇÃO ---
    initialize();
});