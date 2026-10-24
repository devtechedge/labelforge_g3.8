import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LabelForge - Collaborative Data Annotation Workbench',
  description: 'Auditable human-in-the-loop collaborative data annotation workbench with versioned schemas, review, adjudication, and reproducible releases.',
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
    <html lang="en" className="h-full bg-[#fbfbfa] text-[#1c1917] antialiased">
      <body className="min-h-full font-sans flex flex-col selection:bg-violet-100 selection:text-violet-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
