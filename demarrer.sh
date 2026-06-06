#!/bin/bash

# demarrer.sh - Lancement automatique du Serveur PHP + Tunnel de Scan Mobile
# BAL EPI 2026

# Couleurs pour le terminal
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "=========================================================="
echo "      🚀 SERVEUR SECURED TICKETS - BAL EPI 2026          "
echo "=========================================================="
echo -e "${NC}"

# 1. Récupération de l'IP locale
IP_LOCALE=$(hostname -I | awk '{print $1}')
if [ -z "$IP_LOCALE" ]; then
    IP_LOCALE="localhost"
fi

# 2. Nettoyage d'un éventuel serveur PHP déjà actif sur le port 8000
echo -e "🧹 Vérification du port 8000..."
PID_EXISTING=$(lsof -t -i:8000)
if [ ! -z "$PID_EXISTING" ]; then
    echo -e "${YELLOW}⚠️ Un serveur tourne déjà sur le port 8000. Arrêt en cours (PID: $PID_EXISTING)...${NC}"
    kill -9 $PID_EXISTING >/dev/null 2>&1
    sleep 1
fi

# 3. Démarrage du serveur PHP local en arrière-plan
echo -e "🔌 Démarrage du serveur PHP local..."
php -S 0.0.0.0:8000 > php_server.log 2>&1 &
PHP_PID=$!
sleep 1.5

# Vérification si le démarrage a réussi
if ps -p $PHP_PID > /dev/null; then
    echo -e "${GREEN}✅ Serveur PHP démarré avec succès (PID: $PHP_PID)${NC}"
else
    echo -e "${RED}❌ Échec du démarrage du serveur PHP. Vérifiez php_server.log${NC}"
    exit 1
fi

# 4. Affichage des liens utiles
echo -e "\n----------------------------------------------------------"
echo -e "${YELLOW}🔗 LIENS SUR VOTRE ORDINATEUR :${NC}"
echo -e "   🖥️  Console Centrale : ${GREEN}http://localhost:8000/frontend/view/desktop/dashboard.html${NC}"
echo -e "   🖨️  Générer QR Codes : ${GREEN}http://localhost:8000/frontend/view/desktop/generer_qr.html${NC}"
echo -e "   📊 Statistiques     : ${GREEN}http://localhost:8000/frontend/view/desktop/vue_stats.html${NC}"
echo -e "----------------------------------------------------------"
echo -e "${YELLOW}📱 ACCÈS MOBILE SUR LE WI-FI LOCAL (sans tunnel) :${NC}"
echo -e "   👉 Connexion : ${GREEN}http://${IP_LOCALE}:8000/frontend/view/mobile/login.html${NC}"
echo -e "   👉 Inscription : ${GREEN}http://${IP_LOCALE}:8000/frontend/view/mobile/register.html${NC}"
echo -e "----------------------------------------------------------\n"

# 5. Lancement des tests unitaires automatiques
echo -e "${CYAN}🧪 Lancement des tests unitaires avant ouverture du tunnel...${NC}\n"
sleep 1
source "$(dirname "$0")/tester.sh"
TEST_RESULT=$?

if [ $TEST_RESULT -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Des tests ont échoué. Voulez-vous quand même démarrer le tunnel ? (o/N)${NC}"
    read -t 15 -n 1 REPONSE
    echo ""
    if [[ ! "$REPONSE" =~ ^[oO]$ ]]; then
        echo -e "${RED}🛑 Tunnel annulé suite aux erreurs de tests.${NC}"
        kill $PHP_PID >/dev/null 2>&1
        exit 1
    fi
fi

echo -e "${GREEN}✅ Système validé. Ouverture du tunnel dans 2 secondes...${NC}"
sleep 2

# 6. Démarrage du tunnel SSH Serveo
echo -e "${CYAN}🌍 Démarrage du tunnel sécurisé (HTTPS) pour l'accès caméra externe...${NC}"
echo -e "${YELLOW}👉 Copiez et ouvrez l'adresse HTTPS affichée ci-dessous sur votre téléphone.${NC}"
echo -e "${YELLOW}👉 Pour arrêter le serveur et fermer le tunnel, faites CTRL+C dans ce terminal.${NC}\n"

# Fonction appelée lors de l'arrêt par CTRL+C
cleanup() {
    echo -e "\n\n${RED}🛑 Arrêt du serveur PHP (PID: $PHP_PID) et fermeture du tunnel...${NC}"
    kill $PHP_PID >/dev/null 2>&1
    echo -e "${GREEN}👋 Au revoir !${NC}"
    exit 0
}
trap cleanup INT

# Lancement du tunnel SSH Serveo (foreground)
ssh -o StrictHostKeyChecking=no -R 80:localhost:8000 serveo.net
