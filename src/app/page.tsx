import { Calculator } from '@/components/calculator';

export default function Home() {
  return (
    <main className="calculator-page">
      <div className="calculator-page-glow calculator-page-glow-top" aria-hidden="true" />
      <div className="calculator-page-glow calculator-page-glow-bottom" aria-hidden="true" />

      <div className="calculator-page-content">
        <header className="calculator-header">
          <div className="calculator-brand">
            <span className="calculator-brand-mark" aria-hidden="true">
              +
            </span>
            <div>
              <p className="calculator-eyebrow">Pocket arithmetic</p>
              <h1 className="calculator-title">Calc / 01</h1>
            </div>
          </div>
          <div className="calculator-status" aria-label="Calculator status: ready">
            <span className="calculator-status-dot" aria-hidden="true" />
            Ready
          </div>
        </header>

        <div className="calculator-main">
          <div className="calculator-intro">
            <p className="calculator-kicker">Simple by design</p>
            <h2>
              Clear thinking,
              <br />
              one number at a time.
            </h2>
            <p className="calculator-description">
              A quiet space for everyday calculations. Touch the keys or use your keyboard to begin.
            </p>
          </div>
          <Calculator />
        </div>

        <footer className="calculator-footer">
          <span>Built for the everyday</span>
          <span className="calculator-footer-line" aria-hidden="true" />
          <span>v.01</span>
        </footer>
      </div>
    </main>
  );
}
