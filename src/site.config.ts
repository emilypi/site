/**
 * Site identity, navigation, and external links.
 *
 * This is the one file to edit to change who the site says you are, what the
 * nav bar holds, or where the footer links point. Nothing else should hardcode
 * a title, URL, or handle.
 */
export const SITE = {
  title: 'cohomolo.gy',
  tagline: 'notes from the boundary',
  description: 'Engineer and mathematician writing about type theory, AI, and the strange future.',
  url: 'https://cohomolo.gy',
  author: {
    name: 'Emily Pillmore',
    email: 'emilypi@cohomolo.gy',
    bio: 'Engineer and mathematician writing about type theory, AI, and the strange future.',
  },
  locale: 'en',
  nav: [
    { label: 'Writing', href: '/posts/' },
    { label: 'Notes', href: '/notes/' },
    { label: 'Projects', href: '/projects/' },
    { label: 'Talks', href: '/talks/' },
    { label: 'About', href: '/about/' },
  ],
  links: [
    { label: 'GitHub', href: 'https://github.com/emilypi', icon: 'github' },
    { label: 'cohomolo-gy', href: 'https://github.com/cohomolo-gy', icon: 'org' },
    { label: 'Hackage', href: 'https://hackage.haskell.org/user/topos', icon: 'hackage' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/emily-pillmore', icon: 'linkedin' },
    { label: 'Email', href: 'mailto:emilypi@cohomolo.gy', icon: 'mail' },
    { label: 'RSS', href: '/rss.xml', icon: 'rss' },
  ],
  postsPerPage: 20,
  homepage: { recentPosts: 5, recentNotes: 4, featuredProjects: 3 },
} as const;

export type SiteLinkIcon = (typeof SITE.links)[number]['icon'];
