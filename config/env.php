<?php
// config/env.php

// Configuration de la base de données locale (XAMPP / WAMP)
define('DB_HOST', 'localhost');
define('DB_NAME', 'secured_tickets_db');
define('DB_USER', 'admin');
define('DB_PASS', 'admin123'); // Laisse vide si tu es sur Windows, ou met 'root' si tu es sur Mac
define('DB_CHARSET', 'utf8mb4');

// Tu pourras aussi y ajouter d'autres variables globales plus tard, comme l'URL de ton projet
define('BASE_URL', 'http://localhost/secured-event-tickets/');