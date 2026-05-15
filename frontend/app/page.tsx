// app/page.tsx

export default async function Home() {
  // 1. Call the Django backend
  // We use { cache: 'no-store' } so Next.js doesn't cache the test response
  const res = await fetch('http://127.0.0.1:8000/api/hello/', { 
    cache: 'no-store' 
  });
  
  // 2. Parse the JSON response
  const data = await res.json();

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Next.js + Django Connection Test</h1>
      
      <div style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <h3>Data from Django:</h3>
        <p><strong>Message:</strong> {data.message}</p>
        <p><strong>Status:</strong> {data.status}</p>
      </div>
    </main>
  );
}