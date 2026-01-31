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

// --- IA SIMULÉE (VERSION OFFLINE) ---
async function callClaudeAPI(systemPrompt, userMessage) {
    // Simulation d'un délai réseau pour effet réaliste
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const data = getUserData();
    
    // Analyser le contexte pour générer une réponse pertinente
    if (systemPrompt.includes("coach spirituel")) {
        return generateConseilDuJour(data);
    } else if (systemPrompt.includes("développement personnel")) {
        return generateJournalAnalysis(userMessage, data);
    } else if (systemPrompt.includes("objectifs")) {
        return generateObjectifPlan(userMessage, data);
    }
    
    return "Désolé, je n'ai pas compris la demande.";
}

// --- GÉNÉRATEUR DE CONSEILS DU JOUR ---
function generateConseilDuJour(data) {
    const stress = data.aujourdhui.stress || 5;
    const sommeil = data.aujourdhui.sommeil || 7;
    const discipline = data.aujourdhui.discipline || 0;
    const streak = data.global.streak || 0;
    
    let citation = "";
    let conseil = "";
    let intro = "";
    
    // Analyse du stress
    if (stress >= 8) {
        intro = "Guerrier, ton stress est très élevé. 🛡️\n\n";
        citation = "💭 Citation : 'Dans le calme se trouve la force. Dans le repos, la victoire.'\n\n";
        conseil = "🎯 Conseil : STOP. Aujourd'hui est un jour de repos obligatoire.\n\n";
        conseil += "• Prends un bain chaud ou une douche froide\n";
        conseil += "• Respiration 4-7-8 : inspire 4s, retiens 7s, expire 8s (5 fois)\n";
        conseil += "• Couche-toi avant 22h\n";
        conseil += "• Pas de sport intense, juste une marche de 20min\n\n";
        conseil += "Ta série de " + streak + " jours peut survivre à un jour de récupération intelligente. Le repos fait partie de l'entraînement. 💪";
    } else if (stress >= 6) {
        intro = "Je détecte un stress modéré-élevé. ⚠️\n\n";
        citation = "💭 Citation : 'La tempête ne peut ébranler la montagne.'\n\n";
        conseil = "🎯 Conseil : Séance légère aujourd'hui.\n\n";
        conseil += "• Yoga ou mobilité (30min max)\n";
        conseil += "• 3 pauses respiration dans la journée\n";
        conseil += "• Limite le café après 14h\n";
        conseil += "• Identifie la source du stress et note-la\n\n";
        if (discipline >= 3) {
            conseil += "Ta discipline est bonne (" + discipline + "/5), mais écoute ton corps. Pas besoin d'être parfait tous les jours.";
        }
    } else if (stress >= 3) {
        intro = "État émotionnel stable. 😌\n\n";
        citation = "💭 Citation : 'L'équilibre est la clé de la longévité.'\n\n";
        conseil = "🎯 Conseil : Journée normale, maintiens le cap.\n\n";
        conseil += "• Séance standard selon ton programme\n";
        conseil += "• Continue tes habitudes de discipline\n";
        conseil += "• Profite pour avancer sur ta tâche du jour\n\n";
        if (streak > 7) {
            conseil += "🔥 " + streak + " jours d'affilée ! Tu construis quelque chose de solide. Continue.";
        }
    } else {
        intro = "Tu es dans un état optimal ! 🔥\n\n";
        citation = "💭 Citation : 'Le momentum est ton allié le plus puissant.'\n\n";
        conseil = "🎯 Conseil : PROFITE DE CET ÉLAN !\n\n";
        conseil += "• Séance INTENSE aujourd'hui (tu es prêt)\n";
        conseil += "• Pousse tes limites en toute sécurité\n";
        conseil += "• C'est maintenant qu'on progresse vraiment\n";
        conseil += "• Fixe-toi un nouveau record personnel\n\n";
        conseil += "Les jours comme aujourd'hui sont précieux. Ils compensent les jours difficiles. Va chercher la victoire ! 💪";
    }
    
    // Analyse du sommeil
    if (sommeil <= 4) {
        conseil += "\n\n⚠️ Attention : Sommeil critique (" + sommeil + "/10). Même si tu te sens bien, ton corps a besoin de récup. Priorise 8h de sommeil cette nuit.";
    } else if (sommeil >= 8) {
        conseil += "\n\n✅ Excellent sommeil (" + sommeil + "/10) ! Ton corps est rechargé.";
    }
    
    return intro + citation + conseil;
}

