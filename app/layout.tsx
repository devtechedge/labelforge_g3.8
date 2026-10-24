import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeScript } from './theme-script';

export const viewport: Viewport = {
  themeColor: '#fbfbfa',
};

export const metadata: Metadata = {
  title: 'LabelForge - Collaborative Data Annotation Workbench',
  description: 'Auditable human-in-the-loop collaborative data annotation workbench with versioned schemas, review, adjudication, and reproducible releases.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'LabelForge - Collaborative Data Annotation Workbench',
    description: 'Auditable human-in-the-loop collaborative data annotation workbench with versioned schemas, review, adjudication, and reproducible releases.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LabelForge - Collaborative Data Annotation Workbench',
    description: 'Auditable human-in-the-loop collaborative data annotation workbench with versioned schemas, review, adjudication, and reproducible releases.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-[#fbfbfa] text-[#1c1917] antialiased" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full font-sans flex flex-col selection:bg-violet-100 selection:text-violet-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
