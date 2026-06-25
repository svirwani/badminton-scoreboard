// App Core States
let state = {
    // Scoring variables
    p1Score: 0,
    p2Score: 0,
    p1Sets: 0,
    p2Sets: 0,
    currentSet: 1,
    serverSide: 1, // 1 for Team A, 2 for Team B
    isGameOver: false,
    isMatchOver: false,

    // Match setup options
    matchType: 'singles', // 'singles' or 'doubles'
    p1Name: 'Player 1',  // Team A / Singles Player 1
    p2Name: 'Player 2',  // Team B / Singles Player 2
    targetSetsToWin: 2,

    // INDIVIDUAL PLAYER NAMES (Configured in Setup)
    tA_p1: 'Player 1A',
    tA_p2: 'Player 1B',
    tB_p1: 'Player 2A',
    tB_p2: 'Player 2B',

    // ACTIVE COURT LOCATIONS (Who is standing where)
    tA_Left: 'Player 1A',
    tA_Right: 'Player 1B',
    tB_Left: 'Player 2A',
    tB_Right: 'Player 2B',

    activeServerName: 'Player 1A' // The specific player serving
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
    matchHistory: []
};

// ==========================================
//   1. SIGNUP & ONBOARDING ENGINES
// ==========================================
function loadProfileData() {
    const saved = localStorage.getItem('champ_user_profile');
    if (saved) {
        userProfile = JSON.parse(saved);
        profileNameDisp.innerText = userProfile.name;
        navigateTo('screen-home');
    } else {
        navigateTo('screen-auth');
    }
}

function saveProfileToDisk() {
    localStorage.setItem('champ_user_profile', JSON.stringify(userProfile));
    profileNameDisp.innerText = userProfile.name;
}

function handleSocialSignup(provider) {
    userProfile.name = `${provider} User`;
    saveProfileToDisk();
    navigateTo('screen-home');
}

function sendOTP() {
    const field = authIdentifierInput.value.trim();
    if (!field) {
        alert("Please enter your Email or Mobile Number.");
        return;
    }
    btnOtp.classList.add('hidden');
    otpInputGroup.classList.remove('hidden');
    alert("Simulated OTP generated! Enter code 1234 to verify.");
}

function verifyOTP() {
    const code = otpCodeInput.value;
    if (code !== '1234') {
        alert("Incorrect OTP code. Try entering 1234.");
        return;
    }
    const identifier = authIdentifierInput.value.trim();
    userProfile.name = identifier.split('@')[0];
    saveProfileToDisk();
    navigateTo('screen-home');
}

