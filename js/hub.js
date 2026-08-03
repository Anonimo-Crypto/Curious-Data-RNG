/* Index hub: intro + verify + menu */
let audioCtx = null;
let soundEnabled = true;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone({ freq = 440, duration = 0.15, type = "sine", volume = 0.15, slideTo = null, delay = 0 }) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    if (slideTo !== null) osc.frequency.linearRampToValueAtTime(slideTo, ctx.currentTime + delay + duration);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  } catch (e) {}
}

function sfxIntro() {
  playTone({ freq: 220, duration: 0.4, type: "sine", volume: 0.08, slideTo: 330 });
  playTone({ freq: 330, duration: 0.5, type: "triangle", volume: 0.06, slideTo: 440, delay: 0.15 });
}
function sfxClick() {
  playTone({ freq: 520, duration: 0.08, type: "square", volume: 0.1 });
}
function sfxError() {
  playTone({ freq: 200, duration: 0.35, type: "sawtooth", volume: 0.12, slideTo: 100 });
}

function initSoundToggle() {
  const btn = document.getElementById("sound-btn");
  if (!btn) return;
  if (localStorage.getItem("curiousSound") === "off") {
    soundEnabled = false;
    btn.textContent = "🔇";
    btn.classList.add("muted");
  }
  btn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem("curiousSound", soundEnabled ? "on" : "off");
    btn.textContent = soundEnabled ? "🔊" : "🔇";
    btn.classList.toggle("muted", !soundEnabled);
    if (soundEnabled) {
      getAudioCtx();
      sfxClick();
    }
  });
}

function lockProgram(reason) {
  clearSession();
  sfxError();
  document.getElementById("intro").style.display = "none";
  document.getElementById("menu").style.display = "none";
  document.getElementById("status").style.display = "none";
  document.getElementById("lock-reason").textContent = reason;
  document.getElementById("lock-screen").classList.add("active");
}

function showMenu(dataCount) {
  document.getElementById("menu").style.display = "flex";
  const status = document.getElementById("status");
  const local = isLocalMode();
  const pick = document.getElementById("local-pick");

  if (dataCount > 0) {
    status.textContent = "✓ Integridad verificada · " + dataCount + " datos";
    if (pick) pick.style.display = "none";
  } else if (local) {
    status.textContent = "Modo local · puedes cargar data.json manualmente";
    if (pick) pick.style.display = "flex";
  } else {
    status.textContent = "Sin data/data.json en el servidor";
    if (pick) pick.style.display = "none";
  }
}

async function startIntro() {
  const intro = document.getElementById("intro");
  const bar = document.getElementById("progress");
  const loadingText = document.getElementById("loading-text");

  requestAnimationFrame(() => {
    intro.style.opacity = "1";
    sfxIntro();
  });

  await new Promise((r) => setTimeout(r, 5000));
  loadingText.textContent = "Verificando integridad de data.json...";

  const result = await fetchAndDecrypt((pct, msg) => {
    bar.style.width = Math.min(100, pct) + "%";
    if (msg) loadingText.textContent = msg;
  });

  bar.style.width = "100%";
  await new Promise((r) => setTimeout(r, 400));

  if (!result.ok) {
    lockProgram(result.reason);
    return;
  }

  // Guardar sesión verificada para RNG.html
  saveSession(result.data || []);

  intro.style.opacity = "0";
  await new Promise((r) => setTimeout(r, 5000));
  intro.style.display = "none";

  showMenu((result.data || []).length);
}

async function loadFromFile(file) {
  const status = document.getElementById("status");
  status.textContent = "Leyendo " + file.name + "...";
  try {
    const buffer = await file.arrayBuffer();
    if (looksLikePlainJson(buffer)) {
      lockProgram("El archivo es JSON en texto plano, no el binario cifrado de data.html");
      return;
    }
    status.textContent = "Descifrando y verificando...";
    const parsed = await decryptData(buffer);
    if (!Array.isArray(parsed)) throw new Error("Formato inválido");
    saveSession(parsed);
    showMenu(parsed.length);
    sfxClick();
  } catch (e) {
    lockProgram("No se pudo verificar el archivo.\n" + (e.message || e));
  }
}

function initFilePicker() {
  const btn = document.getElementById("pick-data-btn");
  const input = document.getElementById("pick-data-input");
  if (!btn || !input) return;
  btn.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (file) loadFromFile(file);
    input.value = "";
  });
}

function initMenu() {
  document.getElementById("go-rng").addEventListener("click", () => {
    sfxClick();
    location.href = "./RNG.html";
  });
  document.getElementById("go-data").addEventListener("click", () => {
    sfxClick();
    location.href = "./data.html";
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initSoundToggle();
  initFilePicker();
  initMenu();
  startIntro();
});
