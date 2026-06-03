#!/bin/bash

# ============================================================
# tester.sh — Tests Unitaires Automatiques
# Secured Event Tickets — EPI Gala 2026
# Lance automatiquement avant le tunnel
# ============================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

BASE_URL="http://localhost:8000/backend"
PASS=0
FAIL=0
DELAY=0.6  # secondes entre chaque test

echo -e "${CYAN}${BOLD}"
echo "  ┌─────────────────────────────────────────────┐"
echo "  │       🧪 TESTS UNITAIRES — GALA EPI 2026     │"
echo "  └─────────────────────────────────────────────┘"
echo -e "${NC}"

# ============================================================
# HELPER : exécuter un test et afficher le résultat
# ============================================================
# test_api <description> <url> <method> <data> <mot_attendu>
test_api() {
    local DESC="$1"
    local URL="$2"
    local METHOD="$3"
    local DATA="$4"
    local EXPECTED="$5"

    if [ "$METHOD" = "POST" ]; then
        RESPONSE=$(curl -s -X POST -d "$DATA" "$URL" 2>/dev/null)
    else
        RESPONSE=$(curl -s "$URL" 2>/dev/null)
    fi

    if echo "$RESPONSE" | grep -q "$EXPECTED"; then
        echo -e "  ${GREEN}✅ PASS${NC} — $DESC"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}❌ FAIL${NC} — $DESC"
        echo -e "       ${YELLOW}↳ Réponse : $RESPONSE${NC}"
        FAIL=$((FAIL + 1))
    fi
    sleep $DELAY
}

# ============================================================
# MODULE 1 — BASE DE DONNÉES
# ============================================================
echo -e "\n${BOLD}━━━ MODULE 1 : Connexion Base de Données ━━━${NC}"

test_api \
    "Serveur PHP accessible (GET /)" \
    "$BASE_URL/../frontend/view/desktop/dashboard.html" \
    "GET" "" \
    "EPI Gala"

test_api \
    "API stats accessible" \
    "$BASE_URL/recuperer_stats.php" \
    "GET" "" \
    "succes"

test_api \
    "API liste tickets accessible" \
    "$BASE_URL/lister_tickets.php" \
    "GET" "" \
    "tickets"

# ============================================================
# MODULE 2 — CONFIGURATION / TOGGLE INSCRIPTIONS
# ============================================================
echo -e "\n${BOLD}━━━ MODULE 2 : Contrôle des Inscriptions ━━━${NC}"

test_api \
    "Lecture état inscriptions (guichet_actif dans stats)" \
    "$BASE_URL/recuperer_stats.php" \
    "GET" "" \
    "guichet_actif"

test_api \
    "Fermeture des inscriptions (valeur=0)" \
    "$BASE_URL/modifier_config.php" \
    "POST" "cle=guichet_actif&valeur=0" \
    "succes.*true"

test_api \
    "Vérification inscriptions FERMÉES" \
    "$BASE_URL/recuperer_stats.php" \
    "GET" "" \
    '"guichet_actif":"0"'

test_api \
    "Inscription bloquée si fermée" \
    "$BASE_URL/register.php" \
    "POST" "username=test_bloque&password=1234&confirm=1234" \
    "sactiv"

test_api \
    "Réouverture des inscriptions (valeur=1)" \
    "$BASE_URL/modifier_config.php" \
    "POST" "cle=guichet_actif&valeur=1" \
    "succes.*true"

test_api \
    "Clé de configuration non autorisée rejetée" \
    "$BASE_URL/modifier_config.php" \
    "POST" "cle=hack_key&valeur=999" \
    "non autoris"

# ============================================================
# MODULE 3 — INSCRIPTION AGENTS
# ============================================================
echo -e "\n${BOLD}━━━ MODULE 3 : Inscription des Agents ━━━${NC}"

# Nettoyer l'utilisateur de test s'il existe déjà
mysql -u admin -padmin123 -e "DELETE FROM secured_tickets_db.utilisateurs WHERE nom_utilisateur='agent_unit_test';" 2>/dev/null

test_api \
    "Inscription avec données valides" \
    "$BASE_URL/register.php" \
    "POST" "username=agent_unit_test&password=1234&confirm=1234" \
    "succ"

test_api \
    "Inscription avec nom déjà utilisé rejetée" \
    "$BASE_URL/register.php" \
    "POST" "username=agent_unit_test&password=1234&confirm=1234" \
    "utilis"