// ==========================================
//   2. STATISTICS & MATCH LOG TRACKER
// ==========================================
function viewProfile() {
    document.getElementById('stat-played').innerText = userProfile.matchesPlayed;
    document.getElementById('stat-won').innerText = userProfile.matchesWon;
    document.getElementById('stat-lost').innerText = userProfile.matchesLost;
    
    const rate = userProfile.matchesPlayed === 0 
        ? 0 
        : Math.round((userProfile.matchesWon / userProfile.matchesPlayed) * 100);
    document.getElementById('stat-rate').innerText = `${rate}%`;

    const container = document.getElementById('history-container');
    container.innerHTML = "";

    if (userProfile.matchHistory.length === 0) {
        container.innerHTML = `<div class="no-history">No matches refereed yet. Your history will save automatically here.</div>`;
    } else {
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

function commitMatchToHistory(winnerNum) {
    const oppName = winnerNum === 1 ? state.p2Name : state.p1Name;
    const finalScore = `${state.p1Score}-${state.p2Score}`;
    const resultStatus = winnerNum === 1 ? 'Win' : 'Loss';

    const now = new Date();
    const dateString = now.toLocaleDateString() + ' @ ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const matchRecord = {
        id: Date.now(),
        opponent: oppName,
        scoreStr: finalScore,
        dateString: dateString,
        type: state.matchType === 'singles' ? 'Singles' : 'Doubles',
        result: resultStatus
    };

    userProfile.matchesPlayed++;
    if (resultStatus === 'Win') {
        userProfile.matchesWon++;
    } else {
        userProfile.matchesLost++;
    }
    userProfile.matchHistory.push(matchRecord);
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

    const opt3 = document.getElementById('server-opt-3');
    const opt4 = document.getElementById('server-opt-4');

    if (type === 'singles') {
        sBtn.classList.add('active');
        dBtn.classList.remove('active');
        opt3.classList.add('hidden');
        opt4.classList.add('hidden');
        
        namesContainer.innerHTML = `
            <label class="input-label">Player Names</label>
            <input type="text" id="setup-p1-name" class="setup-input" value="${userProfile.name}" placeholder="Enter Player 1 Name" oninput="updateSetupServerNames()">
            <input type="text" id="setup-p2-name" class="setup-input" value="Player 2" placeholder="Enter Player 2 Name" oninput="updateSetupServerNames()">
        `;
    } else {
        sBtn.classList.remove('active');
        dBtn.classList.add('active');
        opt3.classList.remove('hidden');
        opt4.classList.remove('hidden');
        
        namesContainer.innerHTML = `
            <label class="input-label">Team A Configuration</label>
            <input type="text" id="setup-p1-name" class="setup-input" value="Team A" placeholder="Team A Name" oninput="updateSetupServerNames()">
            <input type="text" id="setup-tA-p1" class="setup-input" value="Player 1A" placeholder="Team A Player 1 Name" oninput="updateSetupServerNames()">
            <input type="text" id="setup-tA-p2" class="setup-input" value="Player 1B" placeholder="Team A Player 2 Name" oninput="updateSetupServerNames()">
            
            <label class="input-label" style="margin-top: 1rem;">Team B Configuration</label>
            <input type="text" id="setup-p2-name" class="setup-input" value="Team B" placeholder="Team B Name" oninput="updateSetupServerNames()">
            <input type="text" id="setup-tB-p1" class="setup-input" value="Player 2A" placeholder="Team B Player 1 Name" oninput="updateSetupServerNames()">
            <input type="text" id="setup-tB-p2" class="setup-input" value="Player 2B" placeholder="Team B Player 2 Name" oninput="updateSetupServerNames()">
        `;
    }
    updateSetupServerNames();
}

function updateSetupServerNames() {
    if (state.matchType === 'singles') {
        const p1Val = document.getElementById('setup-p1-name').value || 'Player 1';
        const p2Val = document.getElementById('setup-p2-name').value || 'Player 2';
        document.getElementById('server-opt-1').innerText = p1Val;
        document.getElementById('server-opt-2').innerText = p2Val;
    } else {
        const p1a = document.getElementById('setup-tA-p1').value || 'Player 1A';
        const p1b = document.getElementById('setup-tA-p2').value || 'Player 1B';
        const p2a = document.getElementById('setup-tB-p1').value || 'Player 2A';
        const p2b = document.getElementById('setup-tB-p2').value || 'Player 2B';

        document.getElementById('server-opt-1').innerText = `${p1a} (Team A)`;
        document.getElementById('server-opt-2').innerText = `${p2a} (Team B)`;
        document.getElementById('server-opt-3').innerText = `${p1b} (Team A)`;
        document.getElementById('server-opt-4').innerText = `${p2b} (Team B)`;
    }
}

function startMatch() {
    state.p1Name = document.getElementById('setup-p1-name').value || 'Player 1';
    state.p2Name = document.getElementById('setup-p2-name').value || 'Player 2';
    state.targetSetsToWin = parseInt(document.getElementById('setup-sets').value);
    
    // Clear Match variables
    state.p1Score = 0;
    state.p2Score = 0;
    state.p1Sets = 0;
    state.p2Sets = 0;
    state.currentSet = 1;
    state.isGameOver = false;
    state.isMatchOver = false;
    historyStack = [];

    // Map player details based on Singles/Doubles configurations
    if (state.matchType === 'singles') {
        state.tA_p1 = state.p1Name;
        state.tA_p2 = "";
        state.tB_p1 = state.p2Name;
        state.tB_p2 = "";

        // Default initial courts (Singles starts Right on 0-0)
        state.tA_Right = state.tA_p1;
        state.tA_Left = "";
        state.tB_Right = state.tB_p1;
        state.tB_Left = "";

        // Assign starting server side
        const selectedServerVal = parseInt(document.getElementById('setup-server').value);
        state.serverSide = (selectedServerVal === 1) ? 1 : 2;
        state.activeServerName = (state.serverSide === 1) ? state.tA_p1 : state.tB_p1;
    } else {
        state.tA_p1 = document.getElementById('setup-tA-p1').value || 'Player 1A';
        state.tA_p2 = document.getElementById('setup-tA-p2').value || 'Player 1B';
        state.tB_p1 = document.getElementById('setup-tB-p1').value || 'Player 2A';
        state.tB_p2 = document.getElementById('setup-tB-p2').value || 'Player 2B';

        // Starting Positions
        state.tA_Right = state.tA_p1;
        state.tA_Left = state.tA_p2;
        state.tB_Right = state.tB_p1;
        state.tB_Left = state.tB_p2;

        const serverOptIndex = parseInt(document.getElementById('setup-server').value);
        if (serverOptIndex === 1) { // Team A P1
            state.serverSide = 1;
            state.activeServerName = state.tA_p1;
        } else if (serverOptIndex === 3) { // Team A P2
            state.serverSide = 1;
            state.activeServerName = state.tA_p2;
            // Swap setup positions so designated server starts on the Right (Even) court on 0-0
            state.tA_Right = state.tA_p2;
            state.tA_Left = state.tA_p1;
        } else if (serverOptIndex === 2) { // Team B P1
            state.serverSide = 2;
            state.activeServerName = state.tB_p1;
        } else { // Team B P2
            state.serverSide = 2;
            state.activeServerName = state.tB_p2;
            state.tB_Right = state.tB_p2;
            state.tB_Left = state.tB_p1;
        }
    }

    p1NameEl.value = state.p1Name;
    p2NameEl.value = state.p2Name;

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

    const isCurrentServerScoring = (state.serverSide === player);

    if (player === 1) {
        state.p1Score++;
    } else {
        state.p2Score++;
    }

    // OFFICIAL BADMINTON ROTATION LOGIC
    if (state.matchType === 'singles') {
        state.serverSide = player;
        state.activeServerName = (player === 1) ? state.tA_p1 : state.tB_p1;
        
        // Move players to correct side according to score
        state.tA_Right = (state.p1Score % 2 === 0) ? state.tA_p1 : "";
        state.tA_Left = (state.p1Score % 2 === 0) ? "" : state.tA_p1;
        state.tB_Right = (state.p2Score % 2 === 0) ? state.tB_p1 : "";
        state.tB_Left = (state.p2Score % 2 === 0) ? "" : state.tB_p1;
    } else {
        // Doubles Rule Engine
        if (isCurrentServerScoring) {
            // Serving team scored -> Partner swaps positions on court side
            if (player === 1) {
                const temp = state.tA_Right;
                state.tA_Right = state.tA_Left;
                state.tA_Left = temp;
                
                // Same player serves again from the alternate court
                state.activeServerName = (state.p1Score % 2 === 0) ? state.tA_Right : state.tA_Left;
            } else {
                const temp = state.tB_Right;
                state.tB_Right = state.tB_Left;
                state.tB_Left = temp;
                
                state.activeServerName = (state.p2Score % 2 === 0) ? state.tB_Right : state.tB_Left;
            }
        } else {
            // Receiving team scored -> Shift serving side. NO POSITION SWAPS.
            state.serverSide = player;
            if (player === 1) {
                state.activeServerName = (state.p1Score % 2 === 0) ? state.tA_Right : state.tA_Left;
            } else {
                state.activeServerName = (state.p2Score % 2 === 0) ? state.tB_Right : state.tB_Left;
            }
        }
    }

    checkSetWinner();
    updateUI();
}

// Manual Swap / Position Select (Clicked directly on tactical quadrant)
function togglePlayerPosition(teamNum, courtStr) {
    if (state.isGameOver || state.isMatchOver) return;

    saveState();

    if (state.matchType === 'singles') {
        // Singles: Moving player swaps their court and switches serve if applicable
        if (teamNum === 1) {
            state.tA_Right = (courtStr === 'Right') ? state.tA_p1 : "";
            state.tA_Left = (courtStr === 'Left') ? state.tA_p1 : "";
            if (state.serverSide === 1) {
                state.serverSide = 1;
            }
        } else {
            state.tB_Right = (courtStr === 'Right') ? state.tB_p1 : "";
            state.tB_Left = (courtStr === 'Left') ? state.tB_p1 : "";
        }
    } else {
        // Doubles Court Taps
        if (teamNum === 1) {
            // If active serving side: Tapping partners swaps positions (changes active server)
            const temp = state.tA_Right;
            state.tA_Right = state.tA_Left;
            state.tA_Left = temp;

            if (state.serverSide === 1) {
                state.activeServerName = (state.p1Score % 2 === 0) ? state.tA_Right : state.tA_Left;
            }
        } else {
            const temp = state.tB_Right;
            state.tB_Right = state.tB_Left;
            state.tB_Left = temp;

            if (state.serverSide === 2) {
                state.activeServerName = (state.p2Score % 2 === 0) ? state.tB_Right : state.tB_Left;
            }
        }
    }
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
        commitMatchToHistory(winnerNum);
        showEndModal(`Match Finished! 🏆`, `${winnerName} won the match by ${scoreStr}.`, true);
    } else {
        showEndModal(`Set Finished!`, `${winnerName} won the set by ${scoreStr}.`, false);
    }
}

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

