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
    maxAge: 10 * 60 * 60 * 1000
}));

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

app.set('view engine', 'ejs');

const urlDatabase = {
    'b2xVn2': { longURL: 'http://www.lighthouselabs.ca', userID: "aJ48lW" },
    '9sm5xK': { longURL: 'http://www.google.com', userID: "aJ48lW" },
    'b6UTxQ': { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
    'i3BoGr': { longURL: "https://www.google.ca", userID: "aJ48lW" },
    'aaa': { longURL: "https://www.google.ca", userID: "userRandomID" }
};

const users = {
    "userRandomID": {
        id: "userRandomID",
        email: "user@example.com",
        password: "purple-monkey-dinosaur"
    },
    "user2RandomID": {
        id: "user2RandomID",
        email: "user2@example.com",
        password: "dishwasher-funk"
    },
    "aJ48lW": {
        id: "aJ48lW",
        email: "a@a",
        password: "a"
    }
}

//home page
app.get('/', (request, response) => {
    if (!users[request.session["user_id"]]) {
        request.session = null;
        response.redirect('/login');
    } else {
        let templateVars = {
            user: users[request.session["user_id"]]['email'],
            // urls: urlsForUser(users[request.session["user_id"]]['id']),
            user_id: users[request.session["user_id"]]['id'],
        };
        response.render('urls_home', templateVars);
    }
    // response.send('Welcome to Tiny URLs');
});

//display the list with edit and delete option
app.get('/urls', (request, response) => {
    if (!users[request.session["user_id"]]) {
        request.session = null;
        // response.clearCookie("user_id");
        response.redirect('/login');
    } else {
        let templateVars = {
            user: users[request.session["user_id"]]['email'],
            urls: urlsForUser(users[request.session["user_id"]]['id']),
            user_id: users[request.session["user_id"]]['id'],
        };
        response.render('urls_index', templateVars);
    }
});

function urlsForUser(ID) {
    let URLs = [];
    for (let url in urlDatabase) {
        let URL = {}
        if (urlDatabase[url]['userID'] === ID) {
            URL["longURL"] = (urlDatabase[url]['longURL']);
            URL["shortURL"] = url;
            URLs.push(URL);
        }
    }
    return URLs;
}

//logout and clear cookies
app.post('/logout', (request, response) => {
    request.session = null;
    // response.clearCookie("user_id");
    response.redirect('/login');
});

//get a form for entering a new longURL
app.get('/urls/new', (request, response) => {
    if (!users[request.session["user_id"]]) {
        response.redirect('/login')
    } else {
        let templateVars = {
            user: users[request.session["user_id"]]['email']
        }
        response.render('urls_new', templateVars);
    }
});

//load registration page
app.get('/register', (request, response) => {
    let templateVars = {
        user: request.session["user_id"]
    };
    response.render('urls_register', templateVars);
});

//post on register page and rediret back to list
app.post('/register', (request, response) => {
    let uniqueID = generateRandomString();
    const {
        id,
        email,              // user["id"] = uniqueID;
        password            // user["email"] = request.body.email;
    } = request.body;       // user["password"] = request.body.password;

    const user = {
        id: uniqueID,
        email,
        password: bcrypt.hashSync(password, 10)
    };

    if (email === '' || password === '') {
        response.statusCode = 404;
    } else {
        if (!emailMatch(email)) {
            response.statusCode = 200;
            users[uniqueID] = user;
            // response.cookie("user_id", uniqueID);
            request.session['user_id'] = uniqueID;
            response.redirect('/urls');
        } else {
            response.statusCode = 404;
            console.log("Invalid"); //error page later
        }
    }
})
//load login page
app.get('/login', (request, response) => {
    let templateVars = {
        user: request.session["user_id"]
    };
    response.render('urls_login', templateVars);
});

//login
app.post('/login', (request, response) => {
    if (!users[request.session["user_id"]]) {
        request.session = null;
        // response.clearCookie("user_id");
    }
    let user = {};
    user['email'] = request.body.email;
    user['password'] = request.body.password;

    if (emailMatch(request.body.email) && bcrypt.compareSync(request.body.password, users[findIdFromEmail(request.body.email)]['password'])) {
        response.statusCode = 200;
        // response.cookie("user_id", findIdFromEmail(request.body.email));
        request.session['user_id'] = findIdFromEmail(request.body.email);
        response.redirect('/urls');
    } else { response.statusCode = 403; }

});

//display the shortURL for redirect
app.post('/urls', (request, response) => {
    if (!users[request.session["user_id"]]) {
        response.redirect('/login')
    } else {
        let randomString = generateRandomString();
        let middleware = {};
        middleware["longURL"] = request.body['longURL']; //added
        middleware["userID"] = request.session["user_id"]; //added
        urlDatabase[randomString] = middleware;
        response.render('urls_generated', { url: `http://localhost:8080/u/${randomString}` });
    }
});

//delete an existing 
app.post('/urls/:shortURL/delete', (request, response) => {  //method-override
    if (!users[request.session["user_id"]]) {
        response.redirect('/login')
    } else {
        let templateVars = {
            shortURL: request.params.shortURL,
            longURL: urlDatabase[request.params.shortURL]['longURL'], //changed
            user: users[request.session["user_id"]]['email']
        }
        //check valid login user
        if (users[request.session["user_id"]].id === urlDatabase[request.params.shortURL]['userID']) {
            delete urlDatabase[templateVars.shortURL]; //might not change
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
    if (!users[request.session["user_id"]]) {
        response.redirect('/login')
    } else if (users[request.session["user_id"]].id == urlDatabase[request.params.shortURL]['userID']) {
        let templateVars = {
            shortURL: request.params.shortURL,
            longURL: urlDatabase[request.params.shortURL]['longURL'], //changed
            user: users[request.session["user_id"]]['email']
        }
        response.render('urls_show', templateVars);
    }
    else {
        response.redirect('/urls');
    }
});

//update the URL
app.put('/urls/:shortURL', (request, response) => {  //method-overrided
    if (!users[request.session["user_id"]]) {
        response.redirect('/login')
    } else {
        const { shortURL } = request.params;
        const { longURL } = request.body;
        urlDatabase[shortURL]['longURL'] = longURL; //changed
        urlDatabase[shortURL]['userID'] = request.session["user_id"]; //added
        response.redirect('/urls');
    }
});

app.get('/urls.json', (request, response) => {
    response.json(urlDatabase);
});

// app.get('/hello', (request, response) => {
//     // response.send('<html><body>Hello <b>World</b></body></html>\n');
//     let templateVars = { greeting: 'Hello World!' };
//     response.render('hello_world', templateVars);
// });

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
    // return Math.floor((1 + Math.random()) * 0xfffff).toString(16);
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

//not needed
// function passwordMatch (password) {
//     for (let user in users) {
//         if (password === users[user]['password']){
//             return true;
//         }
//     }
//     return false;
// }

function findIdFromEmail(email) {
    let IdFound = '';
    for (let findUser in users) {
        if (email === users[findUser]['email']) {
            IdFound = users[findUser]['id'];
        }
    }
    return IdFound;
}