<?php
// backend/register.php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['succes' => false, 'message' => 'Méthode non autorisée.']);
    exit;
}

// 1. Vérifier que le guichet est OUVERT (les inscriptions ne sont permises que si le guichet est actif)
try {
    $stmtConfig = $pdo->query("SELECT valeur FROM configuration WHERE cle = 'guichet_actif'");
    $guichetActif = $stmtConfig->fetchColumn();
    if ($guichetActif === '0') {
        echo json_encode([
            'succes' => false,
            'message' => 'Les inscriptions sont désactivées. Le responsable a fermé l\'accès aux agents.'
        ]);
        exit;
    }
} catch (Exception $e) {
    // En cas d'erreur de lecture on laisse passer
}

$username = trim($_POST['username'] ?? '');
$password = trim($_POST['password'] ?? '');
$confirm  = trim($_POST['confirm'] ?? '');

// 2. Validation des champs
if (empty($username) || empty($password) || empty($confirm)) {
    echo json_encode(['succes' => false, 'message' => 'Tous les champs sont obligatoires.']);
    exit;
}
if (strlen($username) < 3 || strlen($username) > 30) {
    echo json_encode(['succes' => false, 'message' => 'Le nom d\'utilisateur doit avoir entre 3 et 30 caractères.']);
    exit;
}
if (!preg_match('/^[a-zA-Z0-9_\-\.]+$/', $username)) {
    echo json_encode(['succes' => false, 'message' => 'Nom d\'utilisateur invalide. Utilisez uniquement des lettres, chiffres ou _ -']);
    exit;
}
if (strlen($password) < 4) {
    echo json_encode(['succes' => false, 'message' => 'Le code PIN doit avoir au moins 4 caractères.']);
    exit;
}
if ($password !== $confirm) {
    echo json_encode(['succes' => false, 'message' => 'Les codes PIN ne correspondent pas.']);
    exit;
}

try {
    // 3. Vérifier si le nom d'utilisateur est déjà pris
    $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM utilisateurs WHERE nom_utilisateur = ?");
    $stmtCheck->execute([$username]);
    if ($stmtCheck->fetchColumn() > 0) {
        echo json_encode(['succes' => false, 'message' => 'Ce nom d\'utilisateur est déjà utilisé. Choisissez-en un autre.']);
        exit;
    }

    // 4. Création du compte agent
    $stmtInsert = $pdo->prepare("INSERT INTO utilisateurs (nom_utilisateur, mot_de_passe, role) VALUES (?, ?, 'agent')");
    $stmtInsert->execute([$username, $password]);

    echo json_encode([
        'succes' => true,
        'message' => 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.'
    ]);

} catch (Exception $e) {
    echo json_encode(['succes' => false, 'message' => 'Erreur serveur : ' . $e->getMessage()]);
}
?>
