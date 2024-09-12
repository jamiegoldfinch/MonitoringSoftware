const fs = require('fs');
const { exec } = require('child_process');

let wasRunning = false; // Tracks if the keylogger was running in the last check

// Log termination to the keylog.txt file
function logToKeylogFile(message) {
  const timestamp = new Date().toLocaleString();
  const logMessage = `${timestamp} - ${message}\n`;
  fs.appendFileSync('keylog.txt', logMessage);
}

// Function to check if the keylogger process is running
function checkKeyloggerStatus() {
  // Check if stop.txt exists
  if (fs.existsSync('stop.txt')) {
    console.log('Stop file detected. Watchdog is shutting down.');
    process.exit(0);
  }

  exec('wmic process where "name=\'node.exe\'" get ProcessId, ExecutablePath, CommandLine /FORMAT:LIST', (error, stdout) => {
    if (error) {
      logToKeylogFile(`Error checking keylogger status: ${error.message}`);
      return;
    }

    // Check if the output contains the keylogger.js process
    const isKeyloggerRunning = stdout.includes('keylogger.js');

    if (isKeyloggerRunning) {
      wasRunning = true; // Update the status to running
    } else if (wasRunning) {
      // Only log if the keylogger was previously running and has now stopped
      logToKeylogFile('Keylogger has stopped unexpectedly.');
      wasRunning = false; // Update the status to stopped
    }
  });
}

// Check the status every 5 seconds
setInterval(checkKeyloggerStatus, 5000);

// Initial check
checkKeyloggerStatus();
