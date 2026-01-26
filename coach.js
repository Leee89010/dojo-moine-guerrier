// ============================================================
// COACH IA - LOGIQUE COMPLÈTE
// ============================================================

// --- UTILITAIRES ---
function getJSON(key, def) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : def;
    } catch {
        return def;
    }
}

function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- RÉCUPÉRATION DES DONNÉES UTILISATEUR ---
function getUserData() {
    const key = todayKey();
    const corps = getJSON("corps", {});
    const discipline = getJSON("discipline", {});
    const seances = getJSON("seances", {});
    const historique = getJSON("historiquePoids", []);
    const xp = parseInt(localStorage.getItem("xp") || "0", 10);
    
    // Calculer série (streak)
    let streak = 0;
    const xpGained = getJSON("xpGained", {});
    const dates = Object.keys(xpGained).sort().reverse();
    for (let date of dates) {
        if (xpGained[date]) {
            streak++;
        } else {
            break;
        }
    }
    
    return {
        aujourdhui: {
            poids: corps[key]?.poids || null,
            stress: corps[key]?.stress || null,
            sommeil: corps[key]?.sommeil || null,
            discipline: discipline[key]?.score || 0,
            seance: seances[key]?.type || null,
            duree: seances[key]?.duree || null
        },
        global: {
            xp,
            streak,
            historique: historique.slice(-7) // 7 derniers jours
        }
    };
}

// --- AFFICHAGE DES MÉTRIQUES ---
function renderMetrics() {
    const data = getUserData();
    const grid = document.getElementById("metricsGrid");
    
    const metrics = [
        { 
            icon: "😰", 
            label: "Stress", 
            value: data.aujourdhui.stress !== null ? data.aujourdhui.stress + "/10" : "—",
            color: data.aujourdhui.stress >= 7 ? "#ff6b6b" : (data.aujourdhui.stress >= 4 ? "#ffa726" : "#4caf50")
        },
        { 
            icon: "😴", 
            label: "Sommeil", 
            value: data.aujourdhui.sommeil !== null ? data.aujourdhui.sommeil + "/10" : "—",
            color: data.aujourdhui.sommeil >= 7 ? "#4caf50" : (data.aujourdhui.sommeil < 5 ? "#ff6b6b" : "#ffa726")
        },
        { 
            icon: "🛡️", 
            label: "Discipline", 
            value: data.aujourdhui.discipline + "/5",
            color: "#d4af37"
        },
        { 
            icon: "🔥", 
            label: "Série", 
            value: data.global.streak + " jours",
            color: "#d4af37"
        }
    ];
    
    grid.innerHTML = metrics.map(m => `
        <div class="metric-item">
            <div class="metric-icon">${m.icon}</div>
            <div class="metric-label">${m.label}</div>
            <div class="metric-value" style="color: ${m.color}">${m.value}</div>
        </div>
    `).join('');
    
    // Update greeting
    updateGreeting(data);
}

function updateGreeting(data) {
    const hour = new Date().getHours();
    let greeting = "Bienvenue, Guerrier";
    
    if (hour < 12) greeting = "Bonjour, Guerrier";
    else if (hour < 18) greeting = "Bon après-midi, Guerrier";
    else greeting = "Bonsoir, Guerrier";
    
    document.getElementById("coachGreeting").textContent = greeting;
    
    let status = "Prêt à t'accompagner aujourd'hui";
    if (data.global.streak > 0) {
        status = `🔥 Série de ${data.global.streak} jours ! Continue !`;
    }
    document.getElementById("coachStatus").textContent = status;
}

// --- APPEL API CLAUDE ---
async function callClaudeAPI(systemPrompt, userMessage) {
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                system: systemPrompt,
                messages: [
                    { role: "user", content: userMessage }
                ],
            })
        });

        const data = await response.json();
        
        if (data.content && data.content[0]) {
            return data.content[0].text;
        } else {
            throw new Error("Réponse invalide de l'API");
        }
    } catch (error) {
        console.error("Erreur API:", error);
        return "Désolé, je n'ai pas pu me connecter. Vérifie ta connexion et réessaie.";
    }
}

