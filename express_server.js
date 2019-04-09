var express = require('express');
var app = express();
var PORT = 8080;

app.set('view engine', 'ejs');

var urlDatabase = {
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

app.get('/urls/:shortURL', (request, response) => {
    let templateVars = {shortURL: request.params.shortURL, longURL: urlDatabase[request.params.shortURL]}
    response.render('urls_show', templateVars);
});

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