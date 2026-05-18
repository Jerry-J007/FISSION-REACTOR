// ui_controller.js

function renderBoard() {
    const container = document.getElementById('board-container');
    container.innerHTML = '';

    for (let r = 0; r < GameState.rows; r++) {
        for (let c = 0; c < GameState.cols; c++) {
            const cellData = GameState.grid[r][c];
            
            const cellDiv = document.createElement('div');
            cellDiv.className = 'cell';
            
            
            cellDiv.dataset.row = r;
            cellDiv.dataset.col = c;
            cellDiv.dataset.count = cellData.count; 
            
            if (cellData.isRelay) {
                cellDiv.classList.add('relay-portal');
                const portalCore = document.createElement('div');
                portalCore.className = 'portal-core';
                cellDiv.appendChild(portalCore);
                
                container.appendChild(cellDiv);
                continue;
            }

           
            if (cellData.count > 0) {
                const player = GameState.players.find(p => p.id === cellData.owner);
                
                
                if (!player) continue; 
                
                for(let i = 0; i < cellData.count; i++) {
                    const atom = document.createElement('div');
                    atom.className = 'atom';
                    
                    
                    if(player.id === 'p1') {
                        atom.classList.add('red'); 
                    } else {
                        atom.style.backgroundColor = player.color; 
                        atom.style.boxShadow = `0 0 8px ${player.color}, 0 0 15px ${player.color}`;
                    }
                    
                    cellDiv.appendChild(atom);
                }
            }
           
            container.appendChild(cellDiv);
        }
    }
}

function updateTurnIndicator() {
    const indicator = document.querySelector('.turn-indicator');
    const player = GameState.players[GameState.currentPlayerIndex];
    
    const playerNum = player.id.replace('p', ''); 
    
  
    let timeLeft = 15 - (GameState.currentTurnTime || 0); 
    
    indicator.textContent = `TURN: PLAYER ${playerNum} (${timeLeft}s)`;
    
    if (timeLeft <= 5) {
        indicator.style.color = '#ff003c';
        indicator.style.textShadow = '0 0 10px #ff003c';
        indicator.style.borderColor = '#ff003c';
    } else {
        indicator.style.color = player.color;
        indicator.style.textShadow = `0 0 5px ${player.color}`;
        indicator.style.borderColor = player.color;
    }
}


function updateHistory() {
    const historyBox = document.getElementById('move-history');
    historyBox.innerHTML = ''; 
    const recentMoves = GameState.history.slice(-10).reverse();

    recentMoves.forEach(move => {
        const p = document.createElement('p');
        const player = GameState.players.find(pl => pl.id === move.player);
        
      
        if (move.type === 'system') {
            p.textContent = move.text;
            p.style.color = '#ffcc00';
            p.style.fontWeight = 'bold';
        } else if (move.type === 'bomb') {
            p.textContent = `[BOMB] P${move.player.replace('p', '')} DETONATED AT [${move.r}, ${move.c}]!`;
            p.style.color = '#bc13fe'; 
            p.style.textShadow = '0 0 5px #bc13fe';

        } 
        
        else if (move.type === 'hack') {
    p.textContent = `[OVERRIDE] P${move.player.replace('p', '')} OVERRIDE AT [${move.r}, ${move.c}]!`;
    p.style.color = '#00f3ff';
    p.style.textShadow = '0 0 5px #00f3ff';}

        else if (move.type === 'elimination') {
            p.textContent = `[!] P${move.player.replace('p', '')} ELIMINATED!`;
            p.style.color = '#ff003c';
        } else if (player) {
            p.textContent = `> P${move.player.replace('p', '')} played at [${move.r}, ${move.c}]`;
            p.style.color = player.color;
        }
        
        p.style.margin = '5px 10px';
        p.style.fontSize = '12px';
        historyBox.appendChild(p);
    });
}

function updateSidebarPlayers() {
    const list = document.getElementById('dynamic-powerup-list');
    list.innerHTML = ''; 

    GameState.players.forEach(p => {
        const pNum = p.id.replace('p', '');
        const pTag = document.createElement('p');
        const formattedScore = p.score.toString().padStart(5, '0');

        if (p.alive) {
           
           pTag.innerHTML = `<span>[P${pNum}]</span> 🏆 ${formattedScore} | 💣 ${p.bombs} | ⚡ ${p.hacks}`;
            pTag.style.color = p.color;
            pTag.style.textShadow = `0 0 8px ${p.color}`;
        } else {
            pTag.innerHTML = `<span>[P${pNum}]</span> OFFLINE (${p.score})`;
            pTag.style.color = '#555'; 
            pTag.style.textDecoration = 'line-through';
        }
        list.appendChild(pTag);
    });
}

function updateActionButtons() {
    const bombBtn = document.getElementById('btn-bomb');
    const hackBtn = document.getElementById('btn-hack');
    const currentPlayer = GameState.players[GameState.currentPlayerIndex];
    
   
    bombBtn.classList.remove('danger-action');
    bombBtn.textContent = "DEPLOY BOMB";
    
    hackBtn.classList.remove('danger-action'); 
    hackBtn.textContent = "OVERRIDE";

    if (currentPlayer && currentPlayer.bombs > 0) {
        bombBtn.classList.remove('disabled');
    } else {
        bombBtn.classList.add('disabled');
        GameState.isBombMode = false; 
    }

   
    if (currentPlayer && currentPlayer.hacks > 0) {
        hackBtn.classList.remove('disabled');
    } else {
        hackBtn.classList.add('disabled');
        GameState.isHackMode = false; 
    }
}


function initPlayerTimersUI() {
    const container = document.getElementById('player-timers');
    container.innerHTML = '';
    
    GameState.players.forEach((p, index) => {
        const badge = document.createElement('div');
        badge.className = 'player-timer-badge';
        badge.id = `timer-badge-${index}`;
        badge.style.color = p.color;
        badge.textContent = `P${p.id.replace('p', '')}: 00:00`;
        container.appendChild(badge);
    });
}


function updatePlayerTimersUI() {
    GameState.players.forEach((p, index) => {
        const badge = document.getElementById(`timer-badge-${index}`);
        if (!badge) return;

        if (p.alive) {
           
            let mins = Math.floor(p.timeElapsed / 60).toString().padStart(2, '0');
            let secs = (p.timeElapsed % 60).toString().padStart(2, '0');
            badge.textContent = `P${p.id.replace('p', '')}: ${mins}:${secs}`;
            
            
            if (index === GameState.currentPlayerIndex && !GameState.isPaused) {
                badge.classList.add('active');
            } else {
                badge.classList.remove('active');
            }
        } else {
            
            badge.textContent = `P${p.id.replace('p', '')}: OFFLINE`;
            badge.style.color = '#555';
            badge.classList.remove('active');
        }
    });
}