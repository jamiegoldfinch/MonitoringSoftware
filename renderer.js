// renderer.js
const { ipcRenderer } = require('electron');
console.log('window.electron:', window.electron);
// Handle the setup form submission
document.getElementById('setup-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const computerName = document.getElementById('computerName').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const reportFrequency = document.getElementById('reportFrequency').value;

  window.electron.send('save-setup-details', { computerName, email, password, reportFrequency });
});

// Reload keywords when instructed by the back-end
window.electron.receive('reload-keywords', () => {
  console.log('Reloading keywords in renderer...');
    reloadKeywords();  // Call your function to reload the keywords into memory
});