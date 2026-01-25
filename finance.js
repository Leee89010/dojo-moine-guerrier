// --- STRUCTURE LOCALSTORAGE ---
function getFinances() {
    return JSON.parse(localStorage.getItem("finances")) || {};
}

function saveFinances(data) {
    localStorage.setItem("finances", JSON.stringify(data));
}
// --- CATÉGORIES PAR DÉFAUT ---
let defaultCategories = [
    "Loyer",
    "Courses",
    "Électricité",
    "Internet",
    "Téléphone",
    "Essence",
    "Transport",
    "Resto",
    "Fast-food",
    "Cinéma",
    "Sorties",
    "Ubereats",
    "Shopping",
    "Santé",
    "Abonnements",
    "Autres"
];
function populateCategories() {
    const select = document.getElementById("categoryInput");
    select.innerHTML = "";

    defaultCategories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

// --- VARIABLES ---
let finances = getFinances();
let currentDate = new Date();
let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth() + 1;

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

// --- CALCUL SOLDE ---
function updateSolde() {
    const list = getMonthTransactions();
    let solde = 0;

    list.forEach(t => {
        solde += t.type === "revenu" ? t.montant : -t.montant;
    });

    const el = document.getElementById("soldeDisplay");
    el.textContent = "Solde : " + solde.toFixed(2) + " €";
    el.style.color = solde >= 0 ? "#4caf50" : "#e53935";
}

// --- AFFICHAGE TRANSACTIONS ---
function renderTransactions() {
    const container = document.getElementById("transactionsList");
    container.innerHTML = "";

    const list = getMonthTransactions();

    list.forEach(t => {
        const card = document.createElement("div");
        card.className = "transaction-card";

        card.innerHTML = `
            <div class="amount ${t.type === "revenu" ? "positive" : "negative"}">
                ${t.type === "revenu" ? "+" : "-"}${t.montant} €
            </div>
            <div class="desc">${t.categorie} — ${t.description || ""}</div>
            <div class="desc">${t.date}</div>
        `;

        container.appendChild(card);
    });
}

// --- GRAPHIQUES ---
let donutChart, barChart;

function updateCharts() {
    const list = getMonthTransactions();

    // Donut : répartition par catégories
    const categories = {};
    list.forEach(t => {
        if (t.type === "depense") {
            categories[t.categorie] = (categories[t.categorie] || 0) + t.montant;
        }
    });

    const donutData = {
        labels: Object.keys(categories),
        datasets: [{
            data: Object.values(categories),
            backgroundColor: ["#d4af37","#ff7043","#42a5f5","#66bb6a","#ab47bc","#ffa726"]
        }]
    };

    if (donutChart) donutChart.destroy();
    donutChart = new Chart(document.getElementById("donutChart"), {
        type: "doughnut",
        data: donutData
    });

    // Bar chart : dépenses par jour
    const daily = {};
    list.forEach(t => {
        if (t.type === "depense") {
            daily[t.date] = (daily[t.date] || 0) + t.montant;
        }
    });

    const barData = {
        labels: Object.keys(daily),
        datasets: [{
            label: "Dépenses",
            data: Object.values(daily),
            backgroundColor: "#d4af37"
        }]
    };

    if (barChart) barChart.destroy();
    barChart = new Chart(document.getElementById("barChart"), {
        type: "bar",
        data: barData
    });
}

// --- AJOUT TRANSACTION ---
document.getElementById("openAddPopup").onclick = () => {
    document.getElementById("popupAdd").style.display = "flex";
};

document.getElementById("closeAddPopup").onclick = () => {
    document.getElementById("popupAdd").style.display = "none";
};

document.getElementById("saveTransaction").onclick = () => {
    const montant = parseFloat(document.getElementById("amountInput").value);
    const type = document.getElementById("typeInput").value;
    const categorie = document.getElementById("categoryInput").value;
    const desc = document.getElementById("descInput").value;
    const date = document.getElementById("dateInput").value;

    if (!montant || !date) {
        alert("Montant et date obligatoires.");
        return;
    }

    if (!finances[currentYear]) finances[currentYear] = {};
    if (!finances[currentYear][formatMonth(currentMonth)])
        finances[currentYear][formatMonth(currentMonth)] = { transactions: [] };

    finances[currentYear][formatMonth(currentMonth)].transactions.push({
        montant,
        type,
        categorie,
        description: desc,
        date
    });

    saveFinances(finances);

    document.getElementById("popupAdd").style.display = "none";

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

// --- INIT ---
populateCategories();
updatePeriodDisplay();
updateSolde();
renderTransactions();
updateCharts();
