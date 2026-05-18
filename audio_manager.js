// audio_manager.js

const AudioEngine = {
    bgmMenu: new Audio('audio/menu_bgm.mp3'),
    bgmGame: new Audio('audio/game_bgm.mp3'),
    
    // Sound effects and stuff
    sfx: {
        place: 'audio/place.mp3',
        explode: 'audio/explode.mp3',
        bomb: 'audio/bomb.mp3',
        override: 'audio/override.mp3',
        teleport: 'audio/teleport.mp3'
    },

    init: function() {
        
        this.bgmMenu.loop = true;
        this.bgmMenu.volume = 0.4; 
        
        this.bgmGame.loop = true;
        this.bgmGame.volume = 0.3; 
    },

    playMenuMusic: function() {
        this.bgmGame.pause();
        this.bgmGame.currentTime = 0;
        
        this.bgmMenu.play().catch(e => console.log("Waiting for user interaction to play audio..."));
    },

    playGameMusic: function() {
        this.bgmMenu.pause();
        this.bgmMenu.currentTime = 0;
        this.bgmGame.play().catch(e => console.log("Waiting for user interaction to play audio..."));
    },

   
    playSound: function(soundName, volume = 0.7) {
        if (!this.sfx[soundName]) return;
        let sound = new Audio(this.sfx[soundName]);
        sound.volume = volume;
        sound.play().catch(e => {});
    }
};


AudioEngine.init(); 