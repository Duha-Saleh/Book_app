'use strict';
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const { req, res } = require('express');
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.get('/', (req, res) =>{
    res.render('pages/index');
});

app.get('/searches/new', (req, res) => {
    res.render('pages/searches/new')
});

app.post('/searches', (req, res) =>{
    console.log('Get req', req.body);
    let search = req.body.searchBox;
    let url = `https://www.googleapis.com/books/v1/volumes?q=+` 
    if(req.body.search === 'title'){
        url += `intitle:${search}`;
    }else if(req.body.search === 'author'){
        url += `inauthor:${search}`;
    }
    superagent.get(url).then(resOfShearch =>{
        let data = resOfShearch.body.items;
        let books = data.map(element =>{
            let newBook = new Book(element);
            return newBook;
        });
        res.render('pages/searches/show', {outpotBooks: books});
    });
});
function Book(info){
    this.title = info.volumeInfo.title;
    this.author = info.volumeInfo.author;
    this.img = info.volumeInfo.imageLinks.thumbnail;
    this.description = info.volumeInfo.description;
    const missingImgs = `https://i.imgur.com/J5LVHEL.jpg`;
}


app.get('*', (req, res) =>{
    res.status(404).send('Not Found');
});
app.use((error, req, res) => {
    res.status(500).send(error);
});
app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
});