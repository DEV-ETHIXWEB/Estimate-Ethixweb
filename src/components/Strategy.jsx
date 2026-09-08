export default function Strategy({ strat }) {
  const items = [
    ['Offer', strat.offer],
    ['Google angle', strat.googleAngle],
    ['Meta angle', strat.metaAngle],
    ['Landing page', strat.landingPage],
    strat.seasonal ? ['Seasonal timing', strat.seasonal] : null,
  ].filter(Boolean);

  return (
    <section className="card strategy-card">
      <div className="card-label">Strategy for this service</div>
      <div className="strategy-grid">
        {items.map(([title, body]) => (
          <div className="strategy-block" key={title}>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        ))}
      </div>
      {strat.note && <div className="strategy-note">{strat.note}</div>}
    </section>
  );
}
