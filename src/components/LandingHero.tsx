import { ParticleLogo } from "@/components/ParticleLogo";

export function LandingHero() {
  return (
    <section className="landing-hero" aria-label="Aarohan Override">
      <div className="landing-hero__frame" aria-hidden="true" />
      <ParticleLogo src="/assets/aarohan-metal-logo.png" />
      <div className="landing-hero__lockup">
        <h1>Aarohan</h1>
        <p>OVERRIDE</p>
        <a className="landing-hero__learn" href="#track">
          <span aria-hidden="true">↓</span> Scroll to learn more
        </a>
      </div>
    </section>
  );
}
