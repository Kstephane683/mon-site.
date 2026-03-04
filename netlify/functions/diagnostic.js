// netlify/functions/diagnostic.js
// ePerformance — Proxy Claude + Brevo
// Version 2.0 — Templates premium dark mode

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
    const ratios = { cac, ltv, payback, ratioLTV, score, marge: Math.round(marge) };

    // Failles
    const failles = [];
    if (cac === 0 && data.pub_active !== 'oui') failles.push({ t: 'Acquisition non structurée', d: 'Aucun investissement publicitaire tracé. La croissance dépend uniquement du bouche-à-oreille — fragile et non scalable.' });
    if (ratioLTV > 0 && ratioLTV < 3) failles.push({ t: `Ratio LTV:CAC insuffisant (${ratioLTV}:1)`, d: 'Chaque client rapporte moins de 3x son coût d\'acquisition. En dessous de 3:1, le modèle n\'est pas rentable à grande échelle.' });
    if (data.duree_vie_client === 'moins_1') failles.push({ t: 'Zéro rétention client', d: 'Vos clients n\'achètent qu\'une seule fois. Sans rachat, vous devez constamment acquérir de nouveaux clients pour maintenir votre CA.' });
    if (data.usage_whatsapp === 'non') failles.push({ t: 'Aucune relance client', d: 'WhatsApp n\'est pas utilisé pour relancer vos prospects et clients. C\'est le canal de conversion le plus puissant en Afrique francophone.' });
    if (data.site_web === 'non') failles.push({ t: 'Absence de présence digitale', d: 'Sans page de vente, vous ne pouvez pas convertir du trafic en clients de façon autonome et mesurable.' });
    if (marge < 25) failles.push({ t: 'Marge insuffisante pour scaler', d: `Avec ${Math.round(marge)}% de marge, augmenter les dépenses publicitaires ne sera pas rentable. La marge doit être restructurée en priorité.` });
    if (failles.length === 0) failles.push({ t: 'Structure correcte', d: 'Votre modèle présente une base saine. Des ajustements ciblés permettraient d\'accélérer significativement.' });
    const top3 = failles.slice(0, 3);

    // Recommandation
    let reco;
    if (score >= 75) reco = { label: 'Prêt pour le scaling', msg: 'Votre structure est saine. Vous êtes en position d\'accélérer avec méthode. Un plan 90 jours permettrait de doubler vos résultats.' };
    else if (score >= 50) reco = { label: 'Optimisation nécessaire', msg: 'Des failles critiques limitent votre rentabilité. Un accompagnement structuré permettrait de les corriger en 60 à 90 jours.' };
    else reco = { label: 'Restructuration prioritaire', msg: 'Votre modèle présente des risques structurels importants. Une restructuration de base est indispensable avant tout investissement supplémentaire.' };

    // Accroche par secteur
    const accroches = {
      mlm: 'Le MLM repose sur un système. Voici ce qui manque au vôtre.',
      ecommerce: 'Votre boutique attire des visiteurs. Voici pourquoi ils ne passent pas à l\'achat.',
      formation: 'Votre expertise est réelle. Voici ce qui empêche vos prospects de vous faire confiance assez vite.',
      cosmetiques: 'Vos produits ont de la valeur. Voici pourquoi vos clients n\'en parlent pas autour d\'eux.',
      restauration: 'Vos clients viennent. Voici pourquoi ils ne reviennent pas assez souvent.',
      immobilier: 'Votre portefeuille existe. Voici ce qui ralentit vos transactions.',
      services: 'Vous livrez de la qualité. Voici pourquoi vos clients ne vous recommandent pas systématiquement.',
      autre: 'Votre activité génère du chiffre. Voici ce qui limite votre croissance réelle.'
    };
    const accroche = accroches[data.secteur] || accroches['autre'];

    // Valeurs N/A enrichies
    const cacDisplay = cac > 0 ? cac.toLocaleString('fr-FR') + ' FCFA' : null;
    const cacNA = 'Non calculé — vous n\'investissez pas encore en publicité payante';
    const ratioDisplay = ratioLTV > 0 ? ratioLTV + ':1' : null;
    const ratioNA = 'Non applicable — activez une source d\'acquisition payante pour mesurer ce ratio';
    const paybackDisplay = payback > 0 ? payback + ' mois' : null;
    const paybackNA = 'Non applicable — ce délai se calcule uniquement avec un budget publicitaire';

    // Couleurs score
    const scoreColor = score >= 75 ? '#6fcf8a' : score >= 50 ? '#c9a96e' : '#e07070';
    const ratioColor = ratioLTV >= 3 ? '#6fcf8a' : ratioLTV >= 1.5 ? '#c9a96e' : '#e07070';

    // Barre de progression score
    const scoreBarWidth = score + '%';

    // ============================================================
    // 2. ENRICHISSEMENT CLAUDE
    // ============================================================
    let claudeAnalyse = '';
    try {
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: `Tu es ePerformance, cabinet stratégique en Afrique francophone. Génère un paragraphe d'analyse court (4-5 phrases) et percutant pour ce prospect.
Données : Secteur ${data.secteur}, CA ${data.ca_mensuel} FCFA/mois, ${data.clients_par_mois} clients/mois, Marge ${Math.round(marge)}%, Score ${score}/100.
Faille principale : ${top3[0]?.t}.
Recommandation : ${reco.label}.
Ton direct, expert, orienté résultats. Pas de généralités. Parle en tant que cabinet, pas en "je".`
          }]
        })
      });
      const claudeData = await claudeRes.json();
      claudeAnalyse = claudeData.content?.[0]?.text || '';
    } catch (e) {
      claudeAnalyse = reco.msg;
    }

    // ============================================================
    // 3. EMAIL PROSPECT — DARK MODE PREMIUM
    // ============================================================
    const emailProspect = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="dark"/>