// --- CONSEIL DU JOUR ---
document.getElementById("btnAnalyze").addEventListener("click", async () => {
    const btn = document.getElementById("btnAnalyze");
    const card = document.getElementById("iaResponseCard");
    const response = document.getElementById("iaResponse");
    const typing = document.getElementById("iaTyping");
    
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span><span>Analyse en cours...</span>';
    
    card.style.display = "block";
    typing.style.display = "block";
    response.innerHTML = "";
    
    const data = getUserData();
    
    const systemPrompt = `Tu es le Sage du Dojo, un coach spirituel, mental et physique.

Tu dois analyser l'état du guerrier et lui donner :
1. Une citation inspirante adaptée à sa situation
2. Un conseil concret et actionnable
3. Un encouragement ou recadrage si nécessaire

Règles :
- Maximum 150 mots
- Ton direct et empathique
- Utilise des emojis avec parcimonie
- Sois honnête mais bienveillant
- Formate avec des retours à la ligne pour la lisibilité`;

    const userMessage = `État actuel :
- Stress : ${data.aujourdhui.stress !== null ? data.aujourdhui.stress + "/10" : "non renseigné"}
- Sommeil : ${data.aujourdhui.sommeil !== null ? data.aujourdhui.sommeil + "/10" : "non renseigné"}
- Discipline : ${data.aujourdhui.discipline}/5
- Série : ${data.global.streak} jours d'affilée
- XP : ${data.global.xp}
- Séance aujourd'hui : ${data.aujourdhui.seance || "aucune"}

Donne-moi ton analyse, une citation pertinente, et un conseil actionnable.`;

    const iaResponse = await callClaudeAPI(systemPrompt, userMessage);
    
    typing.style.display = "none";
    
    // Animation d'écriture
    let i = 0;
    const typeWriter = () => {
        if (i < iaResponse.length) {
            response.innerHTML += iaResponse.charAt(i);
            i++;
            setTimeout(typeWriter, 10);
        }
    };
    typeWriter();
    
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">✨</span><span>Demander un autre conseil</span>';
    
    // Sauvegarder
    const history = getJSON("coachHistory", []);
    history.unshift({
        date: new Date().toISOString(),
        type: "conseil",
        question: userMessage,
        response: iaResponse
    });
    setJSON("coachHistory", history.slice(0, 50)); // Garder 50 derniers
});

// --- JOURNAL IA ---
document.getElementById("btnJournal").addEventListener("click", async () => {
    const input = document.getElementById("journalInput");
    const text = input.value.trim();
    
    if (!text) {
        alert("❌ Écris quelque chose dans ton journal d'abord !");
        return;
    }
    
    const btn = document.getElementById("btnJournal");
    const card = document.getElementById("iaJournalCard");
    const response = document.getElementById("iaJournalResponse");
    const typing = document.getElementById("iaJournalTyping");
    
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span><span>Analyse en cours...</span>';
    
    card.style.display = "block";
    typing.style.display = "block";
    response.innerHTML = "";
    
    const data = getUserData();
    
    const systemPrompt = `Tu es un coach en développement personnel et psychologue bienveillant.

Tu dois :
1. Identifier les émotions exprimées
2. Poser 2-3 questions de réflexion pertinentes
3. Donner 1 conseil actionnable concret
4. Détecter les patterns négatifs s'il y en a

Règles :
- Maximum 200 mots
- Ton empathique et non-jugeant
- Questions ouvertes qui font réfléchir
- Conseil précis et applicable immédiatement`;

    const userMessage = `Voici l'entrée de journal du guerrier :

"${text}"

Contexte de sa journée :
- Stress : ${data.aujourdhui.stress !== null ? data.aujourdhui.stress + "/10" : "non renseigné"}
- Sommeil : ${data.aujourdhui.sommeil !== null ? data.aujourdhui.sommeil + "/10" : "non renseigné"}
- Discipline : ${data.aujourdhui.discipline}/5

Analyse son journal et aide-le à structurer ses pensées.`;

    const iaResponse = await callClaudeAPI(systemPrompt, userMessage);
    
    typing.style.display = "none";
    
    // Animation d'écriture
    let i = 0;
    const typeWriter = () => {
        if (i < iaResponse.length) {
            response.innerHTML += iaResponse.charAt(i);
            i++;
            setTimeout(typeWriter, 10);
        }
    };
    typeWriter();
    
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">🧠</span><span>Analyser une autre entrée</span>';
    
    // Sauvegarder dans historique journal
    const journals = getJSON("journals", []);
    journals.unshift({
        date: new Date().toISOString(),
        entry: text,
        analysis: iaResponse
    });
    setJSON("journals", journals.slice(0, 30));
    
    // Clear input
    input.value = "";
    
    // Refresh history
    renderJournalHistory();
});

