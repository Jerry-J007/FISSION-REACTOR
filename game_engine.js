// game_engine.js


function addScore(playerObj, points) {
    if (!playerObj || !playerObj.alive) return;
    
    playerObj.score += points;
    playerObj.turnScore += points; 
}


function checkTurnRewards(playerObj) {
    if (!playerObj || !playerObj.alive) return;

    if (playerObj.turnScore >= 300) {
        if (playerObj.hacks < 5) {
            playerObj.hacks++;
            GameState.history.push({ type: 'system', text: `[!] P${playerObj.id.replace('p','')} EARNED AN OVERRIDE COMBO!` });
        }
    } 

    if (playerObj.turnScore >= 150) {
        if (playerObj.bombs < 5) {
            playerObj.bombs++;
            GameState.history.push({ type: 'system', text: `[!] P${playerObj.id.replace('p','')} EARNED A BOMB COMBO!` });
        }
    }

    playerObj.turnScore = 0;
}

function processMove(r, c) {
    const cell = GameState.grid[r][c];
    
    if (cell.isRelay) return false;
    const currentPlayer = GameState.players[GameState.currentPlayerIndex];

    if (cell.owner !== null && cell.owner !== currentPlayer.id) return false;

   
    addScore(currentPlayer, 10);
    AudioEngine.playSound('place', 0.5);

    if (GameState.turnCount < GameState.players.length) {
        cell.count += (cell.capacity - 1);
    } else {
        cell.count++;
    }
    
    cell.owner = currentPlayer.id;
    GameState.history.push({ type: 'move', player: currentPlayer.id, r, c });

    checkExplosions();
    checkEliminations();
    checkWinCondition();
    checkTurnRewards(currentPlayer);


    GameState.turnCount++;
    
    if (!GameState.isPaused) {
        do {
            GameState.currentPlayerIndex = (GameState.currentPlayerIndex + 1) % GameState.players.length;
        } while (!GameState.players[GameState.currentPlayerIndex].alive);
    }
    
    return true; 
}

//BOMB 3X3
function processBomb(r, c) {
    const currentPlayer = GameState.players[GameState.currentPlayerIndex];
    const cell = GameState.grid[r][c];
   
    if (cell.isRelay) return false;
    if (currentPlayer.bombs <= 0) return false;

    currentPlayer.bombs--;
    GameState.isBombMode = false; 
    
    GameState.history.push({ type: 'bomb', player: currentPlayer.id, r, c });
    AudioEngine.playSound('bomb', 1.0);

    
    for (let i = r - 1; i <= r + 1; i++) {
        for (let j = c - 1; j <= c + 1; j++) {
            if (i >= 0 && i < GameState.rows && j >= 0 && j < GameState.cols) {
                GameState.grid[i][j].count = 0;
                GameState.grid[i][j].owner = null;
            }
        }
    }

    
    checkEliminations();
    checkWinCondition();

    GameState.turnCount++;
    if (!GameState.isPaused) {
        do {
            GameState.currentPlayerIndex = (GameState.currentPlayerIndex + 1) % GameState.players.length;
        } while (!GameState.players[GameState.currentPlayerIndex].alive);
    }
    return true;
}

