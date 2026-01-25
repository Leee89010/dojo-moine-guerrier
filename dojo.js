// --- UTILITAIRES GLOBAUX ---
function todayKey() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getJSON(key, def) {
    try {
        return JSON.parse(localStorage.getItem(key)) || def;
    } catch {
        return def;
    }
}

function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// --- SETTINGS DOJO ---
function getDojoSettings() {
    return getJSON("dojoSettings", {
        stepsGoal: 10000,
        waterMode: "litres",
        waterGoalLitres: 2,
        waterGoalGlasses: 8
    });
}

function saveDojoSettings(s) {
    setJSON("dojoSettings", s);
}

let dojoSettings = getDojoSettings();

// --- ÉTAT JOURNALIER ---
function getDojoDayState() {
    const key = todayKey();
    const all = getJSON("dojoDayState", {});
    if (!all[key]) {
        all[key] = {
            steps: 0,
            waterLitres: 0,
            waterGlasses: 0,
            rituals: {}
        };
        setJSON("dojoDayState", all);
    }
    return { all, key, state: all[key] };
}

function saveDojoDayState(all) {
    setJSON("dojoDayState", all);
}

let { all: dayAll, key: dayKey, state: dayState } = getDojoDayState();

// --- BINDINGS DOM ---
const stepsValueEl = document.getElementById("stepsValue");
const stepsProgressEl = document.getElementById("stepsProgress");
const stepsGoalLabelEl = document.getElementById("stepsGoalLabel");

const waterValueEl = document.getElementById("waterValue");
const waterUnitEl = document.getElementById("waterUnit");
const waterProgressEl = document.getElementById("waterProgress");
const waterGoalLabelEl = document.getElementById("waterGoalLabel");
const waterGoalUnitEl = document.getElementById("waterGoalUnit");

const modeLitresBtn = document.getElementById("modeLitres");
const modeVerresBtn = document.getElementById("modeVerres");
const waterPlusBtn = document.getElementById("waterPlus");

const stepsCard = document.getElementById("stepsCard");
const ritualsListEl = document.getElementById("ritualsList");

// Popup réglages
const settingsPopup = document.getElementById("settingsPopup");
const openSettingsBtn = document.getElementById("openSettings");
const closeSettingsBtn = document.getElementById("closeSettings");
const saveSettingsBtn = document.getElementById("saveSettings");

const stepsGoalInput = document.getElementById("stepsGoalInput");
const waterModeSelect = document.getElementById("waterModeSelect");
const waterGoalLitresInput = document.getElementById("waterGoalLitresInput");
const waterGoalGlassesInput = document.getElementById("waterGoalGlassesInput");

// --- RENDU ---
function renderSteps() {
    if (!stepsValueEl || !stepsProgressEl || !stepsGoalLabelEl) return;

    stepsValueEl.textContent = dayState.steps;
    stepsGoalLabelEl.textContent = dojoSettings.stepsGoal.toLocaleString("fr-FR");

    const ratio = Math.min(dayState.steps / dojoSettings.stepsGoal, 1);
    stepsProgressEl.style.width = (ratio * 100) + "%";
}

function renderWater() {
    if (!waterValueEl || !waterUnitEl || !waterProgressEl || !waterGoalLabelEl || !waterGoalUnitEl) return;

    if (dojoSettings.waterMode === "litres") {
        modeLitresBtn?.classList.add("active");
        modeVerresBtn?.classList.remove("active");
        waterUnitEl.textContent = "L";
        waterGoalUnitEl.textContent = "L";
        waterGoalLabelEl.textContent = dojoSettings.waterGoalLitres;
        waterValueEl.textContent = dayState.waterLitres.toFixed(1);

        const ratio = Math.min(dayState.waterLitres / dojoSettings.waterGoalLitres, 1);
        waterProgressEl.style.width = (ratio * 100) + "%";
        if (waterPlusBtn) waterPlusBtn.textContent = "+0.25";
    } else {
        modeLitresBtn?.classList.remove("active");
        modeVerresBtn?.classList.add("active");
        waterUnitEl.textContent = "verres";
        waterGoalUnitEl.textContent = "verres";
        waterGoalLabelEl.textContent = dojoSettings.waterGoalGlasses;
        waterValueEl.textContent = dayState.waterGlasses;

        const ratio = Math.min(dayState.waterGlasses / dojoSettings.waterGoalGlasses, 1);
        waterProgressEl.style.width = (ratio * 100) + "%";
        if (waterPlusBtn) waterPlusBtn.textContent = "+1";
    }
}

function renderRituals() {
    if (!ritualsListEl) return;
    const cards = ritualsListEl.querySelectorAll(".ritual-card");
    cards.forEach((card, index) => {
        const key = "r" + index;
        const done = dayState.rituals[key] === true;
        if (done) {
            card.classList.add("completed");
        } else {
            card.classList.remove("completed");
        }
    });
}

// --- EVENTS ---
// Ajout rapide de pas
document.querySelectorAll("[data-steps]").forEach(btn => {
    btn.addEventListener("click", () => {
        const delta = parseInt(btn.getAttribute("data-steps"), 10);
        if (isNaN(delta)) return;
        dayState.steps += delta;
        dayAll[dayKey] = dayState;
        saveDojoDayState(dayAll);
        renderSteps();
    });
});

// Toggle mode eau
modeLitresBtn?.addEventListener("click", () => {
    dojoSettings.waterMode = "litres";
    saveDojoSettings(dojoSettings);
    renderWater();
});

