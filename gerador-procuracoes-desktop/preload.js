const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  savePDF: (data, filename) => ipcRenderer.invoke('save-pdf', { data, filename }),
});
