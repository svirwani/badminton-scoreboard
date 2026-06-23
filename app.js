// App State variables
let state = {
    p1Score: 0,
    p2Score: 0,
    p1Sets: 0,
    p2Sets: 0,
    currentSet: 1,
    server: 1, // 1 for Player 1, 2 for Player 2
    isGameOver: false,
    isMatchOver: false
};

// Undo stack to save previous states
let historyStack = [];

// DOM Elements
const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');
const p1SetsEl = document.getElementById('p1-sets');
const p2SetsEl = document.getElementById('p2-sets');
const p1Box = document.getElementById('p1-box');
const p2Box = document.getElementById('p2-box');
const p1CourtEl = document.getElementById('p1-court');
const p2CourtEl = document.getElementById('p2-court');
const matchStatusEl = document.getElementById('match-status');
const courtLayout = document.getElementById('court-layout');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');

// Save snapshot of current state to history stack
function saveState() {
    historyStack.push(JSON.parse(JSON.stringify(state)));
}

// Add point to scored player
function scorePoint(player) {
    if (state.isGameOver || state.isMatchOver) return;

    saveState();

    // Update Scores & automatically set server (Badminton rule: scorer serves next)
    if (player === 1) {
        state.p1Score++;
        state.server = 1;
    } else {
        state.p2Score++;
        state.server = 2;
    }

    checkSetWinner();
    updateUI();
}

// NEW: Overwrite and change server manually without changing scores
function selectServer(player, event) {
    // Crucial: stops the box click handler from firing and adding a point
    if (event) event.stopPropagation();

    // Don't do anything if they are already the server or game is over
    if (state.server === player || state.isGameOver || state.isMatchOver) return;

    saveState();
    state.server = player;
    updateUI();
}

// Correct Rules of Badminton Scoring
function checkSetWinner() {
    const s1 = state.p1Score;
    const s2 = state.p2Score;

    // Conditions: Must have at least 21 points and lead by 2, or hit 30
    if ((s1 >= 21 && s1 - s2 >= 2) || s1 === 30) {
        handleSetEnd(1);
    } else if ((s2 >= 21 && s2 - s1 >= 2) || s2 === 30) {
        handleSetEnd(2);
    }
}

// Transition sets and check match winner
function handleSetEnd(winner) {
    state.isGameOver = true;
    
    if (winner === 1) {
        state.p1Sets++;
    } else {
        state.p2Sets++;
    }

    // Best of 3 sets: first to win 2 sets wins match
    if (state.p1Sets === 2 || state.p2Sets === 2) {
        state.isMatchOver = true;
        showModal("Match Finished! 🏆", `${getPlayerName(winner)} wins the match!`);
    } else {
        showModal("End of Set", `${getPlayerName(winner)} wins Set ${state.currentSet}. Prepare for next set.`);
    }
}

// Get the visual names written in text inputs
function getPlayerName(num) {
    return document.getElementById(`p${num}-name`).value;
}

// Next Set handler (sets state for next set or restarts)
function closeModal() {
    modal.style.display = "none";
    if (state.isMatchOver) {
        resetMatch();
    } else if (state.isGameOver) {
        // Reset scores for next set
        state.p1Score = 0;
        state.p2Score = 0;
        state.currentSet++;
        state.isGameOver = false;
        updateUI();
    }
}

// Undo Button Functionality
function undo() {
    if (historyStack.length === 0) return;
    state = historyStack.pop();
    updateUI();
}

// Swap layout orientations
function swapSides() {
    courtLayout.classList.toggle('swapped');
}

// Fully resets all scores, history and inputs
function resetMatch() {
    if(confirm("Are you sure you want to reset the entire match score?")) {
        state = {
            p1Score: 0,
            p2Score: 0,
            p1Sets: 0,
            p2Sets: 0,
            currentSet: 1,
            server: 1,
            isGameOver: false,
            isMatchOver: false
        };
        historyStack = [];
        updateUI();
    }
}

// UI Rendering Engine (Renders current State parameters to screen)
function updateUI() {
    p1ScoreEl.innerText = state.p1Score;
    p2ScoreEl.innerText = state.p2Score;
    p1SetsEl.innerText = state.p1Sets;
    p2SetsEl.innerText = state.p2Sets;

    // Update serving classes
    if (state.server === 1) {
        p1Box.classList.add('serving');
        p2Box.classList.remove('serving');
    } else {
        p2Box.classList.add('serving');
        p1Box.classList.remove('serving');
    }

    // Badminton rule logic for serving courts
    // Even Score = Right Court | Odd Score = Left Court
    const p1Court = (state.p1Score % 2 === 0) ? "Right" : "Left";
    const p2Court = (state.p2Score % 2 === 0) ? "Right" : "Left";

    p1CourtEl.innerText = `Court: ${p1Court}`;
    p2CourtEl.innerText = `Court: ${p2Court}`;

    matchStatusEl.innerText = `SET ${state.currentSet}`;
}

// Show Alerts through HTML overlay Modal
function showModal(title, message) {
    modalTitle.innerText = title;
    modalMessage.innerText = message;
    modal.style.display = "flex";
}

// Initial Render
updateUI();