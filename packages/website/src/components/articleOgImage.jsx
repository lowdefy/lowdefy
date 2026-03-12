import { ImageResponse } from 'next/og';

const size = { width: 1200, height: 630 };

export default function articleOgImage({ title, subtitle, tags }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0f172a',
          fontFamily: 'sans-serif',
          padding: '60px 80px',
        }}
      >
        {/* Top: Lowdefy branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Icon mark */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <div
              style={{
                width: 28,
                height: 36,
                background: 'white',
                borderRadius: 3,
                display: 'flex',
              }}
            />
            <div
              style={{
                width: 16,
                height: 16,
                background: '#1890ff',
                borderRadius: 2,
                marginLeft: -9,
              }}
            />
          </div>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'white', letterSpacing: -0.5 }}>
            Lowdefy
          </div>
        </div>

        {/* Middle: Title + Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.15,
              letterSpacing: -1.5,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 24,
                color: '#94a3b8',
                lineHeight: 1.4,
                maxWidth: 900,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Bottom: Tags + accent line */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {tags && tags.length > 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              {tags.map((tag) => (
                <div
                  key={tag}
                  style={{
                    fontSize: 16,
                    color: '#94a3b8',
                    border: '1.5px solid #1890ff',
                    borderRadius: 20,
                    padding: '6px 18px',
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
          <div
            style={{
              width: '100%',
              height: 4,
              background: '#1890ff',
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
