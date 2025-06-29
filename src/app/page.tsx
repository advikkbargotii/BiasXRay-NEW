
import { AppHeader } from '@/components/app-header';
import { BiasGuardTool } from '@/components/bias-guard-tool';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <BiasGuardTool />
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border">
        <div className="flex flex-col items-center space-y-2">
          <p>&copy; {new Date().getFullYear()} Bias X-Ray. An open-source toolkit for ethical AI.</p>
          <Link 
            href="/privacy" 
            className="text-muted-foreground hover:text-foreground underline transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}

