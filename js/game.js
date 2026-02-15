/**
 * Tambola Game - Organizer Controller
 * Main game logic for the organizer panel
 */

class TambolaGame {
    constructor() {
        this.participants = [];
        this.calledNumbers = [];
        this.remainingNumbers = [];
        this.currentNumber = null;
        this.autoCallInterval = null;
        this.displayWindow = null;
        
        // Initialize sound manager
        this.sounds = new SoundManager();
        
        // Winner limits per category
        this.winnerLimits = {
            earlyFive: 1,
            topLine: 2,
            middleLine: 2,
            bottomLine: 2,
            corners: 2,
            fullHouse: 3
        };
        
        // Winners arrays (multiple winners per category)
        this.winners = {
            earlyFive: [],
            topLine: [],
            middleLine: [],
            bottomLine: [],
            corners: [],
            fullHouse: []
        };

        // Announcement mode: true = auto, false = manual
        this.autoAnnounce = true;
        // Queue for pending winner announcements (manual mode)
        this.pendingWinners = [];

        this.init();
    }

    async init() {
        // Initialize number pool (1-90)
        this.remainingNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
        this._shuffle(this.remainingNumbers);

        // Generate number grid
        this.renderNumberGrid();

        // Load or generate participants
        await this.loadParticipants();

        // Setup event listeners
        this.setupEventListeners();

        // Setup storage listener for cross-window communication
        this.setupStorageListener();
        
        // Setup sound toggle
        this.setupSoundToggle();
    }

