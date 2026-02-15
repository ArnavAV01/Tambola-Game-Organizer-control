# 🎱 Tambola Game - Organizer Control System

A web-based Tambola (Housie) game designed for organizers with full control over the game flow and dual-screen support.

## ✨ Features

- **Dual Screen Setup**: Separate organizer panel and audience display screen
- **Auto Number Calling**: Automatic random number generation with adjustable speed
- **Real-time Winner Detection**: Automatic detection and announcement of winners
- **Participant Management**: View all participants and their ticket progress
- **Winner Categories**: Early Five, Top/Middle/Bottom Line, Full House
- **Celebration Animations**: Confetti and animations for winner announcements

## 🚀 Quick Start

### Option 1: Simple HTTP Server (Recommended)

```bash
# Using Python
cd d:\Projects\Tambola
python -m http.server 8080

# Then open http://localhost:8080 in your browser
```

### Option 2: Live Server (VS Code)

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html` → "Open with Live Server"

### Option 3: Double-click (Limited)

Just double-click `index.html` - note that some features may not work due to browser security restrictions.

## 📖 How to Use

### 1. Start the Game

1. Open `index.html` (Organizer Panel)
2. Click "📺 Open Display Screen" to open the audience display
3. Move the display window to your projector/TV

### 2. Calling Numbers

- **Manual**: Click any number on the grid to call it
- **Auto**: Check "Auto Call" and select speed (Slow/Normal/Fast)
- **Next**: Click "📢 Call Next Number" for the next random number

### 3. View Participants

- All participants are listed on the right panel
- Click any participant to view their ticket and progress
- Search participants by name using the search box

### 4. Winners

Winners are automatically detected when:
- **Early Five**: First person to mark any 5 numbers
- **Top Line**: All 5 numbers in row 1 completed
- **Middle Line**: All 5 numbers in row 2 completed
- **Bottom Line**: All 5 numbers in row 3 completed
- **Full House**: All 15 numbers completed

## 📝 Customizing Participants

### Using Your Own Tickets

Edit `data/participants.json` with your participant data:

```json
{
  "gameTitle": "My Tambola Event",
  "participants": [
    {
      "id": 1,
      "name": "John Doe",
      "ticket": [
        [4, null, 21, null, 45, null, 62, 78, null],
        [null, 12, 25, 36, null, 55, null, null, 85],
        [8, null, null, 38, 49, null, 67, 79, null]
      ]
    }
  ]
}
```

### Ticket Format

Each ticket is a 3×9 array where:
- Each row has exactly 5 numbers and 4 `null` values
- Column 1: Numbers 1-9
- Column 2: Numbers 10-19
- Column 3: Numbers 20-29
- ... and so on
- Column 9: Numbers 80-90

### Auto-Generated Tickets

If no `participants.json` is found or you want fresh data:
1. Delete or rename `data/participants.json`
2. Refresh the page
3. 100 participants with valid tickets will be auto-generated

## 🎨 Display Screen Features

The display screen (`display.html`) shows:
- Current number (large, animated)
- Last 5 called numbers
- Complete number board (1-90)
- All winner categories
- Winner announcement overlay with confetti

## 🔧 Customization

### Changing Number of Auto-Generated Participants

In `js/game.js`, find line:
```javascript
const data = generator.generateParticipantsData(100, this.generateSampleNames(100));
```
Change `100` to your desired count (up to 120).

### Adding Sound Effects

Uncomment the audio lines in `js/display.js`:
```javascript
playNumberSound() {
    const audio = new Audio('sounds/number-call.mp3');
    audio.play();
}
```

Add your sound files to a `sounds/` folder.

### Styling

- `css/style.css` - Organizer panel styles
- `css/display.css` - Display screen styles

## 📁 File Structure

```
Tambola/
├── index.html          # Organizer control panel
├── display.html        # Audience display screen
├── css/
│   ├── style.css       # Organizer panel styles
│   └── display.css     # Display screen styles
├── js/
│   ├── game.js         # Main game logic
│   ├── display.js      # Display screen logic
│   └── ticketGenerator.js  # Valid ticket generator
├── data/
│   └── participants.json   # Participant data
└── README.md
```

## 🎯 Tips for Organizers

1. **Test before the event**: Run a few practice rounds
2. **Use full screen**: Press F11 on the display screen
3. **Backup winners**: Keep a manual record as backup
4. **Slow speed first**: Start with slow auto-call, increase as game progresses
5. **Check tickets**: Click on winners to verify their tickets

## 🤝 Support

For any issues or feature requests, please create an issue in the repository.

---

Made with ❤️ for Tambola enthusiasts!
