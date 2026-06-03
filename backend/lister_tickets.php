<?php
// backend/lister_tickets.php
// Retourne TOUS les tickets du stock (non_paye + paye) pour la génération des QR codes
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/db.php';

try {
    $stmt = $pdo->query("
        SELECT 
            tv.id_ticket,
            tv.statut_paiement,
            tv.date_vente,
            CASE WHEN te.id_ticket IS NOT NULL THEN 'scanne' ELSE 'non_scanne' END AS statut_porte
        FROM tickets_vente tv
        LEFT JOIN tickets_entree te ON tv.id_ticket = te.id_ticket
        ORDER BY tv.id_ticket ASC
    ");
    $tickets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'succes' => true,
        'total' => count($tickets),
        'tickets' => $tickets
    ]);

} catch (Exception $e) {
    echo json_encode([
        'succes' => false,
        'message' => 'Erreur: ' . $e->getMessage()
    ]);
}
?>
