import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2, Send } from 'lucide-react';
import Navbar from '../../components/Navbar';
import StatutBadge from '../../components/StatutBadge';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const CODES_DEFAUT1 = [
  '1-Mecanique','2-Electrique','3-Pneumatique',
  '4-Logiciel','5-Hydraulique','6-Maintenance','7-Inspection'
];
const CODES_DEFAUT2 = [
  '01-Cassure','02-Usure','03-Saleté','04-Blocage',
  '05-Desserrage','06-Surcharge','07-Mauvaise_utilisation',
  '08-Mauvais_Reglage','09-Alimentation_electrique_air','10-Court_circuit'
];
const CODES_DEFAUT3 = [
  'PT01-MMC-LTN','PT02-MMC-slovaki','PT03-MMC-KT','PT04-TSK','PT05-divmac','PT06-EMDEP','PT07-créasoft',
  'USS01-Tete de machine','USS02-Generateur et câble','USS03-PC software+Sulwin','USS04-Automate',
  'CHMO01-Armoire électrique','CHMO02-Eclairage chaine','CHMO03-Système de sécurité',
  'CHMO04-Support wagons','CHMO05-Attache rapide chaine','CHMO06-Roues',
  'LAD01-Capteur position poste','LAD02-Armoire électrique','LAD03-Bouton d\'urgence','LAD04-Moteur',
  'PRESS01-Carte électronique','PRESS02-Coupe idchet','PRESS03-Système de sécurité',
  'PRESS04-Bloc de transmission de fil','PRESS05-Bloc de dénudage',
  'PRESS06-Mécanisme de sertissage','PRESS07-Pédale',
  'ISO01-Moule','ISO02-Machine','ISO03-Unité de chauffage'
];

