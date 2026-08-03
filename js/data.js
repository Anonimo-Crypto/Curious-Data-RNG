const AES_PASSWORD_LOCAL = "CuriousData2026Oscar!"; // uses crypto.js helpers
let sections = [{ title: "", bullets: [""] }];
let allData = [];

function initModeUI() {
  const local = isLocalMode();
  const banner = document.getElementById("mode-banner");
  const btn = document.getElementById("save-btn");
  if (local) {
    banner.innerHTML =
      "<strong>Modo local</strong><br>Al guardar se descargará <code>data.json</code>. Luego cárgalo en el menú principal o en RNG.html.";
    if (btn) btn.textContent = "GUARDAR Y DESCARGAR data.json";
  } else {
    banner.innerHTML =
      "<strong>Modo GitHub / servidor</strong><br>Al guardar se descarga <code>data.json</code> cifrado. Súbelo a <code>data/data.json</code> en el repositorio (reemplaza el anterior).";
    if (btn) btn.textContent = "CIFRAR Y DESCARGAR data.json (subir a data/)";
  }
}

function renderSections() {
  const root = document.getElementById("sections-root");
  root.innerHTML = "";
  sections.forEach((sec, sIdx) => {
    const card = document.createElement("div");
    card.className = "section-card";

    const row = document.createElement("div");
    row.className = "row";
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.placeholder = "Título de la sección";
    titleInput.value = sec.title;
    titleInput.oninput = (e) => {
      sections[sIdx].title = e.target.value;
    };
    const btnRemoveSec = document.createElement("button");
    btnRemoveSec.className = "btn btn-danger";
    btnRemoveSec.type = "button";
    btnRemoveSec.textContent = "×";
    btnRemoveSec.onclick = () => {
      sections.splice(sIdx, 1);
      if (!sections.length) sections = [{ title: "", bullets: [""] }];
      renderSections();
    };
    row.appendChild(titleInput);
    row.appendChild(btnRemoveSec);
    card.appendChild(row);

    const bulletsDiv = document.createElement("div");
    bulletsDiv.className = "bullets";
    sec.bullets.forEach((b, bIdx) => {
      const brow = document.createElement("div");
      brow.className = "bullet-row";
      const ta = document.createElement("textarea");
      ta.placeholder = "Viñeta " + (bIdx + 1);
      ta.value = b;
      ta.oninput = (e) => {
        sections[sIdx].bullets[bIdx] = e.target.value;
      };
      const btnRemoveB = document.createElement("button");
      btnRemoveB.className = "btn btn-danger";
      btnRemoveB.type = "button";
      btnRemoveB.textContent = "×";
      btnRemoveB.onclick = () => {
        sections[sIdx].bullets.splice(bIdx, 1);
        if (!sections[sIdx].bullets.length) sections[sIdx].bullets = [""];
        renderSections();
      };
      brow.appendChild(ta);
      brow.appendChild(btnRemoveB);
      bulletsDiv.appendChild(brow);
    });
    card.appendChild(bulletsDiv);

    const btnAddBullet = document.createElement("button");
    btnAddBullet.className = "btn btn-small";
    btnAddBullet.type = "button";
    btnAddBullet.textContent = "+ Viñeta";
    btnAddBullet.onclick = () => {
      sections[sIdx].bullets.push("");
      renderSections();
    };
    card.appendChild(btnAddBullet);
    root.appendChild(card);
  });
}

function addSection() {
  sections.push({ title: "", bullets: [""] });
  renderSections();
}

function downloadBlob(filename, data, mime) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function saveData() {
  const title = document.getElementById("title").value.trim();
  const fact = document.getElementById("fact").value.trim();
  const tag = document.getElementById("tag").value.trim();
  if (!title || !fact || !tag) {
    alert("Completa Título, Descripción y Tag.");
    return;
  }

  const cleanSections = sections
    .map((s) => ({
      title: s.title.trim(),
      bullets: s.bullets.map((b) => b.trim()).filter(Boolean)
    }))
    .filter((s) => s.title && s.bullets.length);

  if (!cleanSections.length) {
    alert("Añade al menos una sección con título y viñetas.");
    return;
  }

  const key =
    "K" +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 8).toUpperCase();

  allData.push({ title, fact, sections: cleanSections, tags: [tag], key });
  localStorage.setItem("curiousDataPlain", JSON.stringify(allData));

  try {
    const encrypted = await encryptPayload(allData);
    downloadBlob("data.json", encrypted, "application/octet-stream");
    alert(
      isLocalMode()
        ? "✅ Cifrado (AES-128)\n\nDatos: " +
            allData.length +
            "\n\nSe descargó data.json\nEn el menú principal o RNG usa: Cargar data.json"
        : "✅ Cifrado (AES-128)\n\nDatos: " +
            allData.length +
            "\n\nSe descargó data.json\nSúbelo a data/data.json en GitHub"
    );
  } catch (err) {
    console.error(err);
    alert("Error al cifrar: " + err.message);
    return;
  }

  document.getElementById("title").value = "";
  document.getElementById("fact").value = "";
  document.getElementById("tag").value = "";
  sections = [{ title: "", bullets: [""] }];
  renderSections();
  document.getElementById("count-meta").textContent =
    "Datos en borrador local: " + allData.length;
}

window.addEventListener("DOMContentLoaded", () => {
  try {
    const saved = localStorage.getItem("curiousDataPlain");
    if (saved) {
      allData = JSON.parse(saved);
      document.getElementById("count-meta").textContent =
        "Datos en borrador local: " + allData.length;
    }
  } catch (e) {}
  renderSections();
  initModeUI();
  window.addSection = addSection;
  window.saveData = saveData;
});
