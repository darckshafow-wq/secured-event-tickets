<?php
// backend/generer_tickets.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['succes' => false, 'message' => 'Méthode non autorisée. Utilisez POST.']);
    exit;
}

$quantite = isset($_POST['quantite']) ? intval($_POST['quantite']) : 0;

if ($quantite <= 0) {
    echo json_encode(['succes' => false, 'message' => 'Veuillez spécifier une quantité valide supérieure à 0.']);
    exit;
}

if ($quantite > 200) {
    echo json_encode(['succes' => false, 'message' => 'Vous ne pouvez pas générer plus de 200 tickets à la fois.']);
    exit;
}

try {
    // 1. Trouver le numéro de ticket le plus élevé actuel (format: BAL-EPI-2026-XXX)
    $stmt = $pdo->query("SELECT id_ticket FROM tickets_vente WHERE id_ticket LIKE 'BAL-EPI-2026-%' ORDER BY id_ticket DESC LIMIT 1");
    $dernierTicket = $stmt->fetch(PDO::FETCH_ASSOC);

    $dernierNumero = 0;
    if ($dernierTicket) {
        $id = $dernierTicket['id_ticket'];
        // Extraction du numéro de la fin (ex: BAL-EPI-2026-018 -> 18)
        $parties = explode('-', $id);
        $dernierNumero = intval(end($parties));
    }

    // 2. Générer et insérer les nouveaux tickets au statut 'non_paye'
    $pdo->beginTransaction();
    $insertedIds = [];

    $stmtInsert = $pdo->prepare("INSERT INTO tickets_vente (id_ticket, statut_paiement) VALUES (?, 'non_paye')");

    for ($i = 1; $i <= $quantite; $i++) {
        $nouveauNumero = $dernierNumero + $i;
        // Formatage avec 3 chiffres avec remplissage de zéros (ex: 019)
        $nouveauId = 'BAL-EPI-2026-' . str_pad($nouveauNumero, 3, '0', STR_PAD_LEFT);
        
        $stmtInsert->execute([$nouveauId]);
        $insertedIds[] = $nouveauId;
    }

    $pdo->commit();

    echo json_encode([
        'succes' => true,
        'message' => "$quantite ticket(s) généré(s) avec succès (de " . reset($insertedIds) . " à " . end($insertedIds) . ").",
        'tickets' => $insertedIds
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode([
        'succes' => false,
        'message' => 'Erreur lors de la génération : ' . $e->getMessage()
    ]);
}
?>
