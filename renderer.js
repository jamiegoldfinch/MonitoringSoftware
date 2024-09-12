// renderer.js
const { ipcRenderer } = require('electron');

document.getElementById('setup-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const computerName = document.getElementById('computerName').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const reportFrequency = document.getElementById('reportFrequency').value;

  window.electron.send('save-setup-details', { computerName, email, password, reportFrequency });
});