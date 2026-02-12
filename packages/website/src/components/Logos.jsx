import Image from 'next/image';

const logos = [
  { name: 'Avis', src: '/images/customers/avis.png' },
  { name: 'Lexus', src: '/images/customers/lexus.png' },
  { name: 'Barloworld', src: '/images/customers/barloworld.png' },
  { name: 'CourierIT', src: '/images/customers/courierit.png' },
  { name: 'Flava', src: '/images/customers/flava.png' },
  { name: 'RTT', src: '/images/customers/rtt.png' },
];

export default function Logos() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800/50 bg-grid-dense">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-sm text-slate-500 dark:text-slate-600 mb-8">
          Powering enterprise apps in production
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50">
          {logos.map((logo) => (
            <Image
              key={logo.name}
              src={logo.src}
              alt={logo.name}
              width={120}
              height={40}
              className="h-8 w-auto grayscale dark:invert"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
