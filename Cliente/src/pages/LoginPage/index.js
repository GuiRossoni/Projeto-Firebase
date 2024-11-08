import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../../components/UserContext";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBphsqxmIVvORxVw7QN3zbC92HEL_Zgm70",
  authDomain: "blog-notinhas-7c131.firebaseapp.com",
  projectId: "blog-notinhas-7c131",
  storageBucket: "blog-notinhas-7c131.firebasestorage.app",
  messagingSenderId: "434926435505",
  appId: "1:434926435505:web:87b55108fdf1ae9200b690"
};
initializeApp(firebaseConfig);
const auth = getAuth();

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [redirect, setRedirect] = useState(false);
  const { setUserInfo } = useContext(UserContext);

  async function login(ev) {
    ev.preventDefault();
    try {
      // Autentica o usuário e obtém o token
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      // Envia o token para o servidor para validação
      const response = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
      });
      if (response.ok) {
        const userInfo = await response.json();
        setUserInfo(userInfo);
        setRedirect(true);
      } else {
        alert('Senha ou email inválidos!');
      }
    } catch (error) {
      console.error("Erro ao realizar login:", error);
      alert("Erro ao realizar login");
    }
  }

  if (redirect) {
    return <Navigate to={'/'} />
  }
  return (
    <form className="login" onSubmit={login}>
      <h1>Login</h1>
      <input type="email"
             placeholder="Email"
             value={email}
             onChange={ev => setEmail(ev.target.value)}/>
      <input type="password"
             placeholder="Senha"
             value={password}
             onChange={ev => setPassword(ev.target.value)}/>
      <button>Login</button>
    </form>
  );
}
