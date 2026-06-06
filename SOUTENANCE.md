# 📋 Documentation Technique — Secured Event Tickets
## BAL EPI 2026 · Système de Contrôle d'Accès par QR Code
> Projet BTS SIO · Développeur : Dark Shadow

---

## 1. Vue d'ensemble du projet

### Problématique
Lors d'un événement d'envergure (BAL EPI), les systèmes de tickets papier posent trois problèmes :

| Problème | Risque |
|---|---|
| Fraude / falsification | Un ticket papier peut être photocopié |
| Lenteur au contrôle | Chercher un nom sur une liste crée des files d'attente |
| Aveuglement des organisateurs | Impossible de savoir en temps réel combien de personnes sont dans la salle |

### Solution
Un système de ticketing numérique, anonyme et temps réel, basé sur des **QR Codes uniques** et une double table MySQL. La supervision se fait depuis un **PC de contrôle**, et le scan depuis des **smartphones Android/iOS**.

---

## 2. Architecture du Projet

```
secured-event-tickets/
│
├── backend/                    # API PHP (serveur)
│   ├── Models/
│   │   └── Ticket.php          # Modèle : requêtes SQL (CRUD)
│   ├── enregistrer.php         # API : Activer un ticket (Guichet)
│   ├── verifier_ticket.php     # API : Valider une entrée (Porte)
│   ├── recuperer_stats.php     # API : Statistiques temps réel
│   └── lister_tickets.php      # API : Lister tous les tickets (QR)
│
├── config/
│   └── db.php                  # Connexion PDO à MySQL
│
├── database/
│   └── structure.sql           # Schéma + données de test
│
└── frontend/
    ├── css/
    │   └── dashboard.css       # Design system global (glassmorphism)
    ├── js/
    │   └── dashboard.js        # Logique JS centralisée (tous modules)
    └── view/
        ├── desktop/            # Interface de supervision (PC)
        │   ├── dashboard.html      → Page d'accueil / Console centrale
        │   ├── vue_stats.html      → Statistiques temps réel
        │   ├── generer_qr.html     → Génération + impression des QR codes
        │   ├── vente.html          → Tableau de suivi des ventes
        │   └── table_entree.html   → Tableau de suivi des entrées
        └── mobile/             # Interface agent (Smartphone)
            └── controle.html       → Scanner caméra (Guichet + Porte)
```

---

## 3. La Base de Données (2 tables)

### Schéma Relationnel

```sql
tickets_vente                    tickets_entree
─────────────────────────────    ────────────────────────────────
id_ticket   VARCHAR(50) PK  ──→  id_ticket   VARCHAR(50) PK, FK
montant     DECIMAL(10,2)        statut_scan ENUM('scanne')
statut_paiement ENUM(            date_scan   DATETIME
    'non_paye',
    'paye'
)
date_vente  DATETIME
```

### Les 4 états d'un ticket (cycle de vie)

```
[GÉNÉRÉ]          → id dans tickets_vente, statut = 'non_paye'
    ↓ (scan guichet)
[VENDU/PAYÉ]      → id dans tickets_vente, statut = 'paye'
    ↓ (scan porte)
[ENTRÉ/SCANNÉ]    → id dans tickets_vente (paye) + id dans tickets_entree
    ↓ (si scanné 2x)
[FRAUDE DÉTECTÉE] → id déjà dans tickets_entree → REJET automatique
```

### Données de test (18 tickets)

| Plage | Quantité | Statut |
|---|---|---|
| BAL-EPI-2026-001 à 010 | 10 | Disponibles (non payés) |
| BAL-EPI-2026-011 à 015 | 5 | Vendus, pas encore scannés |
| BAL-EPI-2026-016 à 018 | 3 | Vendus ET scannés à la porte |

---

## 4. Les QR Codes — Vrais ou Faux ?

> **Les QR codes générés sont 100% VRAIS et scannables par n'importe quelle application.**

### Comment ça fonctionne

La page `generer_qr.html` utilise la bibliothèque JavaScript **`qrcode.js`** (Google) qui génère une véritable image matricielle (canvas HTML5) à partir d'un texte.

```
Texte encodé dans le QR → "BAL-EPI-2026-016"
                                ↓
              qrcode.js génère une image bitmap
                                ↓
         Le QR code est scannable par tout smartphone
                                ↓
      Notre scanner mobile lit "BAL-EPI-2026-016"
                                ↓
         Le backend PHP vérifie l'ID dans MySQL
```

