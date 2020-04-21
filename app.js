var express = require('express');
var cfenv = require('cfenv');
var bodyParser = require('body-parser');
var app = express();
var morgan = require('morgan');
var cors = require('cors');



// serve the files out of ./public as our main files
app.use(express.static('public'));
app.set('views', './server/views');
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cors());
//app.use(morgan());

app.use(function(req, res, next){
  res.header("Acess-Control-Allow-Origin","*");
  res.header("Acess-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept");
  next();
});


var title = 'Simple COS Web Gallery';

// Serve index.ejs
app.get('/', function (req, res) {
  res.render('index', {status: '', title: title});
});

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var galleryController = require('./server/controllers/galleryController')(title);
var imageUploadRouter = require('./server/routes/imageUploadRoutes')(title);
var galleryRouter = require('./server/routes/galleryRoutes')(title);


app.use('/project', galleryController.crearproyecto);
app.use('/gallery', galleryRouter);
app.use('/doc/deltrash', galleryController.delDocTrash);
app.use('/docdelete/:id', galleryController.delGralleryImages);
app.use('/docDownload/:id', galleryController.downGralleryImages);
app.use('/recyclebin', galleryController.GalleryRecycle);
app.use('/docrestore/:id', galleryController.restoreFile);
app.use('/docdeletetrash/:id', galleryController.deleteDocTrash);
app.use('/login',galleryController.validate_login)
app.use('/createuser', galleryController.createUser);
app.use('/delproject/:id', galleryController.deleteProject);
app.post('/file/:id', [galleryController.pruebafile, galleryController.pruebadesc]); //galleryController.pruebafile, 

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});

