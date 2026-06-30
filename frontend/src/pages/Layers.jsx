// Layers.jsx — pipeline image layers viewer (side-by-side)
import { useDataset } from '../context/DatasetContext.jsx'
import { useNavigate } from 'react-router-dom'
import { COLORS } from '../colors.js'

const LAYER_DEFS = [
  { key: 'satellite',          label: 'Satellite Image',    desc: 'Raw satellite tile input to the pipeline.' },
  { key: 'mask',               label: 'Segmentation Mask',  desc: 'Road pixels identified by the UNet model.' },
  { key: 'skeleton',           label: 'Skeleton',           desc: '1-px morphological centerline of the mask.' },
  { key: 'graph_on_satellite', label: 'Extracted Graph',    desc: 'Nodes and edges overlaid on the satellite tile.' },
]

const PIPELINE_CHIPS = [
  'Satellite image', 'Segmentation mask',
  'Skeletonisation', 'Graph extraction', 'Criticality analysis',
]

export default function Layers() {
  const { activeDataset } = useDataset()
  const navigate = useNavigate()
  const ds = activeDataset

  return (
    <div className="rr-page" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 24px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 8,
          }}>
            Pipeline Layers
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, marginBottom: 6 }}>
            Processing Stages
          </h1>
          <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.6 }}>
            {ds
              ? `Viewing layers for: ${ds.name} · ${ds.node_count} nodes · ${ds.edge_count} edges`
              : 'Select a dataset from the Gallery to view its processing layers.'}
          </p>
        </div>

        {!ds ? (
          <div style={{
            textAlign: 'center', padding: '64px 0',
            color: COLORS.textMuted, fontSize: 14,
          }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🗂</div>
            <div style={{ marginBottom: 14 }}>No dataset selected.</div>
            <button
              onClick={() => navigate('/gallery')}
              style={{
                padding: '8px 20px', background: COLORS.accent, border: 'none',
                borderRadius: 7, color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
              className="rr-btn"
            >
              Go to Gallery
            </button>
          </div>
        ) : (
          <>
            {/* Layer cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20, marginBottom: 36,
            }}>
              {LAYER_DEFS.map(({ key, label, desc }) => {
                const filename = ds.pngs?.[key]
                const url = filename ? `/static/${ds.folder}/${filename}` : null
                return (
                  <div key={key} style={{
                    background: COLORS.panelElevated,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12, overflow: 'hidden',
                  }}>
                    {/* Image */}
                    <div style={{
                      width: '100%', aspectRatio: '1/1',
                      background: COLORS.background, position: 'relative',
                    }}>
                      {url ? (
                        <img
                          src={url}
                          alt={label}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: COLORS.textMuted, fontSize: 13,
                        }}>
                          Not available
                        </div>
                      )}

                      {/* Stage label gradient overlay */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.68))',
                        padding: '24px 12px 10px',
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                          {label}
                        </div>
                      </div>
                    </div>

                    {/* Caption */}
                    <div style={{ padding: '10px 14px 14px' }}>
                      <div style={{ fontSize: 12, color: COLORS.textMuted }}>{desc}</div>
                      {!url && (
                        <div style={{
                          marginTop: 6, fontSize: 11, color: COLORS.warning,
                          padding: '2px 8px', borderRadius: 4,
                          background: COLORS.warningSubtle, display: 'inline-block',
                        }}>
                          Image not found
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pipeline diagram */}
            <div style={{
              padding: '22px 24px', borderRadius: 12,
              background: COLORS.panelElevated, border: `1px solid ${COLORS.border}`,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 12,
              }}>
                Processing Pipeline
              </div>
              <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                {PIPELINE_CHIPS.map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      padding: '5px 12px', background: COLORS.background,
                      border: `1px solid ${COLORS.border}`, borderRadius: 6,
                      fontSize: 12, color: COLORS.text, fontWeight: 500,
                    }}>
                      {s}
                    </div>
                    {i < PIPELINE_CHIPS.length - 1 && (
                      <div style={{ color: COLORS.textCaption, fontSize: 14, margin: '0 4px' }}>→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
