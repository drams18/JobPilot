import './globals.css';
import Providers from '@/components/Providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply Copilot',
  description: 'Votre copilote de candidature intelligente',
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
