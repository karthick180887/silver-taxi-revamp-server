'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button, TextField, Paper, Typography, Box, Alert, CircularProgress } from '@mui/material';

export default function LoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState(''); // Can be email or phone
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Use environment variable or default to localhost:8081
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Determine if identifier is email or phone
            // Simple logic: if it contains '@', it's an email. Otherwise treat as phone.
            const isEmail = identifier.includes('@');

            const payload: any = { password };
            if (isEmail) {
                payload.email = identifier;
            } else {
                payload.phone = identifier;
            }

            // POST to /auth/admin/signin directly or via /auth/login rewrite
            const response = await axios.post(`${API_URL}/auth/admin/signin`, payload);

            // Backend returns: token, *AdminResponse
            const { token } = response.data;

            if (token || response.data) {
                // Fallback if token is direct string or in property
                const authToken = token || (typeof response.data === 'string' ? response.data : response.data.accessToken);
                if (authToken) {
                    // Set cookie for middleware access
                    document.cookie = `token=${authToken}; path=/; max-age=86400; SameSite=Lax`;
                    document.cookie = `admin_token=${authToken}; path=/; max-age=86400; SameSite=Lax`; // redundancy

                    localStorage.setItem('admin_token', authToken);
                    router.push('/admin');
                } else {
                    // Maybe the entire response body is the object?
                    console.log("Login success but structure unclear:", response.data);
                    // For now, redirect anyway to test
                    router.push('/');
                }
            }

        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || err.response?.data || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-900 px-4">
            <Paper elevation={3} className="p-8 w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl border border-gray-100 dark:border-zinc-700">
                <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-blue-600/20">ST</div>
                    <Typography variant="h5" component="h1" fontWeight="bold" className="text-gray-900 dark:text-white">
                        Admin Login
                    </Typography>
                    <Typography variant="body2" color="textSecondary" className="text-gray-500 dark:text-gray-400">
                        Sign in to manage Silver Taxi
                    </Typography>
                </Box>

                {error && <Alert severity="error" className="mb-4">{error}</Alert>}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <TextField
                        id="identifier"
                        name="identifier"
                        label="Email or Phone Number"
                        variant="outlined"
                        fullWidth
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className="dark:bg-zinc-900"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
                                '&:hover fieldset': { borderColor: '#2563eb' },
                            }
                        }}
                    />
                    <TextField
                        id="password"
                        name="password"
                        label="Password"
                        variant="outlined"
                        fullWidth
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white normal-case py-3 text-lg font-bold shadow-blue-600/20"
                        sx={{ mt: 2, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                    </Button>
                </form>
            </Paper>
        </div>
    );
}
