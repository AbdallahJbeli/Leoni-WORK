import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Plus, Loader2, Users, FileText, Printer } from 'lucide-react';
import Navbar from '../../components/Navbar';
import StatutBadge from '../../components/StatutBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ROLES = ['demandeur','technicien','qualite','admin'];
const roleColors = {
  admin:      'bg-purple-100 text-purple-700',
  demandeur:  'bg-blue-100 text-blue-700',
  technicien: 'bg-green-100 text-green-700',
  qualite:    'bg-yellow-100 text-yellow-700',
};

const minToHM = (min) => {
  if (!min && min !== 0) return '— H — Min';
  return `${Math.floor(min/60)} H ${min%60} Min`;
};
const decToHM = (dec) => {
  if (!dec && dec !== 0) return '— H — Min';
  const h = Math.floor(dec);
  const m = Math.round((dec - h)*60);
  return `${h} H ${m} Min`;
};

function BonDeTravail({ data, onClose }) {
  const { demande, fiche, pieces, approbation } = data;
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Bon de Travail ${demande.numero_bon}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: Arial, sans-serif; font-size: 10px; color: #000; background: #fff; }
          .page { width:210mm; min-height:297mm; padding:8mm; }
          table { width:100%; border-collapse:collapse; }
          td, th { border:1px solid #000; padding:3px 5px; vertical-align:top; }
          .no-border td, .no-border th { border:none; }
          .header-logo { font-size:18px; font-weight:bold; border:2px solid #000; padding:4px 10px; display:inline-block; }
          .title { font-size:14px; font-weight:bold; text-align:center; }
          .num-bon { font-size:13px; font-weight:bold; color:#cc0000; }
          .section-title { font-weight:bold; text-align:center; background:#f0f0f0; font-size:10px; }
          .italic-title { font-style:italic; font-weight:bold; text-align:center; }
          .checkbox { display:inline-block; width:10px; height:10px; border:1px solid #000; margin-right:3px; text-align:center; line-height:10px; font-size:8px; }
          .checked { background:#000; color:#fff; }
          .small { font-size:8px; }
          .bold { font-weight:bold; }
          .center { text-align:center; }
          .right { text-align:right; }
          .underline-field { border-bottom:1px solid #000; min-width:80px; display:inline-block; }
          h-sep { display:block; height:3px; }
          @media print {
            body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
            @page { size:A4; margin:0; }
          }
        </style>
      </head>
      <body><div class="page">${content}</div></body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const date = demande.date_demande ? new Date(demande.date_demande) : null;
  const dateStr = date ? `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}` : '___/___/20__';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <FileText size={18} /> Bon de Travail — {demande.numero_bon}
          </h2>
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              <Printer size={15} /> Imprimer / PDF
            </button>
            <button onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 border border-gray-200 rounded-lg transition">
              Fermer
            </button>
          </div>
        </div>
        <div className="p-6 overflow-x-auto">
          <div ref={printRef} style={{ fontFamily:'Arial,sans-serif', fontSize:'10px', color:'#000', width:'100%' }}>
            <table style={{marginBottom:'2px'}}>
              <tbody>
                <tr>
                  <td style={{border:'none',width:'120px',verticalAlign:'bottom'}}>
                    <div style={{fontSize:'7px'}}>IT TN 3 402</div>
                    <div style={{fontSize:'7px'}}>Annexe 2 Etat10.17</div>
                  </td>
                  <td style={{border:'none',textAlign:'center',fontWeight:'bold',fontSize:'14px'}}>
                    BON DE TRAVAIL
                  </td>
                  <td style={{border:'none',textAlign:'center',fontWeight:'bold',fontSize:'13px',color:'#cc0000',width:'120px'}}>
                    N° {demande.numero_bon}
                  </td>
                  <td style={{border:'2px solid #000',textAlign:'center',fontWeight:'bold',fontSize:'16px',width:'80px',padding:'4px 8px'}}>
                    LEONI
                  </td>
                </tr>
              </tbody>
            </table>
            <table style={{marginBottom:'0'}}>
              <tbody>
                <tr>
                  <td style={{border:'1px solid #000',width:'60%',padding:'2px 4px'}}>
                    Équipement : <span style={{fontWeight:'bold'}}>{demande.equipement}</span>
                  </td>
                  <td style={{border:'1px solid #000',padding:'2px 4px'}} colSpan={2}>
                    Équipement en arrêt &nbsp;
                    <span style={{display:'inline-block',width:'12px',height:'12px',border:'1px solid #000',textAlign:'center',lineHeight:'12px',fontSize:'9px',background: demande.equipement_en_arret ? '#000':'#fff', color: demande.equipement_en_arret ? '#fff':'#000'}}>
                      {demande.equipement_en_arret ? '✓' : ''}
                    </span> OUI &nbsp;
                    <span style={{display:'inline-block',width:'12px',height:'12px',border:'1px solid #000',textAlign:'center',lineHeight:'12px',fontSize:'9px',background: !demande.equipement_en_arret ? '#000':'#fff', color: !demande.equipement_en_arret ? '#fff':'#000'}}>
                      {!demande.equipement_en_arret ? '✓' : ''}
                    </span> NON
                  </td>
                </tr>
                <tr>
                  <td style={{border:'1px solid #000',padding:'2px 4px'}}>
                    Demandeur : <b>{demande.prenom_demandeur} {demande.nom_demandeur}</b>
                    &nbsp;&nbsp; N° Série/Position : <b>{demande.numero_serie} / {demande.position}</b>
                  </td>
                  <td style={{border:'1px solid #000',padding:'2px 4px'}} colSpan={2}>
                    Heure d'arrêt : {demande.heure_arret || '__ H __'} Min
                  </td>
                </tr>
                <tr>
                  <td style={{border:'1px solid #000',padding:'2px 4px'}}>
                    Matricule : <b>{demande.matricule_demandeur}</b>
                    &nbsp;&nbsp; Date d'arrêt : {demande.date_arret ? new Date(demande.date_arret).toLocaleDateString('fr-FR') : '__/__/20__'}
                  </td>
                  <td style={{border:'1px solid #000',padding:'2px 4px'}} colSpan={2}>
                    Remarque : <b>{demande.remarque === 'critique' ? 'CRITIQUE' : 'PLANIFIÉ'}</b>
                  </td>
                </tr>
                <tr>
                  <td style={{border:'1px solid #000',padding:'2px 4px'}} colSpan={3}>
                    Segment/CC : <b>{demande.segment_chaine}</b>
                  </td>
                </tr>
              </tbody>
            </table>
            <table style={{marginBottom:'0'}}>
              <tbody>
                <tr>
                  <td style={{border:'1px solid #000',fontWeight:'bold',textAlign:'center',background:'#f5f5f5',padding:'2px'}}>
                    Description de la panne ou de l'anomalie constatée
                  </td>
                </tr>
                <tr>
                  <td style={{border:'1px solid #000',minHeight:'30px',padding:'4px',height:'35px'}}>
                    {demande.description_panne}
                  </td>
                </tr>
              </tbody>
            </table>
            <table style={{marginBottom:'0'}}>
              <tbody>
                <tr>
                  <td colSpan={4} style={{border:'1px solid #000',fontStyle:'italic',fontWeight:'bold',textAlign:'center',background:'#f5f5f5',padding:'2px',fontSize:'10px'}}>
                    Champs réservés au Service Maintenance
                  </td>
                  <td style={{border:'1px solid #000',fontWeight:'bold',textAlign:'center',background:'#f5f5f5',padding:'2px'}}>
                    Approbation demandeur
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} style={{border:'1px solid #000',padding:'2px 4px'}}>
                    Nom & Prénom Technicien : <b>{fiche ? `${fiche.prenom_tech} ${fiche.nom_tech}` : '________________'}</b>
                  </td>
                  <td style={{border:'1px solid #000',padding:'2px 4px'}}>
                    Matricule : <b>{fiche?.matricule_tech || '________'}</b>
                  </td>
                  <td style={{border:'1px solid #000',padding:'2px 4px'}}>
                    Reçu le : {fiche?.recu_le ? new Date(fiche.recu_le).toLocaleDateString('fr-FR') : '__/__/20__'}
                    &nbsp; Fin le : {fiche?.fin_le ? new Date(fiche.fin_le).toLocaleDateString('fr-FR') : '__/__/20__'}
                  </td>
                  <td rowSpan={3} style={{border:'1px solid #000',padding:'4px',verticalAlign:'top'}}>
                    <div style={{fontSize:'9px',marginBottom:'4px'}}>Date : {dateStr}</div>
                    <div style={{fontSize:'9px'}}>Matricule/visa : {demande.matricule_demandeur}</div>
                  </td>
                </tr>
                <tr>
                  <td style={{border:'1px solid #000',padding:'2px 4px'}}>Visa</td>
                  <td colSpan={2} style={{border:'1px solid #000',padding:'2px 4px',fontStyle:'italic'}}>Visa</td>
                  <td style={{border:'1px solid #000',padding:'2px 4px',fontWeight:'bold',textAlign:'center',fontSize:'10px'}}>
                    Approbation Qualité
                  </td>
                </tr>
              </tbody>
            </table>
            <table style={{marginBottom:'0'}}>
              <tbody>
                <tr>
                  <td style={{border:'1px solid #000',fontWeight:'bold',padding:'2px 4px',width:'60%'}}>
                    Description des travaux effectués &nbsp; cocher type de travail MCP-MNP-AUT
                  </td>
                  <td style={{border:'1px solid #000',padding:'2px 4px',verticalAlign:'top'}}>
                    Matricule : {approbation?.matricule_qualite || '________'}<br/>
                    Visa : ________
                  </td>
                </tr>
                <tr>
                  <td style={{border:'1px solid #000',padding:'4px',height:'40px',verticalAlign:'top'}}>
                    {fiche?.description_travaux || ''}
                  </td>
                  <td style={{border:'1px solid #000',padding:'2px 4px',verticalAlign:'top',fontSize:'9px'}}>
                    {['MCP','MNP','AUT'].map(t => (
                      <div key={t} style={{display:'flex',alignItems:'center',gap:'4px',marginBottom:'2px'}}>
                        <span style={{display:'inline-block',width:'10px',height:'10px',border:'1px solid #000',textAlign:'center',lineHeight:'10px',background: fiche?.type_travail===t?'#000':'#fff', color: fiche?.type_travail===t?'#fff':'#000'}}>
                          {fiche?.type_travail===t?'✓':''}
                        </span>
                        {t}-{t==='MCP'?'Maintenance curative planifiée':t==='MNP'?'Maint non planifiée':'travaux divers et améliorations'}
                      </div>
                    ))}
                  </td>
                </tr>
              </tbody>
            </table>
            <table>
              <tbody>
                <tr>
                  <td style={{border:'1px solid #000',width:'22%',verticalAlign:'top',padding:'0'}}>
                    <div style={{fontWeight:'bold',textAlign:'center',borderBottom:'1px solid #000',padding:'2px',fontSize:'9px',background:'#f5f5f5'}}>Codes défaut 1 (What)</div>
                    {['1 Mécanique','2 Électrique','3 Pneumatique','4 Logiciel','5 Hydraulique','6 Maintenance','7 Inspection'].map((c,i) => (
                      <div key={i} style={{padding:'1px 4px',borderBottom:'1px solid #eee',display:'flex',gap:'4px',alignItems:'center'}}>
                        <span style={{display:'inline-block',width:'8px',height:'8px',border:'1px solid #000',background: fiche?.code_defaut1?.startsWith(String(i+1))?'#000':'#fff'}}/>
                        <span style={{fontSize:'8px'}}>{c}</span>
                      </div>
                    ))}
                    <div style={{fontWeight:'bold',textAlign:'center',borderTop:'1px solid #000',borderBottom:'1px solid #000',padding:'2px',fontSize:'9px',background:'#f5f5f5'}}>Codes défaut 2 (Why)</div>
                    {['01 Cassure','02 Usure','03 Saleté','04 Blocage','05 Desserrage','06 Surcharge','07 Mauvaise utilisation','08 Mauvais Réglage','09 Alimentation électrique-air','10 Court circuit'].map((c,i) => (
                      <div key={i} style={{padding:'1px 4px',borderBottom:'1px solid #eee',display:'flex',gap:'4px',alignItems:'center'}}>
                        <span style={{display:'inline-block',width:'8px',height:'8px',border:'1px solid #000',background: fiche?.code_defaut2?.startsWith(String(i+1).padStart(2,'0'))?'#000':'#fff'}}/>
                        <span style={{fontSize:'8px'}}>{c}</span>
                      </div>
                    ))}
                  </td>
                  <td style={{border:'1px solid #000',width:'28%',verticalAlign:'top',padding:'0'}}>
                    <div style={{fontWeight:'bold',textAlign:'center',borderBottom:'1px solid #000',padding:'2px',fontSize:'9px',background:'#f5f5f5'}}>Code défaut 3 (Where - Où)</div>
                    {[
                      'PT01-MMC-LTN','PT02-MMC-slovaki','PT03-MMC-KT','PT04-TSK','PT05-divmac','PT06-EMDEP','PT07-créasoft',
                      'USS01-Tete de machine','USS02-Generateur et câble','USS03-PC software+Sulwin','USS04-Automate',
                      'CHMO01-Armoire électrique','CHMO02-Eclairage chaine','CHMO03-Système de sécurité',
                      'CHMO04-Support wagons','CHMO05-Attache rapide chaine','CHMO06-Roues',
                      'LAD01-Capteur position poste','LAD02-Armoire électrique','LAD03-Bouton d\'urgence','LAD04-Moteur',
                      'PRESS01-Carte électronique','PRESS02-Coupe idchet','PRESS03-Système de sécurité',
                      'PRESS04-Bloc de transmission de fil','PRESS05-Bloc de dénudage',
                      'PRESS06-Mécanisme de sertissage','PRESS07-Pédale',
                      'ISO01-Moule','ISO02-Machine','ISO03-Unité de chauffage'
                    ].map((c,i) => (
                      <div key={i} style={{padding:'1px 4px',borderBottom:'1px solid #eee',display:'flex',gap:'4px',alignItems:'center'}}>
                        <span style={{display:'inline-block',width:'8px',height:'8px',border:'1px solid #000',background: fiche?.code_defaut3===c?'#000':'#fff'}}/>
                        <span style={{fontSize:'8px'}}>{c}</span>
                      </div>
                    ))}
                  </td>
                  <td style={{border:'1px solid #000',width:'50%',verticalAlign:'top',padding:'0'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',marginBottom:'0'}}>
                      <thead>
                        <tr>
                          <th style={{border:'1px solid #000',padding:'2px',fontSize:'9px',background:'#f5f5f5'}}>Intervenant(s)</th>
                          <th style={{border:'1px solid #000',padding:'2px',fontSize:'9px',background:'#f5f5f5'}}>Matricule</th>
                          <th style={{border:'1px solid #000',padding:'2px',fontSize:'9px',background:'#f5f5f5'}}>Heures prestées</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{border:'1px solid #000',padding:'2px 3px',fontSize:'9px'}}>{fiche ? `${fiche.prenom_tech} ${fiche.nom_tech}` : ''}</td>
                          <td style={{border:'1px solid #000',padding:'2px 3px',fontSize:'9px'}}>{fiche?.matricule_tech || ''}</td>
                          <td style={{border:'1px solid #000',padding:'2px 3px',fontSize:'9px'}}>{fiche ? decToHM(fiche.heures_prestees) : ''}</td>
                        </tr>
                        {(fiche?.intervenants || []).map((iv,i) => (
                          <tr key={i}>
                            <td style={{border:'1px solid #000',padding:'2px 3px',fontSize:'9px'}}>{iv.nom_prenom}</td>
                            <td style={{border:'1px solid #000',padding:'2px 3px',fontSize:'9px'}}>{iv.matricule}</td>
                            <td style={{border:'1px solid #000',padding:'2px 3px',fontSize:'9px'}}>{iv.heures_prestees ? `${iv.heures_prestees} H` : ''}</td>
                          </tr>
                        ))}
                        {Array(Math.max(0, 4 - (fiche?.intervenants?.length||0) - 1)).fill(0).map((_,i) => (
                          <tr key={`e${i}`}><td style={{border:'1px solid #000',padding:'6px'}} colSpan={3}>&nbsp;</td></tr>
                        ))}
                      </tbody>
                    </table>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead>
                        <tr>
                          <th style={{border:'1px solid #000',padding:'2px',fontSize:'9px',background:'#f5f5f5'}} colSpan={2}>
                            Pièces de rechange TZ Nummer
                          </th>
                          <th style={{border:'1px solid #000',padding:'2px',fontSize:'9px',background:'#f5f5f5'}}>Quantité</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(pieces||[]).map((p,i) => (
                          <tr key={i}>
                            <td style={{border:'1px solid #000',padding:'2px 3px',fontSize:'9px'}} colSpan={2}>{p.tz_nummer} {p.designation ? `— ${p.designation}` : ''}</td>
                            <td style={{border:'1px solid #000',padding:'2px 3px',fontSize:'9px'}}>{p.quantite}</td>
                          </tr>
                        ))}
                        {Array(Math.max(0, 4 - (pieces||[]).length)).fill(0).map((_,i) => (
                          <tr key={`pe${i}`}><td style={{border:'1px solid #000',padding:'5px'}} colSpan={3}>&nbsp;</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <table style={{marginBottom:'0'}}>
              <tbody>
                <tr>
                  <td colSpan={4} style={{border:'1px solid #000',fontWeight:'bold',textAlign:'center',background:'#f5f5f5',padding:'2px'}}>
                    Observations
                  </td>
                </tr>
                <tr>
                  <td style={{border:'1px solid #000',padding:'3px 5px',height:'25px'}} colSpan={4}>&nbsp;</td>
                </tr>
              </tbody>
            </table>
            <table>
              <tbody>
                <tr>
                  <td style={{border:'1px solid #000',padding:'3px 5px',fontWeight:'bold',width:'33%'}}>
                    Temps d'arrêt : {minToHM(fiche?.temps_arret)}
                  </td>
                  <td style={{border:'1px solid #000',padding:'3px 5px',fontWeight:'bold',width:'34%'}}>
                    Temps d'attente : {minToHM(fiche?.temps_attente)}
                  </td>
                  <td style={{border:'1px solid #000',padding:'3px 5px',fontWeight:'bold',width:'33%'}}>
                    Temps attente pièces : {minToHM(fiche?.temps_attente_piece)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardAdmin() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rapport, setRapport] = useState(null);
  const [loadingRapport, setLoadingRapport] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    nom:'', prenom:'', matricule:'', email:'', password:'', role:'demandeur'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch {
      toast.error('Erreur chargement utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchDemandes = async () => {
    try {
      const res = await api.get('/demandes');
      setDemandes(res.data);
    } catch {
      toast.error('Erreur chargement demandes');
    }
  };

  useEffect(() => { fetchUsers(); fetchDemandes(); }, []);

  const set = (f,v) => setForm(p => ({...p,[f]:v}));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/users', form);
      toast.success(`Utilisateur ${form.prenom} ${form.nom} créé`);
      setShowForm(false);
      setForm({nom:'',prenom:'',matricule:'',email:'',password:'',role:'demandeur'});
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleEditOpen = (u) => {
    setShowForm(false);
    setEditingUser(u);
    setForm({
      nom: u.nom,
      prenom: u.prenom,
      matricule: u.matricule,
      email: u.email,
      password: '',
      role: u.role
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        matricule: form.matricule,
        email: form.email,
        role: form.role
      };
      if (form.password) payload.password = form.password;
      await api.put(`/auth/users/${editingUser.id}`, payload);
      toast.success(`Utilisateur ${form.prenom} ${form.nom} modifié`);
      setEditingUser(null);
      setForm({nom:'',prenom:'',matricule:'',email:'',password:'',role:'demandeur'});
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditingUser(null);
    setForm({nom:'',prenom:'',matricule:'',email:'',password:'',role:'demandeur'});
  };

  const toggleActif = async (u) => {
    if (u.id === currentUser.id) { toast.error('Impossible de désactiver votre propre compte'); return; }
    try {
      await api.put(`/auth/users/${u.id}`, {
        nom:u.nom, prenom:u.prenom, email:u.email, role:u.role, actif: u.actif ? 0 : 1
      });
      toast.success(u.actif ? 'Désactivé' : 'Activé');
      fetchUsers();
    } catch { toast.error('Erreur'); }
  };

  const handleRapport = async (demandeId) => {
    setLoadingRapport(demandeId);
    try {
      const res = await api.get(`/demandes/${demandeId}`);
      setRapport(res.data);
    } catch { toast.error('Erreur chargement rapport'); }
    finally { setLoadingRapport(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {rapport && <BonDeTravail data={rapport} onClose={() => setRapport(null)} />}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <div className="flex gap-2">
            <button onClick={() => { fetchUsers(); fetchDemandes(); }}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
              <RefreshCw size={16} className="text-gray-500" />
            </button>
            {tab === 'users' && (
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
                <Plus size={16} /> Nouvel utilisateur
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {[
            { key:'users',    label:'👥 Utilisateurs' },
            { key:'demandes', label:'📋 Demandes & Rapports' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'users' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {ROLES.map(r => (
                <div key={r} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-2xl font-bold text-gray-800">{users.filter(u=>u.role===r).length}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColors[r]}`}>{r}</span>
                </div>
              ))}
            </div>
            {editingUser && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><Users size={18}/> Modifier un utilisateur</h3>
                <form onSubmit={handleEditSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                      <input value={form.nom} onChange={e=>set('nom',e.target.value)} requiblue className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                      <input value={form.prenom} onChange={e=>set('prenom',e.target.value)} requiblue className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Matricule *</label>
                      <input value={form.matricule} onChange={e=>set('matricule',e.target.value)} requiblue className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} requiblue className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe (optionnel)</label>
                      <input type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Laisser vide pour ne pas changer" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                      <select value={form.role} onChange={e=>set('role',e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {ROLES.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-60">
                      {saving && <Loader2 size={14} className="animate-spin"/>}
                      {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                    <button type="button" onClick={handleEditCancel} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 transition">Annuler</button>
                  </div>
                </form>
              </div>
            )}
            {showForm && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><Users size={18}/> Créer un utilisateur</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                      <input value={form.nom} onChange={e=>set('nom',e.target.value)} requiblue className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                      <input value={form.prenom} onChange={e=>set('prenom',e.target.value)} requiblue className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Matricule *</label>
                      <input value={form.matricule} onChange={e=>set('matricule',e.target.value)} requiblue className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} requiblue className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe provisoire *</label>
                      <input type="password" value={form.password} onChange={e=>set('password',e.target.value)} requiblue className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                      <select value={form.role} onChange={e=>set('role',e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {ROLES.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-60">
                      {saving && <Loader2 size={14} className="animate-spin"/>}
                      {saving ? 'Création...' : 'Créer'}
                    </button>
                    <button type="button" onClick={()=>setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 transition">Annuler</button>
                  </div>
                </form>
              </div>
            )}
            {loading ? (
              <div className="text-center py-12 text-gray-400">Chargement...</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Matricule</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Rôle</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map(u => {
                      const isSelf = u.id === currentUser.id;
                      return (
                        <tr key={u.id} className={`hover:bg-gray-50 ${isSelf ? 'bg-blue-50/40' : ''}`}>
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {u.prenom} {u.nom}
                            {isSelf && <span className="ml-2 text-xs text-blue-500 font-normal">(vous)</span>}
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-600">{u.matricule}</td>
                          <td className="px-4 py-3 text-gray-500">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleColors[u.role]}`}>{u.role}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {u.actif ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            {isSelf ? (
                              <span className="text-xs text-gray-300 italic">—</span>
                            ) : (
                              <>
                                <button onClick={() => handleEditOpen(u)} className="text-xs underline text-purple-500 hover:text-purple-700 transition">Modifier</button>
                                <button onClick={() => toggleActif(u)} className={`text-xs underline transition ${u.actif ? 'text-blue-400 hover:text-blue-600' : 'text-green-500 hover:text-green-700'}`}>
                                  {u.actif ? 'Désactiver' : 'Activer'}
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {tab === 'demandes' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                {label:'Total',        count: demandes.length,                                   bg:'bg-gray-50'},
                {label:'En cours',     count: demandes.filter(d=>d.statut==='en_reparation').length, bg:'bg-orange-50'},
                {label:'Réparées',     count: demandes.filter(d=>d.statut==='repare').length,     bg:'bg-green-50'},
                {label:'Hors service', count: demandes.filter(d=>d.statut==='hors_service').length,bg:'bg-blue-50'},
              ].map(s => (
                <div key={s.label} className={`rounded-xl border border-gray-200 p-4 ${s.bg}`}>
                  <p className="text-2xl font-bold text-gray-800">{s.count}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">N° Bon</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Équipement</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Demandeur</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Technicien</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3"/>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {demandes.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-medium text-gray-800">{d.numero_bon}</td>
                      <td className="px-4 py-3 text-gray-700">{d.equipement}</td>
                      <td className="px-4 py-3 text-gray-500">{d.prenom_demandeur} {d.nom_demandeur}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {d.nom_tech ? `${d.prenom_tech} ${d.nom_tech}` : <span className="text-gray-300 italic text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3"><StatutBadge statut={d.statut}/></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(d.date_demande).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRapport(d.id)}
                          disabled={loadingRapport === d.id}
                          className="flex items-center gap-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                        >
                          {loadingRapport === d.id
                            ? <Loader2 size={12} className="animate-spin"/>
                            : <FileText size={12}/>
                          }
                          Rapport
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
