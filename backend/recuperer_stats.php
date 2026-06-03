<?php
// backend/recuperer_stats.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/Models/Ticket.php';

$ticketModel = new Ticket($pdo);

try {
    $stats = $ticketModel->getAllStats();
    
    // Récupérer les scanneurs actifs
    $stmtScanners = $pdo->query("SELECT * FROM activite_scanners ORDER BY derniere_activite DESC");
    $scanneurs = $stmtScanners->fetchAll(PDO::FETCH_ASSOC);

    // Récupérer l'état d'activation du guichet
    $stmtConfig = $pdo->query("SELECT valeur FROM configuration WHERE cle = 'guichet_actif'");
    $guichetActif = $stmtConfig->fetchColumn();
    if ($guichetActif === false) {
        $guichetActif = '1';
    }
    
    echo json_encode([
        'succes' => true,
        'stats' => [
            'total_vendus' => $stats['total_vendus'],
            'total_scannes' => $stats['total_scannes'],
            'taux_remplissage' => $stats['taux_remplissage']
        ],
        'onglet_vente' => $stats['onglet_vente'],
        'onglet_entree' => $stats['onglet_entree'],
        'scanneurs' => $scanneurs,
        'guichet_actif' => $guichetActif
    ]);

} catch (Exception $e) {
    echo json_encode([
        'succes' => false,
        'message' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}
?>