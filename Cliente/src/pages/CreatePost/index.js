import 'react-quill/dist/quill.snow.css';
import { useState } from "react";
import { Navigate } from "react-router-dom";
import Editor from "../../components/Editor";

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [redirect, setRedirect] = useState(false);

  async function createNewPost(ev) {
    ev.preventDefault();

    const data = new FormData();
    data.set('title', title);
    data.set('summary', summary);
    data.set('content', content);
    if (files.length > 0) {
      data.set('file', files[0]);
    }

    const response = await fetch('http://localhost:4000/post', {
      method: 'POST',
      body: data,
      credentials: 'include',
    });

    if (response.ok) {
      setRedirect(true);
    } else {
      const errorData = await response.json();
      console.error('Erro ao criar post:', errorData);
    }
  }

  if (redirect) {
    return <Navigate to={'/'} />
  }

  return (
    <form onSubmit={createNewPost}>
      <input
        type="text"
        placeholder={'Título'}
        value={title}
        onChange={ev => setTitle(ev.target.value)}
      />
      <input
        type="text"
        placeholder={'Descrição'}
        value={summary}
        onChange={ev => setSummary(ev.target.value)}
      />
      <input
        type="file"
        onChange={ev => setFiles(ev.target.files)}
      />
      <Editor value={content} onChange={setContent} />
      <button style={{ marginTop: '5px' }}>Criar Post</button>
    </form>
  );
}
