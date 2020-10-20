
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models');
const es6Renderer = require('express-es6-template-engine');
const bcrypt = require('bcrypt');
const session = require('express-session');
// const cookieParser = require('cookie-parser');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const store = new SequelizeStore({ db: db.sequelize });
require("dotenv").config();
// const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST_KEY);
const app = express();
// decode json body data
app.use(bodyParser.json());
// decode 'URL Encoded' form data
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(session({
  secret: 'secret', // used to sign the cookie
  resave: false, // update session even w/ no changes
  saveUninitialized: true, // always create a session
//   cookie: {
//     secure: false, // true: only accept https req's
//     maxAge: 2592000, // time in seconds
//   },
  store: store,
}))

store.sync();

app.use((req, res, next) => {
  console.log('===== USER =====')
  console.log(req.session.user);
  console.log('================')
  next();
})

app.engine('html', es6Renderer); // use es6renderer for html view templates
app.set('views', 'templates'); // look in the 'templates' folder for view templates
app.set('view engine', 'html'); // set the view engine to use the 'html' views

function checkAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// static file
app.use(express.static('public'));

// Routes go here
app.get('/', checkAuth, (req, res) => {
    res.render('index', {
      locals: {
        user: req.session.user
      },
      partials: {
        head: 'partials/head'
      }
    });
  })
// app.get('/', checkAuth, (req, res) => {
//     res.render('index', {
//         locals: {
//         error: null,
//         user: req.session.user,
//         },
//         partials: {
//         head: 'partials/head'
//         }
//     });
//     })
app.get('/login', (req, res) => {
    res.render('login', {
      locals: {
        error: null,
      },
      partials: {
        head: 'partials/head'
        }
    });
  })

app.post('/login', (req, res) => {
// check if post was submitted with username and password
if (!req.body.username || !req.body.password) {
    res.render('login', {
    locals: {
        error: 'Please submit all required fields'
    },
    partials: {
        head: 'partials/head'
    }
    })
    return;
}

db.User.findOne({
    where: {
    username: req.body.username
    }
})
    .then((user) => {
    if (!user) {
        res.render('login', {
        locals: {
            error: 'No user with that username'
        },
        partials: {
            head: 'partials/head'
        }
        })
        return;
    }

    bcrypt.compare(req.body.password, user.password, (err, matched) => {
        if (matched) {
        req.session.user = user;
        res.redirect('/')
        } else {
        res.render('login', {
            locals: {
            error: 'Incorrect password. Please try again.'
            },
            partials: {
                head: 'partials/head'
            }
        })
        }
        return;
    })
    })
}) 

app.get('/register', (req, res) => {
  res.render('register', {
    locals: {
    error: null,
    },
    partials: {
    head: 'partials/head'
    }
  })
})

app.post('/register', (req, res) => {
// check if post was submitted with username and password
if (!req.body.username || !req.body.password) {
    res.render('register', {
    locals: {
        error: 'Please submit all required fields'
    },
    partials: {
        head: 'partials/head'
    }
    })
    return;
}

const { username, password } = req.body;
bcrypt.hash(password, 10, (err, hash) => {
    db.User.create({
    username: username,
    password: hash
    })
    .then((user) => {
        res.redirect('/index');
    })
})
})


app.get('/products', checkAuth, (req, res) => {
res.render('products', {
    locals: {
        error: null,
    },
    partials: {
        head: 'partials/head'
    }
});
})
  
  app.get('/logout', (req, res) => {
    req.session.user = null;
    res.redirect('/login');
  })

// app.get('/', (req, res) => {
//     const name = req.query.name || 'World';
    
//     res.render('index', {
//       locals: {
//         name: name,
//         title: 'Home'
//       },
//       partials: {
//         head: 'partials/head'
//       }
//     });
//   })
   
app.listen(3000, () => {
  console.log('Running on http://localhost:3000')
});