test_api \
    "Inscription avec PIN trop court rejetée" \
    "$BASE_URL/register.php" \
    "POST" "username=agent_new_ok&password=12&confirm=12" \
    "4 caract"

test_api \
    "Inscription avec PIN non confirmé rejetée" \
    "$BASE_URL/register.php" \
    "POST" "username=agent_new_ok&password=1234&confirm=9999" \
    "correspondent"

test_api \
    "Inscription avec champs vides rejetée" \
    "$BASE_URL/register.php" \
    "POST" "username=&password=&confirm=" \
    "obligatoires"

# ============================================================
# MODULE 4 — CONNEXION AGENTS
# ============================================================
echo -e "\n${BOLD}━━━ MODULE 4 : Connexion des Agents ━━━${NC}"

test_api \
    "Connexion avec credentials valides" \
    "$BASE_URL/login.php" \
    "POST" "username=agent&password=1234" \
    "succes.*true"

test_api \
    "Connexion avec mauvais mot de passe rejetée" \
    "$BASE_URL/login.php" \
    "POST" "username=agent&password=mauvais" \
    "incorrect"

test_api \
    "Connexion avec utilisateur inexistant rejetée" \
    "$BASE_URL/login.php" \
    "POST" "username=fantome&password=1234" \
    "incorrect"

test_api \
    "Connexion avec champs vides rejetée" \
    "$BASE_URL/login.php" \
    "POST" "username=&password=" \
    "manquants"

# ============================================================
# MODULE 5 — GESTION DES TICKETS
# ============================================================
echo -e "\n${BOLD}━━━ MODULE 5 : Gestion des Tickets ━━━${NC}"

test_api \
    "Génération de 2 tickets en séquence" \
    "$BASE_URL/generer_tickets.php" \
    "POST" "quantite=2" \
    "succ"

test_api \
    "Génération avec quantité invalide (0) rejetée" \
    "$BASE_URL/generer_tickets.php" \
    "POST" "quantite=0" \
    "valide"

test_api \
    "Génération avec quantité > 200 rejetée" \
    "$BASE_URL/generer_tickets.php" \
    "POST" "quantite=999" \
    "200"

# Trouver le dernier ticket non_paye pour le tester
LAST_TICKET=$(mysql -u admin -padmin123 -s -N -e "SELECT id_ticket FROM secured_tickets_db.tickets_vente WHERE statut_paiement='non_paye' ORDER BY id_ticket DESC LIMIT 1;" 2>/dev/null)

if [ ! -z "$LAST_TICKET" ]; then
    test_api \
        "Ticket BAL-EPI-2026-000 non activé est rejeté" \
        "$BASE_URL/verifier_ticket.php?id_ticket=BAL-EPI-2026-000" \
        "GET" "" \
        "succes.*false"
else
    echo -e "  ${YELLOW}⚠️ SKIP${NC} — Aucun ticket disponible pour le test de scan"
fi

test_api \
    "QR Code avec format invalide rejeté (verifier_ticket)" \
    "$BASE_URL/verifier_ticket.php?id_ticket=FAUX-CODE" \
    "GET" "" \
    "REJET"

# ============================================================
# MODULE 6 — SURVEILLANCE DES SCANNEURS
# ============================================================
echo -e "\n${BOLD}━━━ MODULE 6 : Statistiques & Scanneurs ━━━${NC}"

test_api \
    "Stats contiennent le tableau des scanneurs" \
    "$BASE_URL/recuperer_stats.php" \
    "GET" "" \
    "scanneurs"

test_api \
    "Stats contiennent les données de vente" \
    "$BASE_URL/recuperer_stats.php" \
    "GET" "" \
    "onglet_vente"

test_api \
    "Stats contiennent les données d'entrées" \
    "$BASE_URL/recuperer_stats.php" \
    "GET" "" \
    "onglet_entree"

# ============================================================
# NETTOYAGE : remettre en état propre
# ============================================================
mysql -u admin -padmin123 -e "DELETE FROM secured_tickets_db.utilisateurs WHERE nom_utilisateur='agent_unit_test';" 2>/dev/null

# ============================================================
# RÉSUMÉ FINAL
# ============================================================
TOTAL=$((PASS + FAIL))
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $FAIL -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}🎉 TOUS LES TESTS PASSÉS : $PASS/$TOTAL${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    return 0 2>/dev/null || exit 0
else
    echo -e "  ${RED}${BOLD}⚠️  $FAIL TEST(S) ÉCHOUÉ(S) — $PASS/$TOTAL réussis${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    return 1 2>/dev/null || exit 1
fi
