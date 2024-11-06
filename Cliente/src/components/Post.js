import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

export default function Post({ id, title, summary, cover, content, createdAt, authorEmail }) {
  // Converta createdAt para uma data JavaScript, se for um timestamp do Firestore
  const createdAtDate = createdAt && createdAt._seconds
    ? new Date(createdAt._seconds * 1000)
    : null;

  // Formate a data ou defina como "Data indisponível" caso não seja válida
  const formattedDate = createdAtDate 
    ? format(createdAtDate, "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
    : "Data indisponível";

  return (
    <div className="post">
      <div className="image">
        <Link to={`/post/${id}`}>
          <img src={`http://localhost:4000/${cover}`} alt={title} />
        </Link>
      </div>
      <div className="texts">
        <Link to={`/post/${id}`}>
          <h2>{title}</h2>
        </Link>
        <p className="info">
          <span className="author">Por: {authorEmail || "Autor desconhecido"}</span>
        </p>
        <p className="date">
          <time>{formattedDate}</time>
        </p>
        <p className="summary">{summary}</p>
      </div>
    </div>
  );
}
