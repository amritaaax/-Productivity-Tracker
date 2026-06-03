const LIMITS = {
  "youtube.com": 60 * 60 * 1000,
  "instagram.com": 60 * 60 * 1000,
  "facebook.com": 60 * 60 * 1000,
  "reddit.com": 60 * 60 * 1000,
  "tiktok.com": 60 * 60 * 1000,
  "snapchat.com": 60 * 60 * 1000,
  "pinterest.com": 60 * 60 * 1000,
  "twitter.com": 60 * 60 * 1000,
  "x.com": 60 * 60 * 1000,
};

const PRODUCTIVE_SITES = [
  "github.com","chatgpt.com","leetcode.com","hackerrank.com",
  "geeksforgeeks.org","stackoverflow.com","coursera.org","udemy.com",
];

const DISTRACTING_SITES = Object.keys(LIMITS);

function isDistracting(hostname) {
  return DISTRACTING_SITES.some((s) => hostname.includes(s));
}

function isProductive(hostname) {
  return PRODUCTIVE_SITES.some((s) => hostname.includes(s));
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

const notifiedAt = {};

function sendNotification(id, title, message) {
  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: "icon.png",
    title: title,
    message: message,
  });
}

function checkNotifications(hostname, totalTime, focusMode) {
  if (!isDistracting(hostname)) return;

if (totalTime >= 20 * 60 * 1000 && !notifiedAt[hostname + "_60"]) {    
    notifiedAt[hostname + "_60"] = true;
    sendNotification(hostname + "_60", "⚠️ Daily Limit Reached",
      "You've spent 1 hour on " + hostname + ". Consider a break!");
  }

  if (totalTime >= 30 * 60 * 1000 && !notifiedAt[hostname + "_90"]) {
    notifiedAt[hostname + "_90"] = true;
    sendNotification(hostname + "_90", "🚨 Excessive Usage Warning",
      "You've spent 90 minutes on " + hostname + ". This is too much!");
  }
  if (totalTime >= 40 * 60 * 1000 && !notifiedAt[hostname + "_120"]) {
    notifiedAt[hostname + "_120"] = true;
    sendNotification(hostname + "_120", "🔒 Focus Mode Recommendation",
      "2 hours on " + hostname + "! Switch to productive work now.");
  }

  if (focusMode && totalTime >= 10 * 60 * 1000 && !notifiedAt[hostname + "_focus"]) {
    notifiedAt[hostname + "_focus"] = true;
    sendNotification(hostname + "_focus", "🎯 Focus Mode Active",
      "Focus Mode ON! You are wasting time on " + hostname + ".");
  }
}

function updateStreak(usage) {
  var today = getToday();
  var productiveTime = 0;
  Object.keys(usage).forEach(function(site) {
    if (isProductive(site)) productiveTime += usage[site];
  });

  chrome.storage.local.get(["streak", "lastActiveDay", "achievements"], function(result) {
    var streak = result.streak || 0;
    var lastActiveDay = result.lastActiveDay || "";
    var achievements = result.achievements || [];

    if (productiveTime >= 30 * 60 * 1000 && lastActiveDay !== today) {
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      var yStr = yesterday.toISOString().split("T")[0];

      if (lastActiveDay === yStr) {
        streak += 1;
      } else {
        streak = 1;
      }

      if (streak >= 3 && achievements.indexOf("3_day_streak") === -1) {
        achievements.push("3_day_streak");
        sendNotification("ach_3day", "🏆 Achievement Unlocked!", "3-Day Productivity Streak!");
      }
      if (streak >= 7 && achievements.indexOf("7_day_streak") === -1) {
        achievements.push("7_day_streak");
        sendNotification("ach_7day", "🏆 Achievement Unlocked!", "7-Day Productivity Streak!");
      }
      if (streak >= 30 && achievements.indexOf("30_day_streak") === -1) {
        achievements.push("30_day_streak");
        sendNotification("ach_30day", "🏆 Achievement Unlocked!", "30-Day Streak! Legend!");
      }

      chrome.storage.local.set({ streak: streak, lastActiveDay: today, achievements: achievements });
    }
  });
}

chrome.runtime.onInstalled.addListener(function() {
  console.log("Productivity Tracker v2 Installed");
  chrome.alarms.create("dailyReset", { periodInMinutes: 1440 });
  chrome.storage.local.get(["lastReset"], function(result) {
    if (result.lastReset !== getToday()) {
      chrome.storage.local.set({ usage: {}, lastReset: getToday() });
    }
  });
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === "dailyReset") {
    Object.keys(notifiedAt).forEach(function(k) { delete notifiedAt[k]; });
    chrome.storage.local.set({ usage: {}, lastReset: getToday() });
  }
});

chrome.runtime.onMessage.addListener(function(message) {
  if (!message.hostname || !message.duration) return;

  var hostname = message.hostname.replace(/^www\./, "");
  var duration = message.duration;
  var productivityType = isProductive(hostname) ? "productive"
    : isDistracting(hostname) ? "distracting" : "neutral";

  fetch("http://localhost:5000/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostname: hostname, duration: duration, productivityType: productivityType }),
  }).catch(function(err) { console.error("Backend error:", err); });

  chrome.storage.local.get(["usage", "focusMode"], function(result) {
    var usage = result.usage || {};
    var focusMode = result.focusMode || false;

    usage[hostname] = (usage[hostname] || 0) + duration;
    chrome.storage.local.set({ usage: usage });

    checkNotifications(hostname, usage[hostname], focusMode);
    updateStreak(usage);
  });
});