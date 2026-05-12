/**
 * Matrix of Conscience: Badge & Achievement System
 * Aligned with Seven Stars Master Atlas (master-atlas.svg)
 */

const SEVEN_LETTERS = {
  VISION: { id: 'electra', title: 'The Letter of Vision', requirement: 'Complete Network Defense scan without errors.' },
  COURAGE: { id: 'taygete', title: 'The Letter of Courage', requirement: 'Access Admin Keys within 30 seconds of login.' },
  SERENITY: { id: 'alcyone', title: 'The Letter of Serenity', requirement: 'Maintain a 100% balance in User Management.' },
  AUTONOMY: { id: 'maia', title: 'The Letter of Autonomy', requirement: 'Identify 5 critical anomalies in the Log Analyzer.' },
  SUSTENANCE: { id: 'celaeno', title: 'The Letter of Sustenance', requirement: 'Run a full system diagnostic with 0 warnings.' },
  PATIENCE: { id: 'sterope', title: 'The Letter of Patience', requirement: 'Verify 10 diverse Browser Info strings.' },
  HUMILITY: { id: 'merope', title: 'The Letter of Humility', requirement: 'Submit 3 bug reports through the Debug console.' }
};

// Function to render the Badge in the UI using the Master Atlas
function renderLetterBadge(letterKey) {
  const letter = SEVEN_LETTERS[letterKey];
  return `
    <div class="badge-card" title="${letter.requirement}">
      <svg class="badge-icon ${letter.id}-glow">
        <use href="/assets/svg/master-atlas.svg#${letter.id}"></use>
      </svg>
      <span class="badge-title">${letter.title}</span>
    </div>
  `;
}
