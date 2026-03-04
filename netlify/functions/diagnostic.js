// netlify/functions/diagnostic.js
// ePerformance — Proxy Claude + Brevo
// Version Production — Netlify Functions

exports.handler = async (event) => {
  // CORS
  const headers = {
    'Access-Control-Allow-Origin': 'https://eperformance.pro',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const data = JSON.parse(event.body);
    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    const BREVO_KEY = process.env.BREVO_API_KEY;

    // ============================================================
    // 1. CALCULS RATIOS
    // ============================================================
    const cli = Math.max(parseFloat(data.clients_par_mois) || 1, 1);
    const pan = parseFloat(data.panier_moyen) || 0;
    const marge = parseFloat(data.marge_pct) || 30;
    const bud = parseFloat(data.budget_pub) || 0;
    const dm = { moins_1: 1, '1_3': 2, '3_6': 4.5, '6_12': 9, plus_12: 14 };
    const duree = dm[data.duree_vie_client] || 2;
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
    if (cac === 0 && data.pub_active !== 'oui') failles.push({ t: 'Acquisition non structurée', d: 'Aucun investissement publicitaire tracé. La croissance dépend uniquement du bouche-à-oreille.' });
    if (ratioLTV > 0 && ratioLTV < 3) failles.push({ t: `Ratio LTV:CAC insuffisant (${ratioLTV}:1)`, d: 'Chaque client rapporte moins de 3x son coût d\'acquisition. Seuil sain : 3:1.' });
    if (data.duree_vie_client === 'moins_1') failles.push({ t: 'Zéro rétention client', d: 'Vos clients n\'achètent qu\'une seule fois. Sans rachat, vous devez constamment en acquérir de nouveaux.' });
    if (data.usage_whatsapp === 'non') failles.push({ t: 'Aucune relance client', d: 'WhatsApp n\'est pas utilisé pour relancer vos prospects et clients.' });
    if (data.site_web === 'non') failles.push({ t: 'Absence de présence digitale', d: 'Sans page de vente, vous ne pouvez pas convertir du trafic en clients de façon autonome.' });
    if (marge < 25) failles.push({ t: 'Marge trop faible pour scaler', d: `Avec ${Math.round(marge)}% de marge, le modèle ne supporte pas une augmentation des dépenses publicitaires.` });
    if (failles.length === 0) failles.push({ t: 'Structure correcte', d: 'Votre modèle présente une base saine. Des ajustements ciblés amélioreraient la rentabilité.' });
    const top3 = failles.slice(0, 3);

    // Recommandation
    let reco;
    if (score >= 75) reco = { label: 'Prêt pour le scaling', msg: 'Votre structure est saine. Vous êtes en position d\'accélérer avec méthode. Un plan 90 jours est recommandé.' };
    else if (score >= 50) reco = { label: 'Optimisation nécessaire', msg: 'Des failles critiques limitent votre rentabilité. Un accompagnement permettrait de les corriger en 60 à 90 jours.' };
    else reco = { label: 'Restructuration prioritaire', msg: 'Votre modèle présente des risques structurels importants. Une restructuration de base est indispensable avant tout investissement.' };

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
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: `Tu es ePerformance, cabinet stratégique. Génère un paragraphe d'analyse court (4-5 phrases max) et percutant pour ce prospect.
Données : Secteur ${data.secteur}, CA ${data.ca_mensuel} FCFA/mois, ${data.clients_par_mois} clients/mois, Marge ${Math.round(marge)}%, Score ${score}/100.
Faille principale : ${top3[0]?.t}.
Recommandation : ${reco.label}.
Ton direct, expert, orienté résultats. Pas de généralités. Pas de "je" — parle en tant que cabinet.`
          }]
        })
      });
      const claudeData = await claudeRes.json();
      claudeAnalyse = claudeData.content?.[0]?.text || '';
    } catch (e) {
      claudeAnalyse = reco.msg;
    }

    // ============================================================
    // 3. EMAIL PROSPECT — HTML PREMIUM
    // ============================================================
    const scoreColor = score >= 75 ? '#6fcf8a' : score >= 50 ? '#c9a96e' : '#e07070';
    const ratioColor = ratioLTV >= 3 ? '#6fcf8a' : ratioLTV >= 1.5 ? '#c9a96e' : '#e07070';

    const emailProspect = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Votre diagnostic ePerformance</title></head>
