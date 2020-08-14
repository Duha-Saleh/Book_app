'use strict';

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');
require('ejs');
require('dotenv').config();
const PORT = process.env.PORT || 3000 ;
const client = new pg.Client(process.env.DATABASE_URL);
const app = express();
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.use(cors());
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');

app.get('/', index);
app.get('/searches/new', newSearch);
app.post('/searches', searchResult);
app.post('/books', addingBooks);
app.get('/books/:book_id', bookDetails);
app.put('/books/:book_id', updateBook);
app.delete('/books/:book_id', deleteBook);
app.get('*', notFound);


function index(req, res){
    let SQL = 'SELECT * FROM books;';
    client.query(SQL).then(outputs =>{
        res.render('pages/index', {books: outputs.rows, numOfSavedBooks: outputs.rowCount});
    })
};

function newSearch(req, res){
    res.render('pages/searches/new');
};

function searchResult(req, res){
    let search = req.body.input;
    let url = `https://www.googleapis.com/books/v1/volumes?q=+` 
    if(req.body.search === 'title'){
        url += `intitle:${search}`;
    }else if(req.body.search === 'author'){
        url += `inauthor:${search}`;
    }
    superagent.get(url).then(resOfShearch =>{
        let data = resOfShearch.body.items;
        let x = data.map(book =>{
            let newBook = new Book(book);
            return newBook;
        });
        res.render('pages/searches/show', {books: x});
    });
};

function addingBooks(req, res){
    let SQL = 'INSERT INTO books (image_url, title, author, description, isbn, bookshelf) VALUES ($1, $2, $3, $4, $5, $6);';
    let assignValues = [req.body.image_url, req.body.title,req.body.author, req.body.description, req.body.isbn, req.body.bookshelf];
    console.log(req.body);
    client.query(SQL, assignValues).then(() =>{
        let SQL1 = 'SELECT * FROM books WHERE isbn=$1;';
        let assignValues = [req.body.isbn];
        client.query(SQL1, assignValues).then(output =>{
            res.redirect(`books/${output.rows[0].id}`);
        });
    });
};

function bookDetails(req, res){
    console.log(req.params)
    let SQL = 'SELECT * FROM books WHERE id=$1;';
    let assignValues = [req.params.book_id];
    client.query(SQL, assignValues).then(output =>{
        console.log('detail', output.rows);
        res.render('pages/books/show', {detailsOfBook: output.rows[0]});
    });
};

function updateBook(req, res){
    let SQL = `UPDATE books SET title=$1, author=$2, description=$3, image_url=$4, bookshelf=$5, isbn=$6 WHERE ID =$7;`;
    let {title, author, description, image_url, bookshelf, isbn} = req.body;
    let id = req.params.book_id;
    let assignValues = [title, author, description, image_url, bookshelf, isbn, id];
    client.query(SQL, assignValues).then(output => {
      res.redirect(`/books/${id}`);
  });
};

function deleteBook(req, res){
    let SQL = `DELETE FROM books WHERE id=$1;`
    let assignValues=[req.params.book_id];
    client.query(SQL,assignValues).then(()=>{
        res.redirect('/')
    })
}

function Book(info){
    const missingImgs = `https://i.imgur.com/J5LVHEL.jpg`;
    this.title = info.volumeInfo.title ? info.volumeInfo.title : "No Name Avaliable";
    this.author = info.volumeInfo.authors ? info.volumeInfo.authors : "Not Found";
    this.img = info.volumeInfo.imageLinks ? info.volumeInfo.imageLinks.thumbnail : "https://i.ytimg.com/vi/uiCm88Me_3U/maxresdefault.jpg";
    this.description = info.volumeInfo.description ? info.volumeInfo.BookDescription : "No Description Found";
    this.isbn = info.volumeInfo.industryIdentifiers ? info.volumeInfo.industryIdentifiers[0].identifier : "Not Exists";
    this.bookshelf = info.volumeInfo.categories ? info.volumeInfo.categories : "Not under a class";
};

function notFound(req, res){
    res.render('pages/error');
};

app.use((error, req, res) => {
    res.status(500).send(error);
});

client.connect().then(() =>{
    app.listen(PORT, () => {
        console.log(`listening on port ${PORT}`);
    });
});