// --- GÉNÉRATEUR D'ANALYSE JOURNAL ---
function generateJournalAnalysis(journalText, data) {
    const text = journalText.toLowerCase();
    
    let emotions = [];
    let questions = [];
    let conseil = "";
    
    // Détection d'émotions
    if (text.includes("stress") || text.includes("stressé") || text.includes("anxieux")) {
        emotions.push("stress");
    }
    if (text.includes("fatigué") || text.includes("épuisé") || text.includes("crevé")) {
        emotions.push("fatigue");
    }
    if (text.includes("coupable") || text.includes("honte") || text.includes("nul")) {
        emotions.push("culpabilité");
    }
    if (text.includes("content") || text.includes("heureux") || text.includes("fier")) {
        emotions.push("satisfaction");
    }
    if (text.includes("pas le temps") || text.includes("débordé") || text.includes("trop")) {
        emotions.push("surcharge");
    }
    
    let response = "🧠 **Analyse de ton journal :**\n\n";
    
    // Émotions détectées
    if (emotions.length > 0) {
        response += "**Émotions identifiées :** ";
        if (emotions.includes("stress")) response += "Stress, ";
        if (emotions.includes("fatigue")) response += "Fatigue, ";
        if (emotions.includes("culpabilité")) response += "Culpabilité, ";
        if (emotions.includes("satisfaction")) response += "Satisfaction, ";
        if (emotions.includes("surcharge")) response += "Surcharge mentale";
        response = response.replace(/,\s*$/, "");
        response += "\n\n";
    }
    
    // Questions de réflexion adaptées
    response += "**Questions de réflexion :**\n\n";
    
    if (emotions.includes("culpabilité")) {
        response += "1. Cette culpabilité est-elle justifiée ou auto-imposée ?\n";
        response += "2. Si ton meilleur ami vivait la même situation, que lui dirais-tu ?\n";
        response += "3. Qu'est-ce qui est EN TON POUVOIR de changer demain ?\n\n";
        conseil = "💡 **Conseil :** La culpabilité est rarement productive. Un jour 'raté' ne détruit pas des semaines d'efforts. ";
        conseil += "Identifie la CAUSE concrète (manque de temps ? énergie ? motivation ?) et ajuste demain. ";
        conseil += "L'échec fait partie du processus. Ce qui compte c'est de revenir.";
    } else if (emotions.includes("surcharge")) {
        response += "1. Quelle est la tâche la PLUS importante aujourd'hui ?\n";
        response += "2. Que peux-tu déléguer, reporter ou éliminer ?\n";
        response += "3. Où as-tu dit 'oui' alors que tu voulais dire 'non' ?\n\n";
        conseil = "💡 **Conseil :** Le sentiment de débordement vient souvent d'un manque de priorisation. ";
        conseil += "Fais UNE chose à la fois. Bloque 1h demain pour ta tâche prioritaire, sans distraction. ";
        conseil += "Apprends à dire non. Ton temps est ta ressource la plus précieuse.";
    } else if (emotions.includes("fatigue")) {
        response += "1. Depuis combien de jours es-tu fatigué ?\n";
        response += "2. Ton sommeil est-il de qualité ou juste suffisant en durée ?\n";
        response += "3. Que fait ton corps pour te dire de ralentir ?\n\n";
        conseil = "💡 **Conseil :** La fatigue est un signal, pas une faiblesse. ";
        conseil += "Si c'est ponctuel : repos aujourd'hui. Si c'est chronique : révise ton hygiène de vie (sommeil, nutrition, surmenage). ";
        conseil += "Parfois, avancer c'est savoir s'arrêter à temps.";
    } else {
        response += "1. Qu'est-ce qui s'est bien passé aujourd'hui, même petit ?\n";
        response += "2. Qu'aurais-tu fait différemment avec le recul ?\n";
        response += "3. Quelle action concrète peux-tu prendre demain pour améliorer ça ?\n\n";
        conseil = "💡 **Conseil :** Chaque journée est une donnée. ";
        conseil += "Les mauvais jours t'apprennent autant que les bons. ";
        conseil += "Note ce que tu ressens, mais concentre-toi sur ce que tu FERAS demain.";
    }
    
    response += conseil;
    
    return response;
}

