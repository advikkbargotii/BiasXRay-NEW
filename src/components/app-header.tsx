
import { Search } from 'lucide-react'; // Changed ShieldCheck to Search for a more fitting icon
import type { SVGProps } from 'react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <div className="flex items-center space-x-3">
          <Search className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">
            Bias X-Ray
          </h1>
        </div>
        {/* Navigation can be added here if needed */}
      </div>
    </header>
  );
}
