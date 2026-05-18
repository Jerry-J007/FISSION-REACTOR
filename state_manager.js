// state_manager.js

const PlayerColorBank = [
    { id: 'p1', color: '#ff003c' }, 
    { id: 'p2', color: '#0066ff' }, 
    { id: 'p3', color: '#00ff66' }, 
    { id: 'p4', color: '#ffcc00' }  
];

const GameState = {
   rows: 12,                
    cols: 6,                
    grid: [],                
    players: [],             
    currentPlayerIndex: 0,   
    turnCount: 0,            
    isPaused: false,         
    history: [],
    isBombMode: false,
    isHackMode: false,
    currentturntime:0,
    relays: [
        { r: 2, c: 2 }, 
        { r: 9, c: 3 } 
    ]
};

function initGameMode(playerCount) {
    GameState.players = [];
    for(let i = 0; i < playerCount; i++) {
        GameState.players.push({
            id: PlayerColorBank[i].id,
            color: PlayerColorBank[i].color,
            alive: true,
            score: 0,
            turnScore: 0,
            bombs: 0,         
            bombsEarned: 0,    
            hacks: 0,        
            hacksEarned: 0,  
            timeElapsed: 0    
        });
    }
    GameState.currentPlayerIndex = 0;
    GameState.turnCount = 0;
    GameState.isPaused = false;
    GameState.history = [];
    GameState.isBombMode = false;
    GameState.isHackMode = false;
    GameState.currentturntime=0;
    initGrid();
}



function initGrid() {
    GameState.grid = [];
    for (let r = 0; r < GameState.rows; r++) {
        let row = [];
        for (let c = 0; c < GameState.cols; c++) {
            let capacity = 4; 
            if (r === 0 || r === GameState.rows - 1) capacity--;
            if (c === 0 || c === GameState.cols - 1) capacity--;

            let isRelay = GameState.relays.some(relay => relay.r === r && relay.c === c);

            row.push({
                row: r, col: c, capacity: capacity, count: 0, owner: null,isRelay: isRelay
            });
        }
        GameState.grid.push(row);
    }
}