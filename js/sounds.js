/**
 * Tambola Game - Sound Effects Manager
 * Uses Web Audio API for interactive sound effects
 */

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.5;
        
        this.init();
    }

    init() {
        // Initialize on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }

    ensureContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Play a beep/tone
    playTone(frequency = 440, duration = 0.15, type = 'sine') {
        if (!this.enabled) return;
        
        this.ensureContext();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Number called sound - ascending tone
    playNumberCall() {
        this.playTone(523.25, 0.1, 'sine'); // C5
        setTimeout(() => this.playTone(659.25, 0.1, 'sine'), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.15, 'sine'), 200); // G5
    }

    // Button click sound
    playClick() {
        this.playTone(800, 0.05, 'square');
    }

    // Winner announcement fanfare
    playWinnerFanfare() {
        if (!this.enabled) return;
        
        this.ensureContext();
        
        const notes = [
            { freq: 523.25, start: 0, duration: 0.1 },      // C5
            { freq: 659.25, start: 0.1, duration: 0.1 },    // E5
            { freq: 783.99, start: 0.2, duration: 0.1 },    // G5
            { freq: 1046.50, start: 0.3, duration: 0.3 },   // C6
            { freq: 783.99, start: 0.5, duration: 0.1 },    // G5
            { freq: 1046.50, start: 0.6, duration: 0.4 },   // C6
        ];

        notes.forEach(note => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'triangle';
                oscillator.frequency.value = note.freq;
                
                gainNode.gain.setValueAtTime(this.volume * 0.8, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.duration);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + note.duration);
            }, note.start * 1000);
        });
    }

    // Error sound
    playError() {
        this.playTone(200, 0.2, 'sawtooth');
    }

    // Success sound
    playSuccess() {
        this.playTone(600, 0.1, 'sine');
        setTimeout(() => this.playTone(800, 0.15, 'sine'), 100);
    }

    // Toggle sound on/off
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    // Set volume (0 to 1)
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }
}

// Export as global
window.SoundManager = SoundManager;
