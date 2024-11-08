const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
const admin = require('firebase-admin');

// Inicializa o Express
const app = express();

// Inicializa o Firebase Admin SDK
const serviceAccount = require('./json/blog-notinhas-7c131-firebase-adminsdk-8pbxo-b3f9288745.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "blog-notinhas-7c131.firebasestorage.app"
});

const db = admin.firestore();
const auth = admin.auth();

// Verifica a conexão com o Firestore
db.collection('posts').limit(1).get()
    .then(() => {
        console.log("Firebase conectado com sucesso.");
    })
    .catch((error) => {
        console.error("Erro ao conectar ao Firebase:", error);
    });

const secret = 'asdfe45we45w345wegw345werjktjwertkj';

// Permitir o CORS para o frontend
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

// Middleware para log das requisições
app.use(morgan('dev'));

// Função para verificar e decodificar o token JWT
function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: "Token não fornecido" });
    }

    jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: "Token inválido" });
        }
        req.user = decoded; // Salva os dados do usuário
        next();
    });
}

// Endpoint de registro de usuário
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userRecord = await auth.createUser({
            email,
            password
        });
        res.json({ id: userRecord.uid, email: userRecord.email });
    } catch (error) {
        console.error("Erro ao registrar usuário:", error);
        res.status(400).json(error);
    }
});

// Endpoint de login
app.post('/login', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extrai o token do cabeçalho

    if (!token) {
        return res.status(401).json({ error: "Token não fornecido" });
    }

    try {
        // Verifica o token JWT usando o Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        const { uid, email } = decodedToken;

        // Cria um token JWT próprio para o backend
        jwt.sign({ id: uid, email }, secret, {}, (err, serverToken) => {
            if (err) throw err;

            // Salva o token como um cookie com configurações de segurança
            res.cookie('token', serverToken, {
                httpOnly: true,  // Impede acesso ao cookie via JavaScript
                secure: process.env.NODE_ENV === 'production', // Só permite cookies em conexões HTTPS
                sameSite: 'Strict',  // Protege contra ataques CSRF
            });

            res.json({ id: uid, email });
        });
    } catch (error) {
        console.error("Erro ao realizar login:", error);
        res.status(401).json("Token inválido ou não autorizado");
    }
});

// Endpoint de perfil
app.get('/profile', verifyToken, (req, res) => {
    res.json(req.user);
});

// Endpoint de logout
app.post('/logout', (req, res) => {
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'Strict' });
    res.json({ message: 'Logout realizado com sucesso' });
});

// Endpoint para criar um post
app.post('/post', verifyToken, uploadMiddleware.single('file'), async (req, res) => {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = `${path}.${ext}`; // Renomeia a imagem
    fs.renameSync(path, newPath); // Renomeia fisicamente o arquivo

    const { title, summary, content } = req.body;
    const user = req.user; // Dados do usuário autenticado

    try {
        const postRef = await db.collection('posts').add({
            title,
            summary,
            content,
            cover: `uploads/${newPath.split('/').pop()}`, // Salva a imagem com o nome alterado
            authorId: user.id,
            authorEmail: user.email,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ id: postRef.id });
    } catch (error) {
        console.error("Erro ao criar post:", error);
        res.status(500).json("Erro ao criar post");
    }
});

// Endpoint para atualizar um post
app.put('/post/:id', verifyToken, uploadMiddleware.single('file'), async (req, res) => {
    const postId = req.params.id;
    const { title, summary, content } = req.body;

    let cover;
    if (req.file) {
        // Processa o novo arquivo, se presente
        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = `${path}.${ext}`;
        fs.renameSync(path, newPath);
        cover = `uploads/${newPath.split('/').pop()}`; // Inclui o caminho 'uploads/'
    } else {
        // Se não houver um novo arquivo, mantém o campo `cover` existente
        const postDoc = await db.collection('posts').doc(postId).get();
        if (postDoc.exists) {
            cover = postDoc.data().cover; // Mantém o valor do campo cover original
        } else {
            return res.status(404).json("Post não encontrado");
        }
    }

    try {
        const postRef = db.collection('posts').doc(postId);

        const updatedData = {
            title,
            summary,
            content,
            cover, // Salva o campo cover com o caminho completo
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await postRef.update(updatedData);
        res.json("Post atualizado com sucesso");
    } catch (error) {
        console.error("Erro ao atualizar post:", error);
        res.status(500).json("Erro ao atualizar post");
    }
});


// Endpoint para excluir um post
app.delete('/post/:id', verifyToken, async (req, res) => {
    const postId = req.params.id;
    try {
        await db.collection('posts').doc(postId).delete();
        res.json({ message: 'Post deletado com sucesso' });
    } catch (error) {
        console.error("Erro ao deletar post:", error);
        res.status(500).json("Erro ao deletar post");
    }
});

// Endpoint para obter um post específico
app.get('/post/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const postDoc = await db.collection('posts').doc(postId).get();
        if (!postDoc.exists) {
            return res.status(404).json("Post não encontrado");
        }
        const postData = postDoc.data();
        
        postData.createdAt = postData.createdAt
            ? postData.createdAt.toDate().toLocaleString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                timeZone: 'UTC'
            })
            : null;

        res.json({ id: postDoc.id, ...postData });
    } catch (error) {
        console.error("Erro ao obter post:", error);
        res.status(500).json("Erro ao obter post");
    }
});

// Endpoint para obter lista de posts
app.get('/post', async (req, res) => {
    try {
        const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').limit(20).get();
        const posts = snapshot.docs.map(doc => {
            const postData = { id: doc.id, ...doc.data() };
            return postData;
        });
        res.json(posts);
    } catch (error) {
        console.error("Erro ao obter posts:", error);
        res.status(500).json("Erro ao obter posts");
    }
});

// Endpoint para obter os comentários de um post específico
app.get('/post/:id/comments', async (req, res) => {
    const postId = req.params.id;
    try {
        const commentsSnapshot = await db.collection('posts').doc(postId).collection('comments').orderBy('createdAt').get();
        const comments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(comments);
    } catch (error) {
        console.error("Erro ao obter comentários:", error);
        res.status(500).json("Erro ao obter comentários");
    }
});

// Endpoint para adicionar um comentário a um post
app.post('/post/:id/comments', verifyToken, async (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;
    const user = req.user;

    try {
        await db.collection('posts').doc(postId).collection('comments').add({
            content,
            authorId: user.id,
            authorEmail: user.email,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json("Comentário adicionado com sucesso");
    } catch (error) {
        console.error("Erro ao adicionar comentário:", error);
        res.status(500).json("Erro ao adicionar comentário");
    }
});

// Endpoint para excluir um comentário
app.delete('/post/:postId/comments/:commentId', verifyToken, async (req, res) => {
    const { postId, commentId } = req.params;

    try {
        const commentRef = db.collection('posts').doc(postId).collection('comments').doc(commentId);
        const commentDoc = await commentRef.get();
    
        if (!commentDoc.exists) {
            return res.status(404).json({ error: "Comentário não encontrado" });
        }
    
        // Verifica se o usuário autenticado é o autor do comentário
        if (commentDoc.data().authorId !== req.user.id) {
            return res.status(403).json({ error: "Você não tem permissão para excluir este comentário" });
        }
    
        await commentRef.delete();
        res.json({ message: "Comentário excluído com sucesso" });
    } catch (error) {
        console.error("Erro ao excluir comentário:", error);
        res.status(500).json({ error: "Erro ao excluir comentário" });
    }    
});



// Inicia o servidor
app.listen(4000, () => {
    console.log("Servidor rodando na porta 4000");
});