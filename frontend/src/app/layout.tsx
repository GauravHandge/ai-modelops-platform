import './globals.css';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'AI ModelOps Platform | Production MLOps Management',
  description: 'Generic, model-agnostic MLOps platform for model registration, versioning, experiment tracking, deployment, monitoring, drift detection, and rollback.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-gray-100 min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-gradient-to-b from-background via-surface/30 to-background">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
