
import { ScanSearch } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <div className="flex items-center space-x-3">
          <ScanSearch className="h-8 w-8 text-white" />
          <h1 className="text-2xl font-semibold text-white">
            Bias X-Ray
          </h1>
        </div>
        {/* Navigation can be added here if needed */}
      </div>
    </header>
  );
}