modeVerresBtn?.addEventListener("click", () => {
    dojoSettings.waterMode = "verres";
    saveDojoSettings(dojoSettings);
    renderWater();
});

// Ajout eau
waterPlusBtn?.addEventListener("click", () => {
    if (dojoSettings.waterMode === "litres") {
        dayState.waterLitres = +(dayState.waterLitres + 0.25).toFixed(2);
    } else {
        dayState.waterGlasses += 1;
    }
    dayAll[dayKey] = dayState;
    saveDojoDayState(dayAll);
    renderWater();
});

// Rituels toggle
if (ritualsListEl) {
    ritualsListEl.querySelectorAll(".ritual-card").forEach((card, index) => {
        const key = "r" + index;
        const toggle = card.querySelector(".ritual-toggle");
        if (!toggle) return;
        toggle.addEventListener("click", () => {
            const current = dayState.rituals[key] === true;
            dayState.rituals[key] = !current;
            dayAll[dayKey] = dayState;
            saveDojoDayState(dayAll);
            renderRituals();
        });
    });
}

// Popup réglages
openSettingsBtn?.addEventListener("click", () => {
    if (!settingsPopup) return;
    stepsGoalInput.value = dojoSettings.stepsGoal;
    waterModeSelect.value = dojoSettings.waterMode;
    waterGoalLitresInput.value = dojoSettings.waterGoalLitres;
    waterGoalGlassesInput.value = dojoSettings.waterGoalGlasses;
    settingsPopup.style.display = "flex";
});

closeSettingsBtn?.addEventListener("click", () => {
    if (!settingsPopup) return;
    settingsPopup.style.display = "none";
});

saveSettingsBtn?.addEventListener("click", () => {
    const newGoal = parseInt(stepsGoalInput.value, 10);
    if (!isNaN(newGoal) && newGoal > 0) dojoSettings.stepsGoal = newGoal;

    dojoSettings.waterMode = waterModeSelect.value || "litres";

    const newLitres = parseFloat(waterGoalLitresInput.value);
    if (!isNaN(newLitres) && newLitres > 0) dojoSettings.waterGoalLitres = newLitres;

    const newGlasses = parseInt(waterGoalGlassesInput.value, 10);
    if (!isNaN(newGlasses) && newGlasses > 0) dojoSettings.waterGoalGlasses = newGlasses;

    saveDojoSettings(dojoSettings);
    renderSteps();
    renderWater();
    if (settingsPopup) settingsPopup.style.display = "none";
});

// Appui long sur la carte “Pas” → ouvre réglages
let stepsPressTimer = null;
if (stepsCard) {
    const startPress = () => {
        stepsPressTimer = setTimeout(() => {
            openSettingsBtn?.click();
            stepsGoalInput?.focus();
        }, 600);
    };
    const endPress = () => clearTimeout(stepsPressTimer);

    stepsCard.addEventListener("mousedown", startPress);
    stepsCard.addEventListener("mouseup", endPress);
    stepsCard.addEventListener("mouseleave", endPress);

    stepsCard.addEventListener("touchstart", startPress);
    stepsCard.addEventListener("touchend", endPress);
    stepsCard.addEventListener("touchcancel", endPress);
}

// --- INIT ---
renderSteps();
renderWater();
renderRituals();
// --- RENDU DES CARTES SUPPLÉMENTAIRES ---
const key = todayKey();

// CORPS
const corps = getJSON("corps", {});
if (corps[key]) {
    document.getElementById("poidsLabel").textContent = corps[key].poids + " kg";
    document.getElementById("stressLabel").textContent = corps[key].stress + "/10";
    document.getElementById("sommeilLabel").textContent = corps[key].sommeil + "/10";
}

// SÉANCE
const seances = getJSON("seances", {});
if (seances[key]) {
    document.getElementById("typeSeanceLabel").textContent = seances[key].type;
    document.getElementById("dureeSeanceLabel").textContent = seances[key].duree + " min";
    document.getElementById("intensiteSeanceLabel").textContent = seances[key].intensite + "/10";
}

// ADDICTIONS
const add = getJSON("addictions", {});
if (add[key]) {
    document.getElementById("jointsLabel").textContent = add[key].joints;
    document.getElementById("cigarettesLabel").textContent = add[key].cigarettes;
    document.getElementById("cravingLabel").textContent = add[key].craving + "/10";
}

// MENTAL
if (corps[key]) {
    const stress = parseInt(corps[key].stress || "0", 10);
    let etat = "", conseil = "";

    if (stress >= 7) {
        etat = "Stress élevé";
        conseil = "Respiration 4-2-6 + marche";
    } else if (stress >= 4) {
        etat = "Stress modéré";
        conseil = "Pause + respiration lente";
    } else {
        etat = "Stress bas";
        conseil = "Avance fort sur ta tâche";
    }

    document.getElementById("mentalEtatLabel").textContent = etat;
    document.getElementById("mentalConseilLabel").textContent = conseil;
}

// XP / NIVEAU
const xp = parseInt(localStorage.getItem("xp") || "0", 10);
let niveau = "Errant";
if (xp >= 500) niveau = "Moine Implacable";
else if (xp >= 300) niveau = "Moine Rigoureux";
else if (xp >= 150) niveau = "Moine en Formation";
else if (xp >= 50) niveau = "Apprenti de la Rigueur";

document.getElementById("xpLabel").textContent = xp + " XP";
document.getElementById("niveauLabel").textContent = niveau;

// DISCIPLINE
const disc = getJSON("discipline", {});
if (disc[key]) {
    document.getElementById("disciplineScoreLabel").textContent = disc[key].score + "/5";
}
