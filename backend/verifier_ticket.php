<?php
// backend/verifier_ticket.php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Évite les blocages de la caméra mobile en réseau local

require_once '../config/db.php';
require_once 'Models/Ticket.php';

// Récupération de l'ID extrait du QR code (Format attendu : BAL-EPI-2026-XXX)
$id_ticket = $_GET['id_ticket'] ?? null;

if (!$id_ticket) {
    echo json_encode([
        'succes' => false, 
        'statut_scan' => 'vide', 
        'message' => 'Aucun identifiant de ticket fourni par le scanner.'
    ]);
    exit;
}

// Validation stricte du format type BTS (Ex: BAL-EPI-2026-045)
if (!preg_match('/^BAL-EPI-2026-\d{3}$/', $id_ticket)) {
    echo json_encode([
        'succes' => false,
        'statut_scan' => 'inconnu',
        'message' => 'REJET : Format de code QR non reconnu ou falsifié !'
    ]);
    exit;
}

$ticketModel = new Ticket($pdo);

try {
    // ❌ FILTRE DE REJET 1 & 2 : On regarde si le ticket a d'abord été créé/vendu au guichet
    $achat = $ticketModel->verifierAchat($id_ticket);

    if (!$achat) {
        // Le ticket n'existe pas dans la table tickets_vente (il n'a pas été payé au guichet)
        echo json_encode([
            'succes' => false,
            'statut_scan' => 'non_active',
            'message' => 'REJET : Billet non activé. Ce ticket n\'a pas été enregistré au guichet !'
        ]);
        exit;
    }

    // ❌ FILTRE DE REJET 3 : On regarde si le ticket existe déjà dans la table d'entrée (Fraude photocopie)
    $entreeDejaFaite = $ticketModel->verifierEntree($id_ticket);

    if ($entreeDejaFaite) {
        echo json_encode([
            'succes' => false,
            'statut_scan' => 'deja_scanne',
            'message' => 'ALERTE FRAUDE : Ce ticket a déjà été utilisé pour entrer !',
            'date_scan' => $entreeDejaFaite['date_scan'] // Heure du premier scan pour preuve
        ]);
        exit;
    }

    // ✅ CAS D'ACCEPTATION : Le ticket est bien vendu et n'a jamais été scanné à la porte
    // On l'ajoute directement au fil de l'eau dans la table entrée
    $enregistrementOk = $ticketModel->enregistrerEntree($id_ticket);

    if ($enregistrementOk) {
        // Enregistrement de l'activité du scanner
        if (isset($_SESSION['username'])) {
            try {
                $stmtTrack = $pdo->prepare("UPDATE activite_scanners SET nombre_scans = nombre_scans + 1, derniere_activite = NOW() WHERE nom_utilisateur = ?");
                $stmtTrack->execute([$_SESSION['username']]);
            } catch (Exception $e) {}
        }
        echo json_encode([
            'succes' => true,
            'statut_scan' => 'acceptation',
            'message' => 'ACCÈS ACCORDÉ : Bienvenue au BAL de l\'EPI !',
            'id_ticket' => $id_ticket
        ]);
    } else {
        echo json_encode([
            'succes' => false,
            'statut_scan' => 'erreur',
            'message' => 'Erreur technique lors de l\'enregistrement de l\'entrée.'
        ]);
    }
    exit;

} catch (Exception $e) {
    echo json_encode([
        'succes' => false,
        'statut_scan' => 'erreur',
        'message' => 'Erreur système sur le serveur local : ' . $e->getMessage()
    ]);
}