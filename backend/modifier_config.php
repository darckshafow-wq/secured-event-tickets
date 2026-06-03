<?php
// backend/modifier_config.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once '../config/db.php';

// Vérifier si la session admin est active (optionnel, mais bon pour la sécurité)
session_start();
// Pour la démo, on accepte la modif directement si les paramètres POST sont bons.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['succes' => false, 'message' => 'Méthode non autorisée. Utilisez POST.']);
    exit;
}

$cle = $_POST['cle'] ?? null;
$valeur = $_POST['valeur'] ?? null;

if (!$cle || $valeur === null) {
    echo json_encode(['succes' => false, 'message' => 'Paramètres manquants (cle, valeur).']);
    exit;
}

// Validation des clés autorisées
$clesAutorisees = ['guichet_actif'];
if (!in_array($cle, $clesAutorisees)) {
    echo json_encode(['succes' => false, 'message' => 'Clé de configuration non autorisée.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE configuration SET valeur = ? WHERE cle = ?");
    $stmt->execute([$valeur, $cle]);

    echo json_encode([
        'succes' => true,
        'message' => 'Configuration mise à jour avec succès.',
        'cle' => $cle,
        'valeur' => $valeur
    ]);

} catch (Exception $e) {
    echo json_encode([
        'succes' => false,
        'message' => 'Erreur lors de la mise à jour : ' . $e->getMessage()
    ]);
}
?>