### Ce qui est encodé dans le QR

Uniquement l'**identifiant du ticket** (exemple : `BAL-EPI-2026-016`).
Aucune donnée personnelle n'est encodée (système anonyme "au porteur").

### Workflow d'impression

1. Aller sur `generer_qr.html`
2. Filtrer par "Disponibles" pour voir les tickets vierges
3. Cliquer **🖨️ Imprimer** → le navigateur génère un PDF imprimable
4. Découper et distribuer les tickets aux acheteurs
5. Au guichet le jour J : scanner le QR → le ticket passe en "Payé"

---

## 5. Comment Fonctionne le Scanner Caméra

### Bibliothèque utilisée
**`html5-qrcode`** (by Minhaj Ahmmad, open source, MIT License)
- Accède à la caméra via l'API `getUserMedia` du navigateur
- Analyse les frames vidéo en temps réel à 10 fps
- Détecte les QR codes sans installation d'application

### Flux de scan (Mode Guichet)

```
[Agent ouvre controle.html sur son téléphone]
          ↓
[Choisit "Mode Guichet / Vente"]
          ↓
[La caméra s'active (autorisation requise)]
          ↓
[Présente le ticket QR devant l'objectif]
          ↓
[html5-qrcode détecte le code en ~0.5 seconde]
          ↓
[JavaScript vérifie le format "BAL-EPI-2026-"]
          ↓
[Appel POST → backend/enregistrer.php]
          ↓
[PHP vérifie dans MySQL que le ticket existe et est 'non_paye']
          ↓
[MySQL met à jour : statut_paiement = 'paye', date_vente = NOW()]
          ↓
[PHP retourne JSON {succes: true}]
          ↓
[✅ SUCCÈS affiché sur le téléphone, caméra reprend en 3s]
          ↓
[Le tableau vente.html se met à jour automatiquement]
```

### Flux de scan (Mode Contrôle Porte)

```
[Agent ouvre controle.html sur son téléphone]
          ↓
[Choisit "Mode Contrôle / Porte"]
          ↓
[Scan du ticket QR d'un participant]
          ↓
[Appel GET → backend/verifier_ticket.php?id_ticket=BAL-EPI-2026-016]
          ↓
[PHP : Vérifie que le ticket existe dans tickets_vente ET statut = 'paye']
    → Non → ❌ "TICKET INVALIDE"
    → Oui  ↓
[PHP : Vérifie que le ticket N'EST PAS dans tickets_entree]
    → Oui (déjà scanné) → ❌ "ALERTE FRAUDE : ticket déjà utilisé"
    → Non → ↓
[PHP : INSERT dans tickets_entree (date_scan = NOW())]
          ↓
[✅ ACCÈS AUTORISÉ — participant peut entrer]
          ↓
[Le tableau table_entree.html se met à jour, la nouvelle ligne s'illumine]
```

### Cas d'erreurs gérés

| Cas | Réponse système |
|---|---|
| QR code invalide (format ≠ BAL-EPI-2026-) | ❌ Format invalide |
| Ticket non vendu (non_paye) | ❌ Ticket non activé au guichet |
| Ticket inconnu | ❌ ID inexistant en base |
| Double scan (fraude) | 🚨 ALERTE — déjà utilisé à HH:MM |
| Erreur réseau | 📡 Vérifiez la connexion WiFi |

---

## 6. Séparation Vue / Logique / Style

### Architecture CSS (`dashboard.css`)
Le fichier CSS est le **design system unique** pour toutes les pages desktop. Il définit :
- Les tokens CSS (couleurs, espacements)
- Les classes utilitaires (`.glass-panel`, `.badge`, `.card`, `.btn`)
- L'effet glassmorphism (backdrop-filter + dégradés)
- Le comportement responsive des grilles

### Architecture JS (`dashboard.js`)
Le fichier JS centralise **tous les modules de logique** :

| Fonction | Utilisée par | Rôle |
|---|---|---|
| `initStats()` | `vue_stats.html` | Rafraîchit les 3 compteurs |
| `initTableVentes()` | `vente.html` | Rafraîchit le tableau des ventes |
| `initTableEntrees()` | `table_entree.html` | Rafraîchit le tableau des entrées |
| `initGenererQr()` | `generer_qr.html` | Charge et affiche les QR codes |
| `appliquerFiltreQr()` | `generer_qr.html` | Filtre les tickets par statut |
| `apiGet(url)` | Tous | Helper requête GET JSON |
| `apiPost(url, params)` | Tous | Helper requête POST |