// --- GÉNÉRATEUR DE PLAN D'OBJECTIF ---
function generateObjectifPlan(objectifText, data) {
    const text = objectifText.toLowerCase();
    
    // Détection du type d'objectif
    let type = "general";
    if (text.includes("kg") || text.includes("poids") || text.includes("maigrir") || text.includes("peser")) {
        type = "poids";
    } else if (text.includes("€") || text.includes("euro") || text.includes("économiser") || text.includes("épargn")) {
        type = "finance";
    } else if (text.includes("km") || text.includes("courir") || text.includes("course")) {
        type = "sport";
    }
    
    let plan = {
        titre: objectifText,
        description: "",
        duree_estimee: "",
        etapes: [],
        conseils: [],
        metriques: []
    };
    
    if (type === "poids") {
        // Extraction du poids cible
        const match = text.match(/(\d+)\s*kg/);
        const poidsActuel = data.aujourdhui.poids || 80;
        const poidsCible = match ? parseInt(match[1]) : 75;
        const diff = Math.abs(poidsActuel - poidsCible);
        const mois = Math.ceil(diff / 2); // Perte saine : 2kg/mois
        
        plan.titre = "Atteindre " + poidsCible + "kg";
        plan.description = "Objectif de transformation physique avec perte de poids saine et durable";
        plan.duree_estimee = mois + " mois";
        
        plan.etapes = [
            {
                titre: "Phase 1 : Fondations",
                description: "Établir de bonnes habitudes alimentaires et routine sport",
                delai: "Semaines 1-4"
            },
            {
                titre: "Phase 2 : Accélération",
                description: "Intensifier les séances et optimiser la nutrition",
                delai: "Mois 2-3"
            },
            {
                titre: "Phase 3 : Stabilisation",
                description: "Maintenir le nouveau poids et sculpter",
                delai: "Dernier mois"
            }
        ];
        
        plan.conseils = [
            "3-4 séances de sport par semaine minimum",
            "Déficit calorique modéré (300-500 kcal/jour)",
            "Sommeil 7-8h obligatoire pour la récupération",
            "Hydratation 2-3L par jour",
            "Pesée 1x par semaine (même jour, même heure)",
            "Photos avant/après tous les 15 jours"
        ];
        
        plan.metriques = [
            "Poids (1x/semaine)",
            "Tour de taille",
            "Énergie quotidienne (/10)",
            "Nombre de séances par semaine"
        ];
    } else if (type === "finance") {
        const match = text.match(/(\d+)\s*€/);
        const montant = match ? parseInt(match[1]) : 1000;
        const mois = Math.ceil(montant / 200); // Épargne ~200€/mois
        
        plan.titre = "Économiser " + montant + "€";
        plan.description = "Objectif d'épargne avec discipline budgétaire";
        plan.duree_estimee = mois + " mois";
        
        plan.etapes = [
            {
                titre: "Audit financier",
                description: "Analyser toutes les dépenses du mois dernier",
                delai: "Semaine 1"
            },
            {
                titre: "Élimination des fuites",
                description: "Supprimer les dépenses inutiles (abonnements non utilisés, etc.)",
                delai: "Semaine 2-3"
            },
            {
                titre: "Épargne automatique",
                description: "Virer X€ au début du mois sur compte épargne",
                delai: "Dès le mois 1"
            }
        ];
        
        plan.conseils = [
            "Règle des 50/30/20 : 50% besoins, 30% envies, 20% épargne",
            "Cuisiner maison (économie 200-300€/mois vs resto)",
            "Challenge 'no spend' : 1 semaine par mois sans achats non-essentiels",
            "Tracker TOUTES les dépenses dans l'app Finance"
        ];
        
        plan.metriques = [
            "Solde compte épargne",
            "Dépenses mensuelles totales",
            "Nombre de jours sans achat impulsif",
            "% d'épargne du salaire"
        ];
    } else if (type === "sport") {
        plan.titre = objectifText;
        plan.description = "Objectif de performance sportive";
        plan.duree_estimee = "3-4 mois";
        
        plan.etapes = [
            {
                titre: "Développement de l'endurance de base",
                description: "Augmenter progressivement la distance/durée",
                delai: "Mois 1-2"
            },
            {
                titre: "Amélioration de la vitesse",
                description: "Intégrer des intervalles et sprints",
                delai: "Mois 3"
            },
            {
                titre: "Test et ajustements finaux",
                description: "Simulations et récupération avant l'objectif",
                delai: "Mois 4"
            }
        ];
        
        plan.conseils = [
            "Augmentation progressive : +10% max par semaine",
            "Jours de repos obligatoires (2-3 par semaine)",
            "Échauffement et étirements systématiques",
            "Écouter son corps : douleur = stop"
        ];
        
        plan.metriques = [
            "Distance parcourue",
            "Temps/vitesse moyenne",
            "Fréquence cardiaque au repos",
            "Ressenti de difficulté (/10)"
        ];
    } else {
        // Objectif général
        plan.titre = objectifText;
        plan.description = "Objectif personnel nécessitant discipline et régularité";
        plan.duree_estimee = "2-3 mois";
        
        plan.etapes = [
            {
                titre: "Définition précise",
                description: "Clarifier exactement ce que tu veux atteindre",
                delai: "Semaine 1"
            },
            {
                titre: "Action quotidienne",
                description: "Mettre en place une routine quotidienne de 15-30min",
                delai: "Semaines 2-8"
            },
            {
                titre: "Évaluation et ajustement",
                description: "Mesurer les progrès et adapter la stratégie",
                delai: "Mois 2-3"
            }
        ];
        
        plan.conseils = [
            "Commence petit mais tous les jours",
            "Track tes progrès visuellement",
            "Trouve un accountability partner",
            "Célèbre les petites victoires"
        ];
        
        plan.metriques = [
            "Nombre de jours consécutifs",
            "Temps investi par semaine",
            "Progression subjective (/10)"
        ];
    }
    
    return JSON.stringify(plan);
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
