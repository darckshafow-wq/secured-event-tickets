<?php
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';

// Si une session utilisateur existe, on est authentifié
if (isset($_SESSION['user_id'])) {
    // Enregistrement de l'activité du scanner
    try {
        $stmt = $pdo->prepare("
            INSERT INTO activite_scanners (nom_utilisateur, adresse_ip, appareil, derniere_activite)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                adresse_ip = VALUES(adresse_ip),
                appareil = VALUES(appareil),
                derniere_activite = NOW()
        ");
        $stmt->execute([
            $_SESSION['username'],
            $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
            $_SERVER['HTTP_USER_AGENT'] ?? 'Inconnu'
        ]);
    } catch (Exception $e) {
        // On ne bloque pas si l'écriture échoue
    }

    // Récupérer l'état du guichet
    $guichetActif = '1';
    try {
        $stmtConfig = $pdo->query("SELECT valeur FROM configuration WHERE cle = 'guichet_actif'");
        $val = $stmtConfig->fetchColumn();
        if ($val !== false) {
            $guichetActif = $val;
        }
    } catch (Exception $e) {}

    echo json_encode([
        'auth' => true, 
        'user' => [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role']
        ],
        'guichet_actif' => $guichetActif
    ]);
} else {
    echo json_encode(['auth' => false]);
}
?>
