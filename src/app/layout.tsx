import './globals.css';
import Providers from '@/components/Providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CV Optimizer',
  description: 'Optimisez votre CV pour chaque offre d\'emploi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
