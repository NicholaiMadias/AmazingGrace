// story-nodes.js — Narrative data for the Seven Stars Ministry story engine.
// Loaded as an external script by ministries/index.html to keep the HTML
// payload small and enable future lazy-loading of individual story branches.
const STORY_NODES = {

    intro: {
        act: 1,
        chapter: 'Chapter 1',
        title: 'The Call of the Stars',
        text: `You stand at the threshold of an ancient observatory. Through the open dome, seven stars burn with unusual brilliance — each a different colour, each a different intensity. At your feet lies a worn scroll bound in golden cord.

You feel the weight of a calling you cannot fully explain. The stars seem to be waiting.`,
        scripture: { ref: 'Revelation 1:3', text: '"Blessed is the one who reads aloud the words of this prophecy, and blessed are those who hear it."' },
        type: 'choice',
        choices: [
            { label: '📜 Unroll the scroll and read the full message', next: 'read_scroll' },
            { label: '🙏 Look up at the seven stars and pray first', next: 'pray_first' }
        ]
    },

    read_scroll: {
        act: 1,
        chapter: 'Chapter 1',
        title: 'The Ancient Message',
        text: `The scroll unrolls to reveal ancient text written in gold ink:

"Seven churches. Seven messages. Seven mysteries. The One who holds the Seven Stars in His right hand speaks. Do you have ears to hear?

Seek the Refraction — the lens through which all seven lights become one clear truth."`,
        scripture: { ref: 'Revelation 1:20', text: '"The mystery of the seven stars that you saw in my right hand and of the seven golden lampstands is this: The seven stars are the angels of the seven churches."' },
        type: 'choice',
        choices: [
            { label: '⚡ Enter the Refraction Trial', next: 'refraction_trial' }
        ]
    },

    pray_first: {
        act: 1,
        chapter: 'Chapter 1',
        title: 'Wisdom Before the Trial',
        text: `As you bow your head in the starlight, a quiet warmth fills the observatory. The seven stars seem to brighten, as if responding to the posture of your heart.

A still, small voice says: "Wisdom begins here. You are ready to see."

Strengthened, you reach down and unroll the scroll.`,
        scripture: { ref: 'Proverbs 9:10', text: '"The fear of the LORD is the beginning of wisdom, and knowledge of the Holy One is understanding."' },
        type: 'choice',
        choices: [
            { label: '⚡ Begin the Refraction Trial, Strengthened', next: 'refraction_trial' }
        ]
    },

    refraction_trial: {
        act: 2,
        chapter: 'Chapter 2',
        title: 'The Refraction Trial',
        text: `The scroll dissolves into beams of coloured light — gold, blue, purple, and red — each streaming from one of the seven stars above. To decode the message of the Stars, you must align them.

A crystalline lens floats before you. Arrange the star crystals to refract their light into a single focused beam.`,
        scripture: null,
        type: 'puzzle'
    },

    seven_letters: {
        act: 3,
        chapter: 'Chapter 3',
        title: 'The Seven Letters',
        text: `The aligned starlight illuminates seven sealed letters on the observatory wall — each bearing the name of a church: Ephesus, Smyrna, Pergamum, Thyatira, Sardis, Philadelphia, Laodicea.

One glows brighter than the others, pulsing gently, as though it knows your name.`,
        scripture: { ref: 'Revelation 2:1', text: '"To the angel of the church in Ephesus write: These are the words of him who holds the seven stars in his right hand."' },
        type: 'choice',
        choices: [
            { label: '💌 Open the letter of first love — Ephesus', next: 'letter_ephesus' },
            { label: '🚪 Open the letter of the open door — Philadelphia', next: 'letter_philadelphia' }
        ]
    },

    letter_ephesus: {
        act: 3,
        chapter: 'Chapter 3',
        title: 'Letter to Ephesus: First Love',
        text: `The letter reads: "You have abandoned the love you had at first. Remember from where you have fallen; repent, and do the works you did at first."

The message lands deep — not as condemnation, but as an invitation to return. To first love. To first calling. To the reason you began.`,
        scripture: { ref: 'Revelation 2:4–5', text: '"You have forsaken the love you had at first. Consider how far you have fallen! Repent and do the things you did at first."' },
        type: 'choice',
        choices: [
            { label: '🌑 Follow the path deeper into the stars', next: 'the_dark_valley' }
        ]
    },

    letter_philadelphia: {
        act: 3,
        chapter: 'Chapter 3',
        title: 'Letter to Philadelphia: The Open Door',
        text: `The letter reads: "See, I have placed before you an open door that no one can shut. I know that you have little strength, yet you have kept my word."

Small faithfulness. Open doors. Not power, but presence. Not volume, but endurance.`,
        scripture: { ref: 'Revelation 3:8', text: '"I have placed before you an open door that no one can shut. I know that you have little strength, yet you have kept my word."' },
        type: 'choice',
        choices: [
            { label: '🌑 Follow the path deeper into the stars', next: 'the_dark_valley' }
        ]
    },

    the_dark_valley: {
        act: 4,
        chapter: 'Chapter 4',
        title: 'The Valley of Doubt',
        text: `The path to the lens of clarity passes through a darkened valley. A voice whispers from the shadows:

"Who are you to seek the Seven Stars? You have stumbled. You have fallen short. The stars are not for you."

The voice is familiar — it is the voice of your own fear.`,
        scripture: null,
        type: 'choice',
        choices: [
            { label: '✝️ Answer: "Not by my strength — by grace I stand."', next: 'victory_grace' },
            { label: '🔥 Answer: "I will press on. The work is not yet finished."', next: 'victory_perseverance' }
        ]
    },

    victory_grace: {
        act: 4,
        chapter: 'Chapter 4',
        title: 'Grace Breaks Through',
        text: `The word "grace" hits the darkness like starlight striking a lens. The shadows scatter.

You are not worthy by your deeds — you are worthy by the One who holds the seven stars. Grace is not earned; it is received. And in that receiving, doubt has no foothold.

The path forward is clear.`,
        scripture: { ref: 'Ephesians 2:8–9', text: '"For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God — not by works."' },
        type: 'choice',
        choices: [
            { label: '⭐ Claim the Seven Stars Lens', next: 'the_revelation' }
        ]
    },

    victory_perseverance: {
        act: 4,
        chapter: 'Chapter 4',
        title: 'Endurance Triumphs',
        text: `You step forward into the dark valley — not because the fear is gone, but because the calling is greater than the fear.

The stars overhead do not flicker. They burn steady. Those who endure, inherit. The path opens before you.`,
        scripture: { ref: 'Matthew 24:13', text: '"But the one who endures to the end will be saved."' },
        type: 'choice',
        choices: [
            { label: '⭐ Claim the Seven Stars Lens', next: 'the_revelation' }
        ]
    },

    the_revelation: {
        act: 5,
        chapter: 'Chapter 5',
        title: 'The Seven Stars Revealed',
        text: `The lens materialises in your hands — a crystal of pure clarity, containing the light of all seven stars unified into a single beam.

Through it you see clearly: each star is a church, each church a lesson, each lesson a step toward the One who holds them in His right hand. The mystery is not solved by intellect alone — it is unveiled by faith, faithfulness, and the courage to keep walking.

You have completed the journey.`,
        scripture: { ref: 'Revelation 1:16', text: '"In his right hand he held seven stars, and coming out of his mouth was a sharp, double-edged sword. His face was like the sun shining in all its brilliance."' },
        type: 'ending'
    }
};

// Automatically generates a map of the story for debugging or navigation
function generateStoryIndex() {
    return Object.keys(STORY_NODES).map(key => ({
        id: key,
        title: STORY_NODES[key].title,
        act: STORY_NODES[key].act
    }));
}

