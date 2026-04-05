type AppIconProps = {
  scale?: number;
};

export function AppIcon({ scale = 1 }: AppIconProps) {
  const accentBlur = 18 * scale;
  const glowBlur = 24 * scale;

  return (
    <div
      style={{
        alignItems: "center",
        background:
          "radial-gradient(circle at 18% 20%, rgba(125,211,252,0.9), transparent 34%), linear-gradient(145deg, #020617 0%, #0f172a 42%, #0f766e 100%)",
        borderRadius: 22 * scale,
        display: "flex",
        height: "100%",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        width: "100%"
      }}
    >
      <div
        style={{
          background: "rgba(34,211,238,0.82)",
          borderRadius: 9999,
          filter: `blur(${accentBlur}px)`,
          height: 30 * scale,
          left: 12 * scale,
          opacity: 0.9,
          position: "absolute",
          top: 10 * scale,
          width: 30 * scale
        }}
      />
      <div
        style={{
          background: "rgba(56,189,248,0.44)",
          borderRadius: 9999,
          filter: `blur(${glowBlur}px)`,
          height: 44 * scale,
          position: "absolute",
          right: 8 * scale,
          top: 8 * scale,
          width: 44 * scale
        }}
      />
      <div
        style={{
          alignItems: "center",
          border: `${1.5 * scale}px solid rgba(255,255,255,0.28)`,
          borderRadius: 18 * scale,
          boxShadow: `0 ${10 * scale}px ${24 * scale}px rgba(15,23,42,0.28)`,
          display: "flex",
          height: 40 * scale,
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
          width: 40 * scale
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 100%)",
            inset: 0,
            position: "absolute"
          }}
        />
        <div
          style={{
            border: `${2.2 * scale}px solid rgba(255,255,255,0.96)`,
            borderRadius: 10 * scale,
            display: "flex",
            height: 21 * scale,
            position: "relative",
            width: 21 * scale
          }}
        >
          <div
            style={{
              borderBottom: `${2.2 * scale}px solid rgba(255,255,255,0.96)`,
              borderRadius: `${5 * scale}px ${5 * scale}px 0 0`,
              height: 7 * scale,
              left: 2.6 * scale,
              position: "absolute",
              top: 2.8 * scale,
              width: 16 * scale
            }}
          />
          <div
            style={{
              background: "rgba(255,255,255,0.96)",
              borderRadius: 9999,
              bottom: 4 * scale,
              height: 2.4 * scale,
              left: "50%",
              position: "absolute",
              transform: "translateX(-50%)",
              width: 8 * scale
            }}
          />
        </div>
      </div>
    </div>
  );
}
