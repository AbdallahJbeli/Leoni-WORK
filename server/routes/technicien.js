// routes/technicien.js
import express from 'express';
const router = express.Router();
import pool from '../config/db.js';
import { verifyToken, authorizeRoles } from '../middleware/auth.js';

// Helper : envoie une notification à un utilisateur
async function notifier(destinataire_id, demande_id, message) {
  await pool.query(
    'INSERT INTO notifications (destinataire_id, demande_id, message) VALUES (?,?,?)',
    [destinataire_id, demande_id, message]
  );
}

// ----------------------------------------------------------
// PUT /api/technicien/:id/voir
// Technicien ouvre les détails → statut passe à "en_revision"
// ----------------------------------------------------------
router.put('/:id/voir', verifyToken, authorizeRoles('technicien'), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM demandes WHERE id = ? AND statut = 'en_attente'",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Demande introuvable ou déjà traitée' });
    }

    await pool.query(
      "UPDATE demandes SET statut = 'en_revision' WHERE id = ?",
      [id]
    );

    await notifier(
      rows[0].demandeur_id, id,
      `Votre demande ${rows[0].numero_bon} est en cours de révision par un technicien`
    );

    res.json({ message: 'Statut mis à jour : en révision' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// PUT /api/technicien/:id/hors-service
// Technicien refuse → statut "hors_service"
// ----------------------------------------------------------
router.put('/:id/hors-service', verifyToken, authorizeRoles('technicien'), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM demandes WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Demande introuvable' });

    await pool.query(
      "UPDATE demandes SET statut = 'hors_service' WHERE id = ?",
      [id]
    );

    await notifier(
      rows[0].demandeur_id, id,
      `Votre demande ${rows[0].numero_bon} a été classée Hors service`
    );

    res.json({ message: 'Demande classée hors service' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// POST /api/technicien/:id/accepter
// Technicien accepte + remplit la fiche → statut "en_reparation"
// ----------------------------------------------------------
router.post('/:id/accepter', verifyToken, authorizeRoles('technicien'), async (req, res) => {
  const { id } = req.params;
  const {
    nom_tech, prenom_tech, matricule_tech,
    recu_le, fin_le, description_travaux,
    type_travail, code_defaut1, code_defaut2, code_defaut3,
    heures_prestees, temps_arret, temps_attente, temps_attente_piece,
    pieces,       // tableau [{ tz_nummer, designation, quantite }]
    intervenants  // tableau [{ nom_prenom, matricule, heures_prestees }]
  } = req.body;

  if (!recu_le || !description_travaux || !type_travail) {
    return res.status(400).json({ message: 'Champs obligatoires : recu_le, description_travaux, type_travail' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [demandeRows] = await conn.query('SELECT * FROM demandes WHERE id = ?', [id]);
    if (demandeRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Demande introuvable' });
    }
    const demande = demandeRows[0];

    const [ficheExist] = await conn.query(
      'SELECT id FROM fiches_technicien WHERE demande_id = ?', [id]
    );

    let fiche_id;

    if (ficheExist.length > 0) {
      fiche_id = ficheExist[0].id;
      await conn.query(
        `UPDATE fiches_technicien SET
          nom_tech=?, prenom_tech=?, matricule_tech=?,
          recu_le=?, fin_le=?, description_travaux=?,
          type_travail=?, code_defaut1=?, code_defaut2=?, code_defaut3=?,
          heures_prestees=?, temps_arret=?, temps_attente=?, temps_attente_piece=?
         WHERE id=?`,
        [
          nom_tech || req.user.nom,
          prenom_tech || req.user.prenom,
          matricule_tech || req.user.matricule,
          recu_le, fin_le || null, description_travaux,
          type_travail, code_defaut1 || null, code_defaut2 || null, code_defaut3 || null,
          heures_prestees || null, temps_arret || null,
          temps_attente || null, temps_attente_piece || null,
          fiche_id
        ]
      );
      await conn.query('DELETE FROM pieces_rechange WHERE fiche_id = ?', [fiche_id]);
      await conn.query('DELETE FROM intervenants WHERE fiche_id = ?', [fiche_id]);
    } else {
      const [ficheResult] = await conn.query(
        `INSERT INTO fiches_technicien
          (demande_id, technicien_id, nom_tech, prenom_tech, matricule_tech,
           recu_le, fin_le, description_travaux,
           type_travail, code_defaut1, code_defaut2, code_defaut3,
           heures_prestees, temps_arret, temps_attente, temps_attente_piece)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id, req.user.id,
          nom_tech || req.user.nom,
          prenom_tech || req.user.prenom,
          matricule_tech || req.user.matricule,
          recu_le, fin_le || null, description_travaux,
          type_travail, code_defaut1 || null, code_defaut2 || null, code_defaut3 || null,
          heures_prestees || null, temps_arret || null,
          temps_attente || null, temps_attente_piece || null
        ]
      );
      fiche_id = ficheResult.insertId;
    }

    if (pieces && pieces.length > 0) {
      const pieceValues = pieces.map(p => [fiche_id, p.tz_nummer, p.designation || null, p.quantite || 1]);
      await conn.query(
        'INSERT INTO pieces_rechange (fiche_id, tz_nummer, designation, quantite) VALUES ?',
        [pieceValues]
      );
    }

    if (intervenants && intervenants.length > 0) {
      const intervValues = intervenants.map(i => [fiche_id, i.nom_prenom, i.matricule, i.heures_prestees || null]);
      await conn.query(
        'INSERT INTO intervenants (fiche_id, nom_prenom, matricule, heures_prestees) VALUES ?',
        [intervValues]
      );
    }

    await conn.query(
      "UPDATE demandes SET statut = 'en_reparation' WHERE id = ?",
      [id]
    );

    await conn.commit();

    await notifier(
      demande.demandeur_id, id,
      `Votre demande ${demande.numero_bon} est en cours de réparation`
    );

    res.status(201).json({ message: 'Fiche technicien enregistrée', fiche_id });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    conn.release();
  }
});

// ----------------------------------------------------------
// PUT /api/technicien/:id/repare
// Technicien clique "Réparé" → statut "repare"
// ----------------------------------------------------------
router.put('/:id/repare', verifyToken, authorizeRoles('technicien'), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM demandes WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Demande introuvable' });

    await pool.query(
      "UPDATE demandes SET statut = 'repare' WHERE id = ?",
      [id]
    );

    await notifier(
      rows[0].demandeur_id, id,
      `✅ Votre demande ${rows[0].numero_bon} a été réparée`
    );

    res.json({ message: 'Demande marquée comme réparée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// POST /api/technicien/:id/approbation-qualite
// Technicien envoie une demande d'approbation qualité
// ----------------------------------------------------------
router.post('/:id/approbation-qualite', verifyToken, authorizeRoles('technicien'), async (req, res) => {
  const { id } = req.params;
  const { message_tech } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM demandes WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Demande introuvable' });

    const demande = rows[0];

    const [result] = await pool.query(
      'INSERT INTO approbations_qualite (demande_id, message_tech) VALUES (?,?)',
      [id, message_tech || null]
    );

    await pool.query(
      "UPDATE demandes SET statut = 'attente_qualite' WHERE id = ?",
      [id]
    );

    const [qualiteUsers] = await pool.query(
      "SELECT id FROM users WHERE role = 'qualite' AND actif = 1"
    );
    if (qualiteUsers.length > 0) {
      const notifValues = qualiteUsers.map(q => [
        q.id, id,
        `🟡 Approbation qualité requise pour ${demande.numero_bon} — ${demande.equipement}`
      ]);
      await pool.query(
        'INSERT INTO notifications (destinataire_id, demande_id, message) VALUES ?',
        [notifValues]
      );
    }

    await notifier(
      demande.demandeur_id, id,
      `Votre demande ${demande.numero_bon} est en attente d'approbation qualité`
    );

    res.status(201).json({
      message: 'Demande d\'approbation qualité envoyée',
      approbation_id: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;