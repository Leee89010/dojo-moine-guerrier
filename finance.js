// ============================================================
// FINANCE.JS - VERSION PREMIUM CORRIGÉE
// ============================================================

// --- STRUCTURE LOCALSTORAGE ---
function getFinances() {
    return JSON.parse(localStorage.getItem("finances")) || {};
}

function saveFinances(data) {
    localStorage.setItem("finances", JSON.stringify(data));
}

// --- CATÉGORIES SÉPARÉES PAR TYPE ---
const categoriesDepenses = [
    { name: "Loyer", icon: "🏠" },
    { name: "Courses", icon: "🛒" },
    { name: "Électricité", icon: "⚡" },
    { name: "Internet", icon: "🌐" },
    { name: "Téléphone", icon: "📱" },
    { name: "Essence", icon: "⛽" },
    { name: "Transport", icon: "🚌" },
    { name: "Resto", icon: "🍽️" },
    { name: "Fast-food", icon: "🍔" },
    { name: "Cinéma", icon: "🎬" },
    { name: "Sorties", icon: "🎉" },
    { name: "Ubereats", icon: "🛵" },
    { name: "Shopping", icon: "🛍️" },
    { name: "Santé", icon: "💊" },
    { name: "Abonnements", icon: "📦" },
    { name: "Autres", icon: "💸" }
];

const categoriesRevenus = [
    { name: "Salaire", icon: "💼" },
    { name: "Freelance", icon: "💻" },
    { name: "Prime", icon: "🎁" },
    { name: "APL", icon: "🏠" },
    { name: "Prime Activité", icon: "💰" },
    { name: "Remboursement", icon: "↩️" },
    { name: "Investissement", icon: "📈" },
    { name: "Vente", icon: "🏷️" },
    { name: "Autres", icon: "💵" }
];

// Icônes par catégorie (combiné)
const categoryIcons = {};
[...categoriesDepenses, ...categoriesRevenus].forEach(cat => {
    categoryIcons[cat.name] = cat.icon;
});

// --- VARIABLES ---
let finances = getFinances();
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth() + 1;
let selectedType = "depense";
let selectedCategory = null;

// --- UTILITAIRES ---
function formatMonth(m) {
    return m < 10 ? "0" + m : m;
}

function getMonthName(m) {
    return [
        "Janvier","Février","Mars","Avril","Mai","Juin",
        "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
    ][m - 1];
}

// --- AFFICHAGE PERIODE ---
function updatePeriodDisplay() {
    document.getElementById("currentPeriod").textContent =
        getMonthName(currentMonth) + " " + currentYear;
}

// --- RECUPERATION DES TRANSACTIONS DU MOIS ---
function getMonthTransactions() {
    const y = finances[currentYear] || {};
    const m = y[formatMonth(currentMonth)] || { transactions: [] };
    return m.transactions;
}

// --- CALCUL SOLDE ET TOTAUX ---
function updateSolde() {
    const list = getMonthTransactions();
    let solde = 0;
    let totalRevenus = 0;
    let totalDepenses = 0;

    list.forEach(t => {
        if (t.type === "revenu") {
            solde += t.montant;
            totalRevenus += t.montant;
        } else {
            solde -= t.montant;
            totalDepenses += t.montant;
        }
    });

    const soldeEl = document.getElementById("soldeDisplay");
    soldeEl.textContent = solde.toFixed(2) + " €";
    soldeEl.style.color = solde >= 0 ? "#4caf50" : "#ff6b6b";

    document.getElementById("totalRevenus").textContent = totalRevenus.toFixed(2) + " €";
    document.getElementById("totalDepenses").textContent = totalDepenses.toFixed(2) + " €";
}

