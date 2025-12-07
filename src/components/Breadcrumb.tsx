import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbNameMap: Record<string, string> = {
    '': 'Home',
    'tools': 'Tools',
    'registry': 'Registry',
    'research': 'Research',
    'waitlist': 'Waitlist',
    'faq': 'FAQ',
    'bibliography': 'Bibliography',
    'glossary': 'Glossary',
    'protocol-guide': 'Protocol Guide',
    'evidence-map': 'Evidence Map',
    'methods': 'Methods',
    'critiques': 'Critiques',
    'about': 'About',
    'events': 'Events & Trials',
    'open-questions': 'Open Questions',
    'admin': 'Admin',
    'auth': 'Login',
    'dataset': 'Dataset',
    'bundles': 'Bundles',
    'null-reports': 'Null Reports',
    'leaderboard': 'Community',
    'assess': 'Assessment',
    'submit-symbol': 'Submit Symbol',
    'submit': 'Submit Symbol',
    'protocols': 'Protocols',
    'log': 'Voice Logger',
    'dashboard': 'Dashboard',
    'profile': 'Profile',
    'my-symbols': 'My Symbols'
  };

  return (
    <nav aria-label="Breadcrumb" className="container mx-auto px-4 py-4">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link 
            to="/" 
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Home"
          >
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label = breadcrumbNameMap[value] || value;

          return (
            <li key={to} className="flex items-center space-x-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              {isLast ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link 
                  to={to} 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
