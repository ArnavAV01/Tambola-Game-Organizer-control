/**
 * Tambola Game - Display Screen Controller
 * For projector/TV display showing called numbers and winners
 */

class TambolaDisplay {
    constructor() {
        this.currentNumber = null;
        this.calledNumbers = [];
        this.recentNumbers = [];
        this.winners = {};
        
        // Initialize sound manager
        this.sounds = new SoundManager();
        
        this.init();
    }

    init() {
        // Render number grid
        this.renderNumberGrid();

        // Setup storage listener
        this.setupStorageListener();

        // Signal ready
        localStorage.setItem('tambolaDisplayReady', 'true');

        // Load initial state if exists
        this.loadGameState();
        
        // Enable sound on first click
        document.addEventListener('click', () => {
            this.sounds.ensureContext();
        }, { once: true });
    }

    renderNumberGrid() {
        const grid = document.getElementById('displayNumberGrid');
        grid.innerHTML = '';
        
        for (let i = 1; i <= 90; i++) {
            const cell = document.createElement('div');
            cell.className = 'display-number-cell';
            cell.dataset.number = i;
            cell.textContent = i;
            grid.appendChild(cell);
        }
    }

    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'tambolaGameState') {
                this.handleGameStateUpdate(JSON.parse(e.newValue));
            } else if (e.key === 'tambolaWinner') {
                this.handleWinnerAnnouncement(JSON.parse(e.newValue));
            }
        });

        // Also poll for updates (backup for same-origin)
        setInterval(() => {
            const stateStr = localStorage.getItem('tambolaGameState');
            if (stateStr) {
                const state = JSON.parse(stateStr);
                if (state.timestamp !== this.lastStateTimestamp) {
                    this.lastStateTimestamp = state.timestamp;
                    this.handleGameStateUpdate(state);
                }
            }
        }, 500);
    }

    loadGameState() {
        const stateStr = localStorage.getItem('tambolaGameState');
        if (stateStr) {
            const state = JSON.parse(stateStr);
            this.lastStateTimestamp = state.timestamp;
            this.handleGameStateUpdate(state);
        }
    }

    handleGameStateUpdate(state) {
        if (!state) return;

        const previousNumber = this.currentNumber;
        this.currentNumber = state.currentNumber;
        this.calledNumbers = state.calledNumbers || [];
        this.winners = state.winners || {};

        // Update current number display
        this.updateCurrentNumber(previousNumber !== this.currentNumber);

        // Update number grid
        this.updateNumberGrid();

        // Update recent numbers
        this.updateRecentNumbers();

        // Update winners display
        this.updateWinnersDisplay();
    }

    updateCurrentNumber(isNew) {
        const el = document.getElementById('currentNumber');
        el.textContent = this.currentNumber || '--';

        if (isNew && this.currentNumber) {
            // Trigger animation
            el.classList.remove('pop');
            el.offsetHeight; // Trigger reflow
            el.classList.add('pop');

            // Play number call sound
            this.sounds.playNumberCall();
        }
    }

    updateNumberGrid() {
        // Reset all cells
        document.querySelectorAll('.display-number-cell').forEach(cell => {
            cell.classList.remove('called', 'just-called');
        });

        // Mark called numbers
        this.calledNumbers.forEach((num, index) => {
            const cell = document.querySelector(`.display-number-cell[data-number="${num}"]`);
            if (cell) {
                cell.classList.add('called');
                // Add special animation for the most recent number
                if (num === this.currentNumber) {
                    cell.classList.add('just-called');
                }
            }
        });
    }

    updateRecentNumbers() {
        const container = document.getElementById('recentNumbers');
        const recentNums = [...this.calledNumbers].slice(-5).reverse();
        
        container.innerHTML = '';
        
        for (let i = 0; i < 5; i++) {
            const span = document.createElement('span');
            span.className = 'recent-num';
            span.textContent = recentNums[i] || '--';
            container.appendChild(span);
        }
    }

    updateWinnersDisplay() {
        const categories = [
            { id: 'winnerEarlyFive', key: 'earlyFive' },
            { id: 'winnerTopLine', key: 'topLine' },
            { id: 'winnerMiddleLine', key: 'middleLine' },
            { id: 'winnerBottomLine', key: 'bottomLine' },
            { id: 'winnerCorners', key: 'corners' },
            { id: 'winnerFullHouse', key: 'fullHouse' }
        ];

        categories.forEach(({ id, key }) => {
            const box = document.getElementById(id);
            if (!box) return;
            
            const nameEls = box.querySelectorAll('.winner-name');
            const winners = this.winners[key] || [];
            
            nameEls.forEach((el, index) => {
                if (Array.isArray(winners) && winners[index]) {
                    el.textContent = winners[index];
                    el.classList.add('won');
                } else if (!Array.isArray(winners) && winners && index === 0) {
                    // Backward compatibility for non-array winners
                    el.textContent = winners;
                    el.classList.add('won');
                } else {
                    el.textContent = '-';
                    el.classList.remove('won');
                }
            });
        });
    }

    handleWinnerAnnouncement(data) {
        if (!data) return;

        // Play winner fanfare
        this.sounds.playWinnerFanfare();

        // Show winner overlay
        this.showWinnerOverlay(data.name, data.displayName);
    }

    showWinnerOverlay(name, prize) {
        const overlay = document.getElementById('winnerOverlay');
        const nameEl = document.getElementById('winnerNameAnnounce');
        const prizeEl = document.getElementById('winnerPrizeAnnounce');

        nameEl.textContent = name;
        prizeEl.textContent = `for ${prize}!`;

        // Create confetti
        this.createConfetti();

        // Show overlay
        overlay.classList.remove('hidden');

        // Hide after 5 seconds
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 5000);
    }

    createConfetti() {
        const container = document.querySelector('.confetti-container');
        container.innerHTML = '';

        const colors = ['#f093fb', '#f5576c', '#4ade80', '#667eea', '#fbbf24', '#60a5fa'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            container.appendChild(confetti);
        }
    }
}

// Initialize display when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.display = new TambolaDisplay();
});
