// Quartz Factory hourly production by level (1–30)
const QUARTZ_RATES = {
    1: 720,
    2: 1440,
    3: 2160,
    4: 2880,
    5: 3600,
    6: 4320,
    7: 5040,
    8: 5760,
    9: 6480,
    10: 7200,
    11: 7920,
    12: 8640,
    13: 9360,
    14: 10080,
    15: 10800,
    16: 11520,
    17: 12240,
    18: 12960,
    19: 13680,
    20: 14400,
    21: 15120,
    22: 15840,
    23: 16560,
    24: 17280,
    25: 18000,
    26: 18720,
    27: 19440,
    28: 20160,
    29: 20880,
    30: 21600
  };
  
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
    { level: 9, quartz: 234800, upgradeTime: "03:50:22" }
  ];
  
  const ONI_STORAGE_KEY = "oniSealHallLevels_v1";
  
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
  
  // New: total quartz per hour based on 5 fixed factory boxes
  function getTotalQuartzPerHour() {
    let total = 0;
  
    for (let i = 1; i <= 5; i++) {
      const builtCheckbox = document.getElementById(`factoryBuilt_${i}`);
      const levelSelect = document.getElementById(`factoryLevel_${i}`);
      if (!builtCheckbox || !levelSelect) continue;
  
      if (!builtCheckbox.checked) continue; // factory not built
  
      const level = parseInt(levelSelect.value, 10);
      const rate = QUARTZ_RATES[level] || 0;
      total += rate;
    }
  
    return total;
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
  
    const totalRate = getTotalQuartzPerHour(); // base production per hour
  
    // Season Pass handling
    const seasonPassCheckbox = document.getElementById("seasonPass");
    const hasSeasonPass = seasonPassCheckbox && seasonPassCheckbox.checked;
    const effectiveRate = hasSeasonPass ? Math.round(totalRate * 1.2) : totalRate;
  
    const currentLevel = parseInt(document.getElementById("currentLevel").value, 10) || 0;
    const currentQuartz = Math.max(0, parseInt(document.getElementById("currentQuartz").value, 10) || 0);
    const nextLevel = currentLevel + 1;
  
    if (totalRate <= 0) {
      resultsDiv.innerHTML = `
        <div class="results-notes">
          ⚠ You have no built Quartz Factories selected.
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
  
    if (remainingQuartzRaw <= 0) {
      notes = "✅ You already have enough quartz to start this upgrade.";
    } else {
      // Use effectiveRate (with Season Pass bonus if enabled)
      const hoursNeeded = remainingQuartz / effectiveRate;
      const minutesNeeded = Math.ceil(hoursNeeded * 60);
  
      farmingTimeDisplay = formatDurationFromMinutes(minutesNeeded);
  
      const now = new Date();
      const readyTime = new Date(now.getTime() + minutesNeeded * 60 * 1000);
      readyTimeDisplay = `${readyTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} on ${readyTime.toLocaleDateString()}`;
  
      const bonusText = hasSeasonPass ? " (including 20% Season Pass bonus)" : "";
      notes = `Estimated farming time: ~${farmingTimeDisplay}${bonusText}<br>If you start now: ready around ${readyTimeDisplay}`;
    }
  
    const rows = [
      { label: "Base quartz production", value: `${totalRate.toLocaleString()} / hour` },
      { label: "Season Pass purchased", value: hasSeasonPass ? "Yes (+20% production)" : "No" },
      { label: "Effective quartz production", value: `${effectiveRate.toLocaleString()} / hour` },
      { label: "Current Oni Seal Hall level", value: currentLevel },
      { label: "Target level", value: nextLevel },
      { label: "Current quartz stored", value: currentQuartz.toLocaleString() },
      { label: "Next level quartz requirement", value: `${requiredQuartz.toLocaleString()} (upgrade time in game: ${levelData.upgradeTime || "unknown"})` },
      { label: "Quartz still needed", value: remainingQuartz.toLocaleString() }
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
  
    if (!level || level < 1 || level > 30) {
      alert("Please enter a valid level between 1 and 30.");
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
  
    // Clear inputs lightly but keep level for quick tweaks if you like
    quartzInput.value = "";
    timeInput.value = "";
  }
  
  // Initial setup
  loadOniLevelsFromStorage();
  
  document.addEventListener("DOMContentLoaded", () => {
    renderOniTable();
  
    document.getElementById("calculateBtn").addEventListener("click", calculateNextUpgrade);
    document.getElementById("addLevelBtn").addEventListener("click", handleAddOrUpdateLevel);
  });
  



