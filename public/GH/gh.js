const { useState } = React;
// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  two:   { bg: "#FAC775", color: "#633806", border: "#BA7517" },
  three: { bg: "#F0997B", color: "#4A1B0C", border: "#D85A30" },
  one:   { bg: "#C0DD97", color: "#27500A", border: "#639922" },
  wash:  { bg: "#B5D4F4", color: "#042C53", border: "#378ADD" },
  washH: { bg: "repeating-linear-gradient(45deg,#B5D4F4 0,#B5D4F4 4px,#85B7EB 4px,#85B7EB 8px)", color: "#042C53", border: "#378ADD" },
};

// ─── Floor config ─────────────────────────────────────────────────────────────
const FLOORS = [
  { label: "Floor 0 (GF)", wings: "A + B + C" },
  { label: "Floor 1",      wings: "A + B + C" },
  { label: "Floor 2",      wings: "A + B + C" },
  { label: "Floor 3",      wings: "A + B" },
  { label: "Floor 4",      wings: "B only" },
];

// ─── Primitives ───────────────────────────────────────────────────────────────
function Room({ type = "two", label, w = 36, h = 26, fontSize = 10 }) {
  const c = C[type];
  return (
    <div title={String(label || type)} style={{
      width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize, fontWeight: 500, borderRadius: 3, border: `0.5px solid ${c.border}`,
      color: c.color, flexShrink: 0, textAlign: "center", lineHeight: 1.2, userSelect: "none",
      background: c.bg,
    }}>
      {label}
    </div>
  );
}

function RoomRow({ count, type, w = 44, h = 26 }) {
  return (
    <div style={{ display: "flex", gap: 2, justifyContent: "center", padding: "2px 6px", flexWrap: "wrap" }}>
      {Array.from({ length: count }, (_, i) => <Room key={i} type={type} label={i + 1} w={w} h={h} />)}
    </div>
  );
}

function RoomCol({ count, type, w = 38, h = 26, align = "flex-start" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "4px 4px", justifyContent: "center", alignItems: align }}>
      {Array.from({ length: count }, (_, i) => <Room key={i} type={type} label={i + 1} w={w} h={h} />)}
    </div>
  );
}

const lblBase = {
  writingMode: "vertical-rl", fontSize: 11, fontWeight: 500, padding: "5px 5px",
  background: "#f8f8f8", color: "#666", letterSpacing: 1,
  display: "flex", alignItems: "center", justifyContent: "center", minWidth: 26, userSelect: "none",
};

function WingRow({ name, leftType, rightType, leftCount = 5, rightCount = 5, minH = 90, children }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "#fff", borderTop: "0.5px solid #ddd" }}>
      <div style={{ ...lblBase, transform: "rotate(180deg)", borderRight: "0.5px solid #ddd" }}>{name}</div>
      <RoomCol count={leftCount} type={leftType} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "center", minHeight: minH }}>
        {children}
      </div>
      <RoomCol count={rightCount} type={rightType} align="flex-end" />
      <div style={{ ...lblBase, transform: "rotate(0deg)", borderLeft: "0.5px solid #ddd" }}>Breadth-2</div>
    </div>
  );
}

function Corridor({ label, split = false }) {
  return (
    <div style={{
      textAlign: "center", fontSize: 11, fontWeight: 500, padding: "5px 12px", letterSpacing: 0.5,
      color: split ? "#6b5fa0" : "#666",
      borderTop: split ? "2px dashed #9b8fcc" : "1px solid #ddd",
      borderBottom: split ? "2px dashed #9b8fcc" : "1px solid #ddd",
      background: split
        ? "repeating-linear-gradient(45deg,#ede9f5 0,#ede9f5 4px,#e5e0f0 4px,#e5e0f0 8px)"
        : "repeating-linear-gradient(45deg,#f1f0eb 0,#f1f0eb 4px,#e8e7e2 4px,#e8e7e2 8px)",
    }}>{label}</div>
  );
}