> Le fichier s'auto-initialise via `DOMContentLoaded` : il détecte automatiquement sur quelle page il se trouve et lance le bon module.

### Architecture HTML (Views)
Chaque page HTML est une **vue pure** : elle ne contient que la structure DOM et les liens vers CSS/JS. Aucune logique métier n'est dupliquée dans les vues.

```html
<!-- Structure type d'une vue desktop -->
<link rel="stylesheet" href="../../css/dashboard.css">  <!-- Style -->
<!-- ... HTML de la vue ... -->
<script src="../../js/dashboard.js"></script>            <!-- Logique -->
```

---

## 7. APIs Backend — Référence Rapide

### `POST /backend/enregistrer.php`
Active un ticket au guichet (passe de `non_paye` à `paye`).

**Paramètre POST :** `id_qr` (ex: `BAL-EPI-2026-011`)

**Réponse :**
```json
{ "succes": true, "message": "Ticket activé avec succès" }
{ "succes": false, "message": "Ce ticket n'existe pas ou est déjà activé" }
```

### `GET /backend/verifier_ticket.php?id_ticket=BAL-EPI-2026-016`
Valide l'entrée à la porte (anti-fraude double-scan).

**Réponse :**
```json
{ "succes": true, "message": "ACCÈS ACCORDÉ : Bienvenue au BAL !" }
{ "succes": false, "message": "ALERTE FRAUDE : ticket déjà utilisé" }
```

### `GET /backend/recuperer_stats.php`
Retourne les statistiques et les listes pour les tableaux.

**Réponse :**
```json
{
  "succes": true,
  "stats": { "total_vendus": 8, "total_scannes": 3, "taux_remplissage": 37 },
  "onglet_vente": [ {"id_ticket": "BAL-EPI-2026-011", "date_vente": "..."}, ... ],
  "onglet_entree": [ {"id_ticket": "BAL-EPI-2026-016", "date_scan": "..."}, ... ]
}
```

### `GET /backend/lister_tickets.php`
Retourne tous les tickets du stock avec leur statut complet (pour `generer_qr.html`).

**Réponse :**
```json
{
  "succes": true,
  "total": 18,
  "tickets": [
    { "id_ticket": "BAL-EPI-2026-001", "statut_paiement": "non_paye", "statut_porte": "non_scanne", "date_vente": null },
    { "id_ticket": "BAL-EPI-2026-016", "statut_paiement": "paye", "statut_porte": "scanne", "date_vente": "..." }
  ]
}
```

---

## 8. URLs d'Accès

| Page | URL |
|---|---|
| Console Centrale | `http://localhost:8000/frontend/view/desktop/dashboard.html` |
| Statistiques | `http://localhost:8000/frontend/view/desktop/vue_stats.html` |
| Générer QR Codes | `http://localhost:8000/frontend/view/desktop/generer_qr.html` |
| Suivi Ventes | `http://localhost:8000/frontend/view/desktop/vente.html` |
| Suivi Entrées | `http://localhost:8000/frontend/view/desktop/table_entree.html` |
| Scanner Mobile | `http://localhost:8000/frontend/view/mobile/controle.html` |

> **⚠️ Note importante :** Sur mobile (réseau WiFi local), remplacer `localhost` par l'IP du PC (ex: `http://192.168.1.X:8000/...`). La caméra ne fonctionnera que si le mobile est sur le même réseau.

---

## 9. Démarrage du serveur

```bash
# Dans le dossier du projet
php -S localhost:8000

# Ou pour l'accès depuis le réseau local (smartphones)
php -S 0.0.0.0:8000
```

---

## 10. Technologies Utilisées

| Composant | Technologie | Rôle |
|---|---|---|
| Serveur | PHP 8.x (built-in server) | Traitement des requêtes API |
| Base de données | MySQL 8 / MariaDB | Stockage des tickets |
| ORM | PDO (PHP Data Objects) | Connexion sécurisée BDD |
| Frontend | HTML5 + CSS3 Vanilla | Structure et style |
| Logique cliente | JavaScript ES6 (Fetch API) | Appels API, manipulation DOM |
| Scan QR | `html5-qrcode` (unpkg CDN) | Lecture caméra temps réel |
| Génération QR | `qrcodejs` (cdnjs CDN) | Création d'images QR scannables |
| Police | Inter (Google Fonts) | Typographie premium |
