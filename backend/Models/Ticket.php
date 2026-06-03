<?php
// backend/Models/Ticket.php

class Ticket {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    // --- METHODES POUR LE GUICHET (tickets_vente) ---
    
    public function trouverParId($id_ticket) {
        $stmt = $this->pdo->prepare("SELECT * FROM tickets_vente WHERE id_ticket = ?");
        $stmt->execute([$id_ticket]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function enregistrerVente($id_ticket) {
        $stmt = $this->pdo->prepare("
            UPDATE tickets_vente 
            SET statut_paiement = 'paye', date_vente = NOW(), montant = 15000.00
            WHERE id_ticket = ? AND statut_paiement = 'non_paye'
        ");
        return $stmt->execute([$id_ticket]);
    }

    // --- METHODES POUR LA PORTE D'ENTREE (tickets_entree) ---

    public function verifierAchat($id_ticket) {
        $stmt = $this->pdo->prepare("SELECT * FROM tickets_vente WHERE id_ticket = ? AND statut_paiement = 'paye'");
        $stmt->execute([$id_ticket]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function verifierEntree($id_ticket) {
        $stmt = $this->pdo->prepare("SELECT * FROM tickets_entree WHERE id_ticket = ?");
        $stmt->execute([$id_ticket]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function enregistrerEntree($id_ticket) {
        $stmt = $this->pdo->prepare("INSERT INTO tickets_entree (id_ticket, statut_scan, date_scan) VALUES (?, 'scanne', NOW())");
        return $stmt->execute([$id_ticket]);
    }

    // --- METHODES POUR LES STATISTIQUES ---

    public function getAllStats() {
        // Total vendus
        $stmt = $this->pdo->query("SELECT COUNT(*) as total FROM tickets_vente WHERE statut_paiement = 'paye'");
        $totalVendus = $stmt->fetch()['total'];

        // Total scannés
        $stmt = $this->pdo->query("SELECT COUNT(*) as total FROM tickets_entree WHERE statut_scan = 'scanne'");
        $totalScannes = $stmt->fetch()['total'];

        // Taux de remplissage
        $tauxRemplissage = $totalVendus > 0 ? round(($totalScannes / $totalVendus) * 100, 1) : 0;

        // Liste des ventes
        $stmt = $this->pdo->query("SELECT id_ticket, montant, statut_paiement, date_vente 
                                  FROM tickets_vente 
                                  WHERE statut_paiement = 'paye'
                                  ORDER BY date_vente DESC");
        $ventes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Liste des entrées
        $stmt = $this->pdo->query("SELECT t.id_ticket, t.date_scan, t.statut_scan 
                                  FROM tickets_entree t
                                  ORDER BY t.date_scan DESC");
        $entrees = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'total_vendus' => (int)$totalVendus,
            'total_scannes' => (int)$totalScannes,
            'taux_remplissage' => $tauxRemplissage,
            'onglet_vente' => $ventes,
            'onglet_entree' => $entrees
        ];
    }
}
?>