function dismissModalOutside(event) {
    if (event.target === modal) {
        modal.style.display = "none";
        
        if (state.isMatchOver) {
            ctrlSwap.classList.add('hidden');
            ctrlReset.classList.add('hidden');
            ctrlNewMatch.classList.remove('hidden');
        }
    }
}

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
        
        // Reset positions for next set
        if (state.matchType === 'singles') {
            state.tA_Right = state.tA_p1;
            state.tA_Left = "";
            state.tB_Right = state.tB_p1;
            state.tB_Left = "";
        } else {
            state.tA_Right = state.tA_p1;
            state.tA_Left = state.tA_p2;
            state.tB_Right = state.tB_p1;
            state.tB_Left = state.tB_p2;
        }

        updateUI();
    }
}

// Shift serve manually via the score panels
function selectServer(teamNum, event) {
    if (event) event.stopPropagation();

    if (state.isGameOver || state.isMatchOver) return;

    saveState();
    state.serverSide = teamNum;

    // Map active server to correct player based on Even/Odd score court
    if (state.matchType === 'singles') {
        state.activeServerName = (teamNum === 1) ? state.tA_p1 : state.tB_p1;
    } else {
        if (teamNum === 1) {
            state.activeServerName = (state.p1Score % 2 === 0) ? state.tA_Right : state.tA_Left;
        } else {
            state.activeServerName = (state.p2Score % 2 === 0) ? state.tB_Right : state.tB_Left;
        }
    }
    updateUI();
}