<title>Votre diagnostic ePerformance</title>
<!--[if mso]><style>* { font-family: Georgia, serif !important; }</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#08080c;font-family:Arial,sans-serif;color:#edeae3;-webkit-text-size-adjust:100%;">

<!-- PRÉHEADER INVISIBLE -->
<div style="display:none;max-height:0;overflow:hidden;color:#08080c;font-size:1px;">Votre rapport stratégique personnalisé est prêt. Score ${score}/100 — ${reco.label}. &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#08080c;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td style="text-align:center;padding:0 0 32px 0;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:700;color:#c9a96e;letter-spacing:4px;">ePerformance</div>
    <div style="font-size:11px;color:#7a7a85;letter-spacing:4px;text-transform:uppercase;margin-top:6px;">Cabinet Stratégique · par K. STÉPHANE</div>
    <div style="height:1px;background:linear-gradient(to right,transparent,#1c1c22,transparent);margin-top:24px;"></div>
  </td></tr>

  <!-- ACCROCHE SECTEUR -->
  <tr><td style="padding:0 0 20px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background-color:#0c0c10;border:1px solid #1c1c22;border-left:3px solid #c9a96e;border-radius:12px;padding:20px 24px;">
      <div style="font-size:11px;color:#c9a96e;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;">Diagnostic Stratégique</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#edeae3;line-height:1.3;">Bonjour ${data.nom},</div>
      <div style="font-size:15px;color:#c9a96e;font-style:italic;margin-top:8px;line-height:1.5;">${accroche}</div>
      <div style="font-size:14px;color:#b0aaa0;margin-top:10px;line-height:1.6;">Voici votre rapport stratégique calculé à partir de vos données réelles.</div>
    </td></tr>
    </table>
  </td></tr>

  <!-- SCORE -->
  <tr><td style="padding:0 0 16px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:16px;padding:28px;text-align:center;">
      <div style="font-size:11px;color:#7a7a85;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">Score de Maturité Globale</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:72px;font-weight:700;color:${scoreColor};line-height:1;">${score}<span style="font-size:32px;">/100</span></div>
      <!-- Barre progression -->
      <table width="80%" cellpadding="0" cellspacing="0" border="0" style="margin:16px auto 0;">
      <tr>
        <td style="background-color:#1c1c22;border-radius:4px;height:8px;overflow:hidden;">
          <div style="width:${scoreBarWidth};height:8px;background-color:${scoreColor};border-radius:4px;"></div>
        </td>
      </tr>
      </table>
      <div style="font-size:15px;color:#b0aaa0;margin-top:14px;font-weight:600;">${reco.label}</div>
    </td></tr>
    </table>
  </td></tr>

  <!-- RATIOS -->
  <tr><td style="padding:0 0 16px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0 8px;">

      <!-- CAC -->
      <tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:18px 20px;">
        <div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">CAC · Coût d'Acquisition Client</div>
        <div style="font-size:11px;color:#7a7a85;margin-bottom:10px;">Ce que vous coûte chaque nouveau client</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:${cacDisplay ? '26px' : '13px'};color:${cacDisplay ? '#c9a96e' : '#9a9490'};font-weight:700;line-height:1.3;">${cacDisplay || cacNA}</div>
      </td></tr>

      <!-- LTV -->
      <tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:18px 20px;margin-top:8px;">
        <div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">LTV · Valeur Vie Client</div>
        <div style="font-size:11px;color:#7a7a85;margin-bottom:10px;">Ce qu'un client vous rapporte au total</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:${ltv > 0 ? '26px' : '13px'};color:${ltv > 0 ? '#c9a96e' : '#9a9490'};font-weight:700;">${ltv > 0 ? ltv.toLocaleString('fr-FR') + ' FCFA' : 'Non calculé — renseignez votre panier moyen'}</div>
      </td></tr>

      <!-- RATIO -->
      <tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:18px 20px;">
        <div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Ratio LTV:CAC · Rentabilité globale</div>
        <div style="font-size:11px;color:#7a7a85;margin-bottom:10px;">Seuil sain minimum : 3:1</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:${ratioDisplay ? '26px' : '13px'};color:${ratioDisplay ? ratioColor : '#9a9490'};font-weight:700;line-height:1.3;">${ratioDisplay || ratioNA}</div>
      </td></tr>

      <!-- PAYBACK -->
      <tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:18px 20px;">
        <div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Payback · Délai de remboursement</div>
        <div style="font-size:11px;color:#7a7a85;margin-bottom:10px;">Temps pour récupérer le coût d'acquisition</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:${paybackDisplay ? '26px' : '13px'};color:${paybackDisplay ? '#c9a96e' : '#9a9490'};font-weight:700;line-height:1.3;">${paybackDisplay || paybackNA}</div>
      </td></tr>

    </table>
  </td></tr>

  <!-- FAILLES -->
  <tr><td style="padding:0 0 16px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:16px;padding:24px;">
      <div style="font-size:11px;color:#7a7a85;letter-spacing:3px;text-transform:uppercase;margin-bottom:20px;">3 Failles Prioritaires Identifiées</div>
      ${top3.map((f, i) => `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:${i < top3.length - 1 ? '16px' : '0'};padding-bottom:${i < top3.length - 1 ? '16px' : '0'};border-bottom:${i < top3.length - 1 ? '1px solid #1c1c22' : 'none'};">
      <tr>
        <td width="60" valign="top">
          <div style="background-color:rgba(224,112,112,.12);border:1px solid rgba(224,112,112,.3);border-radius:8px;padding:5px 8px;font-size:11px;color:#e07070;font-weight:700;text-align:center;white-space:nowrap;">Faille ${i + 1}</div>
        </td>
        <td style="padding-left:12px;">
          <div style="font-weight:700;color:#edeae3;font-size:14px;margin-bottom:5px;">${f.t}</div>
          <div style="font-size:13px;color:#7a7a85;line-height:1.6;">${f.d}</div>
        </td>
      </tr>
      </table>`).join('')}
    </td></tr>
    </table>
  </td></tr>

  <!-- ANALYSE CLAUDE -->
  ${claudeAnalyse ? `
  <tr><td style="padding:0 0 16px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background-color:rgba(201,169,110,.06);border:1px solid rgba(201,169,110,.2);border-left:3px solid #c9a96e;border-radius:16px;padding:24px;">
      <div style="font-size:11px;color:#c9a96e;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">Analyse Stratégique</div>
      <div style="font-size:14px;color:#b0aaa0;line-height:1.8;">${claudeAnalyse}</div>
    </td></tr>
    </table>
  </td></tr>` : ''}

  <!-- ÉTAPES SUIVANTES -->
  <tr><td style="padding:0 0 16px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background-color:#0c0c10;border:1px solid #1c1c22;border-radius:16px;padding:24px;">
      <div style="font-size:11px;color:#7a7a85;letter-spacing:3px;text-transform:uppercase;margin-bottom:20px;">Ce qui se passe ensuite</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="36" valign="top"><div style="width:32px;height:32px;background-color:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.3);border-radius:8px;text-align:center;line-height:32px;font-family:Georgia,serif;font-size:16px;color:#c9a96e;font-weight:700;">1</div></td>
          <td style="padding-left:12px;padding-bottom:16px;"><div style="font-weight:700;color:#edeae3;font-size:13px;">K. Stéphane analyse votre dossier</div><div style="font-size:12px;color:#7a7a85;margin-top:3px;">Dans les 24-48h suivant votre diagnostic</div></td>
        </tr>
        <tr>
          <td width="36" valign="top"><div style="width:32px;height:32px;background-color:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.3);border-radius:8px;text-align:center;line-height:32px;font-family:Georgia,serif;font-size:16px;color:#c9a96e;font-weight:700;">2</div></td>
          <td style="padding-left:12px;padding-bottom:16px;"><div style="font-weight:700;color:#edeae3;font-size:13px;">Appel stratégique de 45 minutes</div><div style="font-size:12px;color:#7a7a85;margin-top:3px;">Si votre profil correspond, on creuse votre situation</div></td>
        </tr>
        <tr>
          <td width="36" valign="top"><div style="width:32px;height:32px;background-color:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.3);border-radius:8px;text-align:center;line-height:32px;font-family:Georgia,serif;font-size:16px;color:#c9a96e;font-weight:700;">3</div></td>
          <td style="padding-left:12px;"><div style="font-weight:700;color:#edeae3;font-size:13px;">Plan 90 jours personnalisé</div><div style="font-size:12px;color:#7a7a85;margin-top:3px;">Architecture complète de votre système d'acquisition</div></td>
        </tr>
      </table>
    </td></tr>
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:8px 0 24px 0;text-align:center;">
    <a href="https://wa.me/2250151170666?text=Bonjour%20K.%20St%C3%A9phane%2C%20j'ai%20re%C3%A7u%20mon%20diagnostic%20ePerformance%20(Score%20${score}%2F100).%20Je%20souhaite%20en%20discuter."
       style="display:inline-block;background-color:#c9a96e;color:#08080c;font-weight:700;font-size:15px;padding:18px 36px;border-radius:999px;text-decoration:none;letter-spacing:.5px;">
      Discuter de mon diagnostic sur WhatsApp →
    </a>
    <div style="font-size:12px;color:#7a7a85;margin-top:12px;">K. Stéphane vous répondra dans les 24-48h</div>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="border-top:1px solid #1c1c22;padding-top:24px;text-align:center;">
    <div style="font-size:12px;color:#7a7a85;line-height:2;">
      ePerformance · Cabinet Stratégique<br>
      <a href="https://eperformance.pro" style="color:#c9a96e;text-decoration:none;">eperformance.pro</a> · +225 01 51 17 06 66<br>
      <span style="font-size:11px;color:#4a4a55;">Ce rapport est confidentiel et généré uniquement pour ${data.nom}</span><br>
      <a href="https://eperformance.pro" style="font-size:11px;color:#4a4a55;">Se désabonner</a>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    // ============================================================
    // 4. EMAIL ADMIN — DARK MODE
    // ============================================================
    const budgetLabel = {
      'moins_100k': '< 100 000 FCFA',
      '100_300k': '100 000 – 300 000 FCFA',
      '300_600k': '300 000 – 600 000 FCFA',
      'plus_600k': '> 600 000 FCFA ⭐',
      'ne_sait_pas': 'Ne sait pas encore'
    };
    const budgetPriorite = data.budget_accompagnement === 'plus_600k' ? '⭐ PROSPECT PREMIUM' :
      data.budget_accompagnement === '300_600k' ? '✅ QUALIFIÉ' :
      data.budget_accompagnement === '100_300k' ? '🔵 À QUALIFIER' : '⚪ FAIBLE BUDGET';

    const sourcesDisplay = data.sources_acquisition || data.sources || 'Non renseigné';
    const whatsappRelance = data.usage_whatsapp || data.relance_whatsapp || 'Non renseigné';
    const blocage = data.blocage_principal || data.blocage || 'Non renseigné';
    const caMensuel = data.ca_mensuel || 'Non renseigné';
    const venteMoyenne = data.vente_moyenne || data.panier_moyen || 'Non renseigné';

    const emailAdmin = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background-color:#08080c;font-family:Arial,sans-serif;color:#edeae3;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#08080c;">
