// App Core States
let state = {
    // Scoring variables
    p1Score: 0,
    p2Score: 0,
    p1Sets: 0,
    p2Sets: 0,
    currentSet: 1,
    server: 1, // 1 or 2
    isGameOver: false,
    isMatchOver: false,

    // Match setup options
    matchType: 'singles',
    p1Name: 'Player 1',
    p2Name: 'Player 2',
    targetSetsToWin: 2
};

// Undo stack to save previous states
let historyStack = [];

// DOM Elements mapping
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

// Action Buttons
const ctrlUndo = document.getElementById('ctrl-undo');
const ctrlSwap = document.getElementById('ctrl-swap');
const ctrlReset = document.getElementById('ctrl-reset');
const ctrlNewMatch = document.getElementById('ctrl-new-match');

// Modal Components
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalActions = document.getElementById('modal-actions');

// Auth DOM
const authIdentifierInput = document.getElementById('auth-identifier');
const btnOtp = document.getElementById('btn-otp');
const otpInputGroup = document.getElementById('otp-input-group');
const otpCodeInput = document.getElementById('otp-code');
const profileNameDisp = document.getElementById('profile-name-disp');

// User Profile Stats State mapping LocalStorage
let userProfile = {
    name: 'Referee',
    matchesPlayed: 0,
    matchesWon: 0,
    matchesLost: 0,
    matchHistory: [] // Items structured: { id, opponent, scoreStr, dateString, type, result: 'Win'|'Loss' }
};

// ==========================================
//   1. SIGNUP & ONBOARDING ENGINES
// ==========================================

// Load user session from LocalStorage
function loadProfileData() {
    const saved = localStorage.getItem('champ_user_profile');
    if (saved) {
        userProfile = JSON.parse(saved);
        profileNameDisp.innerText = userProfile.name;
        // Skip login if session verified
        navigateTo('screen-home');
    } else {
        navigateTo('screen-auth');
    }
}

// Write Profile details to LocalStorage
function saveProfileToDisk() {
    localStorage.setItem('champ_user_profile', JSON.stringify(userProfile));
    profileNameDisp.innerText = userProfile.name;
}

// Social Signups (Mocks instant success)
function handleSocialSignup(provider) {
    userProfile.name = `${provider} User`;
    saveProfileToDisk();
    navigateTo('screen-home');
}

// Send simulated OTP
function sendOTP() {
    const field = authIdentifierInput.value.trim();
    if (!field) {
        alert("Please enter your Email or Mobile Number.");
        return;
    }
    // Simulation triggers verification input visibility
    btnOtp.classList.add('hidden');
    otpInputGroup.classList.remove('hidden');
    alert("Simulated OTP generated! Enter code 1234 to verify.");
}

// Verify simulated OTP
function verifyOTP() {
    const code = otpCodeInput.value;
    if (code !== '1234') {
        alert("Incorrect OTP code. Try entering 1234.");
        return;
    }
    
    // Create name based on contact information
    const identifier = authIdentifierInput.value.trim();
    userProfile.name = identifier.split('@')[0]; // Username extraction
    saveProfileToDisk();
    
    // Progress
    navigateTo('screen-home');
}

// ==========================================
//   2. STATISTICS & MATCH LOG TRACKER
// ==========================================

function viewProfile() {
    // Populate stats fields
    document.getElementById('stat-played').innerText = userProfile.matchesPlayed;
    document.getElementById('stat-won').innerText = userProfile.matchesWon;
    document.getElementById('stat-lost').innerText = userProfile.matchesLost;
    
    const rate = userProfile.matchesPlayed === 0 
        ? 0 
        : Math.round((userProfile.matchesWon / userProfile.matchesPlayed) * 100);
    document.getElementById('stat-rate').innerText = `${rate}%`;

    // Render historical lists
    const container = document.getElementById('history-container');
    container.innerHTML = ""; // Clear loader

    if (userProfile.matchHistory.length === 0) {
        container.innerHTML = `<div class="no-history">No matches refereed yet. Your history will save automatically here.</div>`;
    } else {
        // Render logs backward (most recent first)
        userProfile.matchHistory.slice().reverse().forEach(match => {
            const resultClass = match.result === 'Win' ? 'card-win' : 'card-loss';
            const textResultClass = match.result === 'Win' ? 'text-win' : 'text-loss';
            
            const itemHTML = `
                <div class="match-history-card ${resultClass}">
                    <div class="history-meta">
                        <span class="hist-date">${match.dateString}</span>
                        <div class="hist-opp">vs ${match.opponent}</div>
                        <span class="hist-type">${match.type}</span>
                    </div>
                    <div class="history-outcome">
                        <span class="hist-outcome-text ${textResultClass}">${match.result}</span>
                        <span class="hist-score">${match.scoreStr}</span>
                    </div>
                </div>
            `;
            container.innerHTML += itemHTML;
        });
    }
    navigateTo('screen-profile');
}

