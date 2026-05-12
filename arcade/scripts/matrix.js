// arcade/scripts/matrix.js
// Matrix of Conscience — animation & visual constants
// Tuned values: slower fade-in, stronger star pulse for dramatic effect.
// (c) 2026 NicholaiMadias — MIT License

const fadeInDuration     = 600;   // ms — screen/overlay fade-in duration
const starPulseIntensity = 1.2;  // multiplier — star icon pulse scale on hover

const choiceFeedbackDelay = 300;  // ms — delay before feedback overlay appears
const progressBarEasing   = 'cubic-bezier(0.34,1.56,0.64,1)'; // conscience bar spring
const cardHoverLift       = '-4px'; // translateY applied to game cards on hover
const glowOpacityHover    = 0.85;   // radial-gradient overlay opacity at hover

/** Shared game constants — used by lobby, Matrix Act I, and Matrix of Conscience */
const MATRIX_CONSTANTS = Object.freeze({
    GAME_TITLE:       'Matrix Act I: Enter the Star Matrix',
    CONSCIENCE_KEYS:  ['empathy', 'justice', 'wisdom', 'growth'],
    STAR_COUNT:       7,
    GRID_SIZE:        7,
    NEXT_GAME_URL:    '/arcade/matrix-of-conscience/',
    NEXT_GAME_LABEL:  'Matrix of Conscience',
    CERT_PREFIX:      'AGHL-MA1-',
});

/* -------------------------------------------------------
   Browser Global (non-module <script> usage)
   ------------------------------------------------------- */
if (typeof window !== 'undefined') {
    // Create a single namespace to avoid polluting window.*
    window.MATRIX = window.MATRIX || {};
    window.MATRIX.CONSTANTS = MATRIX_CONSTANTS;

    // Expose animation constants too
    window.MATRIX.fadeInDuration      = fadeInDuration;
    window.MATRIX.starPulseIntensity  = starPulseIntensity;
    window.MATRIX.choiceFeedbackDelay = choiceFeedbackDelay;
    window.MATRIX.progressBarEasing   = progressBarEasing;
    window.MATRIX.cardHoverLift       = cardHoverLift;
    window.MATRIX.glowOpacityHover    = glowOpacityHover;
}

// Export for module consumers (ES module environments)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fadeInDuration,
        starPulseIntensity,
        choiceFeedbackDelay,
        progressBarEasing,
        cardHoverLift,
        glowOpacityHover,
        MATRIX_CONSTANTS,
    };
}
