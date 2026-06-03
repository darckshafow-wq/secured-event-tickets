-- Création de la base de données (si elle n'existe pas)
CREATE DATABASE IF NOT EXISTS `secured_tickets_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `secured_tickets_db`;

DROP TABLE IF EXISTS `tickets_entree`;
DROP TABLE IF EXISTS `tickets_vente`;
DROP TABLE IF EXISTS `utilisateurs`;

-- Table d'authentification des agents
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom_utilisateur` VARCHAR(50) NOT NULL UNIQUE,
  `mot_de_passe` VARCHAR(255) NOT NULL COMMENT 'Mot de passe (hash ou plain pour la démo)',
  `role` ENUM('admin', 'agent') NOT NULL DEFAULT 'agent'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `utilisateurs` (`nom_utilisateur`, `mot_de_passe`, `role`) VALUES 
('agent', '1234', 'agent');

-- 1. Table des ventes (Guichet) - Contient le stock de billets
CREATE TABLE IF NOT EXISTS `tickets_vente` (
  `id_ticket` VARCHAR(50) NOT NULL COMMENT 'Identifiant unique (ex: BAL-EPI-2026-XXX)',
  `montant` DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Montant payé',
  `statut_paiement` ENUM('non_paye', 'paye') NOT NULL DEFAULT 'non_paye' COMMENT 'État du ticket au guichet',
  `date_vente` DATETIME DEFAULT NULL COMMENT 'Date et heure de l\'enrôlement au guichet',
  PRIMARY KEY (`id_ticket`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table des entrées (Contrôle porte)
CREATE TABLE IF NOT EXISTS `tickets_entree` (
  `id_ticket` VARCHAR(50) NOT NULL,
  `statut_scan` ENUM('scanne') NOT NULL DEFAULT 'scanne' COMMENT 'État du ticket à la porte',
  `date_scan` DATETIME DEFAULT NULL COMMENT 'Date et heure de l\'entrée à la porte le jour J',
  PRIMARY KEY (`id_ticket`),
  FOREIGN KEY (`id_ticket`) REFERENCES `tickets_vente`(`id_ticket`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Génération d'un stock de départ (Test Data)
-- 10 Tickets Vides (A vendre)
INSERT IGNORE INTO `tickets_vente` (`id_ticket`, `statut_paiement`) VALUES 
('BAL-EPI-2026-001', 'non_paye'), ('BAL-EPI-2026-002', 'non_paye'),
('BAL-EPI-2026-003', 'non_paye'), ('BAL-EPI-2026-004', 'non_paye'),
('BAL-EPI-2026-005', 'non_paye'), ('BAL-EPI-2026-006', 'non_paye'),
('BAL-EPI-2026-007', 'non_paye'), ('BAL-EPI-2026-008', 'non_paye'),
('BAL-EPI-2026-009', 'non_paye'), ('BAL-EPI-2026-010', 'non_paye');

-- 5 Tickets Vendus mais PAS ENCORE scannés à la porte
INSERT IGNORE INTO `tickets_vente` (`id_ticket`, `montant`, `statut_paiement`, `date_vente`) VALUES 
('BAL-EPI-2026-011', 5000.00, 'paye', '2026-06-01 10:30:00'),
('BAL-EPI-2026-012', 5000.00, 'paye', '2026-06-01 11:15:00'),
('BAL-EPI-2026-013', 5000.00, 'paye', '2026-06-02 09:45:00'),
('BAL-EPI-2026-014', 5000.00, 'paye', '2026-06-02 14:20:00'),
('BAL-EPI-2026-015', 5000.00, 'paye', '2026-06-03 16:05:00');

-- 3 Tickets Vendus ET Scannés (Déjà dans la salle)
INSERT IGNORE INTO `tickets_vente` (`id_ticket`, `montant`, `statut_paiement`, `date_vente`) VALUES 
('BAL-EPI-2026-016', 5000.00, 'paye', '2026-05-28 10:00:00'),
('BAL-EPI-2026-017', 5000.00, 'paye', '2026-05-29 14:00:00'),
('BAL-EPI-2026-018', 5000.00, 'paye', '2026-05-30 16:30:00');

INSERT IGNORE INTO `tickets_entree` (`id_ticket`, `statut_scan`, `date_scan`) VALUES 
('BAL-EPI-2026-016', 'scanne', '2026-06-03 18:30:00'),
('BAL-EPI-2026-017', 'scanne', '2026-06-03 18:32:00'),
('BAL-EPI-2026-018', 'scanne', '2026-06-03 18:35:00');