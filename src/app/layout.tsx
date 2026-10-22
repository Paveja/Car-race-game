import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tic tac toe — a tiny game of focus',
  description: 'A quick, friendly game of tic tac toe against the computer.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
