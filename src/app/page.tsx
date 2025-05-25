
import { AppHeader } from '@/components/app-header';
import { BiasGuardTool } from '@/components/bias-guard-tool'; 

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      {/* Fade effect element: sticky, positioned below the header (top-16 assumes header is h-16),
          fades from page background to transparent, does not intercept pointer events.
          h-8 (32px) is the height of the fade area. z-40 is below header's z-50.
      */}
      <div
        className="sticky top-16 left-0 w-full h-8 z-40 pointer-events-none bg-gradient-to-b from-background to-transparent"
        aria-hidden="true"
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        <BiasGuardTool />
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border">
        <p>&copy; {new Date().getFullYear()} Bias X-Ray. An open-source toolkit for ethical AI.</p>
      </footer>
    </div>
  );
}