<tr><td align="center" style="padding:24px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td style="padding:0 0 20px 0;">
    <div style="font-family:Georgia,serif;font-size:24px;color:#c9a96e;font-weight:700;">ePerformance · Nouveau Diagnostic</div>
    <div style="font-size:12px;color:#7a7a85;margin-top:4px;">${new Date().toLocaleString('fr-FR')} · ${data.secteur?.toUpperCase() || 'SECTEUR N/A'}</div>
  </td></tr>

  <!-- PRIORITÉ + SCORE -->
  <tr><td style="padding:0 0 12px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td width="50%" style="padding-right:6px;">
        <div style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Score Maturité</div>
          <div style="font-family:Georgia,serif;font-size:40px;color:${scoreColor};font-weight:700;">${score}<span style="font-size:18px;">/100</span></div>
          <div style="font-size:12px;color:#b0aaa0;margin-top:4px;">${reco.label}</div>
        </div>
      </td>
      <td width="50%" style="padding-left:6px;">
        <div style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Qualification</div>
          <div style="font-size:18px;font-weight:700;color:#c9a96e;margin-top:8px;">${budgetPriorite}</div>
          <div style="font-size:12px;color:#7a7a85;margin-top:6px;">${budgetLabel[data.budget_accompagnement] || 'Non renseigné'}</div>
        </div>
      </td>
    </tr>
    </table>
  </td></tr>

  <!-- CTA WHATSAPP -->
  <tr><td style="padding:0 0 16px 0;text-align:center;">
    <a href="https://wa.me/${whatsapp}"
       style="display:inline-block;background-color:#25D366;color:#fff;font-weight:700;font-size:14px;padding:14px 28px;border-radius:999px;text-decoration:none;">
      Contacter ${data.nom} sur WhatsApp →
    </a>
  </td></tr>

  <!-- PROSPECT -->
  <tr><td style="padding:0 0 12px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;">
      <div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Prospect</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;width:40%;">Nom</td><td style="color:#edeae3;font-weight:700;font-size:13px;">${data.nom}</td></tr>
        <tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">WhatsApp</td><td><a href="https://wa.me/${whatsapp}" style="color:#c9a96e;font-size:13px;text-decoration:none;">${data.whatsapp}</a></td></tr>
        <tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">Email</td><td style="color:#edeae3;font-size:13px;">${data.email}</td></tr>
        <tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">Entreprise</td><td style="color:#edeae3;font-size:13px;">${data.entreprise}</td></tr>
        <tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">Secteur</td><td style="color:#edeae3;font-size:13px;">${data.secteur}</td></tr>
        <tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">Expérience conseil</td><td style="color:#edeae3;font-size:13px;">${data.experience_conseil || 'Non renseigné'}</td></tr>
      </table>
    </td></tr>
    </table>
  </td></tr>

  <!-- RATIOS -->
  <tr><td style="padding:0 0 12px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;">
      <div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Ratios</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;width:40%;">CAC</td><td style="color:#c9a96e;font-size:13px;">${cacDisplay || 'Pas de pub'}</td></tr>
        <tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">LTV</td><td style="color:#c9a96e;font-size:13px;">${ltv > 0 ? ltv.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td></tr>
        <tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">Payback</td><td style="color:#c9a96e;font-size:13px;">${paybackDisplay || 'N/A'}</td></tr>
        <tr><td style="color:#7a7a85;font-size:13px;padding:4px 0;">Ratio LTV:CAC</td><td style="color:${ratioColor};font-weight:700;font-size:13px;">${ratioDisplay || 'N/A'}</td></tr>
      </table>
    </td></tr>
    </table>
  </td></tr>

  <!-- FAILLES -->
  <tr><td style="padding:0 0 12px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;">
      <div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Failles Identifiées</div>
      ${top3.map((f, i) => `
      <div style="margin-bottom:${i < top3.length - 1 ? '12px' : '0'};">
        <div style="color:#e07070;font-weight:700;font-size:13px;">${i + 1}. ${f.t}</div>
        <div style="color:#7a7a85;font-size:12px;margin-top:3px;line-height:1.5;">${f.d}</div>
      </div>`).join('')}
    </td></tr>
    </table>
  </td></tr>

  <!-- DONNÉES BRUTES -->
  <tr><td style="padding:0 0 12px 0;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background-color:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;">
      <div style="font-size:10px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Données Brutes</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;width:40%;">CA mensuel</td><td style="color:#edeae3;font-size:12px;">${caMensuel} FCFA</td></tr>
        <tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Clients/mois</td><td style="color:#edeae3;font-size:12px;">${data.clients_par_mois || '0'}</td></tr>
        <tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Vente moyenne</td><td style="color:#edeae3;font-size:12px;">${venteMoyenne} FCFA</td></tr>
        <tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Marge</td><td style="color:#edeae3;font-size:12px;">${Math.round(marge)}%</td></tr>
        <tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Pub active</td><td style="color:#edeae3;font-size:12px;">${data.pub_active || 'non'}</td></tr>
        <tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Budget pub</td><td style="color:#edeae3;font-size:12px;">${bud > 0 ? bud.toLocaleString('fr-FR') + ' FCFA' : 'Pas de pub'}</td></tr>
        <tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Sources</td><td style="color:#edeae3;font-size:12px;">${sourcesDisplay}</td></tr>
        <tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Site web</td><td style="color:#edeae3;font-size:12px;">${data.site_web || 'non'}</td></tr>
        <tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">WhatsApp relance</td><td style="color:#edeae3;font-size:12px;">${whatsappRelance}</td></tr>
        <tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Budget accomp.</td><td style="color:#edeae3;font-size:12px;">${budgetLabel[data.budget_accompagnement] || 'Non renseigné'}</td></tr>
        <tr><td style="color:#7a7a85;font-size:12px;padding:3px 0;">Blocage principal</td><td style="color:#edeae3;font-size:12px;">${blocage}</td></tr>
      </table>
    </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    // ============================================================
    // 5. ENVOI EMAILS VIA BREVO
    // ============================================================
    const sendEmail = async (to, toName, subject, html) => {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': BREVO_KEY },
        body: JSON.stringify({
          sender: { name: 'ePerformance', email: 'bonjour@eperformance.pro' },
          to: [{ email: to, name: toName }],
          subject,
          htmlContent: html
        })
      });
      return res.json();
    };

    const nomProspect = data.nom || 'Prospect';
    const secteurProspect = data.secteur || '';
    const faillePrincipale = top3[0]?.t || 'faille identifiée';

    if (email) {
      await sendEmail(
        email,
        nomProspect,
        `${nomProspect} — ${faillePrincipale} freine votre croissance`,
        emailProspect
      );
    }

    await sendEmail(
      'kstephane683@gmail.com',
      'K. Stéphane',
      `Nouveau diagnostic — ${nomProspect} (${secteurProspect}) — Score ${score}/100 — ${budgetPriorite}`,
      emailAdmin
    );

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, score, reco: reco.label }) };

  } catch (err) {
    console.error('Erreur:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
