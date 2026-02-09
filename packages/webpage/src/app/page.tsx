import {
  Header,
  Hero,
  Logos,
  Problem,
  Solution,
  Comparison,
  Features,
  Connectors,
  Plugins,
  UseCases,
  Services,
  Testimonials,
  CTA,
  Footer,
} from '@/components';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Logos />
        <Problem />
        <Solution />
        <Comparison />
        <Features />
        <Connectors />
        <Plugins />
        <UseCases />
        <Services />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
