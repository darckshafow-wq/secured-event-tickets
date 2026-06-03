<?php
// config/db.php

// 1. On inclut le fichier contenant les variables de configuration
require_once __DIR__ . '/env.php';

try {
    // 2. On utilise les constantes définies dans env.php
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    
    // On active les erreurs PDO pour le développement
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
} catch (\PDOException $e) {
     // Si la connexion échoue, on renvoie une erreur propre en JSON
     header('Content-Type: application/json');
     echo json_encode([
         'succes' => false, 
         'message' => 'Erreur de connexion à la base de données.'
     ]);
     exit;
}