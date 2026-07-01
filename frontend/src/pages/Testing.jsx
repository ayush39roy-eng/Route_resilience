// Testing.jsx — satellite processing pipeline interactive demo
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataset } from '../context/DatasetContext.jsx'
import { COLORS } from '../colors.js'
import { API } from '../api.js'

const PIPELINE_STEPS = [
  { key: 'satellite',          label: 'Satellite',     desc: 'Raw satellite imagery captured from orbit' },
  { key: 'mask',               label: 'Seg. Mask',     desc: 'Road pixels extracted via segmentation model' },
  { key: 'skeleton',           label: 'Skeleton',      desc: 'Road centrelines traced via skeletonisation' },
  { key: 'graph_on_satellite', label: 'Road Graph',    desc: 'Nodes & edges overlaid — ready for analysis' },
]

export default function Testing() {
  const navigate = useNavigate()
  const { datasets, setActiveId } = useDataset()
  const testDatasets = datasets.filter(d => d.is_test)

  const [selected,     setSelected]     = useState(null)
  const [phase,        setPhase]        = useState('select')  // 'select' | 'processing' | 'done'
  const [step,         setStep]         = useState(0)
  const [stepLoading,  setStepLoading]  = useState(false)

  // Auto-advance pipeline steps
  useEffect(() => {
    if (phase !== 'processing') return

    if (stepLoading) {
      // Show loader briefly, then reveal next step
      const t = setTimeout(() => {
        setStep(s => {
          const next = s + 1
          if (next >= PIPELINE_STEPS.length - 1) {
            setStepLoading(false)
            setTimeout(() => setPhase('done'), 200)
            return next
          }
          return next
        })
        setStepLoading(false)
      }, 700)
      return () => clearTimeout(t)
    }

    if (step < PIPELINE_STEPS.length - 1) {
      // Hold current step image, then start loading transition
      const t = setTimeout(() => setStepLoading(true), 1800)
      return () => clearTimeout(t)
    }
  }, [phase, step, stepLoading])

  function handleProcess() {
    if (!selected) return
    setPhase('processing')
    setStep(0)
    setStepLoading(false)
  }

  function handleSimulate() {
    setActiveId(selected.id)
    navigate('/simulation')
  }

  function handleCriticality() {
    setActiveId(selected.id)
    navigate('/criticality')
  }

  function handleReset() {
    setPhase('select')
    setSelected(null)
    setStep(0)
    setStepLoading(false)
  }

  const displayStep   = phase === 'done' ? PIPELINE_STEPS.length - 1 : step
  const currentKey    = PIPELINE_STEPS[displayStep]?.key
  const currentImgUrl = selected?.pngs_urls?.[currentKey]
    ? `${API}${selected.pngs_urls[currentKey]}`
    : null

  return (
    <div className="rr-page" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px 72px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
            color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 8,
          }}>
            Interactive Demo
          </div>
          <h1 className="rr-display" style={{
            fontSize: 26, fontWeight: 700, color: COLORS.text,
            letterSpacing: '-0.02em', marginBottom: 6,
          }}>
            Satellite Processing Pipeline
          </h1>
          <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.65, maxWidth: 540 }}>
            Select a satellite image to watch the full processing pipeline —
            from raw imagery to a fully analysable road network graph.
          </p>
        </div>

        {/* ── Phase: Select ── */}
        {phase === 'select' && (
          <>
            <div style={{
              fontSize: 10, fontWeight: 700, color: COLORS.secondary,
              letterSpacing: '0.13em', textTransform: 'uppercase', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 18, height: 18, borderRadius: 5,
                background: `${COLORS.secondary}20`, border: `1px solid ${COLORS.secondary}40`,
                fontSize: 9, fontWeight: 800,
              }}>1</span>
              Choose a satellite image
            </div>

            {testDatasets.length === 0 ? (
              <div style={{
                padding: '32px 24px', borderRadius: 12,
                background: COLORS.panelElevated, border: `1px solid ${COLORS.border}`,
                color: COLORS.textMuted, fontSize: 13, textAlign: 'center',
              }}>
                No test datasets found in the TESTDATA folder.
                Add folders with nodes.json + edges.json to get started.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 14, marginBottom: 28,
              }}>
                {testDatasets.map(ds => (
                  <SatCard
                    key={ds.id}
                    ds={ds}
                    isSelected={selected?.id === ds.id}
                    onSelect={() => setSelected(ds)}
                  />
                ))}
              </div>
            )}

            {selected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={handleProcess}
                  className="rr-btn"
                  style={{
                    padding: '12px 32px', borderRadius: 10,
                    fontSize: 13, fontWeight: 700,
                    background: COLORS.secondary, border: 'none',
                    color: '#fff', cursor: 'pointer',
                    letterSpacing: '-0.01em',
                    boxShadow: `0 4px 24px ${COLORS.secondary}50`,
                  }}
                >
                  Process Pipeline →
                </button>
                <span style={{ fontSize: 12, color: COLORS.textCaption }}>
                  {selected.name} · {selected.node_count} nodes · {selected.edge_count} edges
                </span>
              </div>
            )}
          </>
        )}

        {/* ── Phase: Processing / Done ── */}
        {(phase === 'processing' || phase === 'done') && (
          <>
            {/* Pipeline step indicators */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0, marginBottom: 28 }}>
              {PIPELINE_STEPS.map((s, i) => {
                const isDone    = phase === 'done' || i < displayStep || (i === displayStep && !stepLoading)
                const isCurrent = phase === 'processing' && i === step
                const isLoading = isCurrent && stepLoading
                return (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                      background: isDone
                        ? `${COLORS.secondary}1A`
                        : isCurrent
                          ? `${COLORS.accent}15`
                          : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isDone
                        ? COLORS.secondary + '45'
                        : isCurrent
                          ? COLORS.accent + '45'
                          : 'rgba(255,255,255,0.07)'}`,
                      color: isDone
                        ? COLORS.secondary
                        : isCurrent
                          ? COLORS.accent
                          : COLORS.textCaption,
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.3s ease',
                    }}>
                      <span style={{ fontSize: 10, opacity: 0.9 }}>
                        {isDone ? '✓' : isLoading ? '◌' : i + 1}
                      </span>
                      {s.label}
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div style={{
                        padding: '0 6px', fontSize: 11,
                        color: isDone ? COLORS.secondary : COLORS.textCaption,
                        opacity: isDone ? 0.6 : 0.3,
                      }}>
                        →
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Image display */}
            <div style={{
              position: 'relative',
              width: '100%', maxWidth: 640, margin: '0 auto 20px',
              background: COLORS.panelElevated,
              border: `1px solid ${COLORS.border}`,
              borderTop: `1px solid ${phase === 'done' ? COLORS.accent : COLORS.secondary}35`,
              borderRadius: 16, overflow: 'hidden',
              aspectRatio: '1/1',
              boxShadow: `0 12px 48px rgba(0,0,0,0.6), 0 0 32px ${phase === 'done' ? COLORS.accent : COLORS.secondary}0A`,
            }}>
              {stepLoading ? (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 16,
                }}>
                  <div className="rr-space-loader" style={{ width: 44, height: 44 }} />
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                    Processing {PIPELINE_STEPS[step + 1]?.label ?? ''}…
                  </div>
                </div>
              ) : currentImgUrl ? (
                <img
                  src={currentImgUrl}
                  alt={PIPELINE_STEPS[displayStep]?.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: COLORS.textCaption, fontSize: 12,
                }}>
                  No image available
                </div>
              )}

              {/* Step label badge */}
              {!stepLoading && (
                <div style={{
                  position: 'absolute', top: 12, left: 12,
                  background: 'rgba(13,11,8,0.90)',
                  border: `1px solid ${phase === 'done' ? COLORS.accent + '40' : COLORS.secondary + '35'}`,
                  borderRadius: 6, padding: '4px 10px',
                  fontSize: 9, fontWeight: 700,
                  color: phase === 'done' ? COLORS.accent : COLORS.secondary,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  backdropFilter: 'blur(12px)',
                }}>
                  {PIPELINE_STEPS[displayStep]?.label}
                </div>
              )}

              {/* Phase "done" — subtle amber glow overlay */}
              {phase === 'done' && (
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${COLORS.accent}14 0%, transparent 70%)`,
                }} />
              )}
            </div>

            {/* Step description (processing) */}
            {phase === 'processing' && !stepLoading && (
              <p style={{
                textAlign: 'center', fontSize: 12, color: COLORS.textMuted,
                marginBottom: 20, lineHeight: 1.65,
              }}>
                {PIPELINE_STEPS[step]?.desc}
                {step < PIPELINE_STEPS.length - 1 && (
                  <span style={{ color: COLORS.textCaption }}>
                    {' '}— up next: {PIPELINE_STEPS[step + 1]?.label}
                  </span>
                )}
              </p>
            )}

            {/* Done state CTAs */}
            {phase === 'done' && (
              <>
                <p style={{
                  textAlign: 'center', fontSize: 12, color: COLORS.textMuted,
                  marginBottom: 18, lineHeight: 1.65,
                }}>
                  {PIPELINE_STEPS[PIPELINE_STEPS.length - 1]?.desc}
                  {' '}· {selected?.node_count} nodes, {selected?.edge_count} edges extracted.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleCriticality}
                    className="rr-btn"
                    style={{
                      padding: '11px 28px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: COLORS.accent, border: 'none', color: '#0A0A0F',
                      cursor: 'pointer',
                      boxShadow: `0 4px 20px ${COLORS.accent}50`,
                    }}
                  >
                    Analyse Criticality
                  </button>
                  <button
                    onClick={handleSimulate}
                    className="rr-btn"
                    style={{
                      padding: '11px 28px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                      background: `${COLORS.danger}18`,
                      border: `1px solid ${COLORS.danger}45`,
                      color: COLORS.danger, cursor: 'pointer',
                    }}
                  >
                    Simulate Disaster
                  </button>
                  <button
                    onClick={handleReset}
                    className="rr-btn"
                    style={{
                      padding: '11px 20px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: COLORS.textMuted, cursor: 'pointer',
                    }}
                  >
                    ← Try Another
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SatCard({ ds, isSelected, onSelect }) {
  const imgUrl = ds.pngs_urls?.satellite
    ? `${API}${ds.pngs_urls.satellite}`
    : ds.thumbnail_url
      ? `${API}${ds.thumbnail_url}`
      : null

  return (
    <div
      onClick={onSelect}
      className="rr-dataset-card"
      style={{
        background: COLORS.panelElevated,
        border: `1px solid ${isSelected ? `${COLORS.secondary}55` : COLORS.border}`,
        borderTop: `1px solid ${isSelected ? `${COLORS.secondary}80` : COLORS.border}`,
        borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        boxShadow: isSelected
          ? `0 0 0 1px ${COLORS.secondary}28, 0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${COLORS.secondary}12`
          : 'none',
        transition: 'all 0.18s ease',
      }}
    >
      {/* Thumbnail */}
      <div style={{ aspectRatio: '1/1', position: 'relative', background: COLORS.background, overflow: 'hidden' }}>
        {imgUrl ? (
          <img
            src={imgUrl} alt={ds.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: COLORS.textCaption, fontSize: 12,
          }}>
            No preview
          </div>
        )}

        {isSelected && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: COLORS.secondary, color: '#fff',
            fontSize: 8, fontWeight: 700, padding: '2px 7px',
            borderRadius: 4, letterSpacing: '0.07em',
            boxShadow: `0 0 10px ${COLORS.secondary}60`,
          }}>
            SELECTED
          </div>
        )}

        {/* Blue tint + bottom fade */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(135deg, ${COLORS.secondary}12 0%, transparent 55%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
          background: `linear-gradient(transparent, ${COLORS.panelElevated}cc)`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 5,
          letterSpacing: '-0.01em',
        }}>
          {ds.name}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textCaption }}>
          <span style={{ color: COLORS.secondary, fontWeight: 600 }}>{ds.node_count}</span> nodes
          {' · '}
          <span style={{ color: COLORS.secondary, fontWeight: 600 }}>{ds.edge_count}</span> edges
        </div>
      </div>
    </div>
  )
}
