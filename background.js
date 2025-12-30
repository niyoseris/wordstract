chrome.action.onClicked.addListener((tab) => {
    // Prevent execution on restricted headers
    if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("about:") || tab.url.startsWith("edge://")) {
        return;
    }

    chrome.tabs.sendMessage(tab.id, { action: "toggleModal" }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn("DomCheck: Modal could not be opened. Error:", chrome.runtime.lastError.message);
            // It's possible the tab needs a refresh
            console.warn("DomCheck: Connection error, page might need refresh.");
        }
    });
});
