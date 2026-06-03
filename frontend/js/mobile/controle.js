// ============================================================
// frontend/js/mobile/controle.js
// Logique du Scanner Mobile - Gala EPI 2026
// ============================================================

// === SÉCURITÉ : VÉRIFICATION DE SESSION ===
fetch('../../../backend/check_auth.php')
    .then(r => r.json())
    .then(data => {
        if (!data.auth) window.location.href = 'login.html';
    })
    .catch(() => { window.location.href = 'login.html'; });

function seDeconnecter() {
    fetch('../../../backend/logout.php')
        .then(() => window.location.href = 'login.html');
}

// === ÉTAT DU SCANNER ===
let scanner     = null;
let modeActuel  = '';
let isProcessing = false;
let cntOk = 0, cntKo = 0;

function lancerScanner(mode) {
    modeActuel = mode;
    cntOk = 0; cntKo = 0;
    majCompteurs();

    document.getElementById('screen-menu').style.display    = 'none';
    document.getElementById('screen-scanner').style.display = 'block';

    const labelEl = document.getElementById('modeLabelTitle');
    if (mode === 'vente') {
        labelEl.className = 'mode-label vente';
        labelEl.innerText = '🎟️ Mode Guichet';
    } else {
        labelEl.className = 'mode-label porte';
        labelEl.innerText = '🚪 Mode Contrôle Porte';
    }

    scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 260, height: 260 }, rememberLastUsedCamera: true },
        false
    );
    scanner.render(onScanSuccess, onScanFailure);
    cacherResultat();
}

function retourMenu() {
    if (scanner) {
        scanner.clear().catch(() => { });
        scanner = null;
    }
    isProcessing = false;
    document.getElementById('screen-scanner').style.display = 'none';
    document.getElementById('screen-menu').style.display    = 'block';
    document.getElementById('reader').innerHTML = '';
    cacherResultat();
}

function onScanSuccess(decodedText) {
    if (isProcessing) return;

    if (!decodedText.startsWith('BAL-EPI-2026-')) {
        afficherResultat('error', '⚠️', 'Format Invalide',
            `Le code "<span class="result-id">${decodedText}</span>" n'est pas un ticket EPI-GALA valide.`);
        return;
    }

    isProcessing = true;
    scanner.pause();

    if (modeActuel === 'vente') {
        const fd = new FormData();
        fd.append('id_qr', decodedText);
        fetch('../../backend/enregistrer.php', { method: 'POST', body: fd })
            .then(r => r.json())
            .then(data => traiterReponse(data, decodedText))
            .catch(() => afficherErreurReseau());
    } else {
        fetch(`../../backend/verifier_ticket.php?id_ticket=${decodedText}`)
            .then(r => r.json())
            .then(data => traiterReponse(data, decodedText))
            .catch(() => afficherErreurReseau());
    }
}

function onScanFailure() { /* Silence intentionnel */ }

function traiterReponse(data, idTicket) {
    if (data.succes) {
        cntOk++;
        const msg = modeActuel === 'vente'
            ? `Ticket enregistré comme <b>PAYÉ</b>. Le ticket <span class="result-id">${idTicket}</span> est prêt pour l'entrée.`
            : `Bienvenue ! Le ticket <span class="result-id">${idTicket}</span> a été validé à la porte.`;
        afficherResultat('success', '✅',
            modeActuel === 'vente' ? 'Paiement Enregistré !' : 'Accès Autorisé !', msg);
    } else {
        cntKo++;
        afficherResultat('error', '❌',
            modeActuel === 'vente' ? 'Activation Refusée' : 'Accès Refusé',
            data.message || 'Erreur inconnue.');
    }
    majCompteurs();
    setTimeout(() => {
        cacherResultat();
        isProcessing = false;
        if (scanner) scanner.resume();
    }, 3000);
}

function afficherErreurReseau() {
    cntKo++;
    majCompteurs();
    afficherResultat('error', '📡', 'Erreur Réseau',
        'Impossible de contacter le serveur. Vérifiez la connexion WiFi.');
    setTimeout(() => {
        cacherResultat();
        isProcessing = false;
        if (scanner) scanner.resume();
    }, 3000);
}

function afficherResultat(type, icon, titre, detail) {
    const box = document.getElementById('resultBox');
    document.getElementById('resultIcon').innerText      = icon;
    document.getElementById('resultTitle').className     = `result-title ${type}`;
    document.getElementById('resultTitle').innerText     = titre;
    document.getElementById('resultDetail').innerHTML    = detail;
    box.className    = `result-box ${type}`;
    box.style.display = 'block';
}

function cacherResultat() {
    document.getElementById('resultBox').style.display = 'none';
}

function majCompteurs() {
    document.getElementById('cntOk').innerText    = cntOk;
    document.getElementById('cntKo').innerText    = cntKo;
    document.getElementById('cntTotal').innerText = cntOk + cntKo;
}