function WashStrip({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: "#E6F1FB", borderTop: "0.5px solid #378ADD", borderBottom: "0.5px solid #378ADD", padding: "4px 12px", gap: 6 }}>
      <div style={{ height: 1, flex: 1, background: "#378ADD" }} />
      <Room type="washH" label={label} w={120} h={26} fontSize={9} />
      <div style={{ height: 1, flex: 1, background: "#378ADD" }} />
    </div>
  );
}

function CornerWash({ sub }) {
  return (
    <div style={{ padding: "5px 5px", display: "flex", alignItems: "center", justifyContent: "center", minWidth: 52 }}>
      <Room type="washH" w={48} h={30} fontSize={9}
        label={<><span>WR</span><br /><span style={{ fontSize: 8, opacity: .7 }}>{sub}</span></>} />
    </div>
  );
}

function EdgeRow({ count, type, w = 50, h = 28, leftSub, rightSub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", background: "#fff" }}>
      <CornerWash sub={leftSub} />
      <div style={{ flex: 1, display: "flex", gap: 2, justifyContent: "center", padding: "5px 8px", flexWrap: "wrap" }}>
        {Array.from({ length: count }, (_, i) => <Room key={i} type={type} label={i + 1} w={w} h={h} />)}
      </div>
      <CornerWash sub={rightSub} />
    </div>
  );
}

function CountNote({ text }) {
  return <div style={{ textAlign: "center", fontSize: 10, color: "#888", padding: "2px 0", borderTop: "0.5px solid #eee" }}>{text}</div>;
}

// ─── Wing sections ────────────────────────────────────────────────────────────
function AWing() {
  return (
    <>
      <WingRow name="A-Wing" leftType="two" rightType="two" minH={110}>
        <div style={{ textAlign: "center", fontSize: 12, fontWeight: 500, padding: "5px 0 2px" }}>A-wing Corridor</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", padding: "4px 8px" }}>
          <Room type="three" label="Large 1" w={115} h={32} fontSize={10} />
          <Room type="three" label="Large 2" w={115} h={32} fontSize={10} />
        </div>
        <div style={{ textAlign: "center", fontSize: 10, color: "#888", padding: "2px 0" }}>2 large rooms [2 three-sitters]</div>
      </WingRow>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: "5px 8px", borderTop: "0.5px solid #ddd", background: "#fafafa" }}>
        <Room type="three" label="Large 1" w={130} h={28} fontSize={10} />
        <span style={{ fontSize: 10, color: "#888" }}>2 large rooms [2 three-sitters]</span>
        <Room type="three" label="Large 2" w={130} h={28} fontSize={10} />
      </div>
    </>
  );
}

function BWing() {
  return (
    <WingRow name="B-Wing" leftType="one" rightType="one" minH={80}>
      <div style={{ textAlign: "center", fontSize: 12, fontWeight: 500, padding: "5px 0 2px" }}>B-wing</div>
      <RoomRow count={7} type="two" w={44} h={26} />
      <div style={{ textAlign: "center", fontSize: 10, color: "#888", padding: "2px 0" }}>7 rooms [7 two-sitters]</div>
    </WingRow>
  );
}

function CWing() {
  return (
    <WingRow name="C-Wing" leftType="two" rightType="two" minH={80}>
      <div style={{ textAlign: "center", fontSize: 12, fontWeight: 500, padding: "5px 0 2px" }}>C-wing</div>
      <div style={{ textAlign: "center", fontSize: 10, color: "#888", padding: "2px 0 4px" }}>Split line with Wing B (ground floor)</div>
    </WingRow>
  );
}

// ─── Floor layouts ────────────────────────────────────────────────────────────
// Floors 0, 1, 2 — A + B + C wings
function Floor012() {
  return (
    <>
      <EdgeRow count={6} type="two" w={52} h={28} leftSub="Corner" rightSub="Corner" />
      <CountNote text="6 rooms [6 two-sitters]" />
      <AWing />
      <Corridor label="Corridor" />
      <WashStrip label="WR — Between A & B" />
      <BWing />
      <Corridor label="Corridor — Split line with Wing B" split />
      <CWing />
      <CountNote text="5 rooms [Breadth-1]  |  5 rooms [Breadth-2]" />
      <CountNote text="9 rooms [9 rooms]" />
      <EdgeRow count={9} type="one" w={44} h={28} leftSub="B1 & L1" rightSub="B2 & L1" />
    </>
  );
}

