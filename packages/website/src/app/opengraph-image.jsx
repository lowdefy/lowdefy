import { ImageResponse } from 'next/og';

export const alt = 'Lowdefy - Config-First Web Stack for AI and Humans';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Lowdefy icon mark */}
        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 80,
              background: 'white',
              borderRadius: 4,
              position: 'relative',
              display: 'flex',
            }}
          />
          <div
            style={{
              width: 36,
              height: 36,
              background: '#1890ff',
              borderRadius: 4,
              marginLeft: -20,
              marginBottom: 0,
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: 'white',
            letterSpacing: -2,
            marginBottom: 16,
          }}
        >
          Lowdefy
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Config-First Web Stack for AI and Humans
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 120,
            height: 4,
            background: '#1890ff',
            borderRadius: 2,
            marginTop: 40,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
