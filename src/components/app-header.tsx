
import { ShieldCheck } from 'lucide-react';
import type { SVGProps } from 'react';

// Using an inline SVG for a more unique logo if needed, but Lucide is simpler.
// For now, sticking to Lucide as requested.
// const BiasGuardLogo = (props: SVGProps<SVGSVGElement>) => (
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
//     <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
//   </svg>
// );


export function AppHeader() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">
            BiasGuard
          </h1>
        </div>
        {/* Navigation can be added here if needed */}
      </div>
    </header>
  );
}
