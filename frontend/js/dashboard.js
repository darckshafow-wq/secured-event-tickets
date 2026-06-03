/**
 * dashboard.js — Logique commune à toutes les pages Desktop
 * Secured Event Tickets — EPI Gala 2026
 *
 * Ce fichier centralise :
 *  - Le rafraîchissement des statistiques (vue_stats)
 *  - Le rafraîchissement du tableau des ventes (vente.html)
 *  - Le rafraîchissement du tableau des entrées (table_entree.html)
 *  - La génération des QR codes (generer_qr.html)
 */

// ============================================================
// CONFIGURATION
// ============================================================
const API_BASE = '../../../backend';
const REFRESH_INTERVAL_MS = 3000;

// ============================================================
// HELPERS
// ============================================================

/**
 * Fait un appel GET JSON vers une URL et retourne la promesse.
 * @param {string} url
 * @returns {Promise<Object>}
 */
function apiGet(url) {
    return fetch(url).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
    });
}

/**
 * Fait un appel POST avec un FormData et retourne la promesse.
 * @param {string} url
 * @param {Object} params — clé/valeur à envoyer
 * @returns {Promise<Object>}
 */
function apiPost(url, params = {}) {
    const fd = new FormData();
    Object.entries(params).forEach(([k, v]) => fd.append(k, v));
    return fetch(url, { method: 'POST', body: fd }).then(r => r.json());
}

// ============================================================
// MODULE : DASHBOARD CENTRAL (dashboard.html)
// ============================================================

function initDashboardCentral() {
    if (!document.getElementById('dash-vendus')) return;

    function rafraichirDash() {
        apiGet(`${API_BASE}/lister_tickets.php`) // On utilise lister_tickets pour avoir TOUT le stock
            .then(data => {
                if (!data.succes) return;
                const tickets = data.tickets;

                const vendus = tickets.filter(t => t.statut_paiement === 'paye').length;
                const entrees = tickets.filter(t => t.statut_porte === 'scanne').length;
                const stock = tickets.filter(t => t.statut_paiement === 'non_paye').length;
                const attente = vendus - entrees;
                const recette = vendus * 5000;
                const taux = vendus > 0 ? Math.round((entrees / vendus) * 100) : 0;

                _setText('dash-vendus', vendus);
                _setText('dash-recette', recette.toLocaleString('fr-FR') + ' FCFA');
                _setText('dash-entrees', entrees);
                _setText('dash-attente', attente >= 0 ? attente : 0);
                _setText('dash-taux', taux + '%');
                _setText('dash-stock', stock);
            })
            .catch(() => { });
    }

    rafraichirDash();
    setInterval(rafraichirDash, REFRESH_INTERVAL_MS);
}

// ============================================================
// MODULE : STATISTIQUES (vue_stats.html)
// ============================================================

function initStats() {
    if (!document.getElementById('stat-total-vendus')) return;

    function rafraichirStats() {
        apiGet(`${API_BASE}/recuperer_stats.php`)
            .then(data => {
                if (!data.succes) return;
                document.getElementById('stat-total-vendus').innerText = data.stats.total_vendus;
                document.getElementById('stat-scannes').innerText = data.stats.total_scannes;
                document.getElementById('stat-taux').innerText = data.stats.taux_remplissage + '%';
            })
            .catch(() => { }); // Silencieux si le serveur est indisponible
    }

    rafraichirStats();
    setInterval(rafraichirStats, REFRESH_INTERVAL_MS);
}

// ============================================================
// MODULE : TABLEAU DES VENTES (vente.html)
// ============================================================

