// App State variables
let state = {
    // Scoring & Set variables
    p1Score: 0,
    p2Score: 0,
    p1Sets: 0,
    p2Sets: 0,
    currentSet: 1,
    server: 1, // 1 for Player 1, 2 for Player 2
    isGameOver: false,
    isMatchOver: false,

    // NEW: Configuration options
    matchType: 'singles', // 'singles' or 'doubles'
    p1Name: 'Player 1',
    p2Name: 'Player 2',
    targetSetsToWin: 2 // Sets needed to win (mapped from match length dropdown)
};

// Undo stack to save previous states
let historyStack = [];

// DOM Elements
const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');
const p1SetsEl = document.getElementById('p1-sets');
const p2SetsEl = document.getElementById('p2-sets');
const p1NameEl = document.getElementById('p1-name');
const p2NameEl = document.getElementById('p2-name');
const p1Box = document.getElementById('p1-box');
const p2Box = document.getElementById('p2-box');
const p1CourtEl = document.getElementById('p1-court');
const p2CourtEl = document.getElementById('p2-court');
const matchStatusEl = document.getElementById('match-status');
const courtLayout = document.getElementById('court-layout');

// Modal Elements
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');

// Setup form Elements
const setupP1Name = document.getElementById('setup-p1-name');
const setupP2Name = document.getElementById('setup-p2-name');
const serverOpt1 = document.getElementById('server-opt-1');
const serverOpt2 = document.getElementById('server-opt-2');

// ==========================================
//   A. SCREEN NAVIGATION ENGINE
// ==========================================
function navigateTo(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    // Show target screen
    document.getElementById(screenId).classList.remove('hidden');
}

// Shows "Under construction" message using our existing modal
function showUnderProgress(sportName) {
    modalTitle.innerText = `${sportName} Scoreboard`;
    modalMessage.innerText = "This sport is currently under progress! Please return soon.";
    modalCloseBtn.innerText = "Understood";
    
    // Custom click handler to just close modal on homepage alerts
    modalCloseBtn.onclick = function() {
        modal.style.display = "none";
    };
    
    modal.style.display = "flex";
}

// Exit from the scoreboard safely to avoid losing progress accidentally
function confirmExit() {
    if (confirm("Are you sure you want to end this match and return to the main menu? Your scores will be lost.")) {
        navigateTo('screen-home');
    }
}

// ==========================================
//   B. BADMINTON SETUP CONFIG LOGIC
// ==========================================

// Handle Singles vs Doubles UI toggle
function setMatchType(type) {
    state.matchType = type;
    const sBtn = document.getElementById('type-singles');
    const dBtn = document.getElementById('type-doubles');
    const namesContainer = document.getElementById('names-container');

    if (type === 'singles') {
        sBtn.classList.add('active');
        dBtn.classList.remove('active');
        namesContainer.innerHTML = `
            <label class="input-label">Player Names</label>
            <input type="text" id="setup-p1-name" class="setup-input" value="Player 1" placeholder="Enter Player 1 Name" oninput="updateSetupServerNames()">
            <input type="text" id="setup-p2-name" class="setup-input" value="Player 2" placeholder="Enter Player 2 Name" oninput="updateSetupServerNames()">
        `;
    } else {
        sBtn.classList.remove('active');
        dBtn.classList.add('active');
        namesContainer.innerHTML = `
            <label class="input-label">Team Names</label>
            <input type="text" id="setup-p1-name" class="setup-input" value="Team A" placeholder="Enter Team A Name" oninput="updateSetupServerNames()">
            <input type="text" id="setup-p2-name" class="setup-input" value="Team B" placeholder="Enter Team B Name" oninput="updateSetupServerNames()">
        `;
    }
    // Update variables
    updateSetupServerNames();
}

// Automatically sync names entered in form to Server Dropdown options
function updateSetupServerNames() {
    const p1Val = document.getElementById('setup-p1-name').value || (state.matchType === 'singles' ? 'Player 1' : 'Team A');
    const p2Val = document.getElementById('setup-p2-name').value || (state.matchType === 'singles' ? 'Player 2' : 'Team B');
    
    document.getElementById('server-opt-1').innerText = p1Val;
    document.getElementById('server-opt-2').innerText = p2Val;
}

