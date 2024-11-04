import Post from "../../components/Post";
import { useEffect, useState } from "react";

export default function IndexPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/post')
      .then(response => response.json())
      .then(data => {
        // Verifica se 'data' é um array antes de definir em 'posts'
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error("A resposta da API não é um array:", data);
          setPosts([]); // Define um array vazio para evitar o erro
        }
      })
      .catch(error => {
        console.error("Erro ao buscar posts:", error);
        setPosts([]); // Define um array vazio em caso de erro
      });
  }, []);

  return (
    <>
      {Array.isArray(posts) && posts.length > 0 ? (
        posts.map(post => (
          <Post key={post._id} {...post} />
        ))
      ) : (
        <p>Nenhum post encontrado.</p>
      )}
    </>
  );
}