function renderJournalHistory() {
    const journals = getJSON("journals", []);
    const container = document.getElementById("journalHistory");
    
    if (journals.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666;">Aucune entrée pour l\'instant</p>';
        return;
    }
    
    container.innerHTML = journals.slice(0, 5).map((j, i) => {
        const date = new Date(j.date);
        return `
            <div class="journal-entry">
                <div class="entry-date">${date.toLocaleDateString('fr-FR')}</div>
                <div class="entry-text">${j.entry.substring(0, 100)}${j.entry.length > 100 ? '...' : ''}</div>
                <button class="entry-view" onclick="viewJournalEntry(${i})">Voir l'analyse</button>
            </div>
        `;
    }).join('');
}

window.viewJournalEntry = (index) => {
    const journals = getJSON("journals", []);
    const entry = journals[index];
    
    if (!entry) return;
    
    const card = document.getElementById("iaJournalCard");
    const response = document.getElementById("iaJournalResponse");
    const typing = document.getElementById("iaJournalTyping");
    
    card.style.display = "block";
    typing.style.display = "none";
    
    response.innerHTML = `
        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; margin-bottom: 15px;">
            <strong>Ta note :</strong><br>${entry.entry}
        </div>
        <strong>Analyse :</strong><br>${entry.analysis}
    `;
    
    // Scroll to card
    card.scrollIntoView({ behavior: 'smooth' });
};

