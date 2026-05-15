'use client'

import React from 'react'

const LoginPage = () => {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [email, setEmail] = React.useState('');

    const handleLogin = () => {
        const data = fetch('http://localhost:8000/api/login/')
        
    }
  return (
    <div>
        <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => (setUsername(e.target.value), console.log(e.target.value))}
        />
    </div>
  )
}

export default LoginPage