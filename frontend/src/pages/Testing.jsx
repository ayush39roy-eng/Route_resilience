// Testing.jsx — satellite processing pipeline interactive demo
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDataset } from '../context/DatasetContext.jsx'
import { COLORS } from '../colors.js'
import { API } from '../api.js'

const PIPELINE_STEPS = [
  {
    key: 'satellite',
    label: 'Satellite Image',
    shortLabel: 'Satellite',
    desc: 'Raw multispectral imagery acquired from orbit at ~0.5 m/pixel resolution. Roads appear as thin, bright linear features against surrounding land cover.',
  },
  {
    key: 'mask',
    label: 'Segmentation Mask',
    shortLabel: 'Seg. Mask',
    desc: 'A U-Net convolutional network predicts a binary probability map — white pixels are roads, black is background. Morphological cleaning removes noise artefacts.',
  },
  {
    key: 'skeleton',
    label: 'Road Skeleton',
    shortLabel: 'Skeleton',
    desc: 'Zhang-Suen skeletonisation traces single-pixel centrelines through the mask. Short stub branches are pruned. The result is a clean medial axis of every road.',
  },
  {
    key: 'graph_on_satellite',
    label: 'Road Network Graph',
    shortLabel: 'Road Graph',
    desc: 'Junction nodes (degree ≥ 3) are detected and connected by weighted edges. The graph is now ready for betweenness-centrality analysis and disaster simulation.',
  },
]

const HOLD_MS_MIN   = 2800
const HOLD_MS_MAX   = 4200
const LOADER_MS_MIN = 2000
const LOADER_MS_MAX = 3400

const randBetween = (min, max) => min + Math.random() * (max - min)

