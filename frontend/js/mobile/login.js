// ============================================================
// frontend/js/mobile/login.js
// Logique de la page de connexion Mobile - Gala EPI 2026
// ============================================================

// Si déjà connecté → redirige directement vers le scanner
fetch('../../../backend/check_auth.php')
    .then(r => r.json())
    .then(data => {
        if (data.auth) window.location.href = 'controle.html';
    }).catch(() => { });

function soumettreLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmit');
    const err = document.getElementById('errorBox');

    btn.innerText      = 'Vérification...';
    btn.style.opacity  = '0.7';
    err.style.display  = 'none';

    const fd = new FormData();
    fd.append('username', document.getElementById('username').value);
    fd.append('password', document.getElementById('password').value);

    fetch('../../../backend/login.php', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => {
            if (data.succes) {
                btn.innerText       = 'Succès !';
                btn.style.background = '#10b981';
                setTimeout(() => window.location.href = 'controle.html', 500);
            } else {
                throw new Error(data.message);
            }
        })
        .catch(e => {
            err.innerText      = e.message || 'Erreur de connexion.';
            err.style.display  = 'block';
            btn.innerText      = 'Se Connecter';
            btn.style.opacity  = '1';
        });
}
