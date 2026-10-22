import { Calculator } from "@/components/calculator";

export default function Home() {
  return (
    <main className="page-shell">
      <div className="calculator-frame">
        <header className="page-heading">
          <p className="page-heading__eyebrow">
            <span className="page-heading__mark" aria-hidden="true" />
            Everyday arithmetic
          </p>
          <h1>Calculator</h1>
          <p className="page-heading__description">
            Clear, quick answers for everyday math.
          </p>
        </header>

        <Calculator />

        <footer className="page-note">
          Your calculations stay on this device and are not saved.
        </footer>
      </div>
    </main>
  );
}
