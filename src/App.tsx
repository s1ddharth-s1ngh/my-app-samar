export default function App() {
  return (
    <div className="p-8">
      <h1 className="font-heading text-4xl mb-4">Ciclo - Design Tokens</h1>
      <p className="font-sans text-ink-muted mb-8">
        This is a test page for design tokens. The heading above is Bricolage Grotesque, and this paragraph is Inter.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-bg rounded shadow border border-line">
          <div className="text-ink font-semibold">bg</div>
        </div>
        <div className="p-4 bg-surface rounded shadow border border-line">
          <div className="text-ink font-semibold">surface</div>
        </div>
        <div className="p-4 bg-surface rounded shadow border border-line">
          <div className="text-ink font-semibold">ink</div>
          <div className="text-ink-muted text-sm">ink-muted</div>
        </div>
        <div className="p-4 bg-accent text-surface rounded shadow">
          <div className="font-semibold">accent</div>
        </div>
        <div className="p-4 bg-signal text-surface rounded shadow">
          <div className="font-semibold">signal</div>
        </div>
        <div className="p-4 bg-alert text-surface rounded shadow">
          <div className="font-semibold">alert</div>
        </div>
      </div>
    </div>
  )
}
