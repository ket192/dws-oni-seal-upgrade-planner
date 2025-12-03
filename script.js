// Oni Seal Hall requirements (seed with known values)
let oniLevels = [
  { level: 1, quartz: 5600, upgradeTime: "00:00:00" },
  { level: 2, quartz: 11200, upgradeTime: "00:08:38" },
  { level: 3, quartz: 22400, upgradeTime: "01:35:46" },
  { level: 4, quartz: 44800, upgradeTime: "03:05:03" },
  { level: 5, quartz: 89600, upgradeTime: "02:33:00" },
  { level: 6, quartz: 125400, upgradeTime: "03:01:24" },
  { level: 7, quartz: 163100, upgradeTime: "02:50:07" },
  { level: 8, quartz: 195700, upgradeTime: "03:14:13" },
  { level: 9, quartz: 234800, upgradeTime: "03:50:22" },
  { level: 10, quartz: 281800, upgradeTime: "04:44:36" },
  { level: 11, quartz: 338100, upgradeTime: "05:00:52" },
  { level: 12, quartz: 405800, upgradeTime: "05:18:46" },
  { level: 13, quartz: 486900, upgradeTime: "05:38:28" },
  { level: 14, quartz: 584300, upgradeTime: "06:00:07" },
  { level: 15, quartz: 701200, upgradeTime: "06:23:56" }
];

const ONI_STORAGE_KEY = "oniSealHallLevels_v1";
let lastReadyTimeData = null; // for calendar export

function loadOniLevelsFromStorage() {
  try {
    const stored = localStorage.getItem(ONI_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        oniLevels = parsed;
      }
    }
  } catch (e) {
    console.warn("Could not load Oni levels from storage", e);
  }
}

function saveOniLevelsToStorage() {
  try {
    localStorage.setItem(ONI_STORAGE_KEY, JSON.stringify(oniLevels));
  } catch (e) {
    console.warn("Could not save Oni levels to storage", e);
  }
}

function renderOniTable() {
  const tbody = document.getElementById("oniTableBody");
  tbody.innerHTML = "";

  const sorted = [...oniLevels].sort((a, b) => a.level - b.level);

  for (const row of sorted) {
    const tr = document.createElement("tr");

    const tdLevel = document.createElement("td");
    tdLevel.textContent = row.level;
    tr.appendChild(tdLevel);

    const tdQuartz = document.createElement("td");
    tdQuartz.textContent = row.quartz.toLocaleString();
    tr.appendChild(tdQuartz);

    const tdTime = document.createElement("td");
    tdTime.textContent = row.upgradeTime || "-";
    tr.appendChild(tdTime);

    tbody.appendChild(tr);
  }
}

function findOniLevel(level) {
  return oniLevels.find(entry => entry.level === level) || null;
}

function formatDurationFromMinutes(totalMinutes) {
  if (totalMinutes <= 0) return "0 minutes";

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);

  return parts.join(" ");
}

