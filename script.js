const WORD_LIST = [
  "algorithm", "function", "variable", "syntax", "compiler", "terminal", "keyboard",
  "developer", "software", "interface", "prototype", "render", "database", "network",
  "execution", "benchmark", "performance", "component", "asynchronous", "framework",
  "application", "scripting", "responsive", "gradient", "vector", "pipeline", "binary"
];

let currentMode = "time";
let currentOption = 30;
let suddenDeath = false;
let blindMode = false;
let soundEnabled = true;

let words = [];
let wordIndex = 0;
let letterIndex = 0;
let timer = 0;
let timerInterval = null;
let isStarted = false;
let startTime = 0;

let totalTyped = 0;
let correctTyped = 0;
let totalKeystrokes = 0;
let wpmHistory = [];
let rawHistory = [];
let labelsHistory = [];

const wordsWrapper = document.getElementById("words-wrapper");
const wordsEl = document.getElementById("words");
const caret = document.getElementById("caret");
const hiddenInput = document.getElementById("hidden-input");
const liveDisplay = document.getElementById("live-display");
const resultsEl = document.getElementById("results");
const restartBtn = document.getElementById("restart-btn");
const themeSelect = document.getElementById("theme-select");
const soundBtn = document.getElementById("sound-btn");
let chartInstance = null;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playAudio(freq, type, duration) {
  if (!soundEnabled) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}

function playKeySound() { playAudio(700, 'sine', 0.03); }
function playErrorSound() { playAudio(150, 'sawtooth', 0.1); }

themeSelect.addEventListener("change", (e) => {
  document.documentElement.setAttribute("data-theme", e.target.value);
});

soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundBtn.classList.toggle("active", soundEnabled);
});

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    currentMode = e.target.dataset.mode;

    document.getElementById("time-options").classList.toggle("hidden", currentMode !== "time");
    document.getElementById("words-options").classList.toggle("hidden", currentMode !== "words");
    
    currentOption = currentMode === "time" ? 30 : (currentMode === "words" ? 25 : 0);
    initTest();
  });
});

document.querySelectorAll(".opt-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.target.parentElement.querySelectorAll(".opt-btn").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    currentOption = parseInt(e.target.dataset.val);
    initTest();
  });
});

document.getElementById("toggle-sudden-death").addEventListener("click", (e) => {
  suddenDeath = !suddenDeath;
  e.target.classList.toggle("active", suddenDeath);
  initTest();
});

document.getElementById("toggle-blind").addEventListener("click", (e) => {
  blindMode = !blindMode;
  e.target.classList.toggle("active", blindMode);
  document.body.classList.toggle("blind-mode", blindMode);
  initTest();
});

function initTest() {
  clearInterval(timerInterval);
  wordIndex = 0;
  letterIndex = 0;
  isStarted = false;
  totalTyped = 0;
  correctTyped = 0;
  totalKeystrokes = 0;
  wpmHistory = [];
  rawHistory = [];
  labelsHistory = [];

  if (currentMode === "time") timer = currentOption;
  else timer = 0;

  liveDisplay.textContent = currentMode === "time" ? timer : (currentMode === "words" ? `${wordIndex}/${currentOption}` : "Zen");
  resultsEl.classList.add("hidden");
  wordsWrapper.classList.remove("hidden");
  hiddenInput.value = "";

  generateWords();
  updateCaretPosition();
  hiddenInput.focus();
}

function generateWords() {
  wordsEl.innerHTML = "";
  const count = currentMode === "words" ? currentOption : 80;
  words = Array.from({ length: count }, () => WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)]);

  words.forEach((wordText) => {
    const wordDiv = document.createElement("div");
    wordDiv.classList.add("word");
    wordText.split("").forEach((char) => {
      const letterSpan = document.createElement("letter");
      letterSpan.textContent = char;
      wordDiv.appendChild(letterSpan);
    });
    wordsEl.appendChild(wordDiv);
  });
}

function startTimer() {
  isStarted = true;
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);

    if (currentMode === "time") {
      timer = currentOption - elapsed;
      liveDisplay.textContent = timer;
      if (timer <= 0) endTest();
    } else {
      timer = elapsed;
      if (currentMode === "zen") liveDisplay.textContent = timer + "s";
    }

    if (elapsed > 0) {
      const min = elapsed / 60;
      wpmHistory.push(Math.round((correctTyped / 5) / min));
      rawHistory.push(Math.round((totalTyped / 5) / min));
      labelsHistory.push(elapsed + "s");
    }
  }, 1000);
}

