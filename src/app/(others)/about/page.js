// About.jsx
export default function About() {
  const text = `
    Welcome to our website! This page is all about us.
    Here you can learn who we are, what we do, and why we do it.
    Our goal is to create helpful, engaging, and reliable content 
    for our visitors.
  `;

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial, sans-serif', lineHeight: 1.6 }}>
      <h1 style={{ color: '#007acc' }}>About Us</h1>
      <p>{text}</p>
    </div>
  );
}
