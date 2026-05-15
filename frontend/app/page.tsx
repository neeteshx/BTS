"use client";

import { useState } from "react";

export default function LoginTester() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Waiting to test connection...");
  const [tokenPreview, setTokenPreview] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Connecting to Windows laptop...");
    setTokenPreview("");

    try {
      // Pointing directly to your Windows machine's IP address
      const res = await fetch("http://192.168.29.155:8000/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("✅ Connection Successful! Logged in.");
        // Showing a tiny preview of the token to prove it worked
        setTokenPreview(data.access.substring(0, 20) + "..."); 
        
        // In a real app, you would save this token:
        // localStorage.setItem("access", data.access);
        // localStorage.setItem("refresh", data.refresh);
      } else {
        setStatus("❌ Connection worked, but Django rejected the login.");
        setTokenPreview(JSON.stringify(data)); // This will show the exact error from Django
      }
    } catch (error) {
      console.error(error);
      setStatus("🚨 Network Error! Could not reach the backend.");
      setTokenPreview("Make sure Django is running with '0.0.0.0:8000' and Windows Firewall isn't blocking it.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Backend Link Test
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
          >
            Test Connection
          </button>
        </form>

        {/* Status Output Console */}
        <div className="mt-8 p-4 bg-gray-900 rounded-md">
          <p className="text-sm text-gray-300 font-mono mb-2">Status:</p>
          <p className={`text-sm font-bold ${status.includes('✅') ? 'text-green-400' : status.includes('❌') || status.includes('🚨') ? 'text-red-400' : 'text-yellow-400'}`}>
            {status}
          </p>
          
          {tokenPreview && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-300 font-mono mb-1">Response Payload:</p>
              <p className="text-xs text-green-300 font-mono break-all bg-gray-800 p-2 rounded">
                {tokenPreview}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}