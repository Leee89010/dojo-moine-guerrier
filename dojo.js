// ============================================================
// DOJO.JS - VERSION FINALE NETTOYÉE
// ============================================================

// --- UTILITAIRES GLOBAUX ---
function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

    stepsValueEl.textContent = dayState.steps.toLocaleString("fr-FR");
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
    const cards = ritualsListEl.querySelectorAll(".ritual-card-premium");
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
    ritualsListEl.querySelectorAll(".ritual-card-premium").forEach((card, index) => {
        const key = "r" + index;
        const toggle = card.querySelector(".ritual-check");
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

// Appui long sur la carte "Pas" → ouvre réglages
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

// ============================================================
// RENDU DES CARTES SUPPLÉMENTAIRES
// ============================================================

const key = todayKey();

// --- POPUP GÉNÉRIQUE ---
window.openPopup = function(id) {
    const popup = document.getElementById(id);
    if (popup) popup.style.display = "flex";
}

window.closePopup = function(id) {
    const popup = document.getElementById(id);
    if (popup) popup.style.display = "none";
}

// --- SÉANCE DU JOUR - VERSION PREMIUM ---
const seances = getJSON("seances", {});

if (!seances[key]) {
    seances[key] = { type: "", duree: "", intensite: "", notes: "" };
}

let selectedSportType = null;
let selectedDuration = null;

const seanceCard = document.getElementById("seanceCard");
if (seanceCard) {
    seanceCard.addEventListener("click", () => {
        // Pré-remplir si déjà saisi
        if (seances[key].type) {
            selectedSportType = seances[key].type;
            document.querySelectorAll(".sport-cat-btn").forEach(btn => {
                if (btn.getAttribute("data-type") === selectedSportType) {
                    btn.classList.add("active");
                }
            });
        }
        
        if (seances[key].duree) {
            selectedDuration = parseInt(seances[key].duree);
            document.getElementById("popupSeanceDuree").value = selectedDuration;
            document.querySelectorAll(".duration-btn").forEach(btn => {
                if (parseInt(btn.getAttribute("data-duration")) === selectedDuration) {
                    btn.classList.add("active");
                }
            });
        }
        
        document.getElementById("popupSeanceIntensite").value = seances[key].intensite || 5;
        updateIntensityDisplay(seances[key].intensite || 5);
        document.getElementById("popupSeanceNotes").value = seances[key].notes || "";
        
        openPopup("popupSeance");
    });
}

// Sélection catégorie sport
document.querySelectorAll(".sport-cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".sport-cat-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedSportType = btn.getAttribute("data-type");
        
        const customInput = document.getElementById("popupSeanceTypeCustom");
        if (selectedSportType === "Autre") {
            customInput.style.display = "block";
        } else {
            customInput.style.display = "none";
        }
    });
});

// Quick duration buttons
document.querySelectorAll(".duration-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".duration-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedDuration = parseInt(btn.getAttribute("data-duration"));
        document.getElementById("popupSeanceDuree").value = selectedDuration;
    });
});

// Manual duration input
const dureeInput = document.getElementById("popupSeanceDuree");
if (dureeInput) {
    dureeInput.addEventListener("input", (e) => {
        document.querySelectorAll(".duration-btn").forEach(b => b.classList.remove("active"));
        selectedDuration = parseInt(e.target.value);
    });
}

// Intensity slider avec emojis
const intensitySlider = document.getElementById("popupSeanceIntensite");
if (intensitySlider) {
    intensitySlider.addEventListener("input", (e) => {
        updateIntensityDisplay(e.target.value);
    });
}

function updateIntensityDisplay(value) {
    const val = parseInt(value);
    const valueEl = document.getElementById("intensityValue");
    const emojiEl = document.getElementById("intensityEmoji");
    
    if (!valueEl || !emojiEl) return;
    
    valueEl.textContent = val + "/10";
    
    const emojis = {
        1: "😴", 2: "😪", 3: "😐", 4: "🙂", 5: "😊",
        6: "💪", 7: "🔥", 8: "💥", 9: "⚡", 10: "🚀"
    };
    
    emojiEl.textContent = emojis[val] || "😐";
    
    if (val <= 3) {
        valueEl.style.color = "#4caf50";
    } else if (val <= 6) {
        valueEl.style.color = "#ffa726";
    } else {
        valueEl.style.color = "#ff6b6b";
    }
}

