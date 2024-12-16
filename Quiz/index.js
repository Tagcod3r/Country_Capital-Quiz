import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';  
import bodyparser from 'body-parser';
import firebase from 'firebase-admin';
import dotenv from 'dotenv';
import 'dotenv/config';


dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'Views'));

app.use(express.static(path.join(__dirname,'public')));
app.use(bodyparser.urlencoded({extended:true}));


/*
const db= new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
}); */

const serviceAccountPath = '/etc/secrets/serviceAccountKey.json';

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccountPath)
});


/* Initializing Firestore */
const db = firebase.firestore();

/* fetching data from the db (async to ensure the rest of the code is executed while acessing the data) */
let CnC = [];
const fetchCapitalData = async () => {
    try {
        const snapshot = await db.collection('capital').get();
        snapshot.forEach(doc => {
            CnC.push(doc.data()); 
        });
    } catch (error) {
        console.error('Error fetching data from Firestore:', error);
    }
};

fetchCapitalData();


/* get function to find the random index from db */
let score=0;
app.get('/', (req, res) => {

    score=0;

    const index = Math.floor(Math.random()*CnC.length);
    const randomcountry = CnC[index].country;
    const capital = CnC[index].capital;
    let gameover = false;  
    let alert = '';
    res.render('home', { country: randomcountry, capital: capital, score: score ,alertMessage: alert, gameOver:gameover });
});

/* post function for rendering ejs and comparison */
app.post('/', (req, res) => {
    const userAnswer = req.body.capital.trim().toLowerCase();
    const correctAnswer = req.body.correctCapital.toLowerCase();
    
    let gameover =false;
    let updatescore =0;
    let alert = '';
    if (userAnswer === correctAnswer) {
        score++; 
    }else if(userAnswer === ''){
            score=0;
    }else{
        updatescore=score;
        score=0;
        gameover=true;
        alert = 'Game Over! Your final score';
    }


    const randomIndex = Math.floor(Math.random() * CnC.length);
    const randomcountry = CnC[randomIndex].country; 
    const capital = CnC[randomIndex].capital;  

    res.render('home', { country: randomcountry, capital: capital, score: score, alertMessage: alert, gameOver:gameover, finals:updatescore });
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});



