chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureVisibleTab") {
    chrome.tabs.captureVisibleTab({ format: "png" }, function (dataUrl) {
      sendResponse({ imageData: dataUrl });
    });
    return true; // Keeps the message channel open until sendResponse is called
  }
});
