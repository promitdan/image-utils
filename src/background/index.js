chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FETCH_IMAGE') {
    fetch(msg.url)
      .then(r => r.blob())
      .then(blob => new Promise((res) => {
        const reader = new FileReader();
        reader.onload = () => res({ dataUrl: reader.result });
        reader.readAsDataURL(blob);
      }))
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }
});