// data/agents.ts - Configuration des 27 agents ePerformance
import { Agent } from '../types';

export const AGENTS: Agent[] = [
  // 1. Agent Accueil - Point d'entrée principal
  {
    id: 'agent-accueil',
    name: 'Agent Accueil',
    displayName: 'ePerformance',
    emoji: '👋',
    avatar: '/icon-eperf.png',
    color: '#a855f7',
    description: 'Votre premier contact avec ePerformance',
    specialties: ['orientation', 'questions générales', 'redirection'],
    greeting: '👋 Bonjour! Bienvenue sur ePerformance. Comment puis-je vous aider aujourd\'hui?',
    quickReplies: [
      { id: 'qr-1', text: 'Découvrir ePerformance', emoji: '🎯', action: { type: 'message', payload: 'Parlez-moi d\'ePerformance' } },
      { id: 'qr-2', text: 'Voir les services', emoji: '💼', action: { type: 'message', payload: 'Quels sont vos services?' } },
      { id: 'qr-3', text: 'Démo gratuite', emoji: '🚀', action: { type: 'message', payload: 'Je veux une démo gratuite' } },
      { id: 'qr-4', text: 'Parler à un expert', emoji: '💬', action: { type: 'message', payload: 'Je souhaite parler à un conseiller' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 2. Expert Acquisition - Lead Generation
  {
    id: 'agent-acquisition',
    name: 'Expert Acquisition',
    displayName: 'Sarah - Expert Acquisition',
    emoji: '🚀',
    avatar: '/icon-eperf.png',
    color: '#ef4444',
    description: 'Spécialiste de l\'acquisition digitale et génération de leads',
    specialties: ['leads', 'acquisition', 'conversion', 'growth'],
    greeting: '🚀 Bonjour! Je suis Sarah, experte en acquisition digitale. Parlons de votre stratégie de croissance!',
    quickReplies: [
      { id: 'qr-a1', text: 'Générer plus de leads', emoji: '📈', action: { type: 'message', payload: 'Comment générer plus de leads qualifiés?' } },
      { id: 'qr-a2', text: 'Optimiser mon CAC', emoji: '💰', action: { type: 'message', payload: 'Réduire mes coûts d\'acquisition' } },
      { id: 'qr-a3', text: 'Stratégie acquisition', emoji: '🎯', action: { type: 'message', payload: 'Créer une stratégie d\'acquisition' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 3. Expert Sites Web
  {
    id: 'agent-website',
    name: 'Expert Sites Web',
    displayName: 'Marc - Expert Web',
    emoji: '🌐',
    avatar: '/icon-eperf.png',
    color: '#10b981',
    description: 'Création de sites web performants et optimisés',
    specialties: ['sites web', 'SEO', 'conversion', 'performance'],
    greeting: '🌐 Salut! Marc ici. Je crée des sites web qui convertissent. Quel est votre projet?',
    quickReplies: [
      { id: 'qr-w1', text: 'Créer mon site', emoji: '🎨', action: { type: 'message', payload: 'Je veux créer un site web professionnel' } },
      { id: 'qr-w2', text: 'Optimiser conversion', emoji: '📊', action: { type: 'message', payload: 'Améliorer mon taux de conversion' } },
      { id: 'qr-w3', text: 'SEO & visibilité', emoji: '🔍', action: { type: 'message', payload: 'Améliorer mon référencement' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 4. Expert Marketing Digital
  {
    id: 'agent-marketing',
    name: 'Expert Marketing',
    displayName: 'Julie - Marketing Manager',
    emoji: '📱',
    avatar: '/icon-eperf.png',
    color: '#f59e0b',
    description: 'Stratégies marketing et campagnes digitales',
    specialties: ['marketing', 'campagnes', 'social media', 'content'],
    greeting: '📱 Hello! Julie du marketing digital. Boostons votre visibilité ensemble!',
    quickReplies: [
      { id: 'qr-m1', text: 'Stratégie marketing', emoji: '📢', action: { type: 'message', payload: 'Créer ma stratégie marketing' } },
      { id: 'qr-m2', text: 'Social media', emoji: '👥', action: { type: 'message', payload: 'Optimiser mes réseaux sociaux' } },
      { id: 'qr-m3', text: 'Content marketing', emoji: '✍️', action: { type: 'message', payload: 'Créer du contenu engageant' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 5. Expert Analytics & Data
  {
    id: 'agent-analytics',
    name: 'Analyste Performance',
    displayName: 'Thomas - Data Analyst',
    emoji: '📈',
    avatar: '/icon-eperf.png',
    color: '#3b82f6',
    description: 'Analyse de données et KPIs',
    specialties: ['analytics', 'KPI', 'reporting', 'data'],
    greeting: '📈 Salut! Thomas ici. Plongeons dans vos données et KPIs!',
    quickReplies: [
      { id: 'qr-an1', text: 'Suivre mes KPIs', emoji: '🎯', action: { type: 'message', payload: 'Comment suivre mes KPIs?' } },
      { id: 'qr-an2', text: 'Analytics setup', emoji: '⚙️', action: { type: 'message', payload: 'Installer un tracking performant' } },
      { id: 'qr-an3', text: 'Rapports', emoji: '📊', action: { type: 'message', payload: 'Créer des rapports automatisés' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 6. Expert E-commerce
  {
    id: 'agent-ecommerce',
    name: 'Expert E-commerce',
    displayName: 'Emma - E-commerce',
    emoji: '🛒',
    avatar: '/icon-eperf.png',
    color: '#8b5cf6',
    description: 'Boutiques en ligne et ventes digitales',
    specialties: ['e-commerce', 'shopify', 'ventes', 'conversion'],
    greeting: '🛒 Bonjour! Emma, spécialiste e-commerce. Développons vos ventes en ligne!',
    quickReplies: [
      { id: 'qr-ec1', text: 'Créer ma boutique', emoji: '🏪', action: { type: 'message', payload: 'Lancer ma boutique en ligne' } },
      { id: 'qr-ec2', text: 'Optimiser ventes', emoji: '💳', action: { type: 'message', payload: 'Augmenter mes ventes' } },
      { id: 'qr-ec3', text: 'Stratégie prix', emoji: '💰', action: { type: 'message', payload: 'Optimiser ma stratégie de prix' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 7. Expert Email Marketing
  {
    id: 'agent-email',
    name: 'Expert Email Marketing',
    displayName: 'Sophie - Email Expert',
    emoji: '✉️',
    avatar: '/icon-eperf.png',
    color: '#ec4899',
    description: 'Campagnes email et automation',
    specialties: ['email', 'automation', 'newsletters', 'nurturing'],
    greeting: '✉️ Salut! Sophie ici. Créons des campagnes email qui convertissent!',
    quickReplies: [
      { id: 'qr-em1', text: 'Campagnes email', emoji: '📧', action: { type: 'message', payload: 'Créer mes campagnes email' } },
      { id: 'qr-em2', text: 'Automation', emoji: '🤖', action: { type: 'message', payload: 'Automatiser mes emails' } },
      { id: 'qr-em3', text: 'Améliorer open rate', emoji: '📬', action: { type: 'message', payload: 'Augmenter mon taux d\'ouverture' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 8. Expert Facebook Ads
  {
    id: 'agent-facebook-ads',
    name: 'Expert Facebook Ads',
    displayName: 'Alex - Facebook Ads',
    emoji: '📘',
    avatar: '/icon-eperf.png',
    color: '#1877f2',
    description: 'Publicité Facebook et Instagram',
    specialties: ['facebook ads', 'instagram ads', 'meta', 'publicité'],
    greeting: '📘 Hey! Alex, expert Facebook Ads. Optimisons vos campagnes Meta!',
    quickReplies: [
      { id: 'qr-fb1', text: 'Lancer mes pubs', emoji: '🚀', action: { type: 'message', payload: 'Créer mes premières Facebook Ads' } },
      { id: 'qr-fb2', text: 'Réduire mon CPA', emoji: '💸', action: { type: 'message', payload: 'Optimiser mon coût par acquisition' } },
      { id: 'qr-fb3', text: 'Retargeting', emoji: '🎯', action: { type: 'message', payload: 'Mettre en place du retargeting' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 9. Expert Google Ads
  {
    id: 'agent-google-ads',
    name: 'Expert Google Ads',
    displayName: 'Pierre - Google Ads',
    emoji: '🔍',
    avatar: '/icon-eperf.png',
    color: '#4285f4',
    description: 'Publicité Google et SEA',
    specialties: ['google ads', 'SEA', 'PPC', 'search'],
    greeting: '🔍 Bonjour! Pierre, spécialiste Google Ads. Maximisons votre ROI publicitaire!',
    quickReplies: [
      { id: 'qr-ga1', text: 'Campagnes Search', emoji: '🔎', action: { type: 'message', payload: 'Créer mes campagnes Search' } },
      { id: 'qr-ga2', text: 'Display & Video', emoji: '📺', action: { type: 'message', payload: 'Lancer Display et YouTube Ads' } },
      { id: 'qr-ga3', text: 'Optimiser QS', emoji: '⭐', action: { type: 'message', payload: 'Améliorer mon Quality Score' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 10. Expert LinkedIn Ads
  {
    id: 'agent-linkedin',
    name: 'Expert LinkedIn',
    displayName: 'Laura - LinkedIn Expert',
    emoji: '💼',
    avatar: '/icon-eperf.png',
    color: '#0a66c2',
    description: 'Marketing B2B et LinkedIn',
    specialties: ['linkedin', 'B2B', 'social selling', 'prospection'],
    greeting: '💼 Bonjour! Laura, experte LinkedIn. Développons votre business B2B!',
    quickReplies: [
      { id: 'qr-li1', text: 'Stratégie LinkedIn', emoji: '🎯', action: { type: 'message', payload: 'Créer ma stratégie LinkedIn' } },
      { id: 'qr-li2', text: 'LinkedIn Ads', emoji: '📢', action: { type: 'message', payload: 'Lancer mes LinkedIn Ads' } },
      { id: 'qr-li3', text: 'Social selling', emoji: '🤝', action: { type: 'message', payload: 'Maîtriser le social selling' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 11. Expert CRM
  {
    id: 'agent-crm',
    name: 'Expert CRM',
    displayName: 'David - CRM Manager',
    emoji: '📇',
    avatar: '/icon-eperf.png',
    color: '#14b8a6',
    description: 'Gestion de la relation client',
    specialties: ['CRM', 'pipeline', 'automation', 'sales'],
    greeting: '📇 Salut! David, expert CRM. Optimisons votre gestion client!',
    quickReplies: [
      { id: 'qr-crm1', text: 'Choisir mon CRM', emoji: '🔧', action: { type: 'message', payload: 'Quel CRM pour mon business?' } },
      { id: 'qr-crm2', text: 'Pipeline de vente', emoji: '📊', action: { type: 'message', payload: 'Créer mon pipeline de vente' } },
      { id: 'qr-crm3', text: 'Automation CRM', emoji: '⚙️', action: { type: 'message', payload: 'Automatiser mon CRM' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 12. Expert Funnel
  {
    id: 'agent-funnel',
    name: 'Expert Funnel',
    displayName: 'Mathieu - Funnel Expert',
    emoji: '🎪',
    avatar: '/icon-eperf.png',
    color: '#f97316',
    description: 'Tunnels de vente et conversion',
    specialties: ['funnel', 'conversion', 'landing pages', 'optimization'],
    greeting: '🎪 Hey! Mathieu ici. Créons des funnels qui convertissent comme des fous!',
    quickReplies: [
      { id: 'qr-fu1', text: 'Créer mon funnel', emoji: '🚀', action: { type: 'message', payload: 'Construire mon tunnel de vente' } },
      { id: 'qr-fu2', text: 'Landing pages', emoji: '🎯', action: { type: 'message', payload: 'Créer des landing pages efficaces' } },
      { id: 'qr-fu3', text: 'A/B testing', emoji: '🧪', action: { type: 'message', payload: 'Optimiser avec A/B testing' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 13. Expert Chatbots
  {
    id: 'agent-chatbots',
    name: 'Expert Chatbots',
    displayName: 'Clara - Chatbot Expert',
    emoji: '🤖',
    avatar: '/icon-eperf.png',
    color: '#06b6d4',
    description: 'Chatbots et automatisation conversationnelle',
    specialties: ['chatbots', 'IA', 'automation', 'support'],
    greeting: '🤖 Bonjour! Clara ici. Créons des chatbots intelligents pour votre business!',
    quickReplies: [
      { id: 'qr-cb1', text: 'Créer mon chatbot', emoji: '💬', action: { type: 'message', payload: 'Lancer mon chatbot' } },
      { id: 'qr-cb2', text: 'IA conversationnelle', emoji: '🧠', action: { type: 'message', payload: 'Intégrer de l\'IA' } },
      { id: 'qr-cb3', text: 'ROI chatbot', emoji: '💰', action: { type: 'message', payload: 'Calculer le ROI d\'un chatbot' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 14. Expert Formation
  {
    id: 'agent-training',
    name: 'Formateur',
    displayName: 'Paul - Formateur',
    emoji: '🎓',
    avatar: '/icon-eperf.png',
    color: '#a855f7',
    description: 'Formation et accompagnement',
    specialties: ['formation', 'coaching', 'mentoring', 'skills'],
    greeting: '🎓 Hello! Paul, formateur. Je vous accompagne vers l\'excellence digitale!',
    quickReplies: [
      { id: 'qr-tr1', text: 'Formations dispo', emoji: '📚', action: { type: 'message', payload: 'Voir les formations disponibles' } },
      { id: 'qr-tr2', text: 'Coaching perso', emoji: '👨‍🏫', action: { type: 'message', payload: 'Coaching personnalisé' } },
      { id: 'qr-tr3', text: 'Certification', emoji: '🏆', action: { type: 'message', payload: 'Obtenir une certification' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 15. Expert SEO
  {
    id: 'agent-seo',
    name: 'Expert SEO',
    displayName: 'Léa - SEO Expert',
    emoji: '🔝',
    avatar: '/icon-eperf.png',
    color: '#10b981',
    description: 'Référencement naturel et visibilité',
    specialties: ['SEO', 'référencement', 'contenu', 'backlinks'],
    greeting: '🔝 Bonjour! Léa, experte SEO. Propulsons votre site en première page!',
    quickReplies: [
      { id: 'qr-seo1', text: 'Audit SEO', emoji: '🔍', action: { type: 'message', payload: 'Faire un audit SEO' } },
      { id: 'qr-seo2', text: 'Stratégie contenu', emoji: '✍️', action: { type: 'message', payload: 'Créer ma stratégie SEO' } },
      { id: 'qr-seo3', text: 'Backlinks', emoji: '🔗', action: { type: 'message', payload: 'Obtenir des backlinks' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 16. Expert Copywriting
  {
    id: 'agent-copywriting',
    name: 'Expert Copywriting',
    displayName: 'Nina - Copywriter',
    emoji: '✍️',
    avatar: '/icon-eperf.png',
    color: '#ec4899',
    description: 'Rédaction persuasive et storytelling',
    specialties: ['copywriting', 'storytelling', 'persuasion', 'contenu'],
    greeting: '✍️ Salut! Nina, copywriter. Créons des textes qui vendent!',
    quickReplies: [
      { id: 'qr-copy1', text: 'Textes de vente', emoji: '💸', action: { type: 'message', payload: 'Rédiger mes textes de vente' } },
      { id: 'qr-copy2', text: 'Storytelling', emoji: '📖', action: { type: 'message', payload: 'Créer mon storytelling' } },
      { id: 'qr-copy3', text: 'Headlines', emoji: '📰', action: { type: 'message', payload: 'Écrire des headlines percutants' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 17. Expert Video Marketing
  {
    id: 'agent-video',
    name: 'Expert Video',
    displayName: 'Hugo - Video Expert',
    emoji: '🎥',
    avatar: '/icon-eperf.png',
    color: '#ef4444',
    description: 'Marketing vidéo et contenu visuel',
    specialties: ['video', 'youtube', 'tiktok', 'reels'],
    greeting: '🎥 Hello! Hugo, expert vidéo. Créons du contenu viral!',
    quickReplies: [
      { id: 'qr-vid1', text: 'Stratégie vidéo', emoji: '🎬', action: { type: 'message', payload: 'Créer ma stratégie vidéo' } },
      { id: 'qr-vid2', text: 'YouTube growth', emoji: '📺', action: { type: 'message', payload: 'Développer ma chaîne YouTube' } },
      { id: 'qr-vid3', text: 'Short-form content', emoji: '📱', action: { type: 'message', payload: 'TikTok et Reels' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 18. Expert Branding
  {
    id: 'agent-branding',
    name: 'Expert Branding',
    displayName: 'Camille - Brand Expert',
    emoji: '🎨',
    avatar: '/icon-eperf.png',
    color: '#f59e0b',
    description: 'Image de marque et identité visuelle',
    specialties: ['branding', 'design', 'identité', 'positionnement'],
    greeting: '🎨 Bonjour! Camille, experte branding. Créons une marque inoubliable!',
    quickReplies: [
      { id: 'qr-br1', text: 'Identité visuelle', emoji: '🖼️', action: { type: 'message', payload: 'Créer mon identité visuelle' } },
      { id: 'qr-br2', text: 'Positionnement', emoji: '🎯', action: { type: 'message', payload: 'Définir mon positionnement' } },
      { id: 'qr-br3', text: 'Charte graphique', emoji: '📐', action: { type: 'message', payload: 'Créer ma charte graphique' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 19. Expert Growth Hacking
  {
    id: 'agent-growth',
    name: 'Growth Hacker',
    displayName: 'Maxime - Growth Hacker',
    emoji: '🚀',
    avatar: '/icon-eperf.png',
    color: '#8b5cf6',
    description: 'Croissance rapide et scaling',
    specialties: ['growth hacking', 'scaling', 'viral', 'experiments'],
    greeting: '🚀 Hey! Maxime, growth hacker. Explosons votre croissance!',
    quickReplies: [
      { id: 'qr-gh1', text: 'Stratégie growth', emoji: '📈', action: { type: 'message', payload: 'Créer ma stratégie de croissance' } },
      { id: 'qr-gh2', text: 'Growth loops', emoji: '🔄', action: { type: 'message', payload: 'Mettre en place des growth loops' } },
      { id: 'qr-gh3', text: 'Viral marketing', emoji: '💥', action: { type: 'message', payload: 'Créer du viral' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 20. Expert Affiliation
  {
    id: 'agent-affiliation',
    name: 'Expert Affiliation',
    displayName: 'Vincent - Affiliation',
    emoji: '🤝',
    avatar: '/icon-eperf.png',
    color: '#14b8a6',
    description: 'Marketing d\'affiliation et partenariats',
    specialties: ['affiliation', 'partenariats', 'commissions', 'influenceurs'],
    greeting: '🤝 Salut! Vincent, expert affiliation. Développons vos partenariats!',
    quickReplies: [
      { id: 'qr-aff1', text: 'Programme affiliation', emoji: '💰', action: { type: 'message', payload: 'Lancer mon programme d\'affiliation' } },
      { id: 'qr-aff2', text: 'Recruter affiliés', emoji: '👥', action: { type: 'message', payload: 'Trouver des affiliés' } },
      { id: 'qr-aff3', text: 'Influenceurs', emoji: '⭐', action: { type: 'message', payload: 'Travailler avec des influenceurs' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 21. Expert Retargeting
  {
    id: 'agent-retargeting',
    name: 'Expert Retargeting',
    displayName: 'Chloé - Retargeting',
    emoji: '🎯',
    avatar: '/icon-eperf.png',
    color: '#f97316',
    description: 'Retargeting et remarketing',
    specialties: ['retargeting', 'remarketing', 'pixels', 'audiences'],
    greeting: '🎯 Bonjour! Chloé, experte retargeting. Reconvertissons vos visiteurs!',
    quickReplies: [
      { id: 'qr-ret1', text: 'Setup retargeting', emoji: '⚙️', action: { type: 'message', payload: 'Mettre en place le retargeting' } },
      { id: 'qr-ret2', text: 'Audiences custom', emoji: '👥', action: { type: 'message', payload: 'Créer mes audiences' } },
      { id: 'qr-ret3', text: 'Dynamic ads', emoji: '🔄', action: { type: 'message', payload: 'Lancer des dynamic ads' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 22. Expert Webinaires
  {
    id: 'agent-webinar',
    name: 'Expert Webinaires',
    displayName: 'Antoine - Webinaires',
    emoji: '🎤',
    avatar: '/icon-eperf.png',
    color: '#3b82f6',
    description: 'Webinaires et événements en ligne',
    specialties: ['webinaires', 'événements', 'présentation', 'live'],
    greeting: '🎤 Hello! Antoine, expert webinaires. Créons des événements qui marquent!',
    quickReplies: [
      { id: 'qr-web1', text: 'Créer webinaire', emoji: '📹', action: { type: 'message', payload: 'Organiser mon webinaire' } },
      { id: 'qr-web2', text: 'Promouvoir', emoji: '📢', action: { type: 'message', payload: 'Promouvoir mon webinaire' } },
      { id: 'qr-web3', text: 'Webinar funnel', emoji: '🎪', action: { type: 'message', payload: 'Créer un webinar funnel' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 23. Expert Pricing
  {
    id: 'agent-pricing',
    name: 'Expert Pricing',
    displayName: 'Isabelle - Pricing',
    emoji: '💎',
    avatar: '/icon-eperf.png',
    color: '#ec4899',
    description: 'Stratégie de prix et monétisation',
    specialties: ['pricing', 'monétisation', 'tarifs', 'value'],
    greeting: '💎 Bonjour! Isabelle, experte pricing. Optimisons votre stratégie tarifaire!',
    quickReplies: [
      { id: 'qr-pr1', text: 'Définir mes prix', emoji: '💰', action: { type: 'message', payload: 'Fixer mes prix optimaux' } },
      { id: 'qr-pr2', text: 'Psychologie prix', emoji: '🧠', action: { type: 'message', payload: 'Utiliser la psychologie des prix' } },
      { id: 'qr-pr3', text: 'Upsell/Cross-sell', emoji: '📈', action: { type: 'message', payload: 'Stratégies d\'upsell' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 24. Expert Customer Success
  {
    id: 'agent-customer-success',
    name: 'Customer Success',
    displayName: 'Lucie - Customer Success',
    emoji: '💙',
    avatar: '/icon-eperf.png',
    color: '#06b6d4',
    description: 'Satisfaction et fidélisation client',
    specialties: ['satisfaction', 'fidélisation', 'retention', 'support'],
    greeting: '💙 Salut! Lucie, Customer Success Manager. Fidélisons vos clients!',
    quickReplies: [
      { id: 'qr-cs1', text: 'Onboarding client', emoji: '🎯', action: { type: 'message', payload: 'Créer mon onboarding' } },
      { id: 'qr-cs2', text: 'Réduire churn', emoji: '🔒', action: { type: 'message', payload: 'Réduire mon taux de churn' } },
      { id: 'qr-cs3', text: 'NPS & feedback', emoji: '⭐', action: { type: 'message', payload: 'Mesurer la satisfaction' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 25. Expert Support Technique
  {
    id: 'agent-support',
    name: 'Support Technique',
    displayName: 'Lucas - Support Tech',
    emoji: '🔧',
    avatar: '/icon-eperf.png',
    color: '#10b981',
    description: 'Assistance technique et résolution de problèmes',
    specialties: ['support', 'technique', 'bugs', 'troubleshooting'],
    greeting: '🔧 Hey! Lucas du support technique. Comment puis-je vous aider?',
    quickReplies: [
      { id: 'qr-sup1', text: 'Problème technique', emoji: '🐛', action: { type: 'message', payload: 'J\'ai un problème technique' } },
      { id: 'qr-sup2', text: 'Documentation', emoji: '📚', action: { type: 'external_link', payload: '/docs' } },
      { id: 'qr-sup3', text: 'Contacter équipe', emoji: '💬', action: { type: 'message', payload: 'Parler à un humain' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques minutes',
  },

  // 26. Expert Facturation
  {
    id: 'agent-billing',
    name: 'Conseiller Facturation',
    displayName: 'Emma - Facturation',
    emoji: '💳',
    avatar: '/icon-eperf.png',
    color: '#f59e0b',
    description: 'Paiements, factures et abonnements',
    specialties: ['facturation', 'paiements', 'abonnements', 'devis'],
    greeting: '💳 Bonjour! Emma à votre service pour toute question de facturation.',
    quickReplies: [
      { id: 'qr-bil1', text: 'Demander devis', emoji: '📄', action: { type: 'message', payload: 'Je veux un devis' } },
      { id: 'qr-bil2', text: 'Voir tarifs', emoji: '💰', action: { type: 'external_link', payload: '/pricing' } },
      { id: 'qr-bil3', text: 'Question facture', emoji: '❓', action: { type: 'message', payload: 'Question sur ma facture' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },

  // 27. Expert Stratégie
  {
    id: 'agent-strategy',
    name: 'Stratège Business',
    displayName: 'Philippe - Stratège',
    emoji: '♟️',
    avatar: '/icon-eperf.png',
    color: '#8b5cf6',
    description: 'Stratégie business et conseil',
    specialties: ['stratégie', 'conseil', 'business plan', 'vision'],
    greeting: '♟️ Bonjour! Philippe, stratège business. Définissons votre feuille de route!',
    quickReplies: [
      { id: 'qr-str1', text: 'Audit complet', emoji: '🔍', action: { type: 'message', payload: 'Faire un audit de mon business' } },
      { id: 'qr-str2', text: 'Roadmap digitale', emoji: '🗺️', action: { type: 'message', payload: 'Créer ma roadmap digitale' } },
      { id: 'qr-str3', text: 'Conseil expert', emoji: '🎯', action: { type: 'message', payload: 'Conseil stratégique personnalisé' } },
    ],
    isAvailable: true,
    responseTime: 'En quelques secondes',
  },
];

// Helper pour récupérer un agent par ID
export const getAgent = (id: string): Agent | undefined => {
  return AGENTS.find(agent => agent.id === id);
};

// Agent par défaut
export const DEFAULT_AGENT = AGENTS[0]; // Agent Accueil
