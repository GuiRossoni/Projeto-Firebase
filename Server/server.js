const express = require('express');
const cors = require('cors');
const firebaseAdmin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getFirestore, Timestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');

// Configurações do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCdr0nswlx0jaPXEc3UYouYCC0DaxhikfM",
    authDomain: "blog-4a.firebaseapp.com",
    projectId: "blog-4a",
    storageBucket: "blog-4a.firebasestorage.app",
    messagingSenderId: "1035052042035",
    appId: "1:1035052042035:web:e66f289d4bffc0eef6a046"
};

const app = express();
initializeApp(firebaseConfig);
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.applicationDefault(),
});
const db = getFirestore();
const auth = getAuth();

console.log("Conectado ao Firestore");

// Middleware e configurações
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

// Registro de Usuário
app.post('/register', async (req, res) => {
    console.log("Requisição para registro de usuário recebida");
    const { email, password } = req.body;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log(`Usuário registrado com email: ${email}`);
        res.json({ id: userCredential.user.uid, email: userCredential.user.email });
    } catch (error) {
        console.error("Erro no registro de usuário:", error.message);
        res.status(400).json(error.message);
    }
});

// Login de Usuário
app.post('/login', async (req, res) => {
    console.log("Requisição de login recebida");
    const { email, password } = req.body;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        console.log(`Usuário logado com email: ${email}`);
        res.cookie('token', token).json({ id: userCredential.user.uid, email });
    } catch (error) {
        console.error("Erro no login:", error.message);
        res.status(400).json(error.message);
    }
});

// Verificar Perfil
app.get('/profile', async (req, res) => {
    console.log("Requisição para verificar perfil recebida");
    const { token } = req.cookies;
    try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        res.json(decodedToken);
    } catch (error) {
        console.error("Erro ao verificar perfil:", error.message);
        res.status(401).json('Token inválido');
    }
});

// Logout
app.post('/logout', (req, res) => {
    console.log("Requisição de logout recebida");
    res.cookie('token', '').json('Desconectado');
});

// Criar Post
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    console.log("Requisição para criação de post recebida");
    const { token } = req.cookies;
    try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        const { title, summary, content } = req.body;
        const { originalname, path } = req.file;
        const ext = originalname.split('.').pop();
        const newPath = path + '.' + ext;
        fs.renameSync(path, newPath);

        const postRef = db.collection('posts').doc();
        await postRef.set({
            title,
            summary,
            content,
            cover: newPath,
            author: decodedToken.uid,
            createdAt: Timestamp.now(),
        });
        console.log(`Post criado com título: ${title}`);
        res.json({ id: postRef.id, title, summary, content });
    } catch (error) {
        console.error("Erro ao criar post:", error.message);
        res.status(400).json(error.message);
    }
});

// Atualizar Post
app.put('/post/:id', uploadMiddleware.single('file'), async (req, res) => {
    console.log(`Requisição para atualização de post com ID: ${req.params.id} recebida`);
    const { token } = req.cookies;
    const { id } = req.params;
    try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        const postRef = db.collection('posts').doc(id);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            console.log("Post não encontrado");
            return res.status(404).json('Post não encontrado');
        }
        if (postDoc.data().author !== decodedToken.uid) {
            console.log("Permissão negada para atualizar o post");
            return res.status(403).json('Permissão negada');
        }

        const { title, summary, content } = req.body;
        let newPath = postDoc.data().cover;

        if (req.file) {
            const { originalname, path } = req.file;
            const ext = originalname.split('.').pop();
            newPath = path + '.' + ext;
            fs.renameSync(path, newPath);
        }

        await postRef.update({
            title,
            summary,
            content,
            cover: newPath,
        });
        console.log(`Post atualizado com título: ${title}`);
        res.json({ id, title, summary, content });
    } catch (error) {
        console.error("Erro ao atualizar post:", error.message);
        res.status(400).json(error.message);
    }
});

// Listar Posts
app.get('/post', async (req, res) => {
    console.log("Requisição para listar posts recebida");
    try {
        const posts = await db.collection('posts').orderBy('createdAt', 'desc').limit(20).get();
        const postList = posts.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`Foram encontrados ${postList.length} posts`);
        res.json(postList);
    } catch (error) {
        console.error("Erro ao listar posts:", error.message);
        res.status(400).json(error.message);
    }
});

// Visualizar Post Individual
app.get('/post/:id', async (req, res) => {
    console.log(`Requisição para visualizar post com ID: ${req.params.id} recebida`);
    const { id } = req.params;
    try {
        const postDoc = await db.collection('posts').doc(id).get();
        if (!postDoc.exists) {
            console.log("Post não encontrado");
            return res.status(404).json('Post não encontrado');
        }
        res.json({ id: postDoc.id, ...postDoc.data() });
    } catch (error) {
        console.error("Erro ao visualizar post:", error.message);
        res.status(400).json(error.message);
    }
});

// Exclusão de Post
app.delete('/post/:id', async (req, res) => {
    console.log(`Requisição para exclusão de post com ID: ${req.params.id} recebida`);
    const { token } = req.cookies;
    const { id } = req.params;
    try {
        // Verificar o token de autenticação do usuário
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        
        const postRef = db.collection('posts').doc(id);
        const postDoc = await postRef.get();

        if (!postDoc.exists) {
            console.log("Post não encontrado");
            return res.status(404).json('Post não encontrado');
        }

        // Verificar se o usuário é o autor do post
        if (postDoc.data().author !== decodedToken.uid) {
            console.log("Permissão negada para excluir o post");
            return res.status(403).json('Permissão negada');
        }

        // Excluir a imagem associada ao post (opcional)
        const coverPath = postDoc.data().cover;
        if (coverPath && fs.existsSync(coverPath)) {
            fs.unlinkSync(coverPath);
        }

        // Excluir o documento do Firestore
        await postRef.delete();
        console.log(`Post com ID: ${id} excluído com sucesso`);
        res.json({ message: 'Post excluído com sucesso' });
    } catch (error) {
        console.error("Erro ao excluir post:", error.message);
        res.status(400).json(error.message);
    }
});

app.listen(4000, () => {
    console.log("Servidor rodando na porta 4000");
});
