// ============================================================
// frontend/js/mobile/controle.js
// Logique du Scanner Mobile - BAL EPI 2026
// ============================================================

// === SÉCURITÉ : VÉRIFICATION DE SESSION ===
function verifierSession() {
    fetch('../../../backend/check_auth.php')
        .then(r => r.json())
        .then(data => {
            if (!data.auth) {
                window.location.href = 'login.html';
            }
        })
        .catch(() => {
            // Ne pas déconnecter sur une simple coupure réseau temporaire
        });
}

// Vérification initiale + heartbeat toutes les 10 secondes pour maintenir la session active
verifierSession();
setInterval(verifierSession, 10000);

function seDeconnecter() {
    fetch('../../../backend/logout.php')
        .then(() => window.location.href = 'login.html');
}

// === ÉTAT DU SCANNER ===
let scanner     = null;
let modeActuel  = '';
let isProcessing = false;
let cntOk = 0, cntKo = 0;

// === GESTION AUDIO (BIPS) ===
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playBeep(type) {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    }
}

function lancerScanner(mode) {
    initAudio(); // Initialiser l'audio au clic utilisateur (politique des navigateurs)
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
    document.getElementById('scanModal').style.display = 'none';
}

function onScanSuccess(decodedText) {
    if (isProcessing) return;

    isProcessing = true;
    if (scanner.pause) {
        scanner.pause(true); // true permet de figer l'image de la caméra
    }

    if (!decodedText.startsWith('BAL-EPI-2026-')) {
        cntKo++;
        majCompteurs();
        ouvrirModal('error', '<i class="fa-solid fa-triangle-exclamation"></i>', 'Format Invalide',
            `Le code "<span class="result-id">${decodedText}</span>" n'est pas un ticket EPI-BAL valide.`);
        return;
    }

    if (modeActuel === 'vente') {
        const fd = new FormData();
        fd.append('id_qr', decodedText);
        fetch('../../../backend/enregistrer.php', { method: 'POST', body: fd })
            .then(r => r.json())
            .then(data => traiterReponse(data, decodedText))
            .catch(() => afficherErreurReseau());
    } else {
        fetch(`../../../backend/verifier_ticket.php?id_ticket=${decodedText}`)
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
            ? `Ticket enregistré comme <b>PAYÉ</b>.<br><br>Le ticket <span class="result-id">${idTicket}</span> est prêt pour l'entrée.`
            : `Bienvenue ! Le ticket <span class="result-id">${idTicket}</span> a été validé à la porte.`;
        ouvrirModal('success', '<i class="fa-solid fa-circle-check"></i>',
            modeActuel === 'vente' ? 'Paiement Enregistré !' : 'Accès Autorisé !', msg);
    } else {
        cntKo++;
        ouvrirModal('error', '<i class="fa-solid fa-circle-xmark"></i>',
            modeActuel === 'vente' ? 'Activation Refusée' : 'Accès Refusé',
            data.message || 'Erreur inconnue.');
    }
    majCompteurs();
}

function afficherErreurReseau() {
    cntKo++;
    majCompteurs();
    ouvrirModal('error', '<i class="fa-solid fa-wifi"></i>', 'Erreur Réseau',
        'Impossible de contacter le serveur. Vérifiez la connexion WiFi.');
}

function ouvrirModal(type, icon, titre, detail) {
    playBeep(type); // Émettre un son en fonction du succès ou de l'erreur
    const box = document.getElementById('scanModal');
    const content = box.querySelector('.modal-content');
    document.getElementById('modalIcon').innerHTML      = icon;
    document.getElementById('modalTitle').className     = `modal-title ${type}`;
    document.getElementById('modalTitle').innerText     = titre;
    document.getElementById('modalDetail').innerHTML    = detail;
    content.className = `modal-content ${type}`;
    box.style.display = 'flex';
}

function fermerModal() {
    document.getElementById('scanModal').style.display = 'none';
    isProcessing = false;
    if (scanner && scanner.resume) {
        scanner.resume();
    }
}

function majCompteurs() {
    document.getElementById('cntOk').innerText    = cntOk;
    document.getElementById('cntKo').innerText    = cntKo;
    document.getElementById('cntTotal').innerText = cntOk + cntKo;
}
