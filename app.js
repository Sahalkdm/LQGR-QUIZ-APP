var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
var logger = require('morgan');
var session=require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session);
var db=require('./config/connection')
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/user');
var handlebar=require('express-handlebars');
const { handlebars } = require('hbs');
const nocache=require('nocache')
const PORT = process.env.PORT || 3001
require('dotenv').config();
const uri = process.env.MONGODB_URI;
var app = express();
app.set('views', path.join(__dirname, 'views'));
const hbs= handlebar.create({extname:'hbs',defaultLayout:'layout',layoutsDir:`${__dirname}/views/layout`,partialsDir:`${__dirname}/views/partials`})
const store = new MongoDBStore({
  uri: uri,
  collection: 'sessions',
  databaseName: 'myFirstDatabase',
});

// Catch errors that occur during session store initialization
store.on('error', (error) => {
  console.log('Error initializing session store:', error);
});
hbs.handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

hbs.handlebars.registerHelper('indexAdd', function(i) {
  let t=parseInt(i)
  return (t+1)
})

hbs.handlebars.registerHelper('filepath', function() {
  let filepath={__dirname}
  console.log('filep'+filepath);
  return (filepath)
})


app.use(
  session({
    secret: 'yes_this_is_mine',
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// view engine setup

app.set('view engine', 'hbs');
//app.engine('handlebars', hbs.engine)
app.engine('hbs', hbs.engine)
app.use(nocache())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(session({secret:'Key',cookie:{maxAge:30*60*60*1000}}))
app.use(bodyParser.json());

app.use('/a1h2z53sf4gh7k2d3m', adminRouter);
app.use('/', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

process.on('SIGINT', () => {
  client.close()
    .then(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
});

db.connect((err)=>{
  if (err)
  console.log('database connection error');
  else {
    console.log('database connected')
    app.listen(PORT, () => {
    console.log("listening for requests");
  })
};
})