import {
  Header,
  Hero,
  Logos,
  Problem,
  Solution,
  Comparison,
  Stack,
  Services,
  Testimonials,
  Footer,
  SectionDivider,
} from '@/components';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Logos />
        <SectionDivider accent="red" />
        <Problem />
        <SectionDivider accent="green" />
        <Solution />
        <SectionDivider accent="primary" />
        <Comparison />
        <SectionDivider accent="cyan" />
        <Stack />
        <SectionDivider accent="cyan" />
        <Services />
        <SectionDivider accent="primary" />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
}
