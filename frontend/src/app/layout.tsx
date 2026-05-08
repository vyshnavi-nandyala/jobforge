import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'JobForge | AI-Powered Job Search for Data Engineers',
  description: 'Automatically find and apply to Data Engineer roles with AI-customized resumes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0d14] text-slate-200 min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { background: '#111827', color: '#e2e8f0', border: '1px solid #1f2937', borderRadius: '10px' },
          }}
        />
      </body>
    </html>
  );
}
