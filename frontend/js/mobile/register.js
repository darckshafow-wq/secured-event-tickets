// ============================================================
// frontend/js/mobile/register.js
// Logique de la page d'inscription Agent — Gala EPI 2026
// ============================================================

const API_BASE = '../../../backend';

// === VÉRIFICATION DE L'ÉTAT DES INSCRIPTIONS AU CHARGEMENT ===
window.addEventListener('DOMContentLoaded', () => {
    verifierInscriptions();
});

function verifierInscriptions() {
    fetch(`${API_BASE}/recuperer_stats.php`)
        .then(r => r.json())
        .then(data => {
            const banner  = document.getElementById('blockedBanner');
            const form    = document.getElementById('registerForm');
            const btnSubmit = document.getElementById('btnSubmit');

            if (data.guichet_actif === '0') {
                // Inscriptions fermées : afficher le bandeau, bloquer le formulaire
                banner.style.display = 'block';
                form.style.display   = 'none';
            } else {
                banner.style.display = 'none';
                form.style.display   = 'block';
            }
        })
        .catch(() => {
            // En cas d'erreur réseau on laisse le formulaire visible
        });
}

// === SOUMISSION DU FORMULAIRE ===
function soumettreInscription(event) {
    event.preventDefault();

    const username  = document.getElementById('reg-username').value.trim();
    const password  = document.getElementById('reg-password').value.trim();
    const confirm   = document.getElementById('reg-confirm').value.trim();
    const errorBox  = document.getElementById('errorBox');
    const successBox = document.getElementById('successBox');
    const btnSubmit = document.getElementById('btnSubmit');

    // Masquer les messages précédents
    errorBox.style.display  = 'none';
    successBox.style.display = 'none';

    // Validation côté client
    if (password !== confirm) {
        afficherErreur('Les deux codes PIN ne correspondent pas.');
        return;
    }

    // Désactiver le bouton pour éviter les doubles soumissions
    btnSubmit.disabled   = true;
    btnSubmit.innerText  = 'Création en cours...';

    const fd = new FormData();
    fd.append('username', username);
    fd.append('password', password);
    fd.append('confirm', confirm);

    fetch(`${API_BASE}/register.php`, { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => {
            if (data.succes) {
                // Succès : afficher le message et rediriger vers login après 2s
                document.getElementById('registerForm').style.display = 'none';
                successBox.innerText  = '✅ ' + data.message;
                successBox.style.display = 'block';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2500);
            } else {
                afficherErreur(data.message || 'Erreur inconnue.');
                btnSubmit.disabled  = false;
                btnSubmit.innerText = '✅ Créer mon compte';

                // Si inscriptions fermées, afficher le bandeau
                if (data.message && data.message.includes('désactivées')) {
                    document.getElementById('blockedBanner').style.display = 'block';
                    document.getElementById('registerForm').style.display = 'none';
                }
            }
        })
        .catch(() => {
            afficherErreur('Erreur réseau. Vérifiez votre connexion et réessayez.');
            btnSubmit.disabled  = false;
            btnSubmit.innerText = '✅ Créer mon compte';
        });
}

function afficherErreur(message) {
    const errorBox = document.getElementById('errorBox');
    errorBox.innerText      = '❌ ' + message;
    errorBox.style.display  = 'block';
}
