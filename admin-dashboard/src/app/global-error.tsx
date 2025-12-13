'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
                    <h2 style={{ color: 'red' }}>Critical Application Error</h2>
                    <p>The application crashed before it could render.</p>
                    <pre style={{ background: '#f0f0f0', padding: '1rem', overflow: 'auto' }}>
                        {error.message}
                    </pre>
                    <pre style={{ background: '#f0f0f0', padding: '1rem', overflow: 'auto', fontSize: '0.8rem' }}>
                        {error.stack}
                    </pre>
                    <button onClick={() => reset()} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
