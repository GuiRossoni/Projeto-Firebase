import { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { UserContext } from "../../components/UserContext";

// Função para formatar o timestamp Firestore, caso esteja no formato de objeto
const formatDate = (timestamp) => {
  if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp) {
    // Converte o timestamp Firestore para um objeto Date
    const date = new Date(timestamp._seconds * 1000);
    return format(date, 'PPpp', { locale: ptBR });
  }
  return 'Data indisponível';
};

export default function PostPage() {
  const [postInfo, setPostInfo] = useState(null);
  const [error, setError] = useState(null);
  const { userInfo } = useContext(UserContext);
  const { id } = useParams();

  useEffect(() => {
    fetch(`http://localhost:4000/post/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(postInfo => {
        console.log("Informações do post:", postInfo); // Verifique o valor de createdAt aqui
        setPostInfo(postInfo); // Salva as informações do post
      })
      .catch(error => {
        console.error("Houve um problema com a operação de fetch:", error);
        setError("Erro ao carregar post.");
      });
  }, [id]);

  if (error) return <div>{error}</div>;
  if (!postInfo) return <div>Carregando...</div>;

  // Formatação da data de criação do post
  const formattedDate = postInfo.createdAt ? formatDate(postInfo.createdAt) : 'Data indisponível';

  return (
    <div className="post-page">
      <h1>{postInfo.title}</h1>
      <time>{formattedDate}</time>
      <div className="author">Criado por: {postInfo.authorEmail || 'Autor desconhecido'}</div>

      {userInfo && userInfo.id === postInfo.authorId && (
        <div className="edit-row">
          <Link className="edit-btn" to={`/edit/${postInfo.id}`}>
            Editar esse Post
          </Link>
        </div>
      )}

      <div className="image">
        <img src={`http://localhost:4000/${postInfo.cover}`} alt="Post Cover" />
      </div>

      <div className="content" dangerouslySetInnerHTML={{ __html: postInfo.content }} />
    </div>
  );
}