// Persists historical stats
function commitMatchToHistory(winnerNum) {
    const oppName = winnerNum === 1 ? state.p2Name : state.p1Name;
    const finalScore = `${state.p1Score}-${state.p2Score}`;
    const resultStatus = winnerNum === 1 ? 'Win' : 'Loss'; // User (Player 1) won or lost

    const now = new Date();
    // Pre-formatting current localized time/date strings securely
    const dateString = now.toLocaleDateString() + ' @ ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const matchRecord = {
        id: Date.now(),
        opponent: oppName,
        scoreStr: finalScore,
        dateString: dateString,
        type: state.matchType === 'singles' ? 'Singles' : 'Doubles',
        result: resultStatus
    };

    // Update global variables
    userProfile.matchesPlayed++;
    if (resultStatus === 'Win') {
        userProfile.matchesWon++;
    } else {
        userProfile.matchesLost++;
    }
    userProfile.matchHistory.push(matchRecord);

    // Save locally
    saveProfileToDisk();
}


// ==========================================
//   3. NAVIGATION ENGINE
// ==========================================
function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

function showUnderProgress(sportName) {
    modalTitle.innerText = `${sportName} Scoreboard`;
    modalMessage.innerText = "This sport is currently under progress! Please return soon.";
    
    modalActions.innerHTML = `
        <button class="btn btn-primary" onclick="modal.style.display = 'none'">Understood</button>
    `;
    modal.style.display = "flex";
}

function confirmExit() {
    if (confirm("Are you sure you want to end this match and return to the main menu? Unsaved scoreboards will be lost.")) {
        navigateTo('screen-home');
    }
}


// ==========================================
//   4. BADMINTON CONFIGURATION
// ==========================================
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
            <input type="text" id="setup-p1-name" class="setup-input" value="${userProfile.name}" placeholder="Enter Player 1 Name" oninput="updateSetupServerNames()">
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
    updateSetupServerNames();
}

function updateSetupServerNames() {
    const p1Val = document.getElementById('setup-p1-name').value || 'Player 1';
    const p2Val = document.getElementById('setup-p2-name').value || 'Player 2';
    
    document.getElementById('server-opt-1').innerText = p1Val;
    document.getElementById('server-opt-2').innerText = p2Val;
}

function startMatch() {
    state.p1Name = document.getElementById('setup-p1-name').value || 'Player 1';
    state.p2Name = document.getElementById('setup-p2-name').value || 'Player 2';
    state.targetSetsToWin = parseInt(document.getElementById('setup-sets').value);
    state.server = parseInt(document.getElementById('setup-server').value);
    
    // Clear State variables
    state.p1Score = 0;
    state.p2Score = 0;
    state.p1Sets = 0;
    state.p2Sets = 0;
    state.currentSet = 1;
    state.isGameOver = false;
    state.isMatchOver = false;
    historyStack = [];

    p1NameEl.value = state.p1Name;
    p2NameEl.value = state.p2Name;

    // Reset scoreboards controls display views
    ctrlSwap.classList.remove('hidden');
    ctrlReset.classList.remove('hidden');
    ctrlNewMatch.classList.add('hidden');

    updateUI();
    navigateTo('screen-scoreboard');
}


// ==========================================
//   5. SCOREBOARD RULES & SCORING MECHANICS
// ==========================================
function saveState() {
    historyStack.push(JSON.parse(JSON.stringify(state)));
}

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

function checkSetWinner() {
    const s1 = state.p1Score;
    const s2 = state.p2Score;

    if ((s1 >= 21 && s1 - s2 >= 2) || s1 === 30) {
        handleSetEnd(1);
    } else if ((s2 >= 21 && s2 - s1 >= 2) || s2 === 30) {
        handleSetEnd(2);
    }
}

