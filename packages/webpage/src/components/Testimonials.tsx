import Image from 'next/image';

const testimonials = [
  {
    quote: 'Lowdefy has allowed me to quickly test new product ideas without having to write any code. I have even recreated older PHP tools which are now easier to maintain and update.',
    author: 'Jon Bennetts',
    role: '86-88 Solutions',
    avatar: '/images/profiles/jon_bennetts.webp',
  },
  {
    quote: 'As a project manager with limited coding knowledge, I\'ve been able to create various financial tracking and academic documentation apps effortlessly. The best part is the supportive community.',
    author: 'Mahdy Arief',
    role: 'Product Manager at Feedloop',
    avatar: '/images/profiles/mahdy_arief.jpeg',
  },
  {
    quote: 'Lowdefy is the ideal solution for anyone looking to build a web application. Its simplicity allowed me to create a functional CRUD app in just a few hours.',
    author: 'Ehan Groenewald',
    role: 'Data Scientist',
    avatar: '/images/profiles/ehan_groenewald.webp',
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Loved by developers
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Teams around the world are building faster with Lowdefy.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="bg-white p-6 rounded-xl border border-slate-200"
            >
              <p className="text-slate-600 mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-slate-900">{testimonial.author}</div>
                  <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
