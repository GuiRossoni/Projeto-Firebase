import { formatISO9075 } from "date-fns";
import { Link } from "react-router-dom";

export default function Post({ _id, title, summary, cover, content, createdAt, author }) {
  // Verifica se o autor é um objeto e se possui a propriedade username
  const authorName = author && typeof author === 'object' && author.username ? author.username : 'Autor Desconhecido';

  return (
    <div className="post">
      <div className="image">
        <Link to={`/post/${_id}`}>
          {/* Verifica se a 'cover' está disponível */}
          <img src={cover ? `http://localhost:4000/${cover}` : 'default-image-path.jpg'} alt={title} />
        </Link>
      </div>
      <div className="texts">
        <Link to={`/post/${_id}`}>
          <h2>{title}</h2>
        </Link>
        <p className="info">
          <a className="author">{authorName}</a>
          <time>{formatISO9075(new Date(createdAt))}</time>
        </p>
        <p className="summary">{summary}</p>
      </div>
    </div>
  );
}
