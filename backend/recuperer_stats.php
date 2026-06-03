<?php
// backend/recuperer_stats.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/Models/Ticket.php';

$ticketModel = new Ticket($pdo);

try {
    $stats = $ticketModel->getAllStats();
    
    echo json_encode([
        'succes' => true,
        'stats' => [
            'total_vendus' => $stats['total_vendus'],
            'total_scannes' => $stats['total_scannes'],
            'taux_remplissage' => $stats['taux_remplissage']
        ],
        'onglet_vente' => $stats['onglet_vente'],
        'onglet_entree' => $stats['onglet_entree']
    ]);

} catch (Exception $e) {
    echo json_encode([
        'succes' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>