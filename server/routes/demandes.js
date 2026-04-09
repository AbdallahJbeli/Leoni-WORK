// routes/demandes.js
import express from 'express';
const router = express.Router();
import pool from '../config/db.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';

// ----------------------------------------------------------
// Génère un numéro de bon unique ex: BDT-001527
// ----------------------------------------------------------
async function genererNumeroBon() {
  const [rows] = await pool.query(
    "SELECT numero_bon FROM demandes ORDER BY id DESC LIMIT 1"
  );
  if (rows.length === 0) return 'BDT-000001';
  const last = rows[0].numero_bon; // "BDT-001526"
  const num = parseInt(last.split('-')[1], 10) + 1;
  return 'BDT-' + String(num).padStart(6, '0');
}

// ----------------------------------------------------------
// POST /api/demandes — Demandeur crée une demande
// ----------------------------------------------------------
router.post('/', verifyToken, authorizeRoles('demandeur'), async (req, res) => {
  const {
    equipement, segment_chaine, position, numero_serie,
    equipement_en_arret, heure_arret, date_arret, description_panne
  } = req.body;

  if (!equipement || !segment_chaine || !position || !numero_serie || !description_panne) {
    return res.status(400).json({ message: 'Champs obligatoires manquants' });
  }

  const enArret = equipement_en_arret ? 1 : 0;
  const remarque = enArret ? 'critique' : 'planifie';

  try {
    const numero_bon = await genererNumeroBon();

    const [result] = await pool.query(
      `INSERT INTO demandes
        (demandeur_id, nom_demandeur, prenom_demandeur, matricule_demandeur,
         equipement, segment_chaine, position, numero_serie,
         equipement_en_arret, heure_arret, date_arret,
         remarque, description_panne, numero_bon)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.id, req.user.nom, req.user.prenom, req.user.matricule,
        equipement, segment_chaine, position, numero_serie,
        enArret, heure_arret || null, date_arret || null,
        remarque, description_panne, numero_bon
      ]
    );

    const demande_id = result.insertId;

    // Notifie tous les techniciens
    const [techniciens] = await pool.query(
      "SELECT id FROM users WHERE role = 'technicien' AND actif = 1"
    );
    if (techniciens.length > 0) {
      const notifValues = techniciens.map(t => [
        t.id,
        demande_id,
        `Nouvelle demande ${numero_bon} — ${equipement} (${remarque === 'critique' ? '🔴 Critique' : '🟡 Planifié'})`
      ]);
      await pool.query(
        'INSERT INTO notifications (destinataire_id, demande_id, message) VALUES ?',
        [notifValues]
      );
    }

    res.status(201).json({
      message: 'Demande créée avec succès',
      demande_id,
      numero_bon
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// GET /api/demandes — Liste selon le rôle
// ----------------------------------------------------------
router.get('/', verifyToken, async (req, res) => {
  try {
    let rows;

    if (req.user.role === 'demandeur') {
      [rows] = await pool.query(
        `SELECT d.*, 
          ft.type_travail, ft.recu_le, ft.fin_le, ft.heures_prestees,
          ft.temps_arret, ft.temps_attente, ft.temps_attente_piece
         FROM demandes d
         LEFT JOIN fiches_technicien ft ON ft.demande_id = d.id
         WHERE d.demandeur_id = ?
         ORDER BY d.date_demande DESC`,
        [req.user.id]
      );
    } else if (req.user.role === 'technicien') {
      [rows] = await pool.query(
        `SELECT d.*,
          u.nom AS dem_nom, u.prenom AS dem_prenom,
          ft.id AS fiche_id, ft.type_travail, ft.recu_le, ft.fin_le, ft.heures_prestees,
          ft.temps_arret, ft.temps_attente, ft.temps_attente_piece
         FROM demandes d
         JOIN users u ON u.id = d.demandeur_id
         LEFT JOIN fiches_technicien ft ON ft.demande_id = d.id
         ORDER BY d.date_demande DESC`
      );
    } else if (req.user.role === 'qualite') {
      [rows] = await pool.query(
        `SELECT d.*,
          aq.id AS appro_id, aq.decision, aq.date_envoi, aq.message_tech,
          aq.commentaire_qualite, aq.date_decision
         FROM demandes d
         JOIN approbations_qualite aq ON aq.demande_id = d.id
         ORDER BY aq.date_envoi DESC`
      );
    } else if (req.user.role === 'admin') {
      [rows] = await pool.query(
        `SELECT d.*,
          u.nom AS dem_nom, u.prenom AS dem_prenom,
          ft.type_travail, ft.heures_prestees,
          ft.temps_arret, ft.temps_attente, ft.temps_attente_piece,
          t.nom AS nom_tech, t.prenom AS prenom_tech
         FROM demandes d
         JOIN users u ON u.id = d.demandeur_id
         LEFT JOIN fiches_technicien ft ON ft.demande_id = d.id
         LEFT JOIN users t ON t.id = ft.technicien_id
         ORDER BY d.date_demande DESC`
      );
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// GET /api/demandes/:id — Détail d'une demande
// ----------------------------------------------------------
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, u.email AS dem_email
       FROM demandes d
       JOIN users u ON u.id = d.demandeur_id
       WHERE d.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Demande introuvable' });
    }

    const demande = rows[0];

    const [fiche] = await pool.query(
      `SELECT ft.*, u.email AS tech_email
       FROM fiches_technicien ft
       JOIN users u ON u.id = ft.technicien_id
       WHERE ft.demande_id = ?`,
      [req.params.id]
    );

    let pieces = [];
    if (fiche.length > 0) {
      const [p] = await pool.query(
        'SELECT * FROM pieces_rechange WHERE fiche_id = ?',
        [fiche[0].id]
      );
      pieces = p;

      const [interv] = await pool.query(
        'SELECT * FROM intervenants WHERE fiche_id = ?',
        [fiche[0].id]
      );
      fiche[0].intervenants = interv;
    }

    const [appro] = await pool.query(
      `SELECT aq.*, u.nom AS qualite_nom, u.prenom AS qualite_prenom
       FROM approbations_qualite aq
       LEFT JOIN users u ON u.id = aq.qualite_id
       WHERE aq.demande_id = ?
       ORDER BY aq.date_envoi DESC LIMIT 1`,
      [req.params.id]
    );

    res.json({
      demande,
      fiche: fiche[0] || null,
      pieces,
      approbation: appro[0] || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// PUT /api/demandes/:id/accepter-demandeur
// Demandeur confirme que la réparation est terminée
// ----------------------------------------------------------
router.put('/:id/accepter-demandeur', verifyToken, authorizeRoles('demandeur'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM demandes WHERE id = ? AND demandeur_id = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Demande introuvable' });
    }

    const demande = rows[0];
    if (demande.statut !== 'repare') {
      return res.status(400).json({ message: 'La demande doit être marquée comme réparée pour être approuvée' });
    }

    await pool.query(
      "UPDATE demandes SET statut = 'acceptee' WHERE id = ?",
      [req.params.id]
    );

    const [fiche] = await pool.query(
      'SELECT technicien_id FROM fiches_technicien WHERE demande_id = ?',
      [req.params.id]
    );
    if (fiche.length > 0 && fiche[0].technicien_id) {
      await pool.query(
        'INSERT INTO notifications (destinataire_id, demande_id, message) VALUES (?,?,?)',
        [
          fiche[0].technicien_id,
          req.params.id,
          `✅ La demande ${demande.numero_bon} a été acceptée par le demandeur`
        ]
      );
    }

    res.json({ message: 'Réparation acceptée par le demandeur' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// GET /api/demandes/notifications/mes
// ----------------------------------------------------------
router.get('/notifications/mes', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.*, d.numero_bon, d.equipement
       FROM notifications n
       LEFT JOIN demandes d ON d.id = n.demande_id
       WHERE n.destinataire_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// PUT /api/demandes/notifications/lire-tout
// ----------------------------------------------------------
router.put('/notifications/lire-tout', verifyToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET lu = 1 WHERE destinataire_id = ?',
      [req.user.id]
    );
    res.json({ message: 'Notifications marquées comme lues' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;