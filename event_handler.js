// event_handler.js
document.addEventListener('DOMContentLoaded', () => {
    
    //DOM
    const mainMenu = document.getElementById('main-menu');
    const playerSelectMenu = document.getElementById('player-select-menu');
    const settingsMenu = document.getElementById('settings-menu');
    const gameWrapper = document.getElementById('game-wrapper');
    const board = document.getElementById('board-container');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const bombBtn = document.getElementById('btn-bomb');
    const hackBtn = document.getElementById('btn-hack');
    
    let startTime = null; 
    let pauseTime = null;

   
    //MENU 
    

    // PLAY
    document.getElementById('btn-play').addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        playerSelectMenu.classList.remove('hidden');
        AudioEngine.playMenuMusic();
    });

    //SETTINGS
    document.getElementById('btn-settings').addEventListener('click', () => {
        mainMenu.classList.add('hidden');
        settingsMenu.classList.remove('hidden');
    });

    // BACK FROM SETTINGS TO MAIN MENU
    document.getElementById('btn-settings-back').addEventListener('click', () => {
        settingsMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
    });

    // EXITTING FROM ENTIRE SITE
    document.getElementById('btn-exit').addEventListener('click', () => {
        const canClose = confirm("ARE YOU SURE CAPTAIN?DON'T LET THE ENEMIES CAPTURE US.");
        if (canClose) {
            window.close(); 
        
        }
    });

    // BACK FROM PLAYER NUMBER SELECTION
    document.getElementById('btn-back').addEventListener('click', () => {
        playerSelectMenu.classList.add('hidden');
        mainMenu.classList.remove('hidden');
    });

    // MENU
    document.getElementById('sys-menu-btn').addEventListener('click', () => {
        gameWrapper.classList.add('hidden');
        mainMenu.classList.remove('hidden');
        AudioEngine.playMenuMusic();
    });

   
    //GAME STARTING
   

    document.querySelectorAll('.btn-player-count').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const count = parseInt(e.target.dataset.count);
            
            
            initGameMode(count);
            
            
            playerSelectMenu.classList.add('hidden');
            gameWrapper.classList.remove('hidden');
            
           
            renderBoard();
            updateTurnIndicator();
            updateHistory();
            updateSidebarPlayers(); 
            updateActionButtons();
            initPlayerTimersUI(); 
            
       
            startTime = null;
            pauseTime=null;
            document.getElementById('game-timer').textContent = "Total Time: 0:00"; 
            pauseBtn.textContent = "PAUSE";
            AudioEngine.playGameMusic();
        });
    });


    //BOMBS AND OTHER STUFF
   

    //Bomb 
    bombBtn.addEventListener('click', () => {
        const currentPlayer = GameState.players[GameState.currentPlayerIndex];
        
       
        if (bombBtn.classList.contains('disabled')) return;

      
        GameState.isBombMode = !GameState.isBombMode;

        if (GameState.isBombMode) {
            bombBtn.classList.add('danger-action');
            bombBtn.textContent = "CANCEL BOMB";
        } else {
            bombBtn.classList.remove('danger-action');
            bombBtn.textContent = "DEPLOY BOMB";
        }
    });
    hackBtn.addEventListener('click', () => {
        if (hackBtn.classList.contains('disabled')) return;

       
        if (GameState.isBombMode) {
            GameState.isBombMode = false;
            bombBtn.classList.remove('danger-action');
            bombBtn.textContent = "DEPLOY BOMB";
        }

        GameState.isHackMode = !GameState.isHackMode;

        if (GameState.isHackMode) {
            hackBtn.classList.add('danger-action');
            hackBtn.textContent = "CANCEL OVERRIDE";
        } else {
            hackBtn.classList.remove('danger-action');
            hackBtn.textContent = "OVERRIDE";
        }
    });

    
    board.addEventListener('click', (e) => {
        if (GameState.isPaused) return;

        const cellDiv = e.target.closest('.cell');
        if (!cellDiv) return;

        const r = parseInt(cellDiv.dataset.row);
        const c = parseInt(cellDiv.dataset.col);

        let isValidAction = false;

        
        if (GameState.isBombMode) {
            isValidAction = processBomb(r, c);
        } 
        else if (GameState.isHackMode) {
            isValidAction = processHack(r, c);}
        else {
            isValidAction = processMove(r, c);
        }
        
       
        if (isValidAction) {
            if (startTime === null) startTime = Date.now(); 


            GameState.currentTurnTime = 0;
            
            renderBoard(); 
            updateTurnIndicator(); 
            updateHistory();       
            updateSidebarPlayers(); 
            updateActionButtons(); 
            
        }
    });

   

    

    pauseBtn.addEventListener('click', () => {
        
        if (startTime === null) return; 

        GameState.isPaused = !GameState.isPaused;
        pauseBtn.textContent = GameState.isPaused ? "RESUME" : "PAUSE";

        
        if (GameState.isPaused) {
            pauseTime = Date.now(); 
        } else {
            if (pauseTime !== null) {
              
                startTime += (Date.now() - pauseTime);
                pauseTime = null; 
            }
        }
    });

    resetBtn.addEventListener('click', () => {
        
        initGameMode(GameState.players.length); 
        
        
        renderBoard();
        updateTurnIndicator();
        updateHistory();
        updateSidebarPlayers();
        updateActionButtons();
        initPlayerTimersUI(); 
        pauseBtn.textContent = "PAUSE";
        
        
        startTime = null; 
        pauseTime=null;
        document.getElementById('game-timer').textContent = "Total Time: 0:00"; 
    });

   // OVERALL CLOCK
    setInterval(() => {
        if (startTime !== null && !GameState.isPaused) {
          
            let diff = Math.floor((Date.now() - startTime) / 1000);
            let mins = Math.floor(diff / 60);
            let secs = (diff % 60).toString().padStart(2, '0');
            document.getElementById('game-timer').textContent = `Total Time: ${mins}:${secs}`;

            
            if (diff >= 180) {
                endGameByTime();
                return; 
            }

           
            const currentPlayer = GameState.players[GameState.currentPlayerIndex];
            if (currentPlayer && currentPlayer.alive) {
                if (typeof currentPlayer.timeElapsed !== 'number' || isNaN(currentPlayer.timeElapsed)) {
                    currentPlayer.timeElapsed = 0;
                }
                currentPlayer.timeElapsed++;
            }

          
            GameState.currentTurnTime++;
            if (GameState.currentTurnTime >= 15) {
                
                
                GameState.history.push({ type: 'system', text: `[!] P${currentPlayer.id.replace('p','')} OUT OF TIME!` });
                
            
                GameState.currentTurnTime = 0;
                GameState.isBombMode = false;
                GameState.isHackMode = false;
                
              
                GameState.turnCount++;
                do {
                    GameState.currentPlayerIndex = (GameState.currentPlayerIndex + 1) % GameState.players.length;
                } while (!GameState.players[GameState.currentPlayerIndex].alive);

             
                updateHistory();
                updateActionButtons();
            }

            updateTurnIndicator(); 
            updatePlayerTimersUI();
        }
    }, 1000);
});