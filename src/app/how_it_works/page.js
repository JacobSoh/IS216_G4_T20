// HowItWorks.jsx
export default function HowItWorks() {
  const text = `
    This page demonstrates a simple JavaScript example.
    When this component loads, JavaScript runs and displays this text.
    You can change this text in the code and it will update automatically.
  `;

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial, sans-serif', lineHeight: 1.6 }}>
      <h1 style={{ color: '#007acc' }}>How It Works</h1>
      <p>{text}</p>
    </div>
  );
}
