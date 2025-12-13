import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Novea Indonesia - Platform Novel Digital',
  description: 'Baca dan tulis novel digital favorit kamu di Novea Indonesia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
