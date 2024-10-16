// Handle the setup form submission
document.getElementById('setup-form').addEventListener('submit', (event) => {
  event.preventDefault();
  console.log("testing the setup form");
  

  // Capture the form data
  const computerName = document.getElementById('computerName').value;
  const userEmail = document.getElementById('userEmail').value;
  const userPassword = document.getElementById('emailPassword').value;
  const partnerEmail = document.getElementById('partnerEmail').value;
  const partnerPassword = document.getElementById('partnerPassword').value;
  const reportFrequency = document.getElementById('reportFrequency').value;

  window.electron.send('save-setup-details', { computerName, userEmail, userPassword, partnerEmail, partnerPassword, reportFrequency });
});

// Reload keywords when instructed by the back-end
window.electron.receive('reload-keywords', () => {
  console.log('Reloading keywords in renderer...');
    reloadKeywords();  // Call your function to reload the keywords into memory
});