// --- OBJECTIFS ---
document.getElementById("btnCreateObjectif").addEventListener("click", async () => {
    const input = document.getElementById("objectifInput");
    const objectif = input.value.trim();
    
    if (!objectif) {
        alert("❌ Décris ton objectif d'abord !");
        return;
    }
    
    const btn = document.getElementById("btnCreateObjectif");
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span><span>Création du plan...</span>';
    
    const data = getUserData();
    
    const systemPrompt = `Tu es un coach expert en définition d'objectifs et planification.

Tu dois créer un plan d'action SMART pour l'objectif donné.

Format de réponse STRICT (JSON) :
{
  "titre": "titre court de l'objectif",
  "description": "reformulation claire",
  "duree_estimee": "durée en mois",
  "etapes": [
    {"titre": "Étape 1", "description": "action concrète", "delai": "semaine 1-2"},
    {"titre": "Étape 2", "description": "action concrète", "delai": "semaine 3-4"}
  ],
  "conseils": ["conseil 1", "conseil 2", "conseil 3"],
  "metriques": ["métrique à suivre 1", "métrique 2"]
}

IMPORTANT : Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

    const userMessage = `Objectif : ${objectif}

Contexte actuel :
- Poids : ${data.aujourdhui.poids || "non renseigné"}
- Discipline : ${data.aujourdhui.discipline}/5
- Série : ${data.global.streak} jours
- XP : ${data.global.xp}

Crée un plan d'action détaillé en JSON.`;

    const iaResponse = await callClaudeAPI(systemPrompt, userMessage);
    
    try {
        // Nettoyer la réponse (enlever markdown si présent)
        let cleanResponse = iaResponse.trim();
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```\n?/g, '').trim();
        }
        
        const plan = JSON.parse(cleanResponse);
        
        // Sauvegarder
        const objectifs = getJSON("objectifs", []);
        objectifs.unshift({
            id: Date.now(),
            dateCreation: new Date().toISOString(),
            statut: "en_cours",
            progression: 0,
            ...plan
        });
        setJSON("objectifs", objectifs);
        
        input.value = "";
        renderObjectifs();
        
        alert("✅ Objectif créé ! Scroll vers le bas pour voir ton plan.");
        
    } catch (error) {
        console.error("Erreur parsing JSON:", error);
        alert("❌ Erreur lors de la création du plan. Réessaie avec un objectif plus clair.");
    }
    
    btn.disabled = false;
    btn.innerHTML = '<span class="btn-icon">🚀</span><span>Créer le plan avec l\'IA</span>';
});

function renderObjectifs() {
    const objectifs = getJSON("objectifs", []);
    const container = document.getElementById("objectifsList");
    
    if (objectifs.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#666; padding: 40px;">Aucun objectif défini. Crée-en un ci-dessus ! 🎯</p>';
        return;
    }
    
    container.innerHTML = objectifs.map((obj, index) => `
        <div class="objectif-card">
            <div class="objectif-header">
                <h3 class="objectif-titre">${obj.titre}</h3>
                <button class="objectif-delete" onclick="deleteObjectif(${index})">🗑️</button>
            </div>
            <p class="objectif-description">${obj.description}</p>
            <div class="objectif-meta">
                <span>⏱️ ${obj.duree_estimee}</span>
                <span>📊 ${obj.progression}% complété</span>
            </div>
            <div class="objectif-progress">
                <div class="objectif-progress-bar" style="width: ${obj.progression}%"></div>
            </div>
            <details class="objectif-details">
                <summary>Voir le plan détaillé</summary>
                <div class="objectif-plan">
                    <h4>📋 Étapes :</h4>
                    ${obj.etapes.map(e => `
                        <div class="etape-item">
                            <strong>${e.titre}</strong> (${e.delai})<br>
                            ${e.description}
                        </div>
                    `).join('')}
                    
                    <h4>💡 Conseils :</h4>
                    <ul>
                        ${obj.conseils.map(c => `<li>${c}</li>`).join('')}
                    </ul>
                    
                    <h4>📈 Métriques à suivre :</h4>
                    <ul>
                        ${obj.metriques.map(m => `<li>${m}</li>`).join('')}
                    </ul>
                </div>
            </details>
            <div class="objectif-actions">
                <button class="btn-update-progress" onclick="updateProgress(${index})">📊 Mettre à jour progression</button>
            </div>
        </div>
    `).join('');
}

window.deleteObjectif = (index) => {
    if (!confirm("Supprimer cet objectif ?")) return;
    const objectifs = getJSON("objectifs", []);
    objectifs.splice(index, 1);
    setJSON("objectifs", objectifs);
    renderObjectifs();
};

window.updateProgress = (index) => {
    const newProgress = prompt("Entre la nouvelle progression (0-100) :");
    if (newProgress === null) return;
    
    const prog = parseInt(newProgress);
    if (isNaN(prog) || prog < 0 || prog > 100) {
        alert("❌ Entre un nombre entre 0 et 100");
        return;
    }
    
    const objectifs = getJSON("objectifs", []);
    objectifs[index].progression = prog;
    
    if (prog === 100) {
        objectifs[index].statut = "termine";
        alert("🎉 Félicitations ! Objectif atteint !");
    }
    
    setJSON("objectifs", objectifs);
    renderObjectifs();
};

// --- ONGLETS ---
document.querySelectorAll(".coach-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        const tabName = tab.getAttribute("data-tab");
        
        document.querySelectorAll(".coach-tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".coach-tab-content").forEach(c => c.classList.remove("active"));
        
        tab.classList.add("active");
        document.getElementById("tab-" + tabName).classList.add("active");
    });
});

// --- INIT ---
renderMetrics();
renderJournalHistory();
renderObjectifs();
