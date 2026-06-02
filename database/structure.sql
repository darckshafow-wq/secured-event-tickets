-- Création de la base de données (si elle n'existe pas)
CREATE DATABASE IF NOT EXISTS `secured_tickets_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `secured_tickets_db`;

-- Structure de la table pour les tickets
CREATE TABLE IF NOT EXISTS `tickets` (
  `id_qr` VARCHAR(50) NOT NULL COMMENT 'L\'identifiant unique extrait du QR Code (ex: TK-101)',
  `nom_etudiant` VARCHAR(100) DEFAULT NULL COMMENT 'Nom de l\'étudiant inscrit',
  `prenom_etudiant` VARCHAR(150) DEFAULT NULL COMMENT 'Prénom de l\'étudiant inscrit',
  `photo_path` VARCHAR(255) DEFAULT NULL COMMENT 'Chemin vers la photo stockée dans le dossier uploads/',
  `statut` ENUM('disponible', 'vendu', 'scanne') NOT NULL DEFAULT 'disponible' COMMENT 'État du ticket',
  `date_achat` DATETIME DEFAULT NULL COMMENT 'Date et heure de l\'enrôlement au guichet',
  `date_scan` DATETIME DEFAULT NULL COMMENT 'Date et heure de l\'entrée à la porte le jour J',
  PRIMARY KEY (`id_qr`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exemple d'insertion pour vos tests (Insère 3 tickets vides prêts à être vendus)
INSERT INTO `tickets` (`id_qr`, `statut`) VALUES 
('TK-100', 'disponible'),
('TK-200', 'disponible'),
('TK-300', 'disponible');