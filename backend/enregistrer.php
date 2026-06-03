<?php
// backend/enregistrer.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config/db.php';
require_once 'Models/Ticket.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['succes' => false, 'message' => 'Méthode non autorisée. Utilisez POST.']);
    exit;
}

$id_qr = $_POST['id_qr'] ?? null;

if (!$id_qr) {
    echo json_encode(['succes' => false, 'message' => 'L\'identifiant du ticket est obligatoire.']);
    exit;
}

$ticketModel = new Ticket($pdo);

// 1. Vérifier si le ticket existe et est toujours disponible dans le stock
$ticket = $ticketModel->trouverParId($id_qr);
if (!$ticket) {
    echo json_encode(['succes' => false, 'message' => 'Ce QR Code n\'existe pas dans le système.']);
    exit;
}
if ($ticket['statut_paiement'] !== 'non_paye') {
    echo json_encode(['succes' => false, 'message' => 'Ce ticket a déjà été payé.']);
    exit;
}

try {
    // 2. Enregistrement en base de données via le modèle
    $majOk = $ticketModel->enregistrerVente($id_qr);

    if ($majOk) {
        echo json_encode([
            'succes' => true,
            'message' => 'Ticket payé et activé avec succès !'
        ]);
    } else {
        echo json_encode(['succes' => false, 'message' => 'Erreur lors de la mise à jour du ticket.']);
    }

} catch (Exception $e) {
    echo json_encode(['succes' => false, 'message' => 'Erreur système : ' . $e->getMessage()]);
}