function undo() {
    if (historyStack.length === 0) return;
    
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

    ctrlSwap.classList.remove('hidden');
    ctrlReset.classList.remove('hidden');
    ctrlNewMatch.classList.add('hidden');

    updateUI();
}

function swapSides() {
    courtLayout.classList.toggle('swapped');
    document.getElementById('court-visual').classList.toggle('swapped');
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
        
        if (state.matchType === 'singles') {
            state.tA_Right = state.tA_p1;
            state.tA_Left = "";
            state.tB_Right = state.tB_p1;
            state.tB_Left = "";
        } else {
            state.tA_Right = state.tA_p1;
            state.tA_Left = state.tA_p2;
            state.tB_Right = state.tB_p1;
            state.tB_Left = state.tB_p2;
        }

        historyStack = [];
        updateUI();
    }
}

// UI RENDERING ENGINE
function updateUI() {
    // 1. Text Scores
    p1ScoreEl.innerText = state.p1Score;
    p2ScoreEl.innerText = state.p2Score;
    p1SetsEl.innerText = state.p1Sets;
    p2SetsEl.innerText = state.p2Sets;

    // 2. Active Server Box Styles
    if (state.serverSide === 1) {
        p1Box.classList.add('serving');
        p2Box.classList.remove('serving');
    } else {
        p2Box.classList.add('serving');
        p1Box.classList.remove('serving');
    }

    // 3. Text Court Labels
    const p1ActiveCourt = (state.matchType === 'singles')
        ? (state.p1Score % 2 === 0 ? 'Right' : 'Left')
        : (state.activeServerName === state.tA_Right ? 'Right' : 'Left');
        
    const p2ActiveCourt = (state.matchType === 'singles')
        ? (state.p2Score % 2 === 0 ? 'Right' : 'Left')
        : (state.activeServerName === state.tB_Right ? 'Right' : 'Left');

    p1CourtEl.innerText = (state.serverSide === 1) ? `Server: ${state.activeServerName} (${p1ActiveCourt})` : `Receiver: ${state.matchType === 'singles' ? state.tA_p1 : (p2ActiveCourt === 'Right' ? state.tA_Right : state.tA_Left)}`;
    p2CourtEl.innerText = (state.serverSide === 2) ? `Server: ${state.activeServerName} (${p2ActiveCourt})` : `Receiver: ${state.matchType === 'singles' ? state.tB_p1 : (p1ActiveCourt === 'Right' ? state.tB_Right : state.tB_Left)}`;
    
    matchStatusEl.innerText = `SET ${state.currentSet}`;

    // 4. COURT VISUAL ELEMENTS RENDERING
    // Reset all quadrants
    document.querySelectorAll('.visual-quadrant').forEach(q => {
        q.classList.remove('serving-quad');
    });
    document.getElementById('player-p1-left').innerText = "";
    document.getElementById('player-p1-right').innerText = "";
    document.getElementById('player-p2-left').innerText = "";
    document.getElementById('player-p2-right').innerText = "";

    // Render Players to positions
    document.getElementById('player-p1-left').innerText = state.tA_Left;
    document.getElementById('player-p1-right').innerText = state.tA_Right;
    document.getElementById('player-p2-left').innerText = state.tB_Left;
    document.getElementById('player-p2-right').innerText = state.tB_Right;

    // HIGHLIGHT ONLY THE ACTIVE SERVER
    if (state.serverSide === 1) {
        if (state.activeServerName === state.tA_Right) {
            document.getElementById('quad-p1-right').classList.add('serving-quad');
        } else {
            document.getElementById('quad-p1-left').classList.add('serving-quad');
        }
    } else {
        if (state.activeServerName === state.tB_Right) {
            document.getElementById('quad-p2-right').classList.add('serving-quad');
        } else {
            document.getElementById('quad-p2-left').classList.add('serving-quad');
        }
    }
}

// Initial Run
loadProfileData();