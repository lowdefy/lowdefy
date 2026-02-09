import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-4 font-mono">404</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">Page not found</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
