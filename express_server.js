const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const bcrypt = require('bcrypt');

const cookieSession = require('cookie-session');
app.use(cookieSession({
    name: 'session',
    keys: ['Arashi'],
    maxAge: 10 * 60 * 1000
}));

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

//database with default test data
const urlDatabase = {
    'b2xVn2': { longURL: 'http://www.lighthouselabs.ca', userID: 'aJ48lW' },
    '9sm5xK': { longURL: 'http://www.google.com', userID: 'aJ48lW' },
    'b6UTxQ': { longURL: 'https://www.tsn.ca', userID: 'aJ48lW' },
    'i3BoGr': { longURL: 'https://www.google.ca', userID: 'aJ48lW' },
    'aaa': { longURL: 'https://www.google.ca', userID: 'userRandomID' }
};

const users = {
    'userRandomID': {
        id: 'userRandomID',
        email: 'user@example.com',
        password: 'purple-monkey-dinosaur'
    },
    'user2RandomID': {
        id: 'user2RandomID',
        email: 'user2@example.com',
        password: 'dishwasher-funk'
    },
    'aJ48lW': {
        id: 'aJ48lW',
        email: 'a@a',
        password: 'a'
    }
}

//home page
app.get('/', (request, response) => {
    if (!users[request.session['user_id']]) {
        response.redirect('/login');
    } else {
        response.redirect('/urls');
    }
});

//display the URLs
app.get('/urls', (request, response) => {
    if (!users[request.session['user_id']]) {
        request.session = null;
        response.redirect('/login');
    } else {
        let templateVars = {
            user: users[request.session['user_id']]['email'],
            urls: urlsForUser(users[request.session['user_id']]['id']),
            user_id: users[request.session['user_id']]['id'],
        };
        response.render('urls_index', templateVars);
    }
});

//logout and clear cookies
app.post('/logout', (request, response) => {
    request.session['user_id'] = null;
    response.redirect('/login');
});

//get a form for entering a new longURL
app.get('/urls/new', (request, response) => {
    if (!users[request.session['user_id']]) {
        response.redirect('/login')
    } else {
        let templateVars = {
            user: users[request.session['user_id']]['email']
        }
        response.render('urls_new', templateVars);
    }
});

//load registration page
app.get('/register', (request, response) => {
    let templateVars = {
        user: request.session['user_id']
    };
    response.render('urls_register', templateVars);
});

//post on register page and rediret back to list
app.post('/register', (request, response) => {
    let uniqueID = generateRandomString();
    const {
        id,
        email,
        password
    } = request.body;

    const user = {
        id: uniqueID,
        email,
        password: bcrypt.hashSync(password, 10)
    };

    if (email === '' || password === '') {
        response.statusCode = 404;
        response.render('urls_empty');
    } else {
        if (!emailMatch(email)) {
            response.statusCode = 200;
            users[uniqueID] = user;
            request.session['user_id'] = uniqueID;
            response.redirect('/urls');
        } else {
            response.statusCode = 404;
            response.render('urls_error');
        }
    }
});

//load login page
app.get('/login', (request, response) => {
    if(!users[request.session['user_id']]){
        request.session['user_id'] = null
    }
    let templateVars = {
        user: request.session['user_id']
    };
    response.render('urls_login', templateVars);
});

//login
app.post('/login', (request, response) => {
    
    let user = {};
    user['email'] = request.body.email;
    user['password'] = request.body.password;

    if (emailMatch(request.body.email) && bcrypt.compareSync(request.body.password, users[findIdFromEmail(request.body.email)]['password'])) {
        response.statusCode = 200;
        request.session['user_id'] = findIdFromEmail(request.body.email);
        response.redirect('/urls');
    } else { 
        response.statusCode = 403;
        response.render('urls_error');
    }

});

//display the shortURL for redirect
app.post('/urls', (request, response) => {
    if (!users[request.session['user_id']]) {
        response.redirect('/login')
    } else {
        let randomString = generateRandomString();
        let middleware = {};
        middleware['longURL'] = request.body['longURL'];
        middleware['userID'] = request.session['user_id'];
        urlDatabase[randomString] = middleware;
        response.render('urls_generated', { url: `http://localhost:8080/u/${randomString}` });
    }
});

//delete an existing 
app.delete('/urls/:shortURL/delete', (request, response) => {
    if (!users[request.session['user_id']]) {
        response.redirect('/login')
    } else {
        let templateVars = {
            shortURL: request.params.shortURL,
            longURL: urlDatabase[request.params.shortURL]['longURL'], 
            user: users[request.session['user_id']]['email']
        }
        //check valid login user
        if (users[request.session['user_id']].id === urlDatabase[request.params.shortURL]['userID']) {
            delete urlDatabase[templateVars.shortURL]; 
        }
        response.redirect('/urls');
    }
});

//redirect to the longURL
app.get('/u/:shortURL', (request, response) => {
    const longURL = urlDatabase[request.params.shortURL]['longURL'];
    response.statusCode = 301;
    response.redirect(longURL);
});

//display the URL
app.get('/urls/:shortURL', (request, response) => {
    if (!users[request.session['user_id']]) {
        response.redirect('/login')
    } else if (users[request.session['user_id']].id == urlDatabase[request.params.shortURL]['userID']) {
        let templateVars = {
            shortURL: request.params.shortURL,
            longURL: urlDatabase[request.params.shortURL]['longURL'],
            user: users[request.session['user_id']]['email']
        }
        response.render('urls_show', templateVars);
    }
    else {
        response.redirect('/urls');
    }
});

//update the URL
app.put('/urls/:shortURL', (request, response) => {
    if (!users[request.session['user_id']]) {
        response.redirect('/login')
    } else {
        const { shortURL } = request.params;
        const { longURL } = request.body;
        urlDatabase[shortURL]['longURL'] = longURL;
        urlDatabase[shortURL]['userID'] = request.session['user_id'];
        response.redirect('/urls');
    }
});

app.get('/urls.json', (request, response) => {
    response.json(urlDatabase);
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
    let option = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890qwertyuioplkjhgfdsazxcvbnm';
    let string = '';
    for (let i = 0; i < 6; i++) {
        string += option[Math.floor(Math.random() * option.length)];
    }
    return string;
}

function emailMatch(email) {
    for (let user in users) {
        if (email === users[user]['email']) {
            return true;
        }
    }
    return false;
}

function findIdFromEmail(email) {
    let IdFound = '';
    for (let findUser in users) {
        if (email === users[findUser]['email']) {
            IdFound = users[findUser]['id'];
        }
    }
    return IdFound;
}

function urlsForUser(ID) {
    let URLs = [];
    for (let url in urlDatabase) {
        let URL = {}
        if (urlDatabase[url]['userID'] === ID) {
            URL['longURL'] = (urlDatabase[url]['longURL']);
            URL['shortURL'] = url;
            URLs.push(URL);
        }
    }
    return URLs;
}