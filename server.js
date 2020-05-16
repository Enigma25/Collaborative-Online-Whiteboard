var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan');
var User = require('./models/user');


var bcrypt = require('bcrypt');
// invoke an instance of express application.
var app = express();
var obje = {}
var count = []
var http = require('http').Server(app);
var io = require('socket.io')(http);
io.on('connection',function(socket){
    socket.on('client_unicast',function(data){
	console.log(data);
        socket.broadcast.emit('server_broadcast',data);
    });
    socket.on('clear_unicast',function(data){
        socket.broadcast.emit('clear_broadcast',data);
    });
    socket.on('object:moved',function(data){
	    console.log(data);
        socket.broadcast.emit('object:moved',data);});
    socket.on('pollcast',function(data){
        socket.broadcast.emit('newpoll',data);
        var qobj = JSON.parse(data)
       console.log(qobj)
       obje = qobj;
       for(var i = 0;i<obje['options'].length;i++)
	    {
	       count.push(0);
	    }
       setTimeout(wait,10000);
       console.log("hello");
    })
    socket.on('answer',function(data){
	    console.log("socket on answer");
	    console.log(data)
	    var attempt = data;
	    console.log(attempt['ans']);
	    if(obje['id']===attempt['id'])
	    {
		    count[attempt['ans']]++;
	    }
    })
});

function wait()
{	console.log("EXECUTING WAIT FUNCTION");
	var list = [];
	console.log(obje['id']);
//	for(var i = 0;i<obje['options'].length;i++)
//	{
//		list.push(obje['options'][i]['count']);
//	}
	console.log(count);
	io.sockets.emit('stats',count);
        
}

// set our application port
//*app.set('port', 9000);

// set morgan to log info about our requests for development use.
app.use(morgan('dev'));

// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({ extended: true }));

// initialize cookie-parser to allow us access the cookies stored in the browser. 
app.use(cookieParser());

// initialize express-session to allow us track the logged-in user across sessions.
app.use(session({
    key: 'user_sid',
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));


// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');        
    }
    next();
});


// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        res.redirect('/dashboard');
    } else {
        next();
    }    
};


// route for Home-Page
app.get('/', sessionChecker, (req, res) => {
    res.redirect('/login');
});


// route for user signup
app.route('/signup')
    .get(sessionChecker, (req, res) => {
        res.sendFile(__dirname + '/public/signup.html');
    })
    .post((req, res) => {
        User.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        })
        .then(user => {
            req.session.user = user.dataValues;
            res.redirect('/dashboard');
        })
        .catch(error => {
            res.redirect('/signup');
        });
    });


// route for user Login
app.route('/login')
    .get(sessionChecker, (req, res) => {
        res.sendFile(__dirname + '/public/login.html');
    })
    .post((req, res) => {
        var username = req.body.username,
            password = req.body.password;




        User.findOne({ where: { username: username } }).then(function (user) {
            // if (!user) {
            //     res.redirect('/login');
            // } else if (!user.validPassword(password)) {
            //     res.redirect('/login');
            // } else {
            //     req.session.user = user.dataValues;
            //     res.redirect('/dashboard');
            // }
            bcrypt.compare(password,user.password,(err,isMatch)=>{

                if(err)
                {
                    res.redirect('/login');
                }
                else if(isMatch)
                {
                    req.session.user = user.dataValues;
                    res.redirect('/dashboard');
                }
                else
                {
                    res.redirect('/login');
                }
            })
        });




    });


// route for user's dashboard
app.get('/dashboard', (req, res) => {
   // if (req.session.user && req.cookies.user_sid) {
      console.log(req.sessionStore);
//	console.log(req.cookies);
	res.sendFile(__dirname + '/public/board_tmp3.html');
   // } else {
   //	    console.log("ERROR DASHBOARD NOT LOADING");
   //     res.redirect('/login');
   // }
});


app.get('/takepoll', (req, res) => {
    res.sendFile(__dirname + '/public/setquestion.html');
});

app.get('/askiitj',(req,res)=>{res.sendFile(__dirname+'/public/newpoll.html')});




// route for user logout
app.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});



// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
  res.status(404).send("Sorry can't find that!")
});


// start the express server
//*app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`));
//var server = require('http').Server(app);
//var server = app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`));
//var io = require('socket.io')(server);
//const port = process.env.PORT || 3000;
//server.listen(port);
var server = http.listen(3001, () => {
    console.log('server is running on port', server.address().port);
  });

