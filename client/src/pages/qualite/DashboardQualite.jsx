import { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import StatutBadge from '../../components/StatutBadge';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function DashboardQualite() {
  const [approbations, setApprobations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [commentaire, setCommentaire]   = useState('');
  const [saving, setSaving]             = useState(false);

  const fetchApprobations = async () => {
    try {
      const res = await api.get('/qualite/approbations');
      setApprobations(res.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprobations(); }, []);

  const handleDecision = async (decision) => {
    setSaving(true);
    try {
      await api.put(`/qualite/approbations/${selected.id}/decider`, {
        decision,
        commentaire_qualite: commentaire,
      });
      toast.success(decision === 'approuve' ? 'Approbation accordée' : 'Demande refusée');
      setSelected(null);
      setCommentaire('');
      fetchApprobations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const en_attente = approbations.filter(a => a.decision === 'en_attente');
  const traitees   = approbations.filter(a => a.decision !== 'en_attente');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Approbations qualité</h1>
            <p className="text-sm text-gray-500 mt-1">{en_attente.length} en attente de décision</p>
          </div>
          <button onClick={fetchApprobations} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
            <RefreshCw size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-2xl font-bold text-yellow-700">{en_attente.length}</p>
            <p className="text-xs text-gray-500 mt-1">En attente</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-700">{approbations.filter(a=>a.decision==='approuve').length}</p>
            <p className="text-xs text-gray-500 mt-1">Approuvées</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-700">{approbations.filter(a=>a.decision==='refuse').length}</p>
            <p className="text-xs text-gray-500 mt-1">Refusées</p>
          </div>
        </div>

        {/* Modal décision */}
        {selected && (
          <div className="bg-white border border-yellow-300 rounded-2xl p-6 mb-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1">Décision pour {selected.numero_bon}</h3>
            <p className="text-sm text-gray-600 mb-1">{selected.equipement} — {selected.segment_chaine}</p>
            {selected.message_tech && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700">
                <span className="font-medium text-gray-500 text-xs block mb-1">Message du technicien :</span>
                {selected.message_tech}
              </div>
            )}
            <textarea
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              rows={3}
              placeholder="Commentaire (optionnel)..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleDecision('approuve')}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                ✅ Approuver
              </button>
              <button
                onClick={() => handleDecision('refuse')}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-60"
              >
                ❌ Refuser
              </button>
              <button onClick={() => { setSelected(null); setCommentaire(''); }} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 transition">
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* En attente */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">En attente de décision</h2>
            {en_attente.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 text-center py-8 text-gray-400 text-sm mb-6">
                Aucune demande en attente
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {en_attente.map(a => (
                  <div key={a.id} className="bg-white rounded-2xl border border-yellow-200 p-5 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-gray-900">{a.numero_bon}</span>
                        <StatutBadge statut={a.statut_demande} />
                      </div>
                      <p className="text-sm text-gray-700">{a.equipement}</p>
                      <p className="text-xs text-gray-400 mt-1">Envoyé le {new Date(a.date_envoi).toLocaleString('fr-FR')}</p>
                      {a.message_tech && <p className="text-xs text-gray-500 mt-1 italic">"{a.message_tech}"</p>}
                    </div>
                    <button
                      onClick={() => { setSelected(a); setCommentaire(''); }}
                      className="shrink-0 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-sm font-medium px-4 py-2 rounded-xl transition"
                    >
                      Décider
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Traitées */}
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Historique</h2>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {traitees.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Aucun historique</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">N° Bon</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Équipement</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Décision</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {traitees.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-medium text-gray-800">{a.numero_bon}</td>
                        <td className="px-4 py-3 text-gray-700">{a.equipement}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${a.decision==='approuve' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {a.decision === 'approuve' ? '✅ Approuvée' : '❌ Refusée'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {a.date_decision ? new Date(a.date_decision).toLocaleDateString('fr-FR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}