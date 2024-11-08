import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  async function register(ev) {
    ev.preventDefault();
    
    if (password.length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    const response = await fetch('http://localhost:4000/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      alert('Usuário registrado!');
      navigate('/login');
    } else {
      alert('Falha no registro');
    }
  }
  
  return (
    <form className="register" onSubmit={register}>
      <h1>Register</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={ev => setEmail(ev.target.value)}
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={ev => setPassword(ev.target.value)}
      />
      <button>Register</button>
    </form>
  );
}