// Ensure first event listeners update dropdowns
setupP1Name.addEventListener('input', updateSetupServerNames);
setupP2Name.addEventListener('input', updateSetupServerNames);

// Build variables and launch Scoreboard Screen with choices
function startMatch() {
    state.p1Name = document.getElementById('setup-p1-name').value || (state.matchType === 'singles' ? 'Player 1' : 'Team A');
    state.p2Name = document.getElementById('setup-p2-name').value || (state.matchType === 'singles' ? 'Player 2' : 'Team B');
    state.targetSetsToWin = parseInt(document.getElementById('setup-sets').value);
    state.server = parseInt(document.getElementById('setup-server').value);
    
    // Reset all game variables for the new match
    state.p1Score = 0;
    state.p2Score = 0;
    state.p1Sets = 0;
    state.p2Sets = 0;
    state.currentSet = 1;
    state.isGameOver = false;
    state.isMatchOver = false;
    historyStack = [];

    // Map names to scoreboard elements
    p1NameEl.value = state.p1Name;
    p2NameEl.value = state.p2Name;

    // Direct interface renderer
    updateUI();

    // Change screen view
    navigateTo('screen-scoreboard');
}

// ==========================================
//   C. MATCH LOGIC & REFEREE CONTROLS
// ==========================================

// Save snapshot of current state to history stack
function saveState() {
    historyStack.push(JSON.parse(JSON.stringify(state)));
}

// Add point to scored player
function scorePoint(player) {
    if (state.isGameOver || state.isMatchOver) return;

    saveState();

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

    // Configured Sets check
    if (state.p1Sets === state.targetSetsToWin || state.p2Sets === state.targetSetsToWin) {
        state.isMatchOver = true;
        showModal("Match Finished! 🏆", `${getPlayerName(winner)} wins the match!`, "Back to Home", true);
    } else {
        showModal("End of Set", `${getPlayerName(winner)} wins Set ${state.currentSet}. Prepare for next set.`, "Next Set", false);
    }
}

// Get the visual names written in text inputs
function getPlayerName(num) {
    return document.getElementById(`p${num}-name`).value;
}

// Overlay triggers
function showModal(title, message, btnText, isGameFinished) {
    modalTitle.innerText = title;
    modalMessage.innerText = message;
    modalCloseBtn.innerText = btnText;
    
    // Set custom click triggers based on status
    modalCloseBtn.onclick = function() {
        modal.style.display = "none";
        if (isGameFinished) {
            navigateTo('screen-home');
        } else {
            closeModal();
        }
    };
    
    modal.style.display = "flex";
}

// Next Set handler (sets state for next set or restarts)
function closeModal() {
    modal.style.display = "none";
    if (state.isGameOver) {
        state.p1Score = 0;
        state.p2Score = 0;
        state.currentSet++;
        state.isGameOver = false;
        updateUI();
    }
}

// Overwrite and change server manually without changing scores
function selectServer(player, event) {
    if (event) event.stopPropagation();

    if (state.server === player || state.isGameOver || state.isMatchOver) return;

    saveState();
    state.server = player;
    updateUI();
}

// Undo Button Functionality
function undo() {
    if (historyStack.length === 0) return;
    state = historyStack.pop();
    
    // Ensure input fields match restored state name values
    p1NameEl.value = state.p1Name;
    p2NameEl.value = state.p2Name;
    
    updateUI();
}

// Swap layout orientations
function swapSides() {
    courtLayout.classList.toggle('swapped');
}

// Fully resets all scores, history and inputs
function resetMatch() {
    if(confirm("Are you sure you want to reset the entire match score?")) {
        state.p1Score = 0;
        state.p2Score = 0;
        state.p1Sets = 0;
        state.p2Sets = 0;
        state.currentSet = 1;
        state.isGameOver = false;
        state.isMatchOver = false;
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

// Launch to Homepage initially
navigateTo('screen-home');