export default function FicheTechnicien() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showFiche, setShowFiche] = useState(false);
  const [showQualite, setShowQualite] = useState(false);
  const [msgQualite, setMsgQualite] = useState('');

  const [fiche, setFiche] = useState({
    recu_le: '', fin_le: '',
    description_travaux: '',
    type_travail: 'MCP',
    code_defaut1: '', code_defaut2: '', code_defaut3: '',
    heures_prestees: '',
    temps_arret: '', temps_attente: '', temps_attente_piece: '',
  });
  const [pieces, setPieces] = useState([]);
  const [intervenants, setIntervenants] = useState([]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/demandes/${id}`);
      setData(res.data);
      // Pré-rempli si fiche existante
      if (res.data.fiche) {
        const f = res.data.fiche;
        setFiche({
          recu_le:             f.recu_le ? f.recu_le.slice(0,16) : '',
          fin_le:              f.fin_le  ? f.fin_le.slice(0,16)  : '',
          description_travaux: f.description_travaux || '',
          type_travail:        f.type_travail || 'MCP',
          code_defaut1:        f.code_defaut1 || '',
          code_defaut2:        f.code_defaut2 || '',
          code_defaut3:        f.code_defaut3 || '',
          heures_prestees:     f.heures_prestees || '',
          temps_arret:         f.temps_arret || '',
          temps_attente:       f.temps_attente || '',
          temps_attente_piece: f.temps_attente_piece || '',
        });
        setPieces(res.data.pieces || []);
        setIntervenants(f.intervenants || []);
        setShowFiche(true);
      }
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleHorsService = async () => {
    if (!confirm('Confirmer : classer cette demande Hors service ?')) return;
    try {
      await api.put(`/technicien/${id}/hors-service`);
      toast.success('Demande classée hors service');
      navigate('/technicien');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleRepare = async () => {
    if (!confirm('Confirmer : marquer cette demande comme Réparée ?')) return;
    try {
      await api.put(`/technicien/${id}/repare`);
      toast.success('Demande marquée comme réparée');
      navigate('/technicien');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleSaveFiche = async () => {
    if (!fiche.recu_le || !fiche.description_travaux) {
      toast.error('Date de réception et description requis');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/technicien/${id}/accepter`, {
        ...fiche,
        pieces,
        intervenants,
      });
      toast.success('Fiche enregistrée');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleQualite = async () => {
    try {
      await api.post(`/technicien/${id}/approbation-qualite`, { message_tech: msgQualite });
      toast.success('Demande d\'approbation qualité envoyée');
      setShowQualite(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const addPiece   = () => setPieces(prev => [...prev, { tz_nummer: '', designation: '', quantite: 1 }]);
  const removePiece = (i) => setPieces(prev => prev.filter((_, idx) => idx !== i));
  const updatePiece = (i, field, val) => setPieces(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  const addIntervenant   = () => setIntervenants(prev => [...prev, { nom_prenom: '', matricule: '', heures_prestees: '' }]);
  const removeIntervenant = (i) => setIntervenants(prev => prev.filter((_, idx) => idx !== i));
  const updateIntervenant = (i, field, val) => setIntervenants(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Chargement...</div>;
  if (!data)   return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Demande introuvable</div>;

  const { demande, approbation } = data;
  const canAct = !['repare','hors_service','qualite_approuvee','qualite_refusee'].includes(demande.statut);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        <button onClick={() => navigate('/technicien')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
          <ArrowLeft size={16} /> Retour
        </button>

        {/* Entête demande */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono font-bold text-gray-900 text-lg">{demande.numero_bon}</span>
                <StatutBadge statut={demande.statut} />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${demande.remarque === 'critique' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {demande.remarque === 'critique' ? '🔴 Critique' : '🟡 Planifié'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{demande.equipement}</h2>
              <p className="text-sm text-gray-500">Segment : {demande.segment_chaine} — Position : {demande.position} — N°Série : {demande.numero_serie}</p>
            </div>
            <div className="text-right text-sm text-gray-400">
              <p>Demandeur : {demande.prenom_demandeur} {demande.nom_demandeur}</p>
              <p>Matricule : {demande.matricule_demandeur}</p>
              <p>Le : {new Date(demande.date_demande).toLocaleString('fr-FR')}</p>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 mb-1">Description de la panne</p>
            <p className="text-sm text-gray-800">{demande.description_panne}</p>
          </div>
        </div>

        {/* Actions principales */}
        {canAct && (
          <div className="flex gap-3 flex-wrap mb-6">
            <button
              onClick={() => setShowFiche(true)}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
            >
              ✅ Accepter et remplir la fiche
            </button>
            <button
              onClick={handleHorsService}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium px-5 py-2.5 rounded-xl transition"
            >
              🔴 Hors service
            </button>
            {demande.statut === 'en_reparation' && (
              <>
                <button
                  onClick={handleRepare}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                >
                  🔧 Marquer Réparé
                </button>
                <button
                  onClick={() => setShowQualite(true)}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm font-medium px-5 py-2.5 rounded-xl transition"
                >
                  🟡 Envoyer approbation qualité
                </button>
              </>
            )}
          </div>
        )}

        {/* Modal approbation qualité */}
        {showQualite && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-3">Demande d'approbation qualité</h3>
            <textarea
              value={msgQualite}
              onChange={e => setMsgQualite(e.target.value)}
              rows={3}
              placeholder="Décrivez l'impact sur le produit..."
              className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none bg-white"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={handleQualite} className="flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-4 py-2 rounded-lg transition">
                <Send size={14} /> Envoyer
              </button>
              <button onClick={() => setShowQualite(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 transition">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Résultat approbation qualité */}
        {approbation && (
          <div className={`rounded-2xl border p-5 mb-6 ${
            approbation.decision === 'approuve' ? 'bg-green-50 border-green-200' :
            approbation.decision === 'refuse'   ? 'bg-blue-50 border-blue-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
            <p className="font-semibold text-sm mb-1">
              {approbation.decision === 'approuve' ? '🟢 Qualité approuvée' :
               approbation.decision === 'refuse'   ? '❌ Qualité refusée' :
               '🟡 En attente approbation qualité'}
            </p>
            {approbation.commentaire_qualite && (
              <p className="text-sm text-gray-700">{approbation.commentaire_qualite}</p>
            )}
          </div>
        )}

        {/* Fiche technicien */}
        {showFiche && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-5">Fiche technicien</h3>

            <div className="space-y-5">
              {/* Identité (pré-remplie) */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Nom</p>
                  <p className="text-sm font-medium">{user.nom}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Prénom</p>
                  <p className="text-sm font-medium">{user.prenom}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Matricule</p>
                  <p className="text-sm font-medium">{user.matricule}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reçu le *</label>
                  <input type="datetime-local" value={fiche.recu_le} onChange={e => setFiche(p=>({...p,recu_le:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin le</label>
                  <input type="datetime-local" value={fiche.fin_le} onChange={e => setFiche(p=>({...p,fin_le:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Description travaux */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description des travaux effectués *</label>
                <textarea value={fiche.description_travaux} onChange={e => setFiche(p=>({...p,description_travaux:e.target.value}))}
                  rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>

              {/* Type de travail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de travail *</label>
                <div className="flex gap-3">
                  {['MCP','MNP','AUT'].map(t => (
                    <label key={t} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition ${fiche.type_travail===t ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 hover:border-gray-400'}`}>
                      <input type="radio" name="type_travail" value={t} checked={fiche.type_travail===t} onChange={() => setFiche(p=>({...p,type_travail:t}))} className="hidden" />
                      <span className="text-sm font-medium">{t}</span>
                      <span className="text-xs text-gray-400">
                        {t==='MCP'?'Curative planifiée':t==='MNP'?'Non planifiée':'Divers'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Codes défauts */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code défaut 1 (What)</label>
                  <select value={fiche.code_defaut1} onChange={e=>setFiche(p=>({...p,code_defaut1:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Sélectionner --</option>
                    {CODES_DEFAUT1.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code défaut 2 (Why)</label>
                  <select value={fiche.code_defaut2} onChange={e=>setFiche(p=>({...p,code_defaut2:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Sélectionner --</option>
                    {CODES_DEFAUT2.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code défaut 3 (Where)</label>
                  <select value={fiche.code_defaut3} onChange={e=>setFiche(p=>({...p,code_defaut3:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Sélectionner --</option>
                    {CODES_DEFAUT3.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Heures + Temps */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heures prestées</label>
                  <input type="number" step="0.5" value={fiche.heures_prestees} onChange={e=>setFiche(p=>({...p,heures_prestees:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temps d'arrêt (min)</label>
                  <input type="number" value={fiche.temps_arret} onChange={e=>setFiche(p=>({...p,temps_arret:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temps d'attente (min)</label>
                  <input type="number" value={fiche.temps_attente} onChange={e=>setFiche(p=>({...p,temps_attente:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attente pièces (min)</label>
                  <input type="number" value={fiche.temps_attente_piece} onChange={e=>setFiche(p=>({...p,temps_attente_piece:e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Pièces de rechange */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Pièces de rechange</label>
                  <button onClick={addPiece} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                    <Plus size={13} /> Ajouter
                  </button>
                </div>
                {pieces.map((p, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input placeholder="TZ Nummer" value={p.tz_nummer} onChange={e=>updatePiece(i,'tz_nummer',e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input placeholder="Désignation" value={p.designation} onChange={e=>updatePiece(i,'designation',e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" placeholder="Qté" value={p.quantite} onChange={e=>updatePiece(i,'quantite',e.target.value)}
                      className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={()=>removePiece(i)} className="text-blue-400 hover:text-blue-600 transition p-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Intervenants */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Intervenants supplémentaires</label>
                  <button onClick={addIntervenant} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                    <Plus size={13} /> Ajouter
                  </button>
                </div>
                {intervenants.map((iv, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input placeholder="Nom & Prénom" value={iv.nom_prenom} onChange={e=>updateIntervenant(i,'nom_prenom',e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input placeholder="Matricule" value={iv.matricule} onChange={e=>updateIntervenant(i,'matricule',e.target.value)}
                      className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" step="0.5" placeholder="H" value={iv.heures_prestees} onChange={e=>updateIntervenant(i,'heures_prestees',e.target.value)}
                      className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button onClick={()=>removeIntervenant(i)} className="text-blue-400 hover:text-blue-600 transition p-2">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Save */}
              <button onClick={handleSaveFiche} disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Enregistrement...' : 'Confirmer la fiche'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}