// --- AFFICHAGE TRANSACTIONS ---
function renderTransactions() {
    const container = document.getElementById("transactionsList");
    container.innerHTML = "";

    const list = getMonthTransactions();

    if (list.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:#666;">
                <div style="font-size:48px; margin-bottom:10px;">📭</div>
                <p>Aucune transaction ce mois-ci</p>
            </div>
        `;
        return;
    }

    // Trier par date (plus récent en premier)
    list.sort((a, b) => new Date(b.date) - new Date(a.date));

    list.forEach((t, index) => {
        const card = document.createElement("div");
        card.className = "transaction-card-premium";
        card.setAttribute("data-id", index);

        const icon = categoryIcons[t.categorie] || "💸";
        const typeClass = t.type === "revenu" ? "revenu" : "depense";

        card.innerHTML = `
            <div class="transaction-main">
                <div class="transaction-icon">${icon}</div>
                <div class="transaction-info">
                    <div class="transaction-category">${t.categorie}</div>
                    <div class="transaction-desc">${t.description || "—"}</div>
                    <div class="transaction-date">${formatDate(t.date)}</div>
                </div>
                <div class="transaction-amount ${typeClass}">
                    ${t.type === "revenu" ? "+" : "-"}${t.montant.toFixed(2)} €
                </div>
            </div>
            <button class="transaction-delete" data-index="${index}">🗑️</button>
        `;

        container.appendChild(card);
    });

    // Activer suppression
    document.querySelectorAll(".transaction-delete").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = parseInt(btn.getAttribute("data-index"));
            deleteTransaction(id);
        });
    });
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
}

function deleteTransaction(index) {
    if (!confirm("Supprimer cette transaction ?")) return;

    const monthData = finances[currentYear][formatMonth(currentMonth)];
    monthData.transactions.splice(index, 1);

    saveFinances(finances);
    renderTransactions();
    updateSolde();
    updateCharts();
}

// --- GRAPHIQUES ---
let donutChart, barChart;

function updateCharts() {
    const list = getMonthTransactions();

    // Donut : répartition par catégories (dépenses uniquement)
    const categories = {};
    list.forEach(t => {
        if (t.type === "depense") {
            categories[t.categorie] = (categories[t.categorie] || 0) + t.montant;
        }
    });

    const donutData = {
        labels: Object.keys(categories).map(cat => (categoryIcons[cat] || "💸") + " " + cat),
        datasets: [{
            data: Object.values(categories),
            backgroundColor: [
                "#d4af37", "#ff7043", "#42a5f5", "#66bb6a", 
                "#ab47bc", "#ffa726", "#ec407a", "#26a69a"
            ],
            borderWidth: 0
        }]
    };

    if (donutChart) donutChart.destroy();
    donutChart = new Chart(document.getElementById("donutChart"), {
        type: "doughnut",
        data: donutData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ddd',
                        font: { size: 11 },
                        padding: 12
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    titleColor: '#d4af37',
                    bodyColor: '#fff',
                    padding: 12,
                    callbacks: {
                        label: (context) => {
                            return context.label + ": " + context.parsed.toFixed(2) + " €";
                        }
                    }
                }
            }
        }
    });

    // Bar chart : dépenses et revenus par jour
    const daily = {};
    list.forEach(t => {
        if (!daily[t.date]) {
            daily[t.date] = { revenus: 0, depenses: 0 };
        }
        if (t.type === "revenu") {
            daily[t.date].revenus += t.montant;
        } else {
            daily[t.date].depenses += t.montant;
        }
    });

    const dates = Object.keys(daily).sort();

    const barData = {
        labels: dates.map(d => {
            const date = new Date(d);
            return date.getDate() + "/" + (date.getMonth() + 1);
        }),
        datasets: [
            {
                label: "Revenus",
                data: dates.map(d => daily[d].revenus),
                backgroundColor: "rgba(76,175,80,0.7)",
                borderColor: "#4caf50",
                borderWidth: 2
            },
            {
                label: "Dépenses",
                data: dates.map(d => daily[d].depenses),
                backgroundColor: "rgba(255,107,107,0.7)",
                borderColor: "#ff6b6b",
                borderWidth: 2
            }
        ]
    };

    if (barChart) barChart.destroy();
    barChart = new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: barData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#ddd',
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    titleColor: '#d4af37',
                    bodyColor: '#fff',
                    padding: 12
                }
            },
            scales: {
                x: {
                    ticks: { color: "#aaa", font: { size: 10 } },
                    grid: { color: "rgba(255,255,255,0.05)" }
                },
                y: {
                    ticks: { color: "#aaa", font: { size: 11 } },
                    grid: { color: "rgba(255,255,255,0.05)" }
                }
            }
        }
    });
}

// --- POPUP AJOUT ---
document.getElementById("openAddPopup").onclick = () => {
    document.getElementById("popupAdd").style.display = "flex";
    
    // Date par défaut = aujourd'hui
    const today = new Date();
    const dateStr = today.getFullYear() + "-" + 
                   String(today.getMonth() + 1).padStart(2, '0') + "-" + 
                   String(today.getDate()).padStart(2, '0');
    document.getElementById("dateInput").value = dateStr;
    
    // Reset
    selectedCategory = null;
    renderCategories();
};

document.getElementById("closeAddPopup").onclick = () => {
    document.getElementById("popupAdd").style.display = "none";
};

// Toggle type (dépense/revenu)
document.querySelectorAll(".type-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedType = btn.getAttribute("data-type");
        selectedCategory = null;
        renderCategories();
    });
});

// Render catégories selon le type
function renderCategories() {
    const grid = document.getElementById("categoriesGrid");
    grid.innerHTML = "";

    const cats = selectedType === "depense" ? categoriesDepenses : categoriesRevenus;

    cats.forEach(cat => {
        const btn = document.createElement("button");
        btn.className = "category-btn";
        if (selectedCategory === cat.name) {
            btn.classList.add("selected");
        }
        btn.innerHTML = `
            <span class="category-icon">${cat.icon}</span>
            <span class="category-name">${cat.name}</span>
        `;
        btn.addEventListener("click", () => {
            selectedCategory = cat.name;
            renderCategories();
        });
        grid.appendChild(btn);
    });
}

// Enregistrer transaction
document.getElementById("saveTransaction").onclick = () => {
    const montant = parseFloat(document.getElementById("amountInput").value);
    const desc = document.getElementById("descInput").value;
    const date = document.getElementById("dateInput").value;

    if (!montant || montant <= 0) {
        alert("❌ Entre un montant valide.");
        return;
    }

    if (!selectedCategory) {
        alert("❌ Sélectionne une catégorie.");
        return;
    }

    if (!date) {
        alert("❌ Sélectionne une date.");
        return;
    }

    // Créer structure si nécessaire
    if (!finances[currentYear]) finances[currentYear] = {};
    if (!finances[currentYear][formatMonth(currentMonth)])
        finances[currentYear][formatMonth(currentMonth)] = { transactions: [] };

    finances[currentYear][formatMonth(currentMonth)].transactions.push({
        montant,
        type: selectedType,
        categorie: selectedCategory,
        description: desc,
        date
    });

    saveFinances(finances);

    document.getElementById("popupAdd").style.display = "none";

    // Reset form
    document.getElementById("amountInput").value = "";
    document.getElementById("descInput").value = "";
    selectedCategory = null;

    updateSolde();
    renderTransactions();
    updateCharts();
};

// --- NAVIGATION MOIS ---
document.getElementById("prevMonth").onclick = () => {
    currentMonth--;
    if (currentMonth === 0) {
        currentMonth = 12;
        currentYear--;
    }
    updatePeriodDisplay();
    updateSolde();
    renderTransactions();
    updateCharts();
};

document.getElementById("nextMonth").onclick = () => {
    currentMonth++;
    if (currentMonth === 13) {
        currentMonth = 1;
        currentYear++;
    }
    updatePeriodDisplay();
    updateSolde();
    renderTransactions();
    updateCharts();
};

// --- INITIALISATION ---
renderCategories();
updatePeriodDisplay();
updateSolde();
renderTransactions();
updateCharts();
