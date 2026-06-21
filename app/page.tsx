import Link from "next/link";

export default function LandingPage() {
  return (
    <div>
      <nav className="landing-nav">
        <div className="brand">
          <div className="logo"></div>
          <span>YADA CRM</span>
        </div>
        <div className="links">
          <span>Product</span>
          <span>Pricing</span>
          <span>Customers</span>
          <Link href="/signin" className="btn">Sign in</Link>
          <Link href="/signin" className="btn btn-primary">Start free trial</Link>
        </div>
      </nav>

      <div className="hero">
        <div className="eyebrow">Built for tech sales teams</div>
        <h1>Run your whole client lifecycle in one place</h1>
        <p>Pipeline, subscriptions, support and billing — unified for teams selling recurring software.</p>
        <div className="hero-actions">
          <Link href="/signin" className="btn btn-primary">Start free trial</Link>
          <button className="btn"><i className="ti ti-player-play"></i>Watch demo</button>
        </div>
      </div>

      <div className="feature-grid">
        <div className="feature-cell">
          <i className="ti ti-target-arrow" style={{ fontSize: 20, color: "var(--purple)" }}></i>
          <span className="title">Sales pipeline</span>
          <span className="desc">Lead to closed won</span>
        </div>
        <div className="feature-cell">
          <i className="ti ti-refresh" style={{ fontSize: 20, color: "var(--teal-light)" }}></i>
          <span className="title">Subscriptions</span>
          <span className="desc">Seats, tiers, renewals</span>
        </div>
        <div className="feature-cell">
          <i className="ti ti-message-circle" style={{ fontSize: 20, color: "var(--coral-light)" }}></i>
          <span className="title">Communication hub</span>
          <span className="desc">Email, SMS, notes</span>
        </div>
        <div className="feature-cell">
          <i className="ti ti-chart-bar" style={{ fontSize: 20, color: "var(--blue-light)" }}></i>
          <span className="title">Analytics</span>
          <span className="desc">MRR, churn, funnels</span>
        </div>
      </div>
    </div>
  );
}