function calculateNextUpgrade() {
  const resultsDiv = document.getElementById("results");
  resultsDiv.style.display = "block";

  const hourlyProduction = parseFloat(document.getElementById("hourlyProduction").value) || 0;
  const currentLevel = parseInt(document.getElementById("currentLevel").value, 10) || 0;
  const currentQuartz = Math.max(0, parseInt(document.getElementById("currentQuartz").value, 10) || 0);
  const nextLevel = currentLevel + 1;

  const calendarBtn = document.getElementById("addCalendarBtn");
  lastReadyTimeData = null;
  if (calendarBtn) {
    calendarBtn.disabled = true;
  }

  if (hourlyProduction <= 0) {
    resultsDiv.innerHTML = `
      <div class="results-notes">
        ⚠ Please enter a valid total quartz production per hour above 0.
      </div>
    `;
    return;
  }

  const levelData = findOniLevel(nextLevel);

  if (!levelData) {
    resultsDiv.innerHTML = `
      <div class="results-notes">
        ⚠ No data saved for level ${nextLevel} yet.<br>
        Add the quartz requirement for this level in the table below, then calculate again.
      </div>
    `;
    return;
  }

  const requiredQuartz = levelData.quartz;
  const remainingQuartzRaw = requiredQuartz - currentQuartz;
  const remainingQuartz = remainingQuartzRaw > 0 ? remainingQuartzRaw : 0;

  let notes = "";
  let farmingTimeDisplay = "-";
  let readyTimeDisplay = "-";
  let readyTime = null;

  if (remainingQuartzRaw <= 0) {
    notes = "✅ You already have enough quartz to start this upgrade.";
  } else {
    const hoursNeeded = remainingQuartz / hourlyProduction;
    const minutesNeeded = Math.ceil(hoursNeeded * 60);

    farmingTimeDisplay = formatDurationFromMinutes(minutesNeeded);

    const now = new Date();
    readyTime = new Date(now.getTime() + minutesNeeded * 60 * 1000);
    readyTimeDisplay = `${readyTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} on ${readyTime.toLocaleDateString()}`;

    notes = `Estimated farming time: ~${farmingTimeDisplay}<br>If you start now: ready around ${readyTimeDisplay}`;

    // Store data for calendar export
    lastReadyTimeData = {
      readyTime,
      currentLevel,
      nextLevel,
      hourlyProduction,
      remainingQuartz
    };

    if (calendarBtn) {
      calendarBtn.disabled = false;
    }
  }

  const rows = [
    { label: "Quartz production", value: `${hourlyProduction.toLocaleString()} / hour` },
    { label: "Current Oni Seal Hall level", value: currentLevel },
    { label: "Target level", value: nextLevel },
    { label: "Current quartz stored", value: currentQuartz.toLocaleString() },
    { label: "Next level quartz requirement", value: `${requiredQuartz.toLocaleString()} (upgrade time in game: ${levelData.upgradeTime || "unknown"})` },
    { label: "Quartz still needed", value: remainingQuartz.toLocaleString() },
    { label: "Estimated farming time", value: farmingTimeDisplay },
    { label: "Estimated ready time (local)", value: readyTimeDisplay }
  ];

  let tableHtml = `
    <table>
      <tbody>
        ${rows.map(row => `
          <tr>
            <th>${row.label}</th>
            <td>${row.value}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  let notesHtml = notes
    ? `<div class="results-notes">${notes}</div>`
    : "";

  resultsDiv.innerHTML = tableHtml + notesHtml;
}

function handleAddOrUpdateLevel() {
  const levelInput = document.getElementById("oniLevelInput");
  const quartzInput = document.getElementById("oniQuartzInput");
  const timeInput = document.getElementById("oniTimeInput");

  const level = parseInt(levelInput.value, 10);
  const quartz = parseInt(quartzInput.value, 10);
  const upgradeTime = timeInput.value.trim();

  if (!level || level < 1 || level > 35) {
    alert("Please enter a valid level between 1 and 35.");
    return;
  }
  if (!Number.isFinite(quartz) || quartz < 0) {
    alert("Please enter a valid quartz requirement (0 or more).");
    return;
  }

  const existingIndex = oniLevels.findIndex(entry => entry.level === level);
  if (existingIndex >= 0) {
    oniLevels[existingIndex] = { level, quartz, upgradeTime };
  } else {
    oniLevels.push({ level, quartz, upgradeTime });
  }

  saveOniLevelsToStorage();
  renderOniTable();

  quartzInput.value = "";
  timeInput.value = "";
}

function toICSDateString(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function downloadCalendarEvent() {
  if (!lastReadyTimeData || !lastReadyTimeData.readyTime) {
    alert("Please calculate the upgrade time first.");
    return;
  }

  const { readyTime, currentLevel, nextLevel, hourlyProduction, remainingQuartz } = lastReadyTimeData;

  // Event start and end (30 minute window)
  const start = readyTime;
  const end = new Date(readyTime.getTime() + 30 * 60 * 1000);

  const dtStart = toICSDateString(start);
  const dtEnd = toICSDateString(end);
  const dtStamp = toICSDateString(new Date());

  const title = `Oni Seal Hall ready to upgrade (L${currentLevel} → L${nextLevel})`;

  const descriptionLines = [
    "Dark War Survival – Sealed Island planner reminder.",
    "",
    `Target: Oni Seal Hall Level ${nextLevel}`,
    `Quartz production at time of planning: ${hourlyProduction.toLocaleString()} / hour`,
    `Quartz still needed at time of planning: ${remainingQuartz.toLocaleString()}`,
    "",
    "Time is approximate and based on current planner settings."
  ];

  const description = descriptionLines.join("\\n");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DWS Oni Seal Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@dws-oni-planner`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "oni-seal-ready.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Initial setup
loadOniLevelsFromStorage();

document.addEventListener("DOMContentLoaded", () => {
  renderOniTable();

  document.getElementById("calculateBtn").addEventListener("click", calculateNextUpgrade);
  document.getElementById("addLevelBtn").addEventListener("click", handleAddOrUpdateLevel);

  const calendarBtn = document.getElementById("addCalendarBtn");
  if (calendarBtn) {
    calendarBtn.addEventListener("click", downloadCalendarEvent);
  }
});