const saveSeanceBtn = document.getElementById("saveSeanceBtn");
if (saveSeanceBtn) {
    saveSeanceBtn.addEventListener("click", () => {
        const customInput = document.getElementById("popupSeanceTypeCustom");
        const finalType = selectedSportType === "Autre" ? customInput.value : selectedSportType;
        const duree = document.getElementById("popupSeanceDuree").value;
        const intensite = document.getElementById("popupSeanceIntensite").value;
        const notes = document.getElementById("popupSeanceNotes").value;
        
        if (!finalType) {
            alert("❌ Sélectionne un type de séance !");
            return;
        }
        
        if (!duree) {
            alert("❌ Entre la durée de ta séance !");
            return;
        }
        
        seances[key].type = finalType;
        seances[key].duree = duree;
        seances[key].intensite = intensite;
        seances[key].notes = notes;

        setJSON("seances", seances);
        renderSeance();
        closePopup("popupSeance");
        
        // Reset
        selectedSportType = null;
        selectedDuration = null;
        document.querySelectorAll(".sport-cat-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".duration-btn").forEach(b => b.classList.remove("active"));
        
        alert("✅ Séance enregistrée !");
    });
}

// --- DISCIPLINE ---
const discipline = getJSON("discipline", {});

if (!discipline[key]) {
    discipline[key] = { score: 0 };
}

const disciplineCard = document.getElementById("disciplineCard");
if (disciplineCard) {
    disciplineCard.addEventListener("click", () => {
        document.getElementById("popupDisciplineScore").value = discipline[key].score || 0;
        openPopup("popupDiscipline");
    });
}

const saveDisciplineBtn = document.getElementById("saveDisciplineBtn");
if (saveDisciplineBtn) {
    saveDisciplineBtn.addEventListener("click", () => {
        discipline[key].score = parseInt(document.getElementById("popupDisciplineScore").value) || 0;
        setJSON("discipline", discipline);
        renderDiscipline();
        closePopup("popupDiscipline");
        alert("✅ Discipline enregistrée !");
    });
}

// --- MENTAL (AUTO CALCULÉ) ---
function renderMental() {
    const mentalEtatLabel = document.getElementById("mentalEtatLabel");
    const mentalConseilLabel = document.getElementById("mentalConseilLabel");
    
    if (!mentalEtatLabel || !mentalConseilLabel) return;
    
    const corps = getJSON("corps", {});
    const c = corps[key];
    if (!c) return;

    let etat = "";
    let conseil = "";

    const stress = parseInt(c.stress || 0);

    if (stress >= 7) {
        etat = "Stress élevé";
        conseil = "Respiration 4-2-6 + marche.";
    } else if (stress >= 4) {
        etat = "Stress modéré";
        conseil = "Pause + respiration lente.";
    } else {
        etat = "Stress bas";
        conseil = "Avance fort sur ta tâche.";
    }

    mentalEtatLabel.textContent = etat;
    mentalConseilLabel.textContent = conseil;
}

// --- XP + NIVEAU ---
function renderXP() {
    const xp = parseInt(localStorage.getItem("xp") || "0");
    let niveau = "Errant";

    if (xp >= 500) niveau = "Moine Implacable";
    else if (xp >= 300) niveau = "Moine Rigoureux";
    else if (xp >= 150) niveau = "Moine en Formation";
    else if (xp >= 50) niveau = "Apprenti de la Rigueur";

    const xpLabel = document.getElementById("xpLabel");
    const niveauLabel = document.getElementById("niveauLabel");
    const xpLabelSmall = document.getElementById("xpLabelSmall");
    const niveauLabelSmall = document.getElementById("niveauLabelSmall");
    
    if (xpLabel) xpLabel.textContent = xp + " XP";
    if (niveauLabel) niveauLabel.textContent = niveau;
    if (xpLabelSmall) xpLabelSmall.textContent = xp + " XP";
    if (niveauLabelSmall) niveauLabelSmall.textContent = niveau;
}

// --- RENDU DES CARTES ---
function renderSeance() {
    const typeLabel = document.getElementById("typeSeanceLabel");
    const dureeLabel = document.getElementById("dureeSeanceLabel");
    const intensiteLabel = document.getElementById("intensiteSeanceLabel");
    
    if (typeLabel) typeLabel.textContent = seances[key]?.type || "—";
    if (dureeLabel) dureeLabel.textContent = seances[key]?.duree ? seances[key].duree + " min" : "—";
    if (intensiteLabel) intensiteLabel.textContent = seances[key]?.intensite ? seances[key].intensite + "/10" : "—";
}

function renderDiscipline() {
    const disciplineScoreLabel = document.getElementById("disciplineScoreLabel");
    if (disciplineScoreLabel) {
        disciplineScoreLabel.textContent = discipline[key]?.score || "0";
    }
}

// --- INITIALISATION ---
renderSteps();
renderWater();
renderRituals();
renderSeance();
renderDiscipline();
renderMental();
renderXP();
