// netlify/functions/diagnostic.js
// ePerformance — Proxy Claude + Brevo
// Version 3.0 — Corrections prompt Claude + ton solo consultant

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://eperformance.pro',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const data = JSON.parse(event.body);
    const ANTHROPIC_KEY = process.env.ANTHROPICAPIKEY;
    const BREVO_KEY = process.env.BREVOAPIKEY;

    // ============================================================
    // 1. CALCULS RATIOS
    // ============================================================
    const cli = Math.max(parseFloat(data.clients_par_mois) || 1, 1);
    const pan = parseFloat(data.vente_moyenne) || parseFloat(data.panier_moyen) || 0;
    const marge = parseFloat(data.marge) || parseFloat(data.marge_pct) || 30;
    const bud = parseFloat(data.budget_pub) || 0;
    const dm = { moins_1: 1, '1_3': 2, '3_6': 4.5, '6_12': 9, plus_12: 14 };
    const duree = dm[data.duree_vie_client] || 2;
    const email = data.email || '';
    const whatsapp = (data.whatsapp || '').replace(/\D/g, '');
    const cac = bud > 0 ? Math.round(bud / cli) : 0;
    const ltv = Math.round(pan * duree);
    const margeAbs = pan * (marge / 100);
    const payback = cac > 0 && margeAbs > 0 ? Math.round(cac / margeAbs) : 0;
    const ratioLTV = cac > 0 && ltv > 0 ? Math.round((ltv / cac) * 10) / 10 : 0;

    let score = 50;
    if (ratioLTV >= 3) score += 20; else if (ratioLTV >= 1.5) score += 10; else if (ratioLTV > 0) score -= 10;
    if (data.pub_active === 'oui') score += 5;
    if (data.site_web === 'oui') score += 5;
    if (data.usage_whatsapp === 'structure' || data.usage_whatsapp === 'automatise') score += 10;
    if (data.duree_vie_client === 'plus_12') score += 10;
    else if (data.duree_vie_client === 'moins_1') score -= 10;
    score = Math.min(100, Math.max(0, score));

    // Failles
    const failles = [];
    if (cac === 0 && data.pub_active !== 'oui') failles.push({ t: 'Acquisition non structurée', d: 'Aucun investissement publicitaire trac&eacute;. La croissance d&eacute;pend uniquement du bouche-&agrave;-oreille &mdash; fragile et non scalable.' });
    if (ratioLTV > 0 && ratioLTV < 3) failles.push({ t: 'Ratio LTV:CAC insuffisant (' + ratioLTV + ':1)', d: "Chaque client rapporte moins de 3x son cout d'acquisition. En dessous de 3:1, le modele n'est pas rentable a grande echelle." });
    if (data.duree_vie_client === 'moins_1') failles.push({ t: 'Zéro rétention client', d: "Vos clients n'ach&egrave;tent qu'une seule fois. Sans rachat, vous devez constamment acqu&eacute;rir de nouveaux clients pour maintenir votre CA." });
    if (data.usage_whatsapp === 'non') failles.push({ t: 'Aucune relance client', d: "WhatsApp n'est pas utilis&eacute; pour relancer vos prospects et clients. C'est le canal de conversion le plus puissant en Afrique francophone." });
    if (data.site_web === 'non') failles.push({ t: 'Absence de présence digitale', d: 'Sans page de vente, vous ne pouvez pas convertir du trafic en clients de fa&ccedil;on autonome et mesurable.' });
    if (marge < 25) failles.push({ t: 'Marge insuffisante pour scaler', d: 'Avec ' + Math.round(marge) + '% de marge, augmenter les depenses publicitaires ne sera pas rentable. La marge doit &ecirc;tre restructur&eacute;e en priorit&eacute;.' });
    if (failles.length === 0) failles.push({ t: 'Structure correcte', d: 'Votre mod&egrave;le pr&eacute;sente une base saine. Des ajustements cibl&eacute;s permettraient d&#39;acc&eacute;l&eacute;rer significativement.' });
    const top3 = failles.slice(0, 3);

    // Recommandation
    let reco;
    if (score >= 75) reco = { label: 'Prêt pour le scaling', msg: 'Votre structure est saine. Vous &ecirc;tes en position d&#39;acc&eacute;l&eacute;rer avec m&eacute;thode. Un plan 90 jours permettrait de doubler vos r&eacute;sultats.' };
    else if (score >= 50) reco = { label: 'Optimisation nécessaire', msg: 'Des failles critiques limitent votre rentabilit&eacute;. Un accompagnement structur&eacute; permettrait de les corriger en 60 &agrave; 90 jours.' };
    else reco = { label: 'Restructuration prioritaire', msg: 'Votre mod&egrave;le pr&eacute;sente des risques structurels importants. Une restructuration de base est indispensable avant tout investissement suppl&eacute;mentaire.' };

    // Accroche par secteur
    const accroches = {
      mlm: 'Le MLM repose sur un syst&egrave;me. Voici ce qui manque au v&ocirc;tre.',
      ecommerce: "Votre boutique attire des visiteurs. Voici pourquoi ils ne passent pas &agrave; l'achat.",
      formation: 'Votre expertise est r&eacute;elle. Voici ce qui emp&ecirc;che vos prospects de vous faire confiance assez vite.',
      cosmetiques: "Vos produits ont de la valeur. Voici pourquoi vos clients n'en parlent pas autour d'eux.",
      restauration: 'Vos clients viennent. Voici pourquoi ils ne reviennent pas assez souvent.',
      immobilier: 'Votre portefeuille existe. Voici ce qui ralentit vos transactions.',
      services: 'Vous livrez de la qualit&eacute;. Voici pourquoi vos clients ne vous recommandent pas syst&eacute;matiquement.',
      autre: 'Votre activit&eacute; g&eacute;n&egrave;re du chiffre. Voici ce qui limite votre croissance r&eacute;elle.'
    };
    const accroche = accroches[data.secteur] || accroches['autre'];

    // Valeurs N/A enrichies
    const cacDisplay = cac > 0 ? cac.toLocaleString('fr-FR') + ' FCFA' : null;
    const cacNA = "Non calcul&eacute; &mdash; vous n'investissez pas encore en publicit&eacute; payante";
    const ratioDisplay = ratioLTV > 0 ? ratioLTV + ':1' : null;
    const ratioNA = "Non applicable &mdash; activez une source d'acquisition payante pour mesurer ce ratio";
    const paybackDisplay = payback > 0 ? payback + ' mois' : null;
    const paybackNA = 'Non applicable &mdash; ce d&eacute;lai se calcule uniquement avec un budget publicitaire';

    // Couleurs score
    const scoreColor = score >= 75 ? '#6fcf8a' : score >= 50 ? '#c9a96e' : '#e07070';
    const ratioColor = ratioLTV >= 3 ? '#6fcf8a' : ratioLTV >= 1.5 ? '#c9a96e' : '#e07070';
    const scoreBarWidth = score + '%';

    // Donnees brutes
    const caMensuelRaw = parseFloat(data.ca_mensuel) || null;
    const caMensuel = caMensuelRaw ? caMensuelRaw.toLocaleString('fr-FR') + ' FCFA' : 'Non renseign&eacute;';
    const venteMoyenneRaw = parseFloat(data.vente_moyenne || data.panier_moyen) || null;
    const venteMoyenneDisplay = venteMoyenneRaw ? venteMoyenneRaw.toLocaleString('fr-FR') + ' FCFA' : 'Non renseign&eacute;';
    const sourcesRaw = data.sources_acquisition || data.sources || '';
    const sourcesMap = {
      bouche_a_oreille: 'Bouche-a-oreille',
      whatsapp: 'WhatsApp',
      reseaux_organiques: 'Reseaux sociaux organiques',
      seo_google: 'SEO / Google',
      facebook_ads: 'Facebook Ads',
      tiktok_organique: 'TikTok organique',
      autres: 'Autres'
    };
    const sourcesDisplay = sourcesRaw
      ? sourcesRaw.split(',').map(function(s) { return sourcesMap[s.trim()] || s.trim(); }).join(', ')
      : 'Non renseign&eacute;';
    const whatsappRelance = data.usage_whatsapp || data.relance_whatsapp || 'Non renseign&eacute;';
    const blocage = data.blocage_principal || data.blocage || 'Non renseign&eacute;';

    // Budget qualification
    const budgetLabel = {
      'moins_100k': '< 100 000 FCFA',
      '100_300k': '100 000 - 300 000 FCFA',
      '300_600k': '300 000 - 600 000 FCFA',
      'plus_600k': '> 600 000 FCFA',
      'ne_sait_pas': 'Ne sait pas encore'
    };
    const budgetPriorite = data.budget_accompagnement === 'plus_600k' ? 'PROSPECT PREMIUM' :
      data.budget_accompagnement === '300_600k' ? 'QUALIFIE' :
      data.budget_accompagnement === '100_300k' ? 'A QUALIFIER' : 'FAIBLE BUDGET';

    // ============================================================
    // 2. ENRICHISSEMENT CLAUDE
    // ============================================================
    let claudeAnalyse = '';
    try {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: 'Tu es K. Stephane, consultant strategique independant specialise en acquisition et rentabilite pour les entrepreneurs en Afrique francophone. Genere un paragraphe analyse court de 4 a 5 phrases maximum et percutant pour ce prospect. Donnees : Secteur ' + (data.secteur || 'non precise') + ', CA ' + (data.ca_mensuel || 'non renseigne') + ' FCFA par mois, ' + (data.clients_par_mois || '0') + ' clients par mois, Marge ' + Math.round(marge) + ' pourcent, Score ' + score + ' sur 100. Faille principale : ' + (top3[0] ? top3[0].t : 'non identifiee') + '. Recommandation : ' + reco.label + '. Ton direct, expert, oriente resultats concrets. Pas de generalites. Parle en tant que consultant, utilise je avec autorite. Termine par une phrase invitant a contacter par WhatsApp. Reponds uniquement en texte brut. Zero markdown. Zero asterisque. Zero symbole gras. Zero titre.'
          }]
        })
      });
      const claudeData = await claudeRes.json();
      if (claudeData.content && claudeData.content[0] && claudeData.content[0].text) {
        claudeAnalyse = claudeData.content[0].text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#/g, '');
      }
    } catch (e) {
      claudeAnalyse = reco.msg;
    }

    // ============================================================
    // 3. EMAIL PROSPECT
    // ============================================================
    const nomProspect = data.nom || 'Prospect';

    const emailProspect = [
      '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Votre diagnostic ePerformance</title></head>',
      '<body style="margin:0;padding:0;background-color:#08080c;font-family:Arial,sans-serif;color:#edeae3;">',
      '<div style="display:none;max-height:0;overflow:hidden;color:#08080c;font-size:1px;">Votre rapport strategique personnalise est pret. Score ' + score + '/100.</div>',
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#08080c;"><tr><td align="center" style="padding:32px 16px;">',
      '<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">',

      // HEADER
      '<tr><td style="text-align:center;padding:0 0 32px 0;">',
      '<div style="font-family:Georgia,serif;font-size:32px;font-weight:700;color:#c9a96e;letter-spacing:4px;">ePerformance</div>',
      '<div style="font-size:11px;color:#7a7a85;letter-spacing:4px;text-transform:uppercase;margin-top:6px;">Consultant Strategique — K. STEPHANE</div>',
      '<div style="height:1px;background:#1c1c22;margin-top:24px;"></div>',
      '</td></tr>',

      // ACCROCHE
      '<tr><td style="padding:0 0 20px 0;">',
      '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#0c0c10;border:1px solid #1c1c22;border-left:3px solid #c9a96e;border-radius:12px;padding:20px 24px;">',
      '<div style="font-size:11px;color:#c9a96e;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;">Diagnostic Strategique</div>',
      '<div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#edeae3;line-height:1.3;">Bonjour ' + nomProspect + ',</div>',
      '<div style="font-size:15px;color:#c9a96e;font-style:italic;margin-top:8px;line-height:1.5;">' + accroche + '</div>',
      '<div style="font-size:14px;color:#b0aaa0;margin-top:10px;line-height:1.6;">Voici votre rapport strategique calcule a partir de vos donnees reelles.</div>',
      '</td></tr></table></td></tr>',

      // SCORE
      '<tr><td style="padding:0 0 16px 0;">',
      '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:16px;padding:28px;text-align:center;">',
      '<div style="font-size:11px;color:#7a7a85;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">Score de Maturite Globale</div>',
      '<div style="font-family:Georgia,serif;font-size:72px;font-weight:700;color:' + scoreColor + ';line-height:1;">' + score + '<span style="font-size:32px;">/100</span></div>',
      '<table width="80%" cellpadding="0" cellspacing="0" border="0" style="margin:16px auto 0;"><tr><td style="background-color:#1c1c22;border-radius:4px;height:8px;overflow:hidden;"><div style="width:' + scoreBarWidth + ';height:8px;background-color:' + scoreColor + ';border-radius:4px;"></div></td></tr></table>',
      '<div style="font-size:15px;color:#b0aaa0;margin-top:14px;font-weight:600;">' + reco.label + '</div>',
      '</td></tr></table></td></tr>',

      // CAC
      '<tr><td style="padding:0 0 8px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:18px 20px;">',
      '<div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">CAC — Cout Acquisition Client</div>',
      '<div style="font-size:11px;color:#7a7a85;margin-bottom:10px;">Ce que vous coute chaque nouveau client</div>',
      '<div style="font-family:Georgia,serif;font-size:' + (cacDisplay ? '26px' : '13px') + ';color:' + (cacDisplay ? '#c9a96e' : '#9a9490') + ';font-weight:700;line-height:1.3;">' + (cacDisplay || cacNA) + '</div>',
      '</td></tr></table></td></tr>',

      // LTV
      '<tr><td style="padding:0 0 8px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:18px 20px;">',
      '<div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">LTV — Valeur Vie Client</div>',
      '<div style="font-size:11px;color:#7a7a85;margin-bottom:10px;">Ce qu un client vous rapporte au total</div>',
      '<div style="font-family:Georgia,serif;font-size:' + (ltv > 0 ? '26px' : '13px') + ';color:' + (ltv > 0 ? '#c9a96e' : '#9a9490') + ';font-weight:700;">' + (ltv > 0 ? ltv.toLocaleString('fr-FR') + ' FCFA' : 'Non calcule — renseignez votre panier moyen') + '</div>',
      '</td></tr></table></td></tr>',

      // RATIO
      '<tr><td style="padding:0 0 8px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:18px 20px;">',
      '<div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Ratio LTV:CAC — Rentabilite globale</div>',
      '<div style="font-size:11px;color:#7a7a85;margin-bottom:10px;">Seuil sain minimum : 3:1</div>',
      '<div style="font-family:Georgia,serif;font-size:' + (ratioDisplay ? '26px' : '13px') + ';color:' + (ratioDisplay ? ratioColor : '#9a9490') + ';font-weight:700;line-height:1.3;">' + (ratioDisplay || ratioNA) + '</div>',
      '</td></tr></table></td></tr>',

      // PAYBACK
      '<tr><td style="padding:0 0 16px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:18px 20px;">',
      '<div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Payback — Delai de remboursement</div>',
      '<div style="font-size:11px;color:#7a7a85;margin-bottom:10px;">Temps pour recuperer le cout d acquisition</div>',
      '<div style="font-family:Georgia,serif;font-size:' + (paybackDisplay ? '26px' : '13px') + ';color:' + (paybackDisplay ? '#c9a96e' : '#9a9490') + ';font-weight:700;line-height:1.3;">' + (paybackDisplay || paybackNA) + '</div>',
      '</td></tr></table></td></tr>',

      // FAILLES
      '<tr><td style="padding:0 0 16px 0;">',
      '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:16px;padding:24px;">',
      '<div style="font-size:11px;color:#7a7a85;letter-spacing:3px;text-transform:uppercase;margin-bottom:20px;">3 Failles Prioritaires Identifiees</div>',
      top3.map(function(f, i) {
        var borderBottom = i < top3.length - 1 ? 'border-bottom:1px solid #1c1c22;padding-bottom:16px;margin-bottom:16px;' : '';
        return '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="' + borderBottom + '">' +
          '<tr><td width="60" valign="top"><div style="background-color:rgba(224,112,112,.12);border:1px solid rgba(224,112,112,.3);border-radius:8px;padding:5px 8px;font-size:11px;color:#e07070;font-weight:700;text-align:center;white-space:nowrap;">Faille ' + (i+1) + '</div></td>' +
          '<td style="padding-left:12px;"><div style="font-weight:700;color:#edeae3;font-size:14px;margin-bottom:5px;">' + f.t + '</div><div style="font-size:13px;color:#7a7a85;line-height:1.6;">' + f.d + '</div></td></tr></table>';
      }).join(''),
      '</td></tr></table></td></tr>',

      // ANALYSE CLAUDE
      claudeAnalyse ? (
        '<tr><td style="padding:0 0 16px 0;">' +
        '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:rgba(201,169,110,.06);border:1px solid rgba(201,169,110,.2);border-left:3px solid #c9a96e;border-radius:16px;padding:24px;">' +
        '<div style="font-size:11px;color:#c9a96e;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">Analyse de K. Stephane</div>' +
        '<div style="font-size:14px;color:#b0aaa0;line-height:1.8;">' + claudeAnalyse + '</div>' +
        '</td></tr></table></td></tr>'
      ) : '',

      // ETAPES SUIVANTES
      '<tr><td style="padding:0 0 16px 0;">',
      '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#0c0c10;border:1px solid #1c1c22;border-radius:16px;padding:24px;">',
      '<div style="font-size:11px;color:#7a7a85;letter-spacing:3px;text-transform:uppercase;margin-bottom:20px;">Ce qui se passe ensuite</div>',
      '<table width="100%" cellpadding="0" cellspacing="0" border="0">',
      '<tr><td width="36" valign="top"><div style="width:32px;height:32px;background-color:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.3);border-radius:8px;text-align:center;line-height:32px;font-family:Georgia,serif;font-size:16px;color:#c9a96e;font-weight:700;">1</div></td><td style="padding-left:12px;padding-bottom:16px;"><div style="font-weight:700;color:#edeae3;font-size:13px;">J analyse votre dossier</div><div style="font-size:12px;color:#7a7a85;margin-top:3px;">Dans les 24-48h suivant votre diagnostic</div></td></tr>',
      '<tr><td width="36" valign="top"><div style="width:32px;height:32px;background-color:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.3);border-radius:8px;text-align:center;line-height:32px;font-family:Georgia,serif;font-size:16px;color:#c9a96e;font-weight:700;">2</div></td><td style="padding-left:12px;padding-bottom:16px;"><div style="font-weight:700;color:#edeae3;font-size:13px;">Appel strategique de 45 minutes</div><div style="font-size:12px;color:#7a7a85;margin-top:3px;">Si votre profil correspond, on creuse votre situation</div></td></tr>',
      '<tr><td width="36" valign="top"><div style="width:32px;height:32px;background-color:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.3);border-radius:8px;text-align:center;line-height:32px;font-family:Georgia,serif;font-size:16px;color:#c9a96e;font-weight:700;">3</div></td><td style="padding-left:12px;"><div style="font-weight:700;color:#edeae3;font-size:13px;">Plan 90 jours personnalise</div><div style="font-size:12px;color:#7a7a85;margin-top:3px;">Architecture complete de votre systeme d acquisition</div></td></tr>',
      '</table></td></tr></table></td></tr>',

      // CTA
      '<tr><td style="padding:8px 0 24px 0;text-align:center;">',
      '<a href="https://wa.me/2250151170666" style="display:inline-block;background-color:#c9a96e;color:#08080c;font-weight:700;font-size:15px;padding:18px 36px;border-radius:999px;text-decoration:none;letter-spacing:.5px;">Discuter de mon diagnostic sur WhatsApp</a>',
      '<div style="font-size:12px;color:#7a7a85;margin-top:12px;">Je vous repondrai dans les 24-48h</div>',
      '</td></tr>',

      // FOOTER
      '<tr><td style="border-top:1px solid #1c1c22;padding-top:24px;text-align:center;">',
      '<div style="font-size:12px;color:#7a7a85;line-height:2;">ePerformance — Consultant Strategique Independant<br>',
      '<a href="https://eperformance.pro" style="color:#c9a96e;text-decoration:none;">eperformance.pro</a> — +225 01 51 17 06 66<br>',
      '<span style="font-size:11px;color:#4a4a55;">Ce rapport est confidentiel et genere uniquement pour ' + nomProspect + '</span><br>',
      '<a href="https://eperformance.pro" style="font-size:11px;color:#4a4a55;">Se desabonner</a></div>',
      '</td></tr>',

      '</table></td></tr></table></body></html>'
    ].join('');

    // ============================================================
    // 4. EMAIL ADMIN
    // ============================================================
    const emailAdmin = [
      '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/></head>',
      '<body style="margin:0;padding:0;background-color:#08080c;font-family:Arial,sans-serif;color:#edeae3;">',
      '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#08080c;"><tr><td align="center" style="padding:24px 16px;">',
      '<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">',

      '<tr><td style="padding:0 0 20px 0;">',
      '<div style="font-family:Georgia,serif;font-size:24px;color:#c9a96e;font-weight:700;">ePerformance — Nouveau Diagnostic</div>',
      '<div style="font-size:12px;color:#7a7a85;margin-top:4px;">' + new Date().toLocaleString('fr-FR') + ' — ' + (data.secteur || '').toUpperCase() + '</div>',
      '</td></tr>',

      '<tr><td style="padding:0 0 12px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>',
      '<td width="50%" style="padding-right:6px;"><div style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:16px;text-align:center;">',
      '<div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Score Maturite</div>',
      '<div style="font-family:Georgia,serif;font-size:40px;color:' + scoreColor + ';font-weight:700;">' + score + '<span style="font-size:18px;">/100</span></div>',
      '<div style="font-size:12px;color:#b0aaa0;margin-top:4px;">' + reco.label + '</div></div></td>',
      '<td width="50%" style="padding-left:6px;"><div style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:16px;text-align:center;">',
      '<div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Qualification</div>',
      '<div style="font-size:16px;font-weight:700;color:#c9a96e;margin-top:8px;">' + budgetPriorite + '</div>',
      '<div style="font-size:12px;color:#7a7a85;margin-top:6px;">' + (budgetLabel[data.budget_accompagnement] || 'Non renseign&eacute;') + '</div></div></td>',
      '</tr></table></td></tr>',

      '<tr><td style="padding:0 0 16px 0;text-align:center;">',
      '<a href="https://wa.me/' + whatsapp + '" style="display:inline-block;background-color:#25D366;color:#fff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:999px;text-decoration:none;">Contacter ' + nomProspect + ' sur WhatsApp</a>',
      '</td></tr>',

      '<tr><td style="padding:0 0 12px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;">',
      '<div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Prospect</div>',
      '<table width="100%" cellpadding="0" cellspacing="0" border="0">',
      '<tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;width:40%;">Nom</td><td style="color:#edeae3;font-weight:700;font-size:13px;">' + nomProspect + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">WhatsApp</td><td><a href="https://wa.me/' + whatsapp + '" style="color:#c9a96e;font-size:13px;text-decoration:none;">' + (data.whatsapp || 'Non renseign&eacute;') + '</a></td></tr>',
      '<tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">Email</td><td style="color:#edeae3;font-size:13px;">' + email + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">Entreprise</td><td style="color:#edeae3;font-size:13px;">' + (data.entreprise || 'Non renseign&eacute;') + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">Secteur</td><td style="color:#edeae3;font-size:13px;">' + (data.secteur || 'Non renseign&eacute;') + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">Experience conseil</td><td style="color:#edeae3;font-size:13px;">' + (data.experience_conseil || 'Non renseign&eacute;') + '</td></tr>',
      '</table></td></tr></table></td></tr>',

      '<tr><td style="padding:0 0 12px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;">',
      '<div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Ratios</div>',
      '<table width="100%" cellpadding="0" cellspacing="0" border="0">',
      '<tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;width:40%;">CAC</td><td style="color:#c9a96e;font-size:13px;">' + (cacDisplay || 'Pas de pub') + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">LTV</td><td style="color:#c9a96e;font-size:13px;">' + (ltv > 0 ? ltv.toLocaleString('fr-FR') + ' FCFA' : 'N/A') + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">Payback</td><td style="color:#c9a96e;font-size:13px;">' + (paybackDisplay || 'N/A') + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">Ratio LTV:CAC</td><td style="color:' + ratioColor + ';font-weight:700;font-size:13px;">' + (ratioDisplay || 'N/A') + '</td></tr>',
      '</table></td></tr></table></td></tr>',

      '<tr><td style="padding:0 0 12px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;">',
      '<div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Failles Identifiees</div>',
      top3.map(function(f, i) {
        return '<div style="margin-bottom:' + (i < top3.length - 1 ? '12px' : '0') + ';">' +
          '<div style="color:#e07070;font-weight:700;font-size:13px;">' + (i+1) + '. ' + f.t + '</div>' +
          '<div style="color:#7a7a85;font-size:12px;margin-top:3px;line-height:1.5;">' + f.d + '</div></div>';
      }).join(''),
      '</td></tr></table></td></tr>',

      '<tr><td style="padding:0 0 12px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;">',
      '<div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Donnees Brutes</div>',
      '<table width="100%" cellpadding="0" cellspacing="0" border="0">',
      '<tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;width:40%;">CA mensuel</td><td style="color:#edeae3;font-size:12px;">' + caMensuel + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Clients/mois</td><td style="color:#edeae3;font-size:12px;">' + (data.clients_par_mois || '0') + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Vente moyenne</td><td style="color:#edeae3;font-size:12px;">' + venteMoyenneDisplay + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Marge</td><td style="color:#edeae3;font-size:12px;">' + Math.round(marge) + '%</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Pub active</td><td style="color:#edeae3;font-size:12px;">' + (data.pub_active || 'non') + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Budget pub</td><td style="color:#edeae3;font-size:12px;">' + (bud > 0 ? bud.toLocaleString('fr-FR') + ' FCFA' : 'Pas de pub') + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Sources</td><td style="color:#edeae3;font-size:12px;">' + sourcesDisplay + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Site web</td><td style="color:#edeae3;font-size:12px;">' + (data.site_web || 'non') + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">WhatsApp relance</td><td style="color:#edeae3;font-size:12px;">' + whatsappRelance + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Budget accomp.</td><td style="color:#edeae3;font-size:12px;">' + (budgetLabel[data.budget_accompagnement] || 'Non renseign&eacute;') + '</td></tr>',
      '<tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Blocage principal</td><td style="color:#edeae3;font-size:12px;">' + blocage + '</td></tr>',
      '</table></td></tr></table></td></tr>',

      '</table></td></tr></table></body></html>'
    ].join('');

    // ============================================================
    // 5. ENVOI EMAILS VIA BREVO
    // ============================================================
    const sendEmail = async function(to, toName, subject, html) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': BREVO_KEY },
        body: JSON.stringify({
          sender: { name: 'K. Stephane — ePerformance', email: 'bonjour@eperformance.pro' },
          to: [{ email: to, name: toName }],
          subject: subject,
          htmlContent: html
        })
      });
      return res.json();
    };

    // Nettoyer les entites HTML pour les sujets email (texte brut)
    const stripHtml = function(str) {
      return str
        .replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è').replace(/&ecirc;/g, 'ê')
        .replace(/&agrave;/g, 'à').replace(/&acirc;/g, 'â').replace(/&ocirc;/g, 'ô')
        .replace(/&ucirc;/g, 'û').replace(/&ccedil;/g, 'ç').replace(/&icirc;/g, 'î')
        .replace(/&Eacute;/g, 'É').replace(/&mdash;/g, '-').replace(/&ndash;/g, '-')
        .replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
    };
    const faillePrincipale = top3[0] ? stripHtml(top3[0].t) : 'faille identifiée';

    if (email) {
      await sendEmail(
        email,
        nomProspect,
        nomProspect + ' — ' + faillePrincipale + ' freine votre croissance',
        emailProspect
      );
    }

    await sendEmail(
      'kstephane683@gmail.com',
      'K. Stephane',
      'Nouveau diagnostic — ' + nomProspect + ' (' + (data.secteur || '') + ') — Score ' + score + '/100 — ' + budgetPriorite,
      emailAdmin
    );

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, score: score, reco: reco.label }) };

  } catch (err) {
    console.error('Erreur:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
