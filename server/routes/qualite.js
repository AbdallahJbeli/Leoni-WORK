// routes/qualite.js
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
// GET /api/qualite/approbations
// Qualité voit toutes les demandes d'approbation en attente
// ----------------------------------------------------------
router.get('/approbations', verifyToken, authorizeRoles('qualite', 'admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT aq.*,
        d.numero_bon, d.equipement, d.segment_chaine, d.description_panne,
        d.demandeur_id, d.nom_demandeur, d.prenom_demandeur,
        d.statut AS statut_demande,
        u.nom AS qualite_nom, u.prenom AS qualite_prenom
       FROM approbations_qualite aq
       JOIN demandes d ON d.id = aq.demande_id
       LEFT JOIN users u ON u.id = aq.qualite_id
       ORDER BY aq.date_envoi DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ----------------------------------------------------------
// PUT /api/qualite/approbations/:appro_id/decider
// Qualité approuve ou refuse
// Body: { decision: 'approuve' | 'refuse', commentaire_qualite }
// ----------------------------------------------------------
router.put('/approbations/:appro_id/decider', verifyToken, authorizeRoles('qualite'), async (req, res) => {
  const { appro_id } = req.params;
  const { decision, commentaire_qualite } = req.body;

  if (!['approuve', 'refuse'].includes(decision)) {
    return res.status(400).json({ message: 'Décision invalide : approuve ou refuse' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT aq.*, d.demandeur_id, d.numero_bon, d.equipement
       FROM approbations_qualite aq
       JOIN demandes d ON d.id = aq.demande_id
       WHERE aq.id = ?`,
      [appro_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Approbation introuvable' });
    }

    const appro = rows[0];

    await pool.query(
      `UPDATE approbations_qualite SET
        decision = ?, commentaire_qualite = ?,
        qualite_id = ?, matricule_qualite = ?, date_decision = NOW()
       WHERE id = ?`,
      [decision, commentaire_qualite || null, req.user.id, req.user.matricule, appro_id]
    );

    const nouveauStatut = decision === 'approuve' ? 'qualite_approuvee' : 'qualite_refusee';
    await pool.query(
      'UPDATE demandes SET statut = ? WHERE id = ?',
      [nouveauStatut, appro.demande_id]
    );

    const emoji = decision === 'approuve' ? '🟢' : '❌';
    const label = decision === 'approuve' ? 'approuvée' : 'refusée';
    await notifier(
      appro.demandeur_id,
      appro.demande_id,
      `${emoji} Approbation qualité ${label} pour ${appro.numero_bon} — ${appro.equipement}`
    );

    const [techniciens] = await pool.query(
      "SELECT id FROM users WHERE role = 'technicien' AND actif = 1"
    );
    if (techniciens.length > 0) {
      const notifValues = techniciens.map(t => [
        t.id, appro.demande_id,
        `${emoji} Qualité ${label} pour ${appro.numero_bon}`
      ]);
      await pool.query(
        'INSERT INTO notifications (destinataire_id, demande_id, message) VALUES ?',
        [notifValues]
      );
    }

    res.json({ message: `Approbation ${label} avec succès`, nouveauStatut });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;