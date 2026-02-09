import Image from 'next/image';

const logos = [
  { name: 'Avis', src: '/images/customers/avis.png' },
  { name: 'Lexus', src: '/images/customers/lexus.png' },
  { name: 'Barloworld', src: '/images/customers/barloworld.png' },
  { name: 'CourierIT', src: '/images/customers/courierit.png' },
  { name: 'Flava', src: '/images/customers/flava.png' },
  { name: 'Ingrain', src: '/images/customers/ingrain.png', invert: true },
  { name: 'RTT', src: '/images/customers/rtt.png' },
];

export default function Logos() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-sm text-slate-500 mb-8">
          Trusted by teams at leading companies
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
          {logos.map((logo) => (
            <Image
              key={logo.name}
              src={logo.src}
              alt={logo.name}
              width={120}
              height={40}
              className={`h-8 w-auto grayscale ${logo.invert ? 'invert' : ''}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
