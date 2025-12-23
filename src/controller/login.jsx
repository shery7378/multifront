'use client';
// src/controller/login.jsx
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Button from '@/components/UI/Button';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [response, setResponse] = useState(null);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setResponse(null);
        console.log(email, 'sss');
        try {
            // Step 1: Fetch CSRF cookie
            await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`,
                {
                    withCredentials: true,
                });

            // Step 2: Send login request
            const res = await axios.post(
                // process.env.NEXT_PUBLIC_API_URL + '/api/login',
                `${process.env.NEXT_PUBLIC_API_URL}/api/login`,
                { email, password },
                {
                    withCredentials: true,
                    // headers: { Origin: 'http://multikonnect.test:3000' },
                }
            );
console.log(res.data.token ,'token');
            // Step 3: Store token and display response
            localStorage.setItem('access_token', res.data.token);
            setResponse(res.data);
            // router.push('/dashboard'); // Redirect to dashboard on success
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Login failed. Please check your credentials.'
            );
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center ">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="vendor@multikonnect.test"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <Button type='submit' fullWidth variant='primary' className='rounded-lg' > Login</Button>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {response && (
                    <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
                        <h2 className="font-semibold">Login Successful</h2>
                        <pre className="mt-2 text-sm">
                            {JSON.stringify(response, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}