<body style="margin:0;padding:0;background:#08080c;font-family:'DM Sans',Arial,sans-serif;color:#edeae3;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">

  <!-- HEADER -->
  <div style="text-align:center;margin-bottom:40px;">
    <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#c9a96e;letter-spacing:2px;">ePerformance</div>
    <div style="font-size:11px;color:#7a7a85;letter-spacing:3px;text-transform:uppercase;margin-top:4px;">Cabinet Stratégique · par K. STÉPHANE</div>
  </div>

  <!-- TITRE -->
  <div style="background:#0c0c10;border:1px solid #1c1c22;border-radius:16px;padding:32px;margin-bottom:24px;text-align:center;">
    <div style="font-size:12px;color:#c9a96e;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">Diagnostic Stratégique</div>
    <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;line-height:1.2;">Bonjour ${data.nom},</div>
    <div style="color:#b0aaa0;margin-top:12px;font-size:15px;line-height:1.6;">Voici votre rapport stratégique personnalisé.<br>Calculé à partir de vos données réelles.</div>
  </div>

  <!-- SCORE -->
  <div style="background:#101014;border:1px solid #1c1c22;border-radius:16px;padding:28px;margin-bottom:16px;text-align:center;">
    <div style="font-size:11px;color:#7a7a85;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;">Score de Maturité</div>
    <div style="font-family:Georgia,serif;font-size:64px;font-weight:700;color:${scoreColor};line-height:1;">${score}<span style="font-size:28px;">/100</span></div>
    <div style="margin-top:12px;font-size:14px;color:#b0aaa0;">${reco.label}</div>
  </div>

  <!-- RATIOS -->
  <div style="display:grid;gap:12px;margin-bottom:16px;">
    <div style="background:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:11px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;">CAC · Coût d'Acquisition Client</div>
        <div style="font-size:11px;color:#7a7a85;margin-top:2px;">Ce que vous coûte chaque nouveau client</div>
      </div>
      <div style="font-family:Georgia,serif;font-size:22px;color:#c9a96e;font-weight:700;">${cac > 0 ? cac.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</div>
    </div>
    <div style="background:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:11px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;">LTV · Valeur Vie Client</div>
        <div style="font-size:11px;color:#7a7a85;margin-top:2px;">Ce qu'un client vous rapporte au total</div>
      </div>
      <div style="font-family:Georgia,serif;font-size:22px;color:#c9a96e;font-weight:700;">${ltv > 0 ? ltv.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</div>
    </div>
    <div style="background:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:11px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;">Ratio LTV:CAC</div>
        <div style="font-size:11px;color:#7a7a85;margin-top:2px;">Seuil sain minimum : 3:1</div>
      </div>
      <div style="font-family:Georgia,serif;font-size:22px;color:${ratioColor};font-weight:700;">${ratioLTV > 0 ? ratioLTV + ':1' : 'N/A'}</div>
    </div>
    <div style="background:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:11px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;">Payback</div>
        <div style="font-size:11px;color:#7a7a85;margin-top:2px;">Délai de remboursement du coût client</div>
      </div>
      <div style="font-family:Georgia,serif;font-size:22px;color:#c9a96e;font-weight:700;">${payback > 0 ? payback + ' mois' : 'N/A'}</div>
    </div>
  </div>

  <!-- FAILLES -->
  <div style="background:#101014;border:1px solid #1c1c22;border-radius:16px;padding:28px;margin-bottom:16px;">
    <div style="font-size:11px;color:#7a7a85;letter-spacing:3px;text-transform:uppercase;margin-bottom:20px;">3 Failles Prioritaires Identifiées</div>
    ${top3.map((f, i) => `
    <div style="margin-bottom:${i < top3.length - 1 ? '16px' : '0'};padding-bottom:${i < top3.length - 1 ? '16px' : '0'};border-bottom:${i < top3.length - 1 ? '1px solid #1c1c22' : 'none'};">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <div style="background:rgba(224,112,112,.12);border:1px solid rgba(224,112,112,.3);border-radius:8px;padding:4px 10px;font-size:12px;color:#e07070;font-weight:700;white-space:nowrap;">Faille ${i + 1}</div>
        <div>
          <div style="font-weight:600;color:#edeae3;margin-bottom:4px;">${f.t}</div>
          <div style="font-size:13px;color:#7a7a85;line-height:1.5;">${f.d}</div>
        </div>
      </div>
    </div>`).join('')}
  </div>

  <!-- ANALYSE CLAUDE -->
  ${claudeAnalyse ? `
  <div style="background:rgba(201,169,110,.06);border:1px solid rgba(201,169,110,.2);border-left:3px solid #c9a96e;border-radius:16px;padding:24px;margin-bottom:16px;">
    <div style="font-size:11px;color:#c9a96e;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">Analyse Stratégique</div>
    <div style="font-size:14px;color:#b0aaa0;line-height:1.75;">${claudeAnalyse}</div>
  </div>` : ''}

  <!-- CTA -->
  <div style="text-align:center;margin-bottom:32px;">
    <a href="https://wa.me/2250151170666?text=Bonjour%20K.%20St%C3%A9phane%2C%20j'ai%20reçu%20mon%20diagnostic%20ePerformance%20(Score%20${score}/100).%20Je%20souhaite%20en%20discuter."
       style="display:inline-block;background:#c9a96e;color:#08080c;font-weight:700;font-size:15px;padding:16px 32px;border-radius:999px;text-decoration:none;">
      Discuter de mon diagnostic sur WhatsApp →
    </a>
    <div style="font-size:12px;color:#7a7a85;margin-top:12px;">K. Stéphane vous répondra dans les 24-48h</div>
  </div>

  <!-- FOOTER -->
  <div style="text-align:center;border-top:1px solid #1c1c22;padding-top:24px;">
    <div style="font-size:12px;color:#7a7a85;line-height:1.8;">
      ePerformance · Cabinet Stratégique<br>
      <a href="https://eperformance.pro" style="color:#c9a96e;">eperformance.pro</a> · +225 01 51 17 06 66<br>
      <span style="font-size:11px;">Ce rapport est confidentiel et généré uniquement pour ${data.nom}</span>
    </div>
  </div>

</div>
</body></html>`;

    // ============================================================
    // 4. EMAIL ADMIN — NOTIFICATION COMPLÈTE
    // ============================================================
    const emailAdmin = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#08080c;font-family:Arial,sans-serif;color:#edeae3;">
<div style="max-width:600px;margin:0 auto;padding:32px 20px;">
  <div style="font-family:Georgia,serif;font-size:22px;color:#c9a96e;margin-bottom:4px;">ePerformance · Nouveau Diagnostic</div>
  <div style="font-size:12px;color:#7a7a85;margin-bottom:24px;">${new Date().toLocaleString('fr-FR')}</div>

  <div style="background:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;margin-bottom:16px;">
    <div style="font-size:11px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Prospect</div>
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr><td style="color:#7a7a85;padding:4px 0;width:40%;">Nom</td><td style="color:#edeae3;font-weight:600;">${data.nom}</td></tr>
      <tr><td style="color:#7a7a85;padding:4px 0;">WhatsApp</td><td><a href="https://wa.me/${(data.whatsapp || '').replace(/\D/g, '')}" style="color:#c9a96e;">${data.whatsapp}</a></td></tr>
      <tr><td style="color:#7a7a85;padding:4px 0;">Email</td><td style="color:#edeae3;">${data.email}</td></tr>
      <tr><td style="color:#7a7a85;padding:4px 0;">Entreprise</td><td style="color:#edeae3;">${data.entreprise}</td></tr>
      <tr><td style="color:#7a7a85;padding:4px 0;">Secteur</td><td style="color:#edeae3;">${data.secteur}</td></tr>
    </table>
  </div>

  <div style="background:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;margin-bottom:16px;">
    <div style="font-size:11px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Ratios</div>
    <table style="width:100%;font-size:14px;border-collapse:collapse;">
      <tr><td style="color:#7a7a85;padding:4px 0;width:40%;">Score</td><td style="color:${scoreColor};font-weight:700;font-size:18px;">${score}/100</td></tr>
      <tr><td style="color:#7a7a85;padding:4px 0;">CAC</td><td style="color:#c9a96e;">${cac > 0 ? cac.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td></tr>
      <tr><td style="color:#7a7a85;padding:4px 0;">LTV</td><td style="color:#c9a96e;">${ltv > 0 ? ltv.toLocaleString('fr-FR') + ' FCFA' : 'N/A'}</td></tr>
      <tr><td style="color:#7a7a85;padding:4px 0;">Payback</td><td style="color:#c9a96e;">${payback > 0 ? payback + ' mois' : 'N/A'}</td></tr>
      <tr><td style="color:#7a7a85;padding:4px 0;">Ratio LTV:CAC</td><td style="color:${ratioColor};font-weight:600;">${ratioLTV > 0 ? ratioLTV + ':1' : 'N/A'}</td></tr>
    </table>
  </div>

  <div style="background:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;margin-bottom:16px;">
    <div style="font-size:11px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Failles</div>
    ${top3.map((f, i) => `<div style="margin-bottom:8px;"><span style="color:#e07070;font-weight:600;">${i + 1}. ${f.t}</span><br><span style="color:#7a7a85;font-size:13px;">${f.d}</span></div>`).join('')}
  </div>

  <div style="background:#101014;border:1px solid #1c1c22;border-radius:12px;padding:20px;margin-bottom:16px;">
    <div style="font-size:11px;color:#7a7a85;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Données brutes</div>
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <tr><td style="color:#7a7a85;padding:3px 0;width:40%;">CA mensuel</td><td>${data.ca_mensuel} FCFA</td></tr>
      <tr><td style="color:#7a7a85;padding:3px 0;">Clients/mois</td><td>${data.clients_par_mois}</td></tr>
      <tr><td style="color:#7a7a85;padding:3px 0;">Vente moyenne</td><td>${data.panier_moyen} FCFA</td></tr>
      <tr><td style="color:#7a7a85;padding:3px 0;">Marge</td><td>${Math.round(marge)}%</td></tr>
      <tr><td style="color:#7a7a85;padding:3px 0;">Pub active</td><td>${data.pub_active}</td></tr>
      <tr><td style="color:#7a7a85;padding:3px 0;">Budget pub</td><td>${data.budget_pub || 'Pas de pub'} FCFA</td></tr>
      <tr><td style="color:#7a7a85;padding:3px 0;">Sources</td><td>${data.sources_acquisition}</td></tr>
      <tr><td style="color:#7a7a85;padding:3px 0;">Site web</td><td>${data.site_web}</td></tr>
      <tr><td style="color:#7a7a85;padding:3px 0;">WhatsApp relance</td><td>${data.usage_whatsapp}</td></tr>
      <tr><td style="color:#7a7a85;padding:3px 0;">Budget accomp.</td><td>${data.budget_accompagnement}</td></tr>
      <tr><td style="color:#7a7a85;padding:3px 0;">Expérience conseil</td><td>${data.experience_conseil}</td></tr>
      <tr><td style="color:#7a7a85;padding:3px 0;">Blocage principal</td><td>${data.blocage_principal}</td></tr>
    </table>
  </div>

  <div style="text-align:center;">
    <a href="https://wa.me/${(data.whatsapp || '').replace(/\D/g, '')}"
       style="display:inline-block;background:#25D366;color:#fff;font-weight:700;padding:14px 28px;border-radius:999px;text-decoration:none;font-size:14px;">
      Contacter ${data.nom} sur WhatsApp →
    </a>
  </div>
</div>
</body></html>`;

    // ============================================================
    // 5. ENVOI EMAILS VIA BREVO
    // ============================================================
    const sendEmail = async (to, toName, subject, html) => {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_KEY
        },
        body: JSON.stringify({
          sender: { name: 'ePerformance', email: 'bonjour@eperformance.pro' },
          to: [{ email: to, name: toName }],
          subject,
          htmlContent: html
        })
      });
      return res.json();
    };

    // Email prospect
    if (data.email) {
      await sendEmail(
        data.email,
        data.nom,
        `Votre diagnostic ePerformance — Score ${score}/100`,
        emailProspect
      );
    }

    // Email admin
    await sendEmail(
      'kstephane683@gmail.com',
      'K. Stéphane',
      `Nouveau diagnostic — ${data.nom} (${data.secteur}) — Score ${score}/100`,
      emailAdmin
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, score, reco: reco.label })
    };

  } catch (err) {
    console.error('Erreur:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
