const express = require('express');
const app = express();
const PORT = 8080;

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require('cookie-parser');
app.use(cookieParser()); //set cookieParser before you use cookie parser, inside the cookieParser() it is the signature of the cookies

app.set('view engine', 'ejs');

const urlDatabase = {
    'b2xVn2': 'http://www.lighthouselabs.ca',
    '9sm5xK': 'http://www.google.com'
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
    }
}

//home page
app.get('/', (request, response) => {
    response.send('Hello');
});

//display the list with edit and delete option
app.get('/urls', (request, response) => {
    let templateVars = {
        user: request.cookies["user_id"],
        urls: urlDatabase
    };
    response.render('urls_index', templateVars);
});

//logout and clear cookies
app.post('/logout', (request, response) => {
    response.clearCookie("user_id");
    response.redirect('/login');
});

//get a form for entering a new longURL
app.get('/urls/new', (request, response) => {
    response.render('urls_new');
});

//get a form for registeration page
app.get('/register', (request, response) => {
    let templateVars = {
        user: request.cookies["user_id"]
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
        password
    };

    if (email === '' || password === ''){
        response.statusCode = 404;
    } else {
        if (!emailMatch(email)) {
            response.statusCode = 200;
            users[uniqueID] = user;
            response.cookie("user_id", uniqueID);
            response.redirect('/urls');
        } else {
            response.statusCode = 404;
            console.log("Ivalid"); //error page later
        }
    }
})

app.get('/login', (request, response) => {
    let templateVars = {
        user: request.cookies["user_id"]
    };
    response.render('urls_login', templateVars);
});

//login
app.post('/login', (request, response) => {
    let user = {};
    user['email'] = request.body.email;
    user['password'] = request.body.password;
    console.log(request.body);
    console.log(`users: ${users}\nuser: ${user}`);
        if (emailMatch (request.body.email) && passwordMatch(request.body.password)){
            response.statusCode = 200;
            for (let findUser in users){
                if(user['email'] === users[findUser]['email']){
                    user['id'] = users[findUser]['id'];
                }
            }
            console.log(`users: ${users}\nuser: ${user}`);
            response.cookie("user_id", user['id']);
            response.redirect('/urls');
        } else { response.statusCode = 403; }
  
});

//display the shortURL
app.post('/urls', (request, response) => {
    let randomString = generateRandomString();
    urlDatabase[randomString] = request.body['longURL'];
    response.send(`http://localhost:8080/u/${randomString}`);
});

//delete an existing 
app.post('/urls/:shortURL/delete', (request, response) => {
    let templateVars = {
        shortURL: request.params.shortURL,
        longURL: urlDatabase[request.params.shortURL],
        user: request.cookies["user_id"]
    }
    delete urlDatabase[templateVars.shortURL];
    response.redirect('/urls');
});

//redirect to the longURL
app.get('/u/:shortURL', (request, response) => {
    const longURL = urlDatabase[request.params.shortURL];
    response.statusCode = 301;
    response.redirect(longURL);
});

//display the URL
app.get('/urls/:shortURL', (request, response) => {
    let templateVars = {
        shortURL: request.params.shortURL,
        longURL: urlDatabase[request.params.shortURL],
        user: request.cookies["user_id"]
    }
    response.render('urls_show', templateVars);
});

//update the URL
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
    let templateVars = { greeting: 'Hello World!' };
    response.render('hello_world', templateVars);
});

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

function emailMatch (email) {
   for (let user in users) {
        if (email === users[user]['email']) {
            return true;
        }
    }
    return false;
}

function passwordMatch (password) {
    for (let user in users) {
        if (password === users[user]['password']){
            return true;
        }
    }
    return false;
}