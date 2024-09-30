// preload.js
// The preload.js script is all about opening up a communication between the front end (renderer.js) and the backend (main.js)
const { contextBridge, ipcRenderer } = require('electron');
// Expose APIs to the renderer process using contextBridge
contextBridge.exposeInMainWorld('electron', {
  // Send function to allow the renderer to send messages to the main process
  send: (channel, data) => ipcRenderer.send(channel, data),

  // Receive function to allow the renderer to receive messages from the main process
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  }
});
