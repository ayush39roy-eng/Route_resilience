// Upload.jsx — placeholder upload / pipeline trigger page
import { COLORS } from '../colors.js'

const PIPELINE_STEPS = [
  { title: 'Segmentation model',  desc: 'UNet identifies road pixels at sub-meter resolution.' },
  { title: 'Skeletonisation',     desc: 'Morphological thinning reduces road pixels to 1-px centerlines.' },
  { title: 'Graph extraction',    desc: 'Skeleton pixels become nodes (junctions / endpoints) and edges.' },
  { title: 'Gap healing',         desc: 'Short occlusions are reconnected using nearest-endpoint search.' },
  { title: 'Criticality analysis',desc: 'Betweenness centrality and global efficiency are precomputed.' },
]

export default function Upload() {
  return (
    <div className="rr-page" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 60px' }}>

        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
            color: COLORS.textCaption, textTransform: 'uppercase', marginBottom: 8,
          }}>
            Upload
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
            Add a New Dataset
          </h1>
          <p style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.7 }}>
            Upload a satellite image patch and run the full extraction pipeline to produce a new
            routable road graph. Segmentation, skeletonisation, and graph extraction are handled
            automatically.
          </p>
        </div>

        {/* Drop zone */}
        <div style={{
          border: `2px dashed ${COLORS.border}`, borderRadius: 12,
          padding: '52px 24px', textAlign: 'center', marginBottom: 28,
          background: COLORS.panelElevated, cursor: 'not-allowed', opacity: 0.52,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛰</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>
            Drop satellite image here
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>
            PNG or GeoTIFF · up to 4096 × 4096 px
          </div>
          <div style={{
            display: 'inline-block', padding: '6px 18px', borderRadius: 6,
            background: COLORS.background, border: `1px solid ${COLORS.border}`,
            fontSize: 12, color: COLORS.textMuted,
          }}>
            Browse files
          </div>
        </div>

        {/* Pipeline steps */}
        <div style={{ marginBottom: 28 }}>
          {PIPELINE_STEPS.map(({ title, desc }, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, padding: '12px 0',
              borderBottom: `1px solid ${COLORS.border}`,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: COLORS.panelElevated, border: `1px solid ${COLORS.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: COLORS.textCaption, marginTop: 1,
              }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 3 }}>
                  {title}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6 }}>
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, padding: '16px 20px', borderRadius: 10,
          background: COLORS.panelElevated, border: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>
            Upload and pipeline execution coming soon.
          </div>
          <button disabled style={{
            padding: '8px 20px', background: COLORS.accent, border: 'none',
            borderRadius: 7, color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'not-allowed', opacity: 0.4, fontFamily: 'inherit',
          }}>
            Run extraction
          </button>
        </div>

      </div>
    </div>
  )
}
