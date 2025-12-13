import type { BlogGridItem } from '../components/sections/BlogGrid';

export type BlogPost = BlogGridItem & {
  category?: string;
  content?: string;
  date?: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'a1',
    title: 'Understanding the Wheel of the Year: Celebrating the Sabbats',
    summary:
      'Pagan holidays, or Sabbats, that mark the turning of the seasons. Learn their history, symbolism, and how to celebrate each one.',
    imageUrl: 'https://placehold.co/915x531.png',
    href: '/blog/wheel-of-the-year',
    category: 'Mindfulness & Healing',
    date: '2025-09-14',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sed arcu non ipsum maximus mattis. Integer dapibus, velit nec efficitur bibendum, mi elit tempor dui, ac ultrices magna nibh eget nisl. Sed non orci ut risus varius iaculis. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
  },
  {
    id: 'a2',
    title: 'Protective Sigils 101: Designing Your Own',
    summary:
      'A beginner-friendly guide to creating and activating sigils for protection and intention setting.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/protective-sigils',
    category: 'Practice & Rituals',
    date: '2025-09-01',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer gravida quam at dui volutpat, non maximus urna feugiat. Suspendisse potenti. Phasellus pulvinar, sapien ac fermentum placerat, arcu turpis aliquam felis, nec scelerisque lectus purus vel erat.',
  },
  {
    id: 'a3',
    title: 'Crystal Grids for Manifestation',
    summary: 'How to choose stones, lay out your grid, and amplify your intentions effectively.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/crystal-grids',
    category: 'Tools & Altars',
    date: '2025-08-25',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eu nibh arcu. In nec turpis nec sem imperdiet pulvinar. Aenean et congue nulla. Nulla facilisi. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
  {
    id: 'a4',
    title: 'Lunar Magic: Working with the Moon Phases',
    summary: 'Harness new moon intentions and full moon release rituals in your practice.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/lunar-magic',
    category: 'Astral & Cycles',
    date: '2025-08-10',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus volutpat sem vitae sapien imperdiet, vitae viverra neque condimentum. Ut ornare erat orci, in condimentum orci consequat sit amet.',
  },
  {
    id: 'a5',
    title: 'Herbal Allies: Witch’s Pantry Essentials',
    summary: 'Start your apothecary with common herbs and their magical correspondences.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/herbal-allies',
    category: 'Herbs & Earth',
    date: '2025-07-28',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam erat volutpat. Sed laoreet leo a nunc iaculis cursus. Sed bibendum mattis nibh, vel pulvinar est pulvinar vitae.',
  },
  {
    id: 'a6',
    title: 'Altars: Building a Sacred Space at Home',
    summary: 'Ideas and inspiration for creating meaningful, intentional altar spaces.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/altars-sacred-space',
    category: 'Tools & Altars',
    date: '2025-07-10',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse quis magna quis elit tempor hendrerit. Donec vitae lectus vitae ligula posuere tincidunt.',
  },
  {
    id: 'a7',
    title: 'Candle Magic Basics: Color and Intention',
    summary: 'A simple primer on color correspondences and ritual setup.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/candle-magic-basics',
    category: 'Practice & Rituals',
    date: '2025-06-29',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam ac viverra lorem. Cras bibendum, lectus at imperdiet luctus, turpis turpis laoreet ipsum, et ultricies sem mauris sit amet justo.',
  },
  {
    id: 'a8',
    title: 'Divination 101: Tarot, Runes, and Pendulums',
    summary: 'Choosing a divination method and forming clear questions.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/divination-101',
    category: 'Divination',
    date: '2025-06-12',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce eu egestas arcu. Etiam posuere, tortor at aliquet posuere, mi mi porta ligula, ac euismod nulla sapien vitae augue.',
  },
  {
    id: 'a9',
    title: 'Grounding and Centering Practices',
    summary: 'Quick techniques to reset energy before and after ritual.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/grounding-centering',
    category: 'Mindfulness & Healing',
    date: '2025-05-30',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis blandit rhoncus mi, in rhoncus augue scelerisque non. Sed iaculis, justo non interdum imperdiet, nulla lectus lobortis dolor, ut bibendum urna arcu at lorem.',
  },
  {
    id: 'a10',
    title: 'Sigils for Prosperity: A Step-by-Step Guide',
    summary: 'Create, charge, and release prosperity sigils safely.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/sigils-prosperity',
    category: 'Practice & Rituals',
    date: '2025-05-12',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vitae viverra quam. Ut tristique tempor tellus, in interdum nisl hendrerit id.',
  },
  {
    id: 'a11',
    title: 'Working with Spirit Guides',
    summary: 'How to invite, recognize, and thank guides respectfully.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/spirit-guides',
    category: 'Spirituality',
    date: '2025-04-28',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sodales, lacus non suscipit rhoncus, odio magna dapibus risus, eget porttitor augue massa non lorem.',
  },
  {
    id: 'a12',
    title: 'Seasonal Altars: Spring to Winter',
    summary: 'Ideas for refreshing your altar with the seasons.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/seasonal-altars',
    category: 'Tools & Altars',
    date: '2025-04-10',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque id ipsum ut justo pellentesque bibendum nec vitae massa.',
  },
  {
    id: 'a13',
    title: 'Moon Water: Creation and Uses',
    summary: 'A gentle introduction to crafting and storing moon water.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/moon-water-uses',
    category: 'Astral & Cycles',
    date: '2025-03-25',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur vitae sapien vitae lorem porta cursus.'
  },
  {
    id: 'a14',
    title: 'Warding Your Space: Simple Protections',
    summary: 'Practical and respectful ways to ward a home or altar.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/warding-your-space',
    category: 'Practice & Rituals',
    date: '2025-03-18',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec facilisis, mi et feugiat ornare, lorem nisl suscipit augue.'
  },
  {
    id: 'a15',
    title: 'Crystals 101: Clearing and Charging',
    summary: 'Basic care for crystals to support ritual and daily use.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/crystals-clearing-charging',
    category: 'Tools & Altars',
    date: '2025-03-05',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris sit amet massa a lorem tempus dapibus.'
  },
  {
    id: 'a16',
    title: 'Herbal Teas for Calm and Focus',
    summary: 'Gentle blends to support mindfulness and grounding.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/herbal-teas-calm-focus',
    category: 'Herbs & Earth',
    date: '2025-02-22',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent lacinia pellentesque sem, ut bibendum velit.'
  },
  {
    id: 'a17',
    title: 'Pendulum Basics: Building Confidence',
    summary: 'Tips to avoid bias and read pendulum movement clearly.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/pendulum-basics',
    category: 'Divination',
    date: '2025-02-14',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam erat volutpat. Proin eu enim blandit, pulvinar elit sed.'
  },
  {
    id: 'a18',
    title: 'Journaling Your Practice',
    summary: 'A simple framework to log rituals, dreams, and signs.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/journaling-your-practice',
    category: 'Mindfulness & Healing',
    date: '2025-02-02',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer non purus ac nisi fermentum posuere.'
  },
  {
    id: 'a19',
    title: 'Respectful Ancestor Work',
    summary: 'Setting boundaries and creating a safe container for contact.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/ancestor-work-respect',
    category: 'Spirituality',
    date: '2025-01-25',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sed arcu ut sapien commodo blandit.'
  },
  {
    id: 'a20',
    title: 'Smoke Cleansing Alternatives',
    summary: 'Non-smoke options for cleansing when fire is not possible.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/smoke-cleansing-alternatives',
    category: 'Practice & Rituals',
    date: '2025-01-12',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed at leo felis. Integer non sem eu arcu bibendum finibus.'
  },
  {
    id: 'a21',
    title: 'Color Magic in Daily Life',
    summary: 'Subtle ways to weave color correspondences into routines.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/color-magic-daily',
    category: 'Practice & Rituals',
    date: '2025-01-01',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant morbi tristique senectus et netus.'
  },
  {
    id: 'a22',
    title: 'Basic Astrology: Sun, Moon, Rising',
    summary: 'Understanding the big three and their influence.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/basic-astrology-big-three',
    category: 'Astral & Cycles',
    date: '2024-12-20',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras ut dui quis sem ultricies pellentesque.'
  },
  {
    id: 'a23',
    title: 'Ethics in Divination',
    summary: 'Consent, care, and boundaries when reading for others.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/ethics-in-divination',
    category: 'Divination',
    date: '2024-12-12',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum venenatis, lectus quis tristique cursus.'
  },
  {
    id: 'a24',
    title: 'Crystal Safety: Water and Sun',
    summary: 'Which crystals are water-safe and sun-safe at a glance.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/crystal-safety-water-sun',
    category: 'Tools & Altars',
    date: '2024-12-01',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse id efficitur libero.'
  },
  {
    id: 'a25',
    title: 'Herb Safety and Respect',
    summary: 'Know your plants and avoid harmful substitutions.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/herb-safety-respect',
    category: 'Herbs & Earth',
    date: '2024-11-22',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam nec volutpat nibh.'
  },
  {
    id: 'a26',
    title: 'Altar Organization Tips',
    summary: 'Keep sacred tools accessible without clutter.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/altar-organization-tips',
    category: 'Tools & Altars',
    date: '2024-11-10',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sed eleifend nulla, vitae imperdiet nibh.'
  },
  {
    id: 'a27',
    title: 'Daily Mindfulness Practices',
    summary: 'Micro-moments to reset: breath, posture, and attention.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/daily-mindfulness-practices',
    category: 'Mindfulness & Healing',
    date: '2024-10-30',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque at velit quis mi laoreet tincidunt.'
  },
  {
    id: 'a28',
    title: 'Basics of Candle Carving',
    summary: 'Simple symbols and letters to focus intention.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/basics-candle-carving',
    category: 'Practice & Rituals',
    date: '2024-10-18',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vulputate urna in dapibus fermentum.'
  },
  {
    id: 'a29',
    title: 'Rune Basics: Elder Futhark',
    summary: 'An overview of the runes and common spreads.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/rune-basics-elder-futhark',
    category: 'Divination',
    date: '2024-10-07',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu elementum arcu.'
  },
  {
    id: 'a30',
    title: 'Planetary Hours: A Quick Guide',
    summary: 'Timing workings with planetary correspondences made simple.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/planetary-hours-guide',
    category: 'Astral & Cycles',
    date: '2024-09-28',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer eget tortor nec sem imperdiet venenatis.'
  },
  {
    id: 'a31',
    title: 'Energy Shields: Visualization Techniques',
    summary: 'Build and maintain protective visualizations with ease.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/energy-shields-visualization',
    category: 'Mindfulness & Healing',
    date: '2024-09-16',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras a risus et justo ornare placerat.'
  },
  {
    id: 'a32',
    title: 'Spell Journals: Templates and Ideas',
    summary: 'Templates to record intent, materials, timing, and results.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/spell-journals-templates',
    category: 'Practice & Rituals',
    date: '2024-09-05',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse potenti.'
  },
  {
    id: 'a33',
    title: 'Crystal Grids: Advanced Patterns',
    summary: 'Beyond basics: complex shapes and layered intentions.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/crystal-grids-advanced',
    category: 'Tools & Altars',
    date: '2024-08-25',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus finibus urna at arcu faucibus euismod.'
  },
  {
    id: 'a34',
    title: 'Herbal Smoke Blends: Basics',
    summary: 'Common gentle blends and respectful usage notes.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/herbal-smoke-blends-basics',
    category: 'Herbs & Earth',
    date: '2024-08-12',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam lacinia condimentum porttitor.'
  },
  {
    id: 'a35',
    title: 'Tarot Court Cards: Personas',
    summary: 'Interpreting courts as roles, energies, and approaches.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/tarot-court-cards-personas',
    category: 'Divination',
    date: '2024-08-01',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed suscipit libero ut arcu blandit pellentesque.'
  },
  {
    id: 'a36',
    title: 'Seasonal Intentions: Equinox & Solstice',
    summary: 'Aligning personal goals with seasonal turning points.',
    imageUrl: 'https://placehold.co/345x230.png',
    href: '/blog/seasonal-intentions-equinox-solstice',
    category: 'Astral & Cycles',
    date: '2024-07-20',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus feugiat dui vitae urna efficitur, vitae mattis mi vehicula.'
  },
];

// Simple helpers to extract data
export const getAllPosts = (): BlogPost[] => BLOG_POSTS;
export const getPostBySlug = (slug: string): BlogPost | undefined => BLOG_POSTS.find(p => p.href?.endsWith(slug));
export const getPostsByCategory = (category: string): BlogPost[] => BLOG_POSTS.filter(p => p.category === category);