function checkExplosions() {
    let explodingCells = [];
    
    for (let r = 0; r < GameState.rows; r++) {
        for (let c = 0; c < GameState.cols; c++) {
            if (GameState.grid[r][c].count >= GameState.grid[r][c].capacity) {
                explodingCells.push(GameState.grid[r][c]);
            }
        }
    }

    if (explodingCells.length === 0) return; 

    explodingCells.forEach(cell => {
        let owner = cell.owner;
        let ownerObj = GameState.players.find(p => p.id === owner);
        
        addScore(ownerObj, 50);
        AudioEngine.playSound('explode', 0.6);

        cell.count -= cell.capacity;
        if (cell.count === 0) cell.owner = null;

      
        const directions = [
            { dr: -1, dc: 0 }, 
            { dr: 1, dc: 0 },  
            { dr: 0, dc: -1 }, 
            { dr: 0, dc: 1 }   
        ];

        directions.forEach(dir => {
            let targetR = cell.row + dir.dr;
            let targetC = cell.col + dir.dc;
            

          
            if (targetR >= 0 && targetR < GameState.rows && targetC >= 0 && targetC < GameState.cols) {
                let targetCell = GameState.grid[targetR][targetC];

              
                if (targetCell.isRelay) {
                   
                    const otherRelay = GameState.relays.find(rel => rel.r !== targetR || rel.c !== targetC);
                    if (otherRelay) {
                      
                        targetR = otherRelay.r + dir.dr;
                        targetC = otherRelay.c + dir.dc;
                        AudioEngine.playSound('teleport', 0.7);
                    }
                }

                
                if (targetR >= 0 && targetR < GameState.rows && targetC >= 0 && targetC < GameState.cols) {
                    let finalCell = GameState.grid[targetR][targetC];

                    if (!finalCell.isRelay) {
                        if (finalCell.owner !== null && finalCell.owner !== owner) {
                            addScore(ownerObj, 100); 
                        }
                        finalCell.count++;
                        finalCell.owner = owner; 
                    }
                }
            }
        });
    });

    checkExplosions(); 
}



function checkEliminations() {
    let activeOwners = new Set();
    
   
    for (let r = 0; r < GameState.rows; r++) {
        for (let c = 0; c < GameState.cols; c++) {
            if (GameState.grid[r][c].owner !== null) {
                activeOwners.add(GameState.grid[r][c].owner);
            }
        }
    }

    GameState.players.forEach(p => {
        
        if (p.alive && p.score > 0 && !activeOwners.has(p.id)) {
            p.alive = false; 
            GameState.history.push({ type: 'elimination', player: p.id }); 
        }
    });
}

function checkWinCondition() {
    if (GameState.turnCount < GameState.players.length) return; 

    const alivePlayers = GameState.players.filter(p => p.alive);

   
    if (alivePlayers.length === 0) {
        GameState.isPaused = true;
        setTimeout(() => alert(`Game Over! It's a DRAW! TOTAL CHAOS.`), 100);
        return;
    }

   
    if (alivePlayers.length === 1) {
        const winner = alivePlayers[0];
        GameState.isPaused = true;
        const playerNum = winner.id
        
        setTimeout(() => {
            alert(`SUPER CRITICAL STAGE REACHED:${playerNum.replace("p","PLAYER")} CLAIMS THE REACTOR!`);
        }, 100);
    }
}
//OVERRIDE 
function processHack(r, c) {
    const cell = GameState.grid[r][c];
    if (cell.isRelay) return false;
    const currentPlayer = GameState.players[GameState.currentPlayerIndex];
    
    if (currentPlayer.hacks <= 0) return false; 
    
    
    if (cell.owner === null || cell.owner === currentPlayer.id) return false;

    currentPlayer.hacks--;
    GameState.isHackMode = false; 
    
   
    cell.owner = currentPlayer.id;
    GameState.history.push({ type: 'hack', player: currentPlayer.id, r, c });
    AudioEngine.playSound('override', 0.8);

    
    checkEliminations();
    checkWinCondition();

    
    GameState.turnCount++;
    if (!GameState.isPaused) {
        do {
            GameState.currentPlayerIndex = (GameState.currentPlayerIndex + 1) % GameState.players.length;
        } while (!GameState.players[GameState.currentPlayerIndex].alive);
    }
    return true;
}


function endGameByTime() {
    GameState.isPaused = true;
    const alivePlayers = GameState.players.filter(p => p.alive);
    
    if (alivePlayers.length === 0) return;

    
    let maxScore = -1;
    alivePlayers.forEach(p => { 
        if (p.score > maxScore) maxScore = p.score; 
    });
    
   
    const winners = alivePlayers.filter(p => p.score === maxScore);
    
    setTimeout(() => {
        if (winners.length > 1) {
            const names = winners.map(w => w.id.replace('p', 'PLAYER ')).join(' & ');
            alert(`TIME LIMIT (3:00) REACHED!\nDRAW BETWEEN ${names} WITH ${maxScore} PTS!`);
        } else {
            alert(`TIME LIMIT (3:00) REACHED!\n${winners[0].id.replace('p', 'PLAYER ')} WINS WITH ${maxScore} PTS!`);
        }
    }, 100);
}