    setupSoundToggle() {
        const soundBtn = document.getElementById('soundToggleBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const enabled = this.sounds.toggle();
                soundBtn.textContent = enabled ? '🔊' : '🔇';
                soundBtn.classList.toggle('muted', !enabled);
                this.sounds.playClick();
            });
        }
    }

    renderNumberGrid() {
        const grid = document.getElementById('numberGrid');
        grid.innerHTML = '';
        
        for (let i = 1; i <= 90; i++) {
            const cell = document.createElement('div');
            cell.className = 'number-cell';
            cell.dataset.number = i;
            cell.textContent = i;
            cell.addEventListener('click', () => this.manualCallNumber(i));
            grid.appendChild(cell);
        }
    }

    async loadParticipants() {
        try {
            // Try to load from participants.json
            const response = await fetch('data/participants.json');
            const data = await response.json();
            this.participants = data.participants;
            console.log('Loaded participants from file:', this.participants.length);
        } catch (error) {
            console.log('No participants.json found, generating sample data...');
            // Generate sample participants
            const generator = new TambolaTicketGenerator();
            const data = generator.generateParticipantsData(100, this.generateSampleNames(100));
            this.participants = data.participants;
            
            // Save to localStorage for persistence
            localStorage.setItem('tambolaParticipants', JSON.stringify(data));
        }

        // Initialize marked numbers for each participant
        this.participants.forEach(p => {
            p.markedNumbers = [];
            p.rowsCompleted = [false, false, false];
        });

        this.renderParticipants();
        document.getElementById('participantCount').textContent = this.participants.length;
    }

    generateSampleNames(count) {
        const firstNames = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Neha', 'Arjun', 'Kavita', 'Raj', 'Anita', 
            'Suresh', 'Meera', 'Karan', 'Pooja', 'Sanjay', 'Deepika', 'Rohit', 'Anjali', 'Vivek', 'Sunita',
            'Arun', 'Ritu', 'Manish', 'Swati', 'Ashok', 'Nisha', 'Gaurav', 'Shweta', 'Nitin', 'Rekha'];
        const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Mehta', 'Joshi', 'Shah', 'Reddy',
            'Iyer', 'Nair', 'Rao', 'Desai', 'Chopra', 'Malhotra', 'Kapoor', 'Bhatia', 'Agarwal', 'Jain'];
        
        const names = [];
        for (let i = 0; i < count; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            names.push(`${firstName} ${lastName}`);
        }
        return names;
    }

    renderParticipants() {
        const list = document.getElementById('participantsList');
        list.innerHTML = '';

        this.participants.forEach(p => {
            const item = document.createElement('div');
            item.className = 'participant-item';
            if (this.isWinner(p)) {
                item.classList.add('winner');
            }

            const markedCount = p.markedNumbers ? p.markedNumbers.length : 0;
            
            item.innerHTML = `
                <span class="participant-name">${p.name}</span>
                <span class="participant-progress">${markedCount}/15</span>
            `;
            
            item.addEventListener('click', () => this.showParticipantTicket(p));
            list.appendChild(item);
        });
    }

    isWinner(participant) {
        return Object.values(this.winners).some(w => w && w.id === participant.id);
    }

    showParticipantTicket(participant) {
        const modal = document.getElementById('ticketModal');
        const nameEl = document.getElementById('modalParticipantName');
        const ticketEl = document.getElementById('modalTicket');
        const progressEl = document.getElementById('modalProgress');

        nameEl.textContent = participant.name;
        
        // Render ticket
        ticketEl.innerHTML = '';
        for (let row = 0; row < 3; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'ticket-row';
            
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                const num = participant.ticket[row][col];
                
                if (num === null) {
                    cell.className = 'ticket-cell empty';
                } else {
                    cell.className = 'ticket-cell';
                    cell.textContent = num;
                    if (participant.markedNumbers && participant.markedNumbers.includes(num)) {
                        cell.classList.add('marked');
                    }
                }
                rowDiv.appendChild(cell);
            }
            ticketEl.appendChild(rowDiv);
        }

        // Show progress
        const markedCount = participant.markedNumbers ? participant.markedNumbers.length : 0;
        progressEl.textContent = `Marked: ${markedCount}/15 numbers`;

        modal.classList.add('show');
    }

    setupEventListeners() {
        // Call number button
        document.getElementById('callNumberBtn').addEventListener('click', () => {
            this.callNextNumber();
        });

        // Auto call toggle
        document.getElementById('autoCallToggle').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startAutoCall();
            } else {
                this.stopAutoCall();
            }
        });

        // Auto call speed
        document.getElementById('autoCallSpeed').addEventListener('change', () => {
            if (this.autoCallInterval) {
                this.stopAutoCall();
                this.startAutoCall();
            }
        });

        // Open display screen
        document.getElementById('openDisplayBtn').addEventListener('click', () => {
            this.openDisplayScreen();
        });

        // Reset game
        document.getElementById('resetGameBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
                this.resetGame();
            }
        });

        // Close modal
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('ticketModal').classList.remove('show');
        });

        // Search participants
        document.getElementById('searchParticipant').addEventListener('input', (e) => {
            this.filterParticipants(e.target.value);
        });

        // Click outside modal to close
        document.getElementById('ticketModal').addEventListener('click', (e) => {
            if (e.target.id === 'ticketModal') {
                document.getElementById('ticketModal').classList.remove('show');
            }
        });

        // Announcement mode toggle
        document.getElementById('announceModeToggle').addEventListener('change', (e) => {
            this.autoAnnounce = e.target.checked;
            this.updateAnnouncementModeUI();
        });

        // Show winner button (manual mode)
        document.getElementById('showWinnerBtn').addEventListener('click', () => {
            this.showNextPendingWinner();
        });
    }

    updateAnnouncementModeUI() {
        const pendingSection = document.getElementById('pendingWinnerSection');
        const showBtn = document.getElementById('showWinnerBtn');
        const pendingText = document.getElementById('pendingWinnerText');

        if (this.autoAnnounce) {
            // Auto mode - hide manual controls
            pendingSection.classList.add('hidden');
            
            // If switching to auto and there are pending winners, show them all
            while (this.pendingWinners.length > 0) {
                const winner = this.pendingWinners.shift();
                this.sendWinnerToDisplay(winner.category, winner.name, winner.displayName);
            }
        } else {
            // Manual mode - show manual controls
            pendingSection.classList.remove('hidden');
            this.updatePendingWinnerUI();
        }
    }

    updatePendingWinnerUI() {
        const showBtn = document.getElementById('showWinnerBtn');
        const pendingText = document.getElementById('pendingWinnerText');

        if (this.pendingWinners.length > 0) {
            const next = this.pendingWinners[0];
            pendingText.textContent = `${next.name} - ${next.displayName} (${this.pendingWinners.length} pending)`;
            showBtn.disabled = false;
            showBtn.classList.add('pulse');
        } else {
            pendingText.textContent = 'No pending winners';
            showBtn.disabled = true;
            showBtn.classList.remove('pulse');
        }
    }

    showNextPendingWinner() {
        if (this.pendingWinners.length === 0) return;

        const winner = this.pendingWinners.shift();
        this.sendWinnerToDisplay(winner.category, winner.name, winner.displayName);
        this.updatePendingWinnerUI();
    }

    setupStorageListener() {
        // Listen for storage events from display window
        window.addEventListener('storage', (e) => {
            if (e.key === 'tambolaDisplayReady' && e.newValue === 'true') {
                this.syncDisplayWindow();
            }
        });
    }

    callNextNumber() {
        if (this.remainingNumbers.length === 0) {
            alert('All numbers have been called!');
            this.stopAutoCall();
            this.sounds.playError();
            return;
        }

        // Get next random number
        const number = this.remainingNumbers.pop();
        this.currentNumber = number;
        this.calledNumbers.push(number);

        // Play number call sound
        this.sounds.playNumberCall();

        // Update UI
        this.updateUI();

        // Check for winners
        this.checkWinners(number);

        // Sync with display window
        this.syncDisplayWindow();
    }

    manualCallNumber(number) {
        if (this.calledNumbers.includes(number)) {
            this.sounds.playError();
            return; // Already called
        }

        // Remove from remaining
        const idx = this.remainingNumbers.indexOf(number);
        if (idx > -1) {
            this.remainingNumbers.splice(idx, 1);
        }

        this.currentNumber = number;
        this.calledNumbers.push(number);

        // Play number call sound
        this.sounds.playNumberCall();

        // Update UI
        this.updateUI();

        // Check for winners
        this.checkWinners(number);

        // Sync with display window
        this.syncDisplayWindow();
    }

    updateUI() {
        // Update current number display
        document.getElementById('currentNumber').textContent = this.currentNumber || '--';

        // Update number grid
        if (this.currentNumber) {
            const cell = document.querySelector(`.number-cell[data-number="${this.currentNumber}"]`);
            if (cell) {
                cell.classList.add('called');
            }
        }

        // Update called numbers list
        const calledList = document.getElementById('calledNumbersList');
        calledList.innerHTML = '';
        [...this.calledNumbers].reverse().forEach(num => {
            const span = document.createElement('span');
            span.textContent = num;
            calledList.appendChild(span);
        });

        // Update count
        document.getElementById('calledCount').textContent = this.calledNumbers.length;
    }

    checkWinners(calledNumber) {
        this.participants.forEach(participant => {
            // Check if this number is on their ticket
            let found = false;
            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 9; col++) {
                    if (participant.ticket[row][col] === calledNumber) {
                        if (!participant.markedNumbers) {
                            participant.markedNumbers = [];
                        }
                        participant.markedNumbers.push(calledNumber);
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }

            if (found) {
                // Check for Early Five (1 winner)
                if (this.winners.earlyFive.length < this.winnerLimits.earlyFive && 
                    participant.markedNumbers.length >= 5 &&
                    !this.hasWon(participant, 'earlyFive')) {
                    this.announceWinner('earlyFive', participant, 'Early Five');
                }

                // Check rows (2 winners each)
                this.checkRowWins(participant);
                
                // Check corners (2 winners)
                this.checkCornerWins(participant);

                // Check Full House (3 winners)
                if (this.winners.fullHouse.length < this.winnerLimits.fullHouse && 
                    participant.markedNumbers.length >= 15 &&
                    !this.hasWon(participant, 'fullHouse')) {
                    const position = this.winners.fullHouse.length + 1;
                    const suffix = position === 1 ? '1st' : position === 2 ? '2nd' : '3rd';
                    this.announceWinner('fullHouse', participant, `Full House (${suffix})`);
                    
                    // Stop auto-calling when all 3 Full House winners declared
                    if (this.winners.fullHouse.length >= this.winnerLimits.fullHouse) {
                        this.stopAutoCall();
                        document.getElementById('autoCallToggle').checked = false;
                    }
                }
            }
        });

        // Update participants display
        this.renderParticipants();
    }
    
    // Check if participant already won in a category
    hasWon(participant, category) {
        return this.winners[category].some(w => w.id === participant.id);
    }
    
    // Check corner wins
    checkCornerWins(participant) {
        if (participant.cornersWon) return;
        
        // Get corner positions (4 corners of the ticket)
        const corners = [
            this.getFirstNumberInRow(participant.ticket, 0), // Top-left
            this.getLastNumberInRow(participant.ticket, 0),  // Top-right
            this.getFirstNumberInRow(participant.ticket, 2), // Bottom-left
            this.getLastNumberInRow(participant.ticket, 2)   // Bottom-right
        ];
        
        const allCornersMarked = corners.every(n => n !== null && participant.markedNumbers.includes(n));
        
        if (allCornersMarked && this.winners.corners.length < this.winnerLimits.corners &&
            !this.hasWon(participant, 'corners')) {
            participant.cornersWon = true;
            const position = this.winners.corners.length + 1;
            this.announceWinner('corners', participant, `Corners (${position}${position === 1 ? 'st' : 'nd'})`);
        }
    }
    
    // Get first number in a row (leftmost)
    getFirstNumberInRow(ticket, row) {
        for (let col = 0; col < 9; col++) {
            if (ticket[row][col] !== null) return ticket[row][col];
        }
        return null;
    }
    
    // Get last number in a row (rightmost)
    getLastNumberInRow(ticket, row) {
        for (let col = 8; col >= 0; col--) {
            if (ticket[row][col] !== null) return ticket[row][col];
        }
        return null;
    }

    checkRowWins(participant) {
        for (let row = 0; row < 3; row++) {
            if (participant.rowsCompleted && participant.rowsCompleted[row]) continue;

            const rowNumbers = participant.ticket[row].filter(n => n !== null);
            const allMarked = rowNumbers.every(n => participant.markedNumbers.includes(n));

            if (allMarked) {
                if (!participant.rowsCompleted) {
                    participant.rowsCompleted = [false, false, false];
                }
                participant.rowsCompleted[row] = true;

                const categories = ['topLine', 'middleLine', 'bottomLine'];
                const names = ['Top Line', 'Middle Line', 'Bottom Line'];

                if (this.winners[categories[row]].length < this.winnerLimits[categories[row]] &&
                    !this.hasWon(participant, categories[row])) {
                    const position = this.winners[categories[row]].length + 1;
                    this.announceWinner(categories[row], participant, `${names[row]} (${position}${position === 1 ? 'st' : 'nd'})`);
                }
            }
        }
    }

    announceWinner(category, participant, displayName) {
        // Add to winners array
        this.winners[category].push(participant);
        const position = this.winners[category].length;

        // Play winner fanfare sound
        this.sounds.playWinnerFanfare();

        // Update winner display in organizer panel
        const winnerEl = document.getElementById(`winner-${category}-${position}`);
        if (winnerEl) {
            winnerEl.textContent = participant.name;
            winnerEl.closest('.winner-slot').classList.add('won');
        }

        // Check announcement mode
        if (this.autoAnnounce) {
            // Auto mode - send immediately to display
            this.sendWinnerToDisplay(category, participant.name, displayName);
        } else {
            // Manual mode - queue the winner
            this.pendingWinners.push({
                category,
                name: participant.name,
                displayName
            });
            this.updatePendingWinnerUI();
        }

        console.log(`🏆 ${displayName} Winner: ${participant.name}`);
    }

    sendWinnerToDisplay(category, name, displayName) {
        const winnerData = {
            category,
            name,
            displayName,
            timestamp: Date.now()
        };
        localStorage.setItem('tambolaWinner', JSON.stringify(winnerData));
    }

    syncDisplayWindow() {
        const gameState = {
            currentNumber: this.currentNumber,
            calledNumbers: this.calledNumbers,
            winners: Object.fromEntries(
                Object.entries(this.winners).map(([k, v]) => [k, v.map(p => p.name)])
            ),
            timestamp: Date.now()
        };
        localStorage.setItem('tambolaGameState', JSON.stringify(gameState));
    }

    openDisplayScreen() {
        if (this.displayWindow && !this.displayWindow.closed) {
            this.displayWindow.focus();
        } else {
            this.displayWindow = window.open('display.html', 'TambolaDisplay', 
                'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no');
        }
    }

    startAutoCall() {
        const speed = parseInt(document.getElementById('autoCallSpeed').value);
        this.autoCallInterval = setInterval(() => {
            this.callNextNumber();
        }, speed);
    }

    stopAutoCall() {
        if (this.autoCallInterval) {
            clearInterval(this.autoCallInterval);
            this.autoCallInterval = null;
        }
        document.getElementById('autoCallToggle').checked = false;
    }

    filterParticipants(query) {
        const items = document.querySelectorAll('.participant-item');
        const lowerQuery = query.toLowerCase();

        items.forEach((item, index) => {
            const name = this.participants[index].name.toLowerCase();
            if (name.includes(lowerQuery)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    resetGame() {
        // Clear called numbers
        this.calledNumbers = [];
        this.currentNumber = null;
        
        // Reset remaining numbers
        this.remainingNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
        this._shuffle(this.remainingNumbers);

        // Reset winners (arrays)
        this.winners = {
            earlyFive: [],
            topLine: [],
            middleLine: [],
            bottomLine: [],
            corners: [],
            fullHouse: []
        };

        // Reset participants
        this.participants.forEach(p => {
            p.markedNumbers = [];
            p.rowsCompleted = [false, false, false];
            p.cornersWon = false;
        });

        // Reset pending winners
        this.pendingWinners = [];
        this.updatePendingWinnerUI();

        // Stop auto call
        this.stopAutoCall();

        // Reset UI
        document.getElementById('currentNumber').textContent = '--';
        document.getElementById('calledNumbersList').innerHTML = '';
        document.getElementById('calledCount').textContent = '0';

        // Reset number grid
        document.querySelectorAll('.number-cell').forEach(cell => {
            cell.classList.remove('called');
        });

        // Reset winner slots
        document.querySelectorAll('.winner-slot').forEach(slot => {
            slot.classList.remove('won');
            slot.querySelector('.winner-name').textContent = 'Waiting...';
        });

        // Re-render participants
        this.renderParticipants();

        // Sync with display
        this.syncDisplayWindow();

        console.log('Game reset!');
    }

    _shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new TambolaGame();
});
