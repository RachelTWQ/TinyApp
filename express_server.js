const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set('view engine', 'ejs');

const urlDatabase = {
    'b2xVn2': 'http://www.lighthouselabs.ca',
    '9sm5xK': 'http://www.google.com'
};

app.get('/', (request, response) => {
    response.send('Hello');
});

app.get('/urls', (request, response) => {
    let templateVars = {urls: urlDatabase};
    response.render('urls_index', templateVars);
});

app.get('/urls/new', (request, response) => {
    response.render('urls_new');
});

app.post('/urls', (request, response) => {
    let randomString = generateRandomString();
    urlDatabase[randomString] = request.body['longURL'];
    response.send(`http://localhost:8080/u/${randomString}`);
});

app.post('/urls/:shortURL/delete', (request, response) => {
    let templateVars = {shortURL: request.params.shortURL, longURL: urlDatabase[request.params.shortURL]}
    delete urlDatabase[templateVars.shortURL];
    response.redirect('/urls');
});

app.get('/u/:shortURL', (request, response) => {
    const longURL = urlDatabase[request.params.shortURL];
    response.statusCode = 301;
    response.redirect(longURL);
});

app.get('/urls/:shortURL', (request, response) => {
    let templateVars = {shortURL: request.params.shortURL, longURL: urlDatabase[request.params.shortURL]}
    response.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (request, response) => {
    const { shortURL } = request.params;
    const { longURL } = request.body;
    urlDatabase[shortURL] = longURL;
    response.redirect('/urls');
})

app.get('/urls.json', (request, response) => {
    response.json(urlDatabase);
});

app.get('/hello', (request, response) => {
    // response.send('<html><body>Hello <b>World</b></body></html>\n');
    let templateVars = {greeting: 'Hello World!'};
    response.render('hello_world', templateVars);
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString(){
    // return Math.floor((1 + Math.random()) * 0xfffff).toString(16);
    let option = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890qwertyuioplkjhgfdsazxcvbnm';
    let string = '';
    for (let i = 0; i < 6; i++){
        string += option[Math.floor(Math.random() * option.length)];
    }
    return string;
}