export default function Testing() {
  const navigate = useNavigate()
  const { datasets, setActiveId } = useDataset()
  const testDatasets = datasets.filter(d => d.is_test)

  const [selected,    setSelected]    = useState(null)
  const [phase,       setPhase]       = useState('select')  // 'select' | 'processing' | 'done'
  const [step,        setStep]        = useState(0)
  const [stepLoading, setStepLoading] = useState(false)

  // Auto-advance pipeline
  useEffect(() => {
    if (phase !== 'processing') return

    if (stepLoading) {
      const t = setTimeout(() => {
        const next = step + 1
        if (next >= PIPELINE_STEPS.length - 1) {
          setStep(next)
          setStepLoading(false)
          setTimeout(() => setPhase('done'), 300)
        } else {
          setStep(next)
          setStepLoading(false)
        }
      }, randBetween(LOADER_MS_MIN, LOADER_MS_MAX))
      return () => clearTimeout(t)
    }

    if (step < PIPELINE_STEPS.length - 1) {
      const t = setTimeout(() => setStepLoading(true), randBetween(HOLD_MS_MIN, HOLD_MS_MAX))
      return () => clearTimeout(t)
    }
  }, [phase, step, stepLoading])

  function handleProcess() {
    if (!selected) return
    setPhase('processing')
    setStep(0)
    setStepLoading(false)
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
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 24px 56px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
            color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 8,
          }}>
            Interactive Demo
          </div>
          <h1 className="rr-display" style={{
            fontSize: 24, fontWeight: 700, color: COLORS.text,
            letterSpacing: '-0.02em', marginBottom: 6,
          }}>
            Satellite Processing Pipeline
          </h1>
          <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.65, maxWidth: 580 }}>
            Choose one of the satellite images below to watch the complete processing pipeline run step-by-step —
            from raw orbit imagery all the way to a road network graph you can analyse for resilience and disaster impact.
          </p>
        </div>

        {/* ── Phase: Select ── */}
        {phase === 'select' && (
          <>
            {/* Explainer card */}
            <div style={{
              marginBottom: 24, padding: '16px 18px', borderRadius: 12,
              background: `${COLORS.secondary}0C`,
              border: `1px solid ${COLORS.secondary}25`,
              borderLeft: `3px solid ${COLORS.secondary}60`,
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{
                fontSize: 18, flexShrink: 0, marginTop: 1,
                filter: 'saturate(0.8)',
              }}>
                🛰
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 5 }}>
                  How to use this demo
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.7 }}>
                  Pick any satellite image card, then click <strong style={{ color: COLORS.secondary }}>Process Pipeline</strong>.
                  You'll watch each processing stage animate live — segmentation mask, road skeleton, and the final extracted graph.
                  At the end you can jump straight into criticality analysis or disaster simulation for that image.
                </div>
              </div>
            </div>

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
              Choose a satellite image to test
            </div>

            {testDatasets.length === 0 ? (
              <div style={{
                padding: '32px 24px', borderRadius: 12,
                background: COLORS.panelElevated, border: `1px solid ${COLORS.border}`,
                color: COLORS.textMuted, fontSize: 13, textAlign: 'center',
              }}>
                No test datasets found. Add folders with nodes.json + edges.json to TESTDATA/.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: 12, marginBottom: 24,
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

            {selected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <button
                  onClick={handleProcess}
                  className="rr-btn"
                  style={{
                    padding: '12px 32px', borderRadius: 10,
                    fontSize: 13, fontWeight: 700,
                    background: COLORS.secondary, border: 'none',
                    color: '#fff', cursor: 'pointer',
                    letterSpacing: '-0.01em',
                    boxShadow: `0 4px 24px ${COLORS.secondary}55`,
                  }}
                >
                  Process Pipeline →
                </button>
                <div style={{ fontSize: 12, color: COLORS.textCaption }}>
                  <span style={{ color: COLORS.text, fontWeight: 600 }}>{selected.name}</span>
                  {' · '}{selected.node_count} nodes · {selected.edge_count} edges
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: COLORS.textCaption, fontStyle: 'italic' }}>
                Select an image above to continue
              </div>
            )}
          </>
        )}

        {/* ── Phase: Processing / Done ── */}
        {(phase === 'processing' || phase === 'done') && (
          <>
            {/* Step indicator strip */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0, marginBottom: 22 }}>
              {PIPELINE_STEPS.map((s, i) => {
                const isDone    = phase === 'done' || i < step || (i === step && !stepLoading)
                const isCurrent = phase === 'processing' && i === step
                const isLoading = isCurrent && stepLoading
                return (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: isDone
                        ? `${COLORS.secondary}18`
                        : isCurrent ? `${COLORS.accent}14` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isDone
                        ? COLORS.secondary + '40'
                        : isCurrent ? COLORS.accent + '40' : 'rgba(255,255,255,0.06)'}`,
                      color: isDone ? COLORS.secondary : isCurrent ? COLORS.accent : COLORS.textCaption,
                      display: 'flex', alignItems: 'center', gap: 5,
                      transition: 'all 0.3s ease',
                    }}>
                      <span style={{ fontSize: 9 }}>{isDone ? '✓' : isLoading ? '◌' : i + 1}</span>
                      {s.shortLabel}
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div style={{
                        padding: '0 5px', fontSize: 10,
                        color: isDone ? COLORS.secondary : COLORS.textCaption,
                        opacity: isDone ? 0.55 : 0.25,
                      }}>→</div>
                    )}
                  </div>
                )
              })}
              <div style={{ marginLeft: 'auto' }}>
                <button
                  onClick={handleReset}
                  className="rr-btn"
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 11,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    color: COLORS.textCaption, cursor: 'pointer',
                  }}
                >
                  ← Change image
                </button>
              </div>
            </div>

            {/* ── Side-by-side layout ── */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

              {/* Left: image panel */}
              <div style={{
                position: 'relative', flexShrink: 0,
                width: 340, height: 340,
                background: COLORS.panelElevated,
                border: `1px solid ${COLORS.border}`,
                borderTop: `1px solid ${phase === 'done' ? COLORS.accent : COLORS.secondary}40`,
                borderRadius: 14, overflow: 'hidden',
                boxShadow: `0 12px 48px rgba(0,0,0,0.6), 0 0 32px ${
                  phase === 'done' ? COLORS.accent : COLORS.secondary
                }08`,
              }}>
                {stepLoading ? (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 14,
                  }}>
                    <div className="rr-space-loader" style={{ width: 42, height: 42 }} />
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                      Processing {PIPELINE_STEPS[step + 1]?.shortLabel}…
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
                    color: COLORS.textCaption, fontSize: 11,
                  }}>
                    No image
                  </div>
                )}

                {/* Step badge */}
                {!stepLoading && (
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: 'rgba(13,11,8,0.92)',
                    border: `1px solid ${phase === 'done' ? COLORS.accent + '45' : COLORS.secondary + '35'}`,
                    borderRadius: 5, padding: '3px 8px',
                    fontSize: 8, fontWeight: 700,
                    color: phase === 'done' ? COLORS.accent : COLORS.secondary,
                    letterSpacing: '0.13em', textTransform: 'uppercase',
                    backdropFilter: 'blur(12px)',
                  }}>
                    {PIPELINE_STEPS[displayStep]?.shortLabel}
                  </div>
                )}

                {/* Step counter */}
                {!stepLoading && (
                  <div style={{
                    position: 'absolute', bottom: 10, right: 10,
                    fontSize: 9, color: COLORS.textCaption,
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  }}>
                    {displayStep + 1} / {PIPELINE_STEPS.length}
                  </div>
                )}

                {phase === 'done' && (
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `radial-gradient(ellipse 80% 55% at 50% 100%, ${COLORS.accent}12 0%, transparent 70%)`,
                  }} />
                )}
              </div>

              {/* Right: info panel */}
              <div style={{ flex: 1, minWidth: 240 }}>

                {/* Step title */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.13em',
                    color: phase === 'done' ? COLORS.accent : COLORS.secondary,
                    textTransform: 'uppercase', marginBottom: 5,
                  }}>
                    {stepLoading
                      ? `Step ${step + 1} → ${step + 2}`
                      : `Step ${displayStep + 1} of ${PIPELINE_STEPS.length}`}
                  </div>
                  <div style={{
                    fontSize: 18, fontWeight: 700, color: COLORS.text,
                    letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8,
                  }}>
                    {stepLoading
                      ? PIPELINE_STEPS[step + 1]?.label
                      : PIPELINE_STEPS[displayStep]?.label}
                  </div>
                  <p style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.7 }}>
                    {stepLoading
                      ? PIPELINE_STEPS[step + 1]?.desc
                      : PIPELINE_STEPS[displayStep]?.desc}
                  </p>
                </div>

                {/* Done: stats + CTAs */}
                {phase === 'done' && (
                  <>
                    {/* Quick stats */}
                    <div style={{
                      display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap',
                    }}>
                      {[
                        { label: 'Nodes', value: selected?.node_count, color: COLORS.accent },
                        { label: 'Edges', value: selected?.edge_count, color: COLORS.secondary },
                        { label: 'Components', value: selected?.component_count, color: COLORS.textMuted },
                      ].map(s => (
                        <div key={s.label} style={{
                          padding: '8px 14px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          textAlign: 'center',
                        }}>
                          <div style={{
                            fontSize: 20, fontWeight: 700, color: s.color,
                            fontFamily: "'Space Grotesk',monospace", lineHeight: 1,
                            marginBottom: 3,
                          }}>
                            {s.value ?? 'N/A'}
                          </div>
                          <div style={{ fontSize: 9, color: COLORS.textCaption, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 16, lineHeight: 1.65 }}>
                      Processing complete. The road network is extracted and ready — choose an analysis mode below.
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => { setActiveId(selected.id); navigate('/criticality') }}
                        className="rr-btn"
                        style={{
                          padding: '10px 22px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                          background: COLORS.accent, border: 'none', color: '#0A0A0F',
                          cursor: 'pointer',
                          boxShadow: `0 4px 20px ${COLORS.accent}50`,
                        }}
                      >
                        Analyse Criticality
                      </button>
                      <button
                        onClick={() => { setActiveId(selected.id); navigate('/simulation') }}
                        className="rr-btn"
                        style={{
                          padding: '10px 22px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                          background: `${COLORS.danger}15`,
                          border: `1px solid ${COLORS.danger}40`,
                          color: COLORS.danger, cursor: 'pointer',
                        }}
                      >
                        Simulate Disaster
                      </button>
                    </div>
                  </>
                )}

                {/* Processing phase — "up next" hint */}
                {phase === 'processing' && !stepLoading && step < PIPELINE_STEPS.length - 1 && (
                  <div style={{
                    marginTop: 18, padding: '8px 12px', borderRadius: 7,
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 11, color: COLORS.textCaption,
                    display: 'flex', alignItems: 'center', gap: 7,
                  }}>
                    <span style={{ opacity: 0.5 }}>Up next:</span>
                    <span style={{ color: COLORS.textMuted }}>
                      {PIPELINE_STEPS[step + 1]?.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SatCard({ ds, isSelected, onSelect }) {
  const imgUrl = ds.pngs_urls?.satellite
    ? `${API}${ds.pngs_urls.satellite}`
    : ds.thumbnail_url ? `${API}${ds.thumbnail_url}` : null

  return (
    <div
      onClick={onSelect}
      className="rr-dataset-card"
      style={{
        background: COLORS.panelElevated,
        border: `1px solid ${isSelected ? `${COLORS.secondary}55` : COLORS.border}`,
        borderTop: `1px solid ${isSelected ? `${COLORS.secondary}80` : COLORS.border}`,
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        boxShadow: isSelected
          ? `0 0 0 1px ${COLORS.secondary}28, 0 8px 28px rgba(0,0,0,0.5), 0 0 18px ${COLORS.secondary}12`
          : 'none',
        transition: 'all 0.18s ease',
      }}
    >
      <div style={{ aspectRatio: '1/1', position: 'relative', background: COLORS.background, overflow: 'hidden' }}>
        {imgUrl ? (
          <img src={imgUrl} alt={ds.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: COLORS.textCaption, fontSize: 11,
          }}>No preview</div>
        )}
        {isSelected && (
          <div style={{
            position: 'absolute', top: 7, right: 7,
            background: COLORS.secondary, color: '#fff',
            fontSize: 8, fontWeight: 700, padding: '2px 6px',
            borderRadius: 3, letterSpacing: '0.07em',
            boxShadow: `0 0 10px ${COLORS.secondary}60`,
          }}>
            SELECTED
          </div>
        )}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(135deg, ${COLORS.secondary}10 0%, transparent 55%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 32,
          background: `linear-gradient(transparent, ${COLORS.panelElevated}cc)`,
          pointerEvents: 'none',
        }} />
      </div>
      <div style={{ padding: '9px 11px 11px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, marginBottom: 3, letterSpacing: '-0.01em' }}>
          {ds.name}
        </div>
        <div style={{ fontSize: 10, color: COLORS.textCaption }}>
          <span style={{ color: COLORS.secondary, fontWeight: 600 }}>{ds.node_count}</span> nodes ·{' '}
          <span style={{ color: COLORS.secondary, fontWeight: 600 }}>{ds.edge_count}</span> edges
        </div>
      </div>
    </div>
  )
}
