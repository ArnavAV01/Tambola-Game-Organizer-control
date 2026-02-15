/**
 * Tambola Ticket Generator
 * Generates valid Tambola/Housie tickets following standard rules:
 * - 3 rows x 9 columns
 * - Each row has exactly 5 numbers
 * - Column 1: 1-9, Column 2: 10-19, ..., Column 9: 80-90
 * - Numbers in each column are sorted top to bottom
 */

class TambolaTicketGenerator {
    constructor() {
        this.columnRanges = [
            [1, 9],    // Column 0
            [10, 19],  // Column 1
            [20, 29],  // Column 2
            [30, 39],  // Column 3
            [40, 49],  // Column 4
            [50, 59],  // Column 5
            [60, 69],  // Column 6
            [70, 79],  // Column 7
            [80, 90]   // Column 8
        ];
    }

    /**
     * Generate a single valid Tambola ticket
     * @returns {Array} 3x9 array representing the ticket
     */
    generateTicket() {
        let ticket;
        let attempts = 0;
        const maxAttempts = 100;

        do {
            ticket = this._tryGenerateTicket();
            attempts++;
        } while (!this._isValidTicket(ticket) && attempts < maxAttempts);

        if (!this._isValidTicket(ticket)) {
            // Fallback to a guaranteed valid generation method
            ticket = this._generateTicketGuaranteed();
        }

        return ticket;
    }

    /**
     * Attempt to generate a ticket
     */
    _tryGenerateTicket() {
        // Initialize empty 3x9 ticket
        const ticket = [
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null]
        ];

        // Generate numbers for each column
        const columnNumbers = [];
        for (let col = 0; col < 9; col++) {
            const [min, max] = this.columnRanges[col];
            const available = [];
            for (let n = min; n <= max; n++) {
                available.push(n);
            }
            // Shuffle and pick 1-3 numbers for this column
            this._shuffle(available);
            columnNumbers.push(available);
        }

        // Determine how many numbers each column will have (1, 2, or 3)
        // Total must be 15 (5 per row x 3 rows)
        const columnCounts = this._distributeColumnCounts();

        // Assign numbers to columns
        for (let col = 0; col < 9; col++) {
            const count = columnCounts[col];
            const numbers = columnNumbers[col].slice(0, count).sort((a, b) => a - b);
            
            // Determine which rows to place numbers in
            const rows = this._selectRows(count);
            
            for (let i = 0; i < count; i++) {
                ticket[rows[i]][col] = numbers[i];
            }
        }

        // Balance rows to ensure each has exactly 5 numbers
        this._balanceRows(ticket, columnNumbers);