function handleSetEnd(winnerNum) {
    state.isGameOver = true;
    const scoreStr = `${Math.max(state.p1Score, state.p2Score)}-${Math.min(state.p1Score, state.p2Score)}`;
    const winnerName = winnerNum === 1 ? state.p1Name : state.p2Name;
    
    if (winnerNum === 1) {
        state.p1Sets++;
    } else {
        state.p2Sets++;
    }

    if (state.p1Sets === state.targetSetsToWin || state.p2Sets === state.targetSetsToWin) {
        state.isMatchOver = true;
        // Save the completed match to Referee profile history
        commitMatchToHistory(winnerNum);
        
        // Show Match Modal
        showEndModal(`Match Won! 🏆`, `${winnerName} won the match by ${scoreStr}.`, true);
    } else {
        // Show Game/Set Modal
        showEndModal(`Set Won!`, `${winnerName} won the set by ${scoreStr}.`, false);
    }
}

// Custom Modal Engine: handles options and click handlers
function showEndModal(title, msg, isMatchOver) {
    modalTitle.innerText = title;
    modalMessage.innerText = msg;
    
    let btnHTML = "";
    if (isMatchOver) {
        btnHTML = `
            <button class="btn btn-primary" onclick="modal.style.display = 'none'; navigateTo('screen-home')">Start New Match</button>
            <button class="btn btn-secondary" onclick="undoMatchEnd()">Undo Point</button>
        `;
    } else {
        btnHTML = `
            <button class="btn btn-primary" onclick="modal.style.display = 'none'; closeModal()">Next Set</button>
            <button class="btn btn-secondary" onclick="undoMatchEnd()">Undo Point</button>
        `;
    }
    
    modalActions.innerHTML = btnHTML;
    modal.style.display = "flex";
}

// Handle clicking outside the modal boundary wrapper
function dismissModalOutside(event) {
    if (event.target === modal) {
        modal.style.display = "none";
        
        // Match over: Freeze board and show special buttons
        if (state.isMatchOver) {
            ctrlSwap.classList.add('hidden');
            ctrlReset.classList.add('hidden');
            ctrlNewMatch.classList.remove('hidden');
        }
    }
}

// Undo direct from within set/match winning dialog
function undoMatchEnd() {
    modal.style.display = "none";
    undo();
}

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

function selectServer(player, event) {
    if (event) event.stopPropagation();

    if (state.server === player || state.isGameOver || state.isMatchOver) return;

    saveState();
    state.server = player;
    updateUI();
}

function undo() {
    if (historyStack.length === 0) return;
    
    // If we undo a completed match, remove the last entry from profile history
    if (state.isMatchOver) {
        const removed = userProfile.matchHistory.pop();
        userProfile.matchesPlayed--;
        if (removed.result === 'Win') {
            userProfile.matchesWon--;
        } else {
            userProfile.matchesLost--;
        }
        saveProfileToDisk();
    }

    state = historyStack.pop();
    p1NameEl.value = state.p1Name;
    p2NameEl.value = state.p2Name;

    // Reset controls layout views
    ctrlSwap.classList.remove('hidden');
    ctrlReset.classList.remove('hidden');
    ctrlNewMatch.classList.add('hidden');

    updateUI();
}

function swapSides() {
    courtLayout.classList.toggle('swapped');
}

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

function updateUI() {
    p1ScoreEl.innerText = state.p1Score;
    p2ScoreEl.innerText = state.p2Score;
    p1SetsEl.innerText = state.p1Sets;
    p2SetsEl.innerText = state.p2Sets;

    if (state.server === 1) {
        p1Box.classList.add('serving');
        p2Box.classList.remove('serving');
    } else {
        p2Box.classList.add('serving');
        p1Box.classList.remove('serving');
    }

    const p1Court = (state.p1Score % 2 === 0) ? "Right" : "Left";
    const p2Court = (state.p2Score % 2 === 0) ? "Right" : "Left";

    p1CourtEl.innerText = `Court: ${p1Court}`;
    p2CourtEl.innerText = `Court: ${p2Court}`;

    matchStatusEl.innerText = `SET ${state.currentSet}`;
}

// ==========================================
//   INIT ENGINE ON RUNTIME
// ==========================================
loadProfileData();