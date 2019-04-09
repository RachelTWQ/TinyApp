let express = require('express');
let app = express();
let PORT = 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

let urlDatabase = {
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
    console.log(request.body);
    response.send('OK');
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