        return ticket;
    }

    /**
     * Distribute column counts so total is 15 and each column has 1-3 numbers
     */
    _distributeColumnCounts() {
        let counts = [1, 1, 1, 1, 1, 1, 1, 1, 1]; // Start with minimum 1 per column = 9
        let remaining = 15 - 9; // Need to add 6 more

        while (remaining > 0) {
            const col = Math.floor(Math.random() * 9);
            if (counts[col] < 3) {
                counts[col]++;
                remaining--;
            }
        }

        return counts;
    }

    /**
     * Select which rows to place numbers in for a column
     */
    _selectRows(count) {
        const allRows = [0, 1, 2];
        this._shuffle(allRows);
        return allRows.slice(0, count).sort((a, b) => a - b);
    }

    /**
     * Balance rows to ensure each has exactly 5 numbers
     */
    _balanceRows(ticket, columnNumbers) {
        for (let attempts = 0; attempts < 50; attempts++) {
            const rowCounts = ticket.map(row => row.filter(n => n !== null).length);
            
            // Check if balanced
            if (rowCounts.every(count => count === 5)) {
                return true;
            }

            // Find rows with too many or too few numbers
            const overflowRows = rowCounts.map((count, idx) => count > 5 ? idx : -1).filter(idx => idx !== -1);
            const underflowRows = rowCounts.map((count, idx) => count < 5 ? idx : -1).filter(idx => idx !== -1);

            if (overflowRows.length === 0 || underflowRows.length === 0) continue;

            // Try to move a number from overflow to underflow
            const fromRow = overflowRows[0];
            const toRow = underflowRows[0];

            // Find a column where we can move
            for (let col = 0; col < 9; col++) {
                if (ticket[fromRow][col] !== null && ticket[toRow][col] === null) {
                    // Check if this column can have a number in toRow
                    const colCount = ticket.map(row => row[col]).filter(n => n !== null).length;
                    
                    // Move the number
                    const [min, max] = this.columnRanges[col];
                    const existingInCol = ticket.map(row => row[col]).filter(n => n !== null);
                    const available = [];
                    for (let n = min; n <= max; n++) {
                        if (!existingInCol.includes(n)) available.push(n);
                    }
                    
                    if (available.length > 0) {
                        // Remove from fromRow
                        ticket[fromRow][col] = null;
                        // Add to toRow
                        const newNum = available[Math.floor(Math.random() * available.length)];
                        ticket[toRow][col] = newNum;
                        
                        // Re-sort the column
                        const colNums = ticket.map(row => row[col]).filter(n => n !== null).sort((a, b) => a - b);
                        const colRows = ticket.map((row, idx) => row[col] !== null ? idx : -1).filter(idx => idx !== -1);
                        for (let i = 0; i < colNums.length; i++) {
                            ticket[colRows[i]][col] = colNums[i];
                        }
                        break;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Guaranteed valid ticket generation using a different approach
     */
    _generateTicketGuaranteed() {
        const ticket = [
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null]
        ];

        // Pre-defined valid column distribution patterns
        const patterns = [
            [2, 2, 2, 2, 1, 2, 1, 2, 1],
            [1, 2, 2, 2, 2, 1, 2, 2, 1],
            [2, 1, 2, 1, 2, 2, 2, 1, 2],
            [1, 2, 1, 2, 2, 2, 2, 2, 1],
            [2, 2, 1, 2, 2, 1, 2, 1, 2],
        ];

        const pattern = patterns[Math.floor(Math.random() * patterns.length)];

        // Row distribution for each column count
        const rowPatterns = {
            1: [[0], [1], [2]],
            2: [[0, 1], [0, 2], [1, 2]],
            3: [[0, 1, 2]]
        };

        // Track how many numbers each row has
        const rowCounts = [0, 0, 0];

        for (let col = 0; col < 9; col++) {
            const count = pattern[col];
            const [min, max] = this.columnRanges[col];

            // Get available row patterns
            const availablePatterns = rowPatterns[count].filter(rows => {
                return rows.every(row => rowCounts[row] < 5);
            });

            if (availablePatterns.length === 0) continue;

            // Choose pattern that balances rows best
            let bestPattern = availablePatterns[0];
            let bestScore = Infinity;

            for (const rp of availablePatterns) {
                const tempCounts = [...rowCounts];
                rp.forEach(row => tempCounts[row]++);
                const score = Math.max(...tempCounts) - Math.min(...tempCounts);
                if (score < bestScore) {
                    bestScore = score;
                    bestPattern = rp;
                }
            }

            // Generate random numbers for this column
            const available = [];
            for (let n = min; n <= max; n++) {
                available.push(n);
            }
            this._shuffle(available);
            const numbers = available.slice(0, count).sort((a, b) => a - b);

            // Place numbers
            for (let i = 0; i < count; i++) {
                ticket[bestPattern[i]][col] = numbers[i];
                rowCounts[bestPattern[i]]++;
            }
        }

        return ticket;
    }

    /**
     * Validate a ticket
     */
    _isValidTicket(ticket) {
        if (!ticket) return false;

        // Check each row has exactly 5 numbers
        for (let row = 0; row < 3; row++) {
            const count = ticket[row].filter(n => n !== null).length;
            if (count !== 5) return false;
        }

        // Check column constraints
        for (let col = 0; col < 9; col++) {
            const colNums = ticket.map(row => row[col]).filter(n => n !== null);
            if (colNums.length < 1 || colNums.length > 3) return false;

            // Check numbers are in valid range
            const [min, max] = this.columnRanges[col];
            for (const num of colNums) {
                if (num < min || num > max) return false;
            }

            // Check numbers are sorted
            for (let i = 1; i < colNums.length; i++) {
                if (colNums[i] <= colNums[i - 1]) return false;
            }
        }

        return true;
    }

    /**
     * Shuffle array in place
     */
    _shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Generate multiple unique tickets
     * @param {number} count - Number of tickets to generate
     * @returns {Array} Array of tickets
     */
    generateTickets(count) {
        const tickets = [];
        const usedNumbers = new Set();

        for (let i = 0; i < count; i++) {
            const ticket = this.generateTicket();
            tickets.push(ticket);
        }

        return tickets;
    }

    /**
     * Generate participants data with tickets
     * @param {number} count - Number of participants
     * @param {Array} names - Optional array of names
     * @returns {Object} Participants data object
     */
    generateParticipantsData(count, names = null) {
        const tickets = this.generateTickets(count);
        const participants = [];

        for (let i = 0; i < count; i++) {
            const name = names && names[i] ? names[i] : `Participant ${i + 1}`;
            participants.push({
                id: i + 1,
                name: name,
                ticket: tickets[i]
            });
        }

        return {
            gameTitle: "Tambola Game",
            generatedAt: new Date().toISOString(),
            participants: participants
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TambolaTicketGenerator;
}
