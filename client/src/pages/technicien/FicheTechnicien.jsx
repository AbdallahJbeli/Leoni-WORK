import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
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
  const [impactProduit, setImpactProduit] = useState(false);
  const [descriptionImpact, setDescriptionImpact] = useState('');
  const [waitingQualite, setWaitingQualite] = useState(false);
  const [confirmButtonVisible, setConfirmButtonVisible] = useState(true);

  const [fiche, setFiche] = useState({
    recu_le: '', fin_le: '',
    description_travaux: '',
    type_travail: 'MCP',
    code_defaut1: '', code_defaut2: '', code_defaut3: '',
    heures_prestees_h: '', heures_prestees_m: '',
    temps_arret_h: '', temps_arret_m: '',
    temps_attente_h: '', temps_attente_m: '',
    temps_attente_piece_h: '', temps_attente_piece_m: '',
  });
  const [pieces, setPieces] = useState([]);
  const [intervenants, setIntervenants] = useState([]);

  const parseTimeParts = (value) => {
    if (value == null || value === '') return { h: '', m: '' };
    const raw = String(value).trim();
    const match = /(?:(\d+)\s*h(?:eures?)?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?/i.exec(raw);
    if (match && (match[1] || match[2])) {
      return { h: match[1] || '', m: match[2] || '' };
    }
    const num = parseFloat(raw.replace(',', '.'));
    if (!Number.isNaN(num)) {
      const hours = Math.floor(num);
      const minutes = Math.round((num - hours) * 60);
      return { h: hours ? String(hours) : '', m: minutes ? String(minutes) : '' };
    }
    return { h: '', m: '' };
  };

  const formatTimeValue = (hours, minutes) => {
    const h = String(hours || '').trim();
    const m = String(minutes || '').trim();
    if (!h && !m) return '';
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  };

  const buildFichePayload = (currentFiche) => ({
    ...currentFiche,
    heures_prestees: formatTimeValue(currentFiche.heures_prestees_h, currentFiche.heures_prestees_m),
    temps_arret: formatTimeValue(currentFiche.temps_arret_h, currentFiche.temps_arret_m),
    temps_attente: formatTimeValue(currentFiche.temps_attente_h, currentFiche.temps_attente_m),
    temps_attente_piece: formatTimeValue(currentFiche.temps_attente_piece_h, currentFiche.temps_attente_piece_m),
  });

  const fetchData = async () => {
    try {
      const res = await api.get(`/demandes/${id}`);
      setData(res.data);
      if (res.data.demande.statut !== 'attente_qualite') {
        setWaitingQualite(false);
      }
      // Pré-rempli si fiche existante
      if (res.data.fiche) {
        const f = res.data.fiche;
        const heures = parseTimeParts(f.heures_prestees);
        const arret = parseTimeParts(f.temps_arret);
        const attente = parseTimeParts(f.temps_attente);
        const attentePiece = parseTimeParts(f.temps_attente_piece);
        setFiche({
          recu_le:             f.recu_le ? f.recu_le.slice(0,16) : '',
          fin_le:              f.fin_le  ? f.fin_le.slice(0,16)  : '',
          description_travaux: f.description_travaux || '',
          type_travail:        f.type_travail || 'MCP',
          code_defaut1:        f.code_defaut1 || '',
          code_defaut2:        f.code_defaut2 || '',
          code_defaut3:        f.code_defaut3 || '',
          heures_prestees_h:   heures.h,
          heures_prestees_m:   heures.m,
          temps_arret_h:       arret.h,
          temps_arret_m:       arret.m,
          temps_attente_h:     attente.h,
          temps_attente_m:     attente.m,
          temps_attente_piece_h: attentePiece.h,
          temps_attente_piece_m: attentePiece.m,
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
        ...buildFichePayload(fiche),
        pieces,
        intervenants,
      });
      toast.success('Fiche enregistrée');
      if (qualityDecision === 'approuve') {
        setConfirmButtonVisible(false);
      }
      setShowFiche(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAndSendQualite = async () => {
    if (qualityDecision === 'approuve') {
      return handleSaveFiche();
    }

    if (!fiche.recu_le || !fiche.description_travaux) {
      toast.error('Date de réception et description requis');
      return;
    }

    const messageTech = `Impact produit: ${impactProduit ? 'Oui' : 'Non'}${impactProduit && descriptionImpact ? ` \nDescription: ${descriptionImpact}` : ''}`;

    setSaving(true);
    try {
      await api.post(`/technicien/${id}/accepter`, {
        ...buildFichePayload(fiche),
        pieces,
        intervenants,
      });

      await api.post(`/technicien/${id}/approbation-qualite`, {
        message_tech: messageTech,
        impact_produit: impactProduit,
        description_impact: descriptionImpact,
      });

      toast.success('Fiche confirmée et envoyée à la qualité');
      setWaitingQualite(true);
      setShowFiche(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
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
  const qualityDecision = approbation?.decision;
  const isQualityApproved = qualityDecision === 'approuve';
  const isQualityRefused = qualityDecision === 'refuse';
  const isWaitingApproval = demande.statut === 'attente_qualite' || waitingQualite;
  const canAct = !['repare','hors_service','qualite_refusee'].includes(demande.statut) && !isWaitingApproval;

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
              <button
                onClick={handleRepare}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
              >
                🔧 Marquer Réparé
              </button>
            )}
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
          <div className="relative bg-white rounded-2xl border border-gray-200 p-6">
            {(isWaitingApproval || isQualityRefused) && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center p-6">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    {isWaitingApproval ? "Attendre l'approbation qualité" : 'Fiche annulée par la qualité'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {isWaitingApproval
                      ? 'La fiche est en attente de validation par le service qualité.'
                      : 'La demande a été refusée par le service qualité et ne peut plus être modifiée.'}
                  </p>
                </div>
              </div>
            )}
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
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 text-center">Observations</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heures prestées</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" min="0" placeholder="h" value={fiche.heures_prestees_h} onChange={e=>setFiche(p=>({...p,heures_prestees_h:e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="number" min="0" max="59" placeholder="min" value={fiche.heures_prestees_m} onChange={e=>setFiche(p=>({...p,heures_prestees_m:e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temps d'arrêt</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" min="0" placeholder="h" value={fiche.temps_arret_h} onChange={e=>setFiche(p=>({...p,temps_arret_h:e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="number" min="0" max="59" placeholder="min" value={fiche.temps_arret_m} onChange={e=>setFiche(p=>({...p,temps_arret_m:e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temps d'attente</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" min="0" placeholder="h" value={fiche.temps_attente_h} onChange={e=>setFiche(p=>({...p,temps_attente_h:e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="number" min="0" max="59" placeholder="min" value={fiche.temps_attente_m} onChange={e=>setFiche(p=>({...p,temps_attente_m:e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attente pièces</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" min="0" placeholder="h" value={fiche.temps_attente_piece_h} onChange={e=>setFiche(p=>({...p,temps_attente_piece_h:e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="number" min="0" max="59" placeholder="min" value={fiche.temps_attente_piece_m} onChange={e=>setFiche(p=>({...p,temps_attente_piece_m:e.target.value}))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
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

              {/* Impact produit / Résultat qualité */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Impact produit</p>
                {qualityDecision ? (
                  <div className={`rounded-2xl p-4 ${isQualityApproved ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                    <p className="font-semibold">Résultat qualité : {isQualityApproved ? 'Approuvée' : 'Refusée'}</p>
                    <p className="text-sm mt-1">
                      {isQualityApproved
                        ? 'La fiche a été approuvée par la qualité. Vous pouvez continuer la saisie.'
                        : 'La fiche a été annulée par la qualité. Aucun traitement supplémentaire n’est possible.'}
                    </p>
                    {approbation.commentaire_qualite && (
                      <p className="text-sm text-gray-700 mt-2">Commentaire qualité : {approbation.commentaire_qualite}</p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer ${impactProduit ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 hover:border-gray-400'}`}>
                        <input type="radio" name="impactProduit" checked={impactProduit} onChange={() => setImpactProduit(true)} className="hidden" />
                        <span>Oui</span>
                      </label>
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer ${!impactProduit ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-gray-200 hover:border-gray-400'}`}>
                        <input type="radio" name="impactProduit" checked={!impactProduit} onChange={() => setImpactProduit(false)} className="hidden" />
                        <span>Non</span>
                      </label>
                    </div>
                    {impactProduit && (
                      <textarea
                        value={descriptionImpact}
                        onChange={e => setDescriptionImpact(e.target.value)}
                        rows={3}
                        placeholder="Décrivez l'impact sur le produit"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    )}
                  </>
                )}
              </div>

              {/* Save */}
              {canAct && confirmButtonVisible && (
                <button onClick={handleConfirmAndSendQualite} disabled={saving || isWaitingApproval || isQualityRefused}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? 'Enregistrement...' : isQualityRefused ? 'Fiche annulée' : qualityDecision === 'approuve' ? 'Mettre à jour la fiche' : 'Confirmer et envoyer approbation qualité'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}