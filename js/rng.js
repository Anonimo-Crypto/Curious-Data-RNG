/* RNG page: only cards / generator (no intro) */
let data = [];
let isSpinning = false;
let currentTag = null;
let locked = false;
let audioCtx = null;
let soundEnabled = true;

const tagsPool = ["Biología", "Astronomía", "Física", "Historia", "Tecnología", "Química", "Matemáticas", "Geografía"];

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

function sfxTick() { playTone({ freq: 800 + Math.random() * 400, duration: 0.04, type: "square", volume: 0.05 }); }
function sfxStop() { playTone({ freq: 600, duration: 0.12, type: "triangle", volume: 0.12, slideTo: 300 }); }
function sfxFlip() { playTone({ freq: 300, duration: 0.25, type: "sine", volume: 0.1, slideTo: 600 }); }
function sfxClick() { playTone({ freq: 520, duration: 0.08, type: "square", volume: 0.1 }); }
function sfxError() { playTone({ freq: 200, duration: 0.35, type: "sawtooth", volume: 0.12, slideTo: 100 }); }

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
    if (soundEnabled) { getAudioCtx(); sfxClick(); }
  });
}

function lockProgram(reason) {
  locked = true;
  clearSession();
  sfxError();
  document.getElementById("main-ui").style.display = "none";
  document.getElementById("status").style.display = "none";
  document.getElementById("lock-reason").textContent = reason;
  document.getElementById("lock-screen").classList.add("active");
}

function applyData(parsed) {
  data = parsed || [];
  const empty = document.getElementById("empty-hint");
  const gen = document.getElementById("generate");
  const status = document.getElementById("status");

  if (data.length === 0) {
    gen.disabled = true;
    if (isLocalMode()) {
      empty.style.display = "block";
      status.textContent = "Sin datos · carga data.json o vuelve al menú";
    } else {
      empty.style.display = "none";
      status.textContent = "Sin datos · genera data.json y súbelo a data/";
    }
  } else {
    empty.style.display = "none";
    gen.disabled = false;
    status.textContent = "✓ " + data.length + " datos listos";
  }
}

async function initData() {
  // Prefer session verified by Index.html
  const session = loadSession();
  if (session) {
    applyData(session);
    return;
  }

  // Fallback: try fetch (GitHub) or wait for manual pick (local)
  if (!isLocalMode()) {
    const result = await fetchAndDecrypt();
    if (!result.ok) {
      lockProgram(result.reason);
      return;
    }
    saveSession(result.data || []);
    applyData(result.data || []);
  } else {
    applyData([]);
  }
}

function initFilePicker() {
  const btn = document.getElementById("pick-data-btn");
  const input = document.getElementById("pick-data-input");
  if (!btn || !input) return;
  btn.addEventListener("click", () => input.click());
  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      if (looksLikePlainJson(buffer)) {
        lockProgram("Archivo en texto plano, no cifrado");
        return;
      }
      const parsed = await decryptData(buffer);
      saveSession(parsed);
      applyData(parsed);
      sfxClick();
    } catch (e) {
      lockProgram("No se pudo descifrar el archivo\n" + (e.message || e));
    }
  });
}

function initGame() {
  document.getElementById("generate").addEventListener("click", () => {
    if (isSpinning || locked || data.length === 0) return;
    isSpinning = true;
    sfxClick();

    const slot = document.getElementById("slot");
    slot.classList.add("spinning");
    document.getElementById("result-card").style.display = "none";
    document.getElementById("result-card").classList.remove("flipped");

    const availableTags = [...new Set(data.flatMap((d) => d.tags || []))];
    const pool = availableTags.length ? availableTags : tagsPool;
    let count = 0;
    const max = 28 + Math.floor(Math.random() * 10);

    const spin = setInterval(() => {
      currentTag = pool[Math.floor(Math.random() * pool.length)];
      slot.textContent = currentTag;
      sfxTick();
      count++;
      if (count >= max) {
        clearInterval(spin);
        isSpinning = false;
        slot.classList.remove("spinning");
        sfxStop();
      }
    }, 70);
  });

  document.getElementById("slot").addEventListener("click", () => {
    if (isSpinning || locked || !currentTag || data.length === 0) return;

    const filtered = data.filter((d) => d.tags && d.tags.includes(currentTag));
    if (!filtered.length) {
      alert('No hay datos con el tag "' + currentTag + '"');
      return;
    }

    const fact = filtered[Math.floor(Math.random() * filtered.length)];
    const card = document.getElementById("result-card");

    document.getElementById("tag-name").textContent = currentTag;
    document.getElementById("fact-title").textContent = fact.title || "";
    document.getElementById("fact-text").textContent = fact.fact || "";

    const container = document.getElementById("fact-sections");
    container.innerHTML = "";
    (fact.sections || []).forEach((sec) => {
      if (sec && typeof sec === "object" && Array.isArray(sec.bullets)) {
        const block = document.createElement("div");
        block.className = "section-block";
        const st = document.createElement("div");
        st.className = "section-title";
        st.textContent = sec.title || "";
        block.appendChild(st);
        const ul = document.createElement("ul");
        sec.bullets.forEach((b) => {
          const li = document.createElement("li");
          li.textContent = b;
          ul.appendChild(li);
        });
        block.appendChild(ul);
        container.appendChild(block);
      }
    });

    card.style.display = "block";
    card.classList.remove("flipped");
    card.querySelector(".card-back").scrollTop = 0;
    card.onclick = () => {
      card.classList.toggle("flipped");
      sfxFlip();
    };
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  initSoundToggle();
  initFilePicker();
  initGame();
  await initData();
});
