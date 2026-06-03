# 🎯 Productivity Tracker

> A full-stack productivity tracking system built with MERN Stack + Chrome Extension that monitors your web usage, generates smart insights, and helps you stay focused.

---

## 👩‍💻 Developer

**Made by Amrita Thakur**
Internship Project 2026
Full Stack Developer — MERN + Chrome Extension

---

## 🚀 Features

### 📊 Dashboard
- Real-time website usage tracking
- Productivity Score (0-100)
- Total time, Productive time, Distracting time
- Top 5 most visited websites
- Most productive and most distracting site

### 🔔 Smart Notifications
- ⚠️ 20 min warning on social media
- 🚨 30 min excessive usage alert
- 🔒 40 min focus mode recommendation
- Uses Chrome Notifications API

### 🎯 Focus Mode
- Toggle Focus Mode ON/OFF
- Aggressive warnings when enabled
- Helps you stay on task

### 📅 Weekly Reports
- 7-day productivity trend chart
- Weekly top sites
- Productive vs Distracting comparison

### 💡 Smart Insights
- Daily personalized insights
- Smart recommendations
- Achievement badges
- Daily streaks system

### 🏆 Achievements
- 🔥 3-Day Streak
- ⚡ 7-Day Streak
- 🏆 30-Day Legend

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Chart.js |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Extension | Chrome Extension Manifest V3 |
| Charts | Chart.js, React-Chartjs-2 |

---

## 📁 Project Structure

Productivity-Tracker/
├── client/                 # React Dashboard
│   ├── src/
│   │   ├── App.js         # Main dashboard
│   │   └── App.css        # Modern UI styles
│   └── public/
├── extension/              # Chrome Extension
│   ├── background.js      # Service worker
│   ├── content.js         # Tab tracker
│   ├── manifest.json      # Extension config
│   └── index.html         # Popup UI
└── server/                 # Node.js Backend
    ├── models/
    │   └── UserData.js    # MongoDB schema
    ├── routes/
    │   └── dataRoutes.js  # API routes
    └── app.js             # Express server

---

## ⚙️ Setup and Installation

### Prerequisites
- Node.js installed
- MongoDB Atlas account
- Google Chrome browser

### 1. Clone Repository
git clone https://github.com/yourusername/productivity-tracker.git
cd productivity-tracker

### 2. Setup Server
cd server
npm install

Create .env file in server folder:
MONGO_URI=your_mongodb_atlas_connection_string
PORT=5000

Start server:
node app.js

### 3. Build React Dashboard
cd client
npm install
npm run build

Copy build to extension:
copy /Y build\index.html ..\extension\index.html
copy /Y build\static\css\* ..\extension\static\css\
copy /Y build\static\js\* ..\extension\static\js\

### 4. Load Chrome Extension
1. Open Chrome
2. Go to chrome://extensions
3. Enable Developer Mode
4. Click Load unpacked
5. Select the extension folder

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/track | Save website usage |
| GET | /api/today | Get today's data |
| GET | /api/weekly | Get weekly data |
| GET | /api/analytics | Get full analytics |

---

## 🎯 Productive Sites (No Limit)
- GitHub, ChatGPT, LeetCode
- HackerRank, GeeksForGeeks
- Stack Overflow, Coursera, Udemy

## ⚠️ Tracked Social Sites (Time Limited)
- YouTube, Instagram, Facebook
- Reddit, TikTok, Snapchat
- Pinterest, Twitter/X

---

## 🔮 Future Improvements
- User authentication
- Mobile app
- Export reports as PDF
- Team productivity tracking
- AI-powered recommendations

---

> 🚀 Made with ❤️ by Amrita Thakur — Internship Project 2026