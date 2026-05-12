/**
 * NEXUS OS: STORY ENGINE - ACT I: THE STAR MATRIX
 * Version: 2.0 (Canonical Synthesis)
 * Features: Cinematic Transitions, Ella as Sheila, Matrix Integration
 */

const StoryConfig = {
    chapters: [
        { id: 1, title: "The Red Queen's Gravity", tone: "heavy", music: "/assets/audio/storm.mp3" },
        { id: 2, title: "Call of the White Rabbit", tone: "mystical", music: "/assets/audio/exploration.mp3" },
        { id: 3, title: "Ascent to Nimbus Land", tone: "hopeful", music: "/assets/audio/fairy_flying.mp3" },
        { id: 4, title: "The Seven Pillars", tone: "instructional", music: "/assets/audio/puzzle.mp3" },
        { id: 5, title: "Mystery of the Sixth Star", tone: "intense", music: "/assets/audio/hit_the_floor.mp3" },
        { id: 6, title: "Covenant of Fellowship", tone: "emotional", music: "/assets/audio/victory.mp3" },
        { id: 7, title: "The New Beginning", tone: "radiant", music: "/assets/audio/ending.mp3" },
        { id: 8, title: "The Star Matrix Vision", tone: "ascendant", music: "/assets/audio/spiritual_stone.mp3" },
        { id: 9, title: "Threshold of Conscience", tone: "destined", music: "/assets/audio/minigame.mp3" }
    ],
    // The "Sheila" Vision Logic (Chapter 8)
    visionScript: {
        speaker: "Sheila (Guardian of Grace)",
        dialogue: [
            "You’ve walked the Seven Roads, Nicholai. You’ve seen the Red Queen’s gravity.",
            "This is the Star Matrix—the map of your conscience. Every choice echoes here.",
            "The Red Queen cannot corrupt what is built on Integrity. You are ready."
        ]
    }
};

class StoryEngine {
    constructor() {
        this.currentChapter = 1;
        this.starsCollected = 0;
        this.initUI();
    }

    initUI() {
        // Expand Arcade container to 100% width, removing Matrix simulation space [cite: 337, 342]
        const container = document.getElementById('arcade-root');
        if (container) {
            container.style.width = '100%';
            container.style.minHeight = '80vh';
            container.classList.add('glass-morphism', 'neon-glow'); // [cite: 566, 571]
        }
    }

    // Triggered when a level/chapter is completed
    completeChapter() {
        this.currentChapter++;
        this.awardStar();
        
        if (this.currentChapter === 8) {
            this.renderSheilaVision();
        } else if (this.currentChapter > 9) {
            this.showMatrixThreshold();
        } else {
            this.nextChapter();
        }
    }

    awardStar() {
        this.starsCollected++;
        // Play Ocarina 'Spiritual Stone' fanfare [cite: 429, 509]
        audioManager.playSFX('/assets/audio/badge.mp3'); 
        // Save to Nexus OS Progression System [cite: 340, 552]
        saveSystem.addStar('match_master'); 
    }

    renderSheilaVision() {
        const mount = document.getElementById('story-viewport');
        mount.innerHTML = `
            <div class="vision-overlay animate-pulse">
                <h2 class="text-cosmic-gold">Sheila: Guardian of Grace</h2>
                <p class="mystical-text">${StoryConfig.visionScript.dialogue[0]}</p>
                <div class="star-lattice-animation"></div>
            </div>
        `;
        // Play mystical background music [cite: 310, 508]
        audioManager.playMusic('/assets/audio/fairy_flying.mp3');
    }

    showMatrixThreshold() {
        const mount = document.getElementById('story-viewport');
        mount.innerHTML = `
            <div class="threshold-container text-center">
                <h1 class="glow-text">The Seven Stars Align</h1>
                <p>The Star Road is open. Your conscience is the key.</p>
                <button 
                    onclick="window.location.href='/matrix-of-conscience.html'" 
                    class="btn-matrix-pulse">
                    ⭐ Enter the Matrix of Conscience
                </button>
            </div>
        `;
    }
}