// HowItWorks.jsx
export default function HowItWorks() {
  const text = `
    This is the how it works  (prob gonna remove page, integrating with about page)
  `;

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial, sans-serif', lineHeight: 1.6 }}>
      <h1 style={{ color: '#007acc' }}>How It Works</h1>
      <p>{text}</p>
    </div>
  );
}
