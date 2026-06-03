<?php
session_start();
header('Content-Type: application/json');

// Si une session utilisateur existe, on est authentifié
if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'auth' => true, 
        'user' => [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role']
        ]
    ]);
} else {
    echo json_encode(['auth' => false]);
}
?>
