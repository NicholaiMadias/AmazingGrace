// matchMakerState.js expansion
const gameState = {
    score: 0,
    level: 1,
    gracePoints: 0,
    targetScore: 500,
    currentChurch: "Ephesus",
    unlockedReflections: []
};

function updateScore(points) {
    gameState.score += points;
    gameState.gracePoints += points;
    
    // Check for Level Up / Church Transition
    if (gameState.score >= gameState.targetScore) {
        levelUp();
    }
    
    renderUI();
}

function levelUp() {
    gameState.level++;
    gameState.targetScore += 500; // Escalating difficulty
    
    // Map levels to the Seven Stars
    const churches = ["Ephesus", "Smyrna", "Pergamum", "Thyatira", "Sardis", "Philadelphia", "Laodicea"];
    gameState.currentChurch = churches[(gameState.level - 1) % 7];
    
    triggerReflection(gameState.currentChurch);
}
