let startTime = Date.now();
let hostname = window.location.hostname.replace(/^www\./, "");

function sendDuration() {
  const duration = Date.now() - startTime;
  if (duration > 1000 && hostname && hostname !== "newtab") {
    try {
      chrome.runtime.sendMessage({ hostname, duration });
    } catch (e) {
      // Extension context invalidated - ignore
    }
  }
  startTime = Date.now();
}

window.addEventListener("beforeunload", sendDuration);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    sendDuration();
  } else {
    startTime = Date.now();
  }
});

setInterval(() => {
  if (!document.hidden) {
    sendDuration();
  }
}, 30000);