function initTableVentes() {
    if (!document.getElementById('tableBodyVentes')) return;

    function rafraichirVentes() {
        apiGet(`${API_BASE}/recuperer_stats.php`)
            .then(data => {
                if (!data.succes) return;

                const vendus = data.onglet_vente ? data.onglet_vente.length : 0;
                const scannes = data.onglet_entree ? data.onglet_entree.length : 0;
                const montant = vendus * 5000;

                // Mise à jour des compteurs rapides
                _setText('stat-vendus', vendus);
                _setText('stat-attente', Math.max(0, vendus - scannes));
                _setText('stat-montant', montant.toLocaleString('fr-FR') + ' FCFA');

                // Tableau
                const tbody = document.getElementById('tableBodyVentes');
                tbody.innerHTML = '';

                if (!data.onglet_vente || vendus === 0) {
                    tbody.innerHTML = _emptyRow(5, 'Aucune vente enregistrée.');
                    return;
                }

                const scannedIds = new Set((data.onglet_entree || []).map(e => e.id_ticket));

                data.onglet_vente.forEach((vente, i) => {
                    const isScanne = scannedIds.has(vente.id_ticket);
                    const porteBadge = isScanne
                        ? '<span class="badge scanne">ENTRÉ ✅</span>'
                        : '<span class="badge non-scanne">EN ATTENTE 🕐</span>';

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="color:var(--text-muted);font-size:13px;">${i + 1}</td>
                        <td style="font-weight:700;color:#60a5fa;font-family:monospace;">${vente.id_ticket}</td>
                        <td><span class="badge vendu">PAYÉ</span></td>
                        <td>${porteBadge}</td>
                        <td style="color:var(--text-muted);font-size:13px;">${vente.date_vente || '—'}</td>
                    `;
                    tbody.appendChild(tr);
                });
            })
            .catch(() => { });
    }

    rafraichirVentes();
    setInterval(rafraichirVentes, REFRESH_INTERVAL_MS);
}

// ============================================================
// MODULE : TABLEAU DES ENTRÉES (table_entree.html)
// ============================================================

let _previousEntreeCount = 0;

function initTableEntrees() {
    if (!document.getElementById('tableBodyEntrees')) return;

    function rafraichirEntrees() {
        apiGet(`${API_BASE}/recuperer_stats.php`)
            .then(data => {
                if (!data.succes) return;

                const vendus = data.onglet_vente ? data.onglet_vente.length : 0;
                const entrees = data.onglet_entree ? data.onglet_entree.length : 0;
                const taux = vendus > 0 ? Math.round((entrees / vendus) * 100) : 0;

                _setText('stat-entrees', entrees);
                _setText('stat-vendus', vendus);
                _setText('stat-taux', taux + '%');

                const tbody = document.getElementById('tableBodyEntrees');
                tbody.innerHTML = '';

                if (entrees === 0) {
                    tbody.innerHTML = _emptyRow(4, 'Aucune entrée. En attente des scans mobile…');
                    _previousEntreeCount = 0;
                    return;
                }

                const isNew = entrees > _previousEntreeCount;
                _previousEntreeCount = entrees;

                [...data.onglet_entree].reverse().forEach((entree, i) => {
                    const tr = document.createElement('tr');
                    if (isNew && i === 0) tr.classList.add('new-entry');
                    tr.innerHTML = `
                        <td style="color:var(--text-muted);font-size:13px;">${entrees - i}</td>
                        <td style="font-weight:700;color:#34d399;font-family:monospace;">${entree.id_ticket}</td>
                        <td><span class="badge scanne">SCANNÉ ✅</span></td>
                        <td style="color:var(--text-muted);font-size:13px;">${entree.date_scan}</td>
                    `;
                    tbody.appendChild(tr);
                });
            })
            .catch(() => { });
    }

    rafraichirEntrees();
    setInterval(rafraichirEntrees, REFRESH_INTERVAL_MS);
}

// ============================================================
// MODULE : GÉNÉRATION QR (generer_qr.html)
// ============================================================

let _allTickets = [];

function initGenererQr() {
    if (!document.getElementById('qrGrid')) return;

    apiGet(`${API_BASE}/lister_tickets.php`)
        .then(data => {
            if (!data.succes) {
                document.getElementById('qrGrid').innerHTML =
                    `<div style="color:#f87171;padding:40px;text-align:center;">❌ ${data.message}</div>`;
                return;
            }
            _allTickets = data.tickets;
            document.getElementById('compteurInfo').innerText = `${_allTickets.length} ticket(s) au total`;
            appliquerFiltreQr();
        })
        .catch(() => {
            document.getElementById('qrGrid').innerHTML =
                '<div style="color:#f87171;padding:40px;text-align:center;">❌ Impossible de contacter le serveur.</div>';
        });
}

function appliquerFiltreQr() {
    const filtre = document.getElementById('filtreStatut')?.value ?? 'tous';
    let tickets = _allTickets;

    if (filtre === 'non_paye') tickets = _allTickets.filter(t => t.statut_paiement === 'non_paye');
    else if (filtre === 'paye') tickets = _allTickets.filter(t => t.statut_paiement === 'paye' && t.statut_porte === 'non_scanne');
    else if (filtre === 'scanne') tickets = _allTickets.filter(t => t.statut_porte === 'scanne');

    document.getElementById('compteurInfo').innerText = `${tickets.length} ticket(s) affiché(s)`;
    _renderQrGrid(tickets);
}

function _renderQrGrid(tickets) {
    const grid = document.getElementById('qrGrid');
    grid.innerHTML = '';
    if (tickets.length === 0) {
        grid.innerHTML = '<div style="color:var(--text-muted);padding:40px;text-align:center;">Aucun ticket pour ce filtre.</div>';
        return;
    }

    const taille = parseInt(document.getElementById('tailleQr')?.value ?? 160);

    tickets.forEach(ticket => {
        const { bg, labelCls, labelTxt } = _ticketMeta(ticket);

        const card = document.createElement('div');
        card.className = 'qr-card glass-panel';
        card.style.background = bg;

        const wrapper = document.createElement('div');
        wrapper.className = 'qr-img-wrapper';

        const idEl = document.createElement('div');
        idEl.className = 'qr-id';
        idEl.innerText = ticket.id_ticket;

        const statusEl = document.createElement('div');
        statusEl.className = `qr-status ${labelCls}`;
        statusEl.innerText = labelTxt;

        card.appendChild(wrapper);
        card.appendChild(idEl);
        card.appendChild(statusEl);

        if (ticket.date_vente) {
            const dateEl = document.createElement('div');
            dateEl.style.cssText = 'font-size:11px;color:#71717a;';
            dateEl.innerText = 'Vendu le ' + ticket.date_vente;
            card.appendChild(dateEl);
        }

        grid.appendChild(card);

        // Génération QR réel (scannable)
        new QRCode(wrapper, {
            text: ticket.id_ticket,
            width: taille,
            height: taille,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    });
}

function _ticketMeta(ticket) {
    if (ticket.statut_porte === 'scanne') return { bg: 'rgba(16,185,129,0.08)', labelCls: 'scanne', labelTxt: '✅ ENTRÉ / SCANNÉ' };
    if (ticket.statut_paiement === 'paye') return { bg: 'rgba(59,130,246,0.08)', labelCls: 'paye', labelTxt: '💳 VENDU — EN ATTENTE' };
    return { bg: 'rgba(245,158,11,0.08)', labelCls: 'non_paye', labelTxt: '🎟️ DISPONIBLE' };
}

// ============================================================
// UTILITAIRES INTERNES
// ============================================================
function _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
}

function _emptyRow(colspan, msg) {
    return `<tr><td colspan="${colspan}" style="text-align:center;color:var(--text-muted);padding:30px;">${msg}</td></tr>`;
}

// ============================================================
// AUTO-INIT : détecte la page et lance le bon module
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    initDashboardCentral();
    initStats();
    initTableVentes();
    initTableEntrees();
    initGenererQr();
});