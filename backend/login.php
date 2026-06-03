<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/db.php';

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(['succes' => false, 'message' => 'Identifiants manquants']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE nom_utilisateur = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Vérification: Accepte le mot de passe en dur (pour la démo) ou hashé (pour la prod)
    if ($user && ($password === $user['mot_de_passe'] || password_verify($password, $user['mot_de_passe']))) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['username'] = $user['nom_utilisateur'];
        
        echo json_encode(['succes' => true, 'message' => 'Connexion réussie', 'role' => $user['role']]);
    } else {
        echo json_encode(['succes' => false, 'message' => 'Identifiant ou mot de passe incorrect']);
    }
} catch (Exception $e) {
    echo json_encode(['succes' => false, 'message' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>