function updateCaretPosition() {
  const currentWord = wordsEl.children[wordIndex];
  if (!currentWord) return;

  const currentLetter = currentWord.children[letterIndex];
  if (currentLetter) {
    caret.style.left = currentLetter.offsetLeft + "px";
    caret.style.top = currentLetter.offsetTop + "px";
  } else {
    const lastLetter = currentWord.lastElementChild;
    caret.style.left = (lastLetter.offsetLeft + lastLetter.offsetWidth) + "px";
    caret.style.top = lastLetter.offsetTop + "px";
  }
}

document.addEventListener("click", () => hiddenInput.focus());

hiddenInput.addEventListener("keydown", (e) => {
  if (!isStarted && e.key.length === 1) startTimer();

  const currentWordDiv = wordsEl.children[wordIndex];
  const targetWord = words[wordIndex];

  if (e.key === "Backspace") {
    if (letterIndex > 0) {
      letterIndex--;
      const letter = currentWordDiv.children[letterIndex];
      if (letter.classList.contains("extra")) letter.remove();
      else letter.className = "";
    } else if (wordIndex > 0 && wordsEl.children[wordIndex - 1].querySelector(".incorrect, .extra")) {
      wordIndex--;
      letterIndex = wordsEl.children[wordIndex].children.length;
    }
    updateCaretPosition();
    return;
  }

  if (e.key === " ") {
    e.preventDefault();
    if (letterIndex === 0) return;

    totalKeystrokes++;
    wordIndex++;
    letterIndex = 0;

    if (currentMode === "words") {
      liveDisplay.textContent = `${wordIndex}/${currentOption}`;
      if (wordIndex >= currentOption) endTest();
    }
    updateCaretPosition();
    return;
  }

  if (e.key.length === 1) {
    totalKeystrokes++;
    const letters = currentWordDiv.children;

    if (letterIndex < targetWord.length) {
      const currentLetter = letters[letterIndex];
      if (e.key === targetWord[letterIndex]) {
        currentLetter.classList.add("correct");
        correctTyped++;
        playKeySound();
      } else {
        currentLetter.classList.add("incorrect");
        playErrorSound();
        if (suddenDeath) return endTest();
      }
      letterIndex++;
    } else {
      const extraLetter = document.createElement("letter");
      extraLetter.textContent = e.key;
      extraLetter.classList.add("extra", "incorrect");
      currentWordDiv.appendChild(extraLetter);
      letterIndex++;
      playErrorSound();
      if (suddenDeath) return endTest();
    }
    totalTyped++;
    updateCaretPosition();
  }
});

function endTest() {
  clearInterval(timerInterval);
  wordsWrapper.classList.add("hidden");
  resultsEl.classList.remove("hidden");

  const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
  const timeInMinutes = elapsedSeconds / 60;

  const wpm = Math.round((correctTyped / 5) / timeInMinutes);
  const rawWpm = Math.round((totalTyped / 5) / timeInMinutes);
  const accuracy = totalKeystrokes > 0 ? Math.round((correctTyped / totalKeystrokes) * 100) : 0;

  document.getElementById("res-wpm").textContent = wpm;
  document.getElementById("res-raw").textContent = rawWpm;
  document.getElementById("res-acc").textContent = accuracy + "%";

  renderChart();
}

function renderChart() {
  const ctx = document.getElementById("wpm-chart").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  const mainColor = getComputedStyle(document.documentElement).getPropertyValue('--main-color').trim();
  const subColor = getComputedStyle(document.documentElement).getPropertyValue('--sub-color').trim();

  // Create gradient background for WPM line
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, mainColor + '44');
  gradient.addColorStop(1, mainColor + '00');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labelsHistory,
      datasets: [
        { 
          label: 'WPM', 
          data: wpmHistory, 
          borderColor: mainColor, 
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 3
        },
        { 
          label: 'Raw WPM', 
          data: rawHistory, 
          borderColor: subColor, 
          borderDash: [4, 4], 
          fill: false,
          tension: 0.4,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: subColor, font: { family: 'JetBrains Mono' } } }
      },
      scales: {
        x: { ticks: { color: subColor }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { color: subColor }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

restartBtn.addEventListener("click", initTest);
initTest();