// Floor 3 — A + B wings only
function Floor3() {
  return (
    <>
      <EdgeRow count={6} type="two" w={52} h={28} leftSub="Corner" rightSub="Corner" />
      <CountNote text="6 rooms [6 two-sitters]" />
      <AWing />
      <Corridor label="Corridor" />
      <WashStrip label="WR — Between A & B" />
      <BWing />
      <CountNote text="5 rooms [Breadth-1]  |  5 rooms [Breadth-2]" />
    </>
  );
}

// Floor 4 — B wing only
function Floor4() {
  return (
    <>
      <WashStrip label="WR — B-wing (top)" />
      <BWing />
      <WashStrip label="WR — B-wing (bottom)" />
    </>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", padding: "7px 11px", background: "#f8f8f8", borderRadius: 8, border: "0.5px solid #e0e0e0", fontSize: 11, color: "#555", marginBottom: 14 }}>
      <strong style={{ fontSize: 11, color: "#888" }}>Key:</strong>
      {[["two","Two-sitter"],["three","Three-sitter (large)"],["one","One-sitter"],["wash","Washroom"]].map(([t, l]) => (
        <div key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 13, height: 13, borderRadius: 3, background: C[t].bg, border: `0.5px solid ${C[t].border}` }} />
          <span>{l}</span>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 13, height: 13, borderRadius: 3, background: "repeating-linear-gradient(45deg,#B5D4F4 0,#B5D4F4 3px,#85B7EB 3px,#85B7EB 6px)", border: "0.5px solid #378ADD" }} />
        <span>Washroom (corner / between wings)</span>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [floor, setFloor] = useState(0);
  const fc = FLOORS[floor];

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: "#f5f5f5", minHeight: "100vh", padding: "20px 16px 40px", color: "#222" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>Girls Hostel — Floor Plan</h1>
      <p style={{ fontSize: 11, color: "#777", marginBottom: 14 }}>
        Floors 0–4 &nbsp;|&nbsp; Wings vary by floor &nbsp;|&nbsp; Block sizes: A=Double-sitter, B=One-sitter, Large=Three-sitter
      </p>

      {/* Floor selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {FLOORS.map((f, i) => (
          <button key={i} onClick={() => setFloor(i)} style={{
            padding: "5px 13px", fontSize: 12, fontWeight: 500, borderRadius: 6, cursor: "pointer",
            border: i === floor ? "1.5px solid #185FA5" : "1px solid #ccc",
            background: i === floor ? "#185FA5" : "#fff",
            color: i === floor ? "#fff" : "#555",
          }}>{f.label}</button>
        ))}
      </div>

      <Legend />

      {/* Floor info bar */}
      <div style={{ textAlign: "center", fontSize: 11, color: "#777", marginBottom: 10 }}>
        Viewing: <strong style={{ color: "#185FA5" }}>{fc.label}</strong>
        &nbsp;—&nbsp; Wings active: <strong style={{ color: "#185FA5" }}>{fc.wings}</strong>
      </div>

      {/* Building shell */}
      <div style={{ border: "2px solid #aaa", borderRadius: 10, overflow: "hidden", maxWidth: 680, margin: "0 auto", background: "#fff" }}>
        {floor <= 2 && <Floor012 />}
        {floor === 3 && <Floor3 />}
        {floor === 4 && <Floor4 />}
      </div>

      {/* Key footnote */}
      <div style={{ maxWidth: 680, margin: "12px auto 0", fontSize: 11, color: "#777" }}>
        <strong>Key:</strong> Block Size (A-wing) = Double-sitter &nbsp;|&nbsp;
        Small Block (B-wing) = One-sitter &nbsp;|&nbsp;
        Large Block (A-wing) = Three-sitter
      </div>
    </div>
  );
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);