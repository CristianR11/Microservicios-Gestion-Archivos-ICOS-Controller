var galleryController = function(title) {

    //Carga de modulos
    var AWS = require('ibm-cos-sdk');
    var util = require('util');
    const sleep = util.promisify(setTimeout);
    var multer = require('multer');
    var multerS3 = require('multer-s3');
    var ejs = require('ejs');
    var myBucket = 'bucketdemo';
    var status = '';
    const IBMCloudEnv = require("ibm-cloud-env");
    IBMCloudEnv.init();
    const s3function = require('./S3Functions');
    const request = require('request-promise');
    var datareq;

    //Credenciales del servicio de object storage
    var config = {
        endpoint: IBMCloudEnv.getString("cos_endpoint"),
        apiKeyId: IBMCloudEnv.getString("cos_api_key"),
        ibmAuthEndpoint: 'https://iam.ng.bluemix.net/oidc/token',
        serviceInstanceId: IBMCloudEnv.getString("cos_service_instance_id"),
        credentials: new AWS.Credentials(IBMCloudEnv.getString("access_key_id"), IBMCloudEnv.getString("secret_access_key"), sessionToken = null),
        signatureVersion: 'v4'
    };

    var s3 = new AWS.S3(config);
    var imageUrlList = new Array();
    var imageUrlListRecycle = new Array();
    var imageName = new Array();
    var namedel = '';
    var nameproject = '';
    var fecha = new Date();

    var downGralleryImages = async function(req, res){
        console.log('Contenido del forulario '+req.body.name_asset);
        console.log('id del proyecto '+ req.params.id);
        var data = await s3.getSignedUrl('getObject',{Bucket: `project${req.params.id}`, Key: req.body.name_asset});
        console.log(data);
        res.json(`${data}`);
    }

   function uploadFile(req,res){
    s3function.s3uploadFile(description,req);
    }

    var upload = multer({
        storage: multerS3({
            s3: s3,
            bucket: myBucket,
            key: function (req, file, cb) {
                cb(null, file.originalname);
            }
        })
    });

    var deleteDocTrash = async function(req, res){
        namedel = req.body.name_asset;
        id = req.params.id;
        id_asset = req.body.id_asset;
        console.log(req.body);
        console.log(req.params);
        await s3function.deleteItem(`trash${id}`,namedel);
        await request.delete({url:`http://localhost:4000/Assets/${id}`, form:{id_asset: id_asset}}, function optionalCallback(err, httpResponse, body) {
        if (err) {
            return console.error('delete failed:', err);
        }
        console.log('Update successful!:', body);
        });
        res.redirect('/gallery');
    }

    var restoreFile = async function(req, res){
        namedel = req.body.name_asset;
        id = req.params.id;
        id_asset = req.body.id_asset;
        console.log(req.body);
        console.log(req.params);
        await s3function.copyItem(`project${id}`,`trash${id}`,namedel);
        await s3function.deleteItem(`trash${id}`,namedel);
        await request.put({url:`http://localhost:4000/Assets/${id}`, form:{status: "true", id_asset: id_asset}}, function optionalCallback(err, httpResponse, body) {
        if (err) {
            return console.error('delete failed:', err);
        }
        console.log('Update successful!:', body);
        });
        res.redirect('/gallery');
    }

    var pruebafile = function(req, res, next){
        datareq = req;
        console.log('recibiendo file');
        s3function.uploadOnBucket(`project${req.params.id}`,req,res);
        next();
    }

    var pruebadesc = async function(req, res, next){
        var typefile = [''];
        const response = await s3function.fromData(req,res);
        console.log(response);
        bucketname = `project${req.params.id}`;
        await sleep(500);
        for (var i = 0; i < response.namefile.length; i++) {
            typefile[i] = response.namefile[i].split('.').pop();
            await sleep(1000);
            await request.post({url:'http://localhost:4000/New-Asset', form:{id_project: req.params.id, name_asset: response.namefile[i], description: response.descripcion[i], type_asset: `.${typefile[i]}`, creation_date: fecha}}, function optionalCallback(err, httpResponse, body) {
            if (err) {
                return console.error('upload failed:', err);
            }
            console.log('Upload successful!  Server responded with:', body);
            });
        }
    }

    
    //Obtener los objetos del ICOS
    var getGalleryImages = function (req, res) {
        var params = {Bucket: myBucket};
        imageUrlList=[];
        s3.listObjects(params, function (err, data) {
            if(data) {
                var bucketContents = data.Contents;
                for (var i = 0; i < bucketContents.length; i++) {
                        console.log(bucketContents[i].Key);
                        var urlParams = {Bucket: myBucket, Key: bucketContents[i].Key};
                        var url = s3.getSignedUrl('getObject', urlParams);
                        imageUrlList[i] = url;  
                        imageName[i]=bucketContents[i].Key;        
                }
            }
            res.render('galleryView', {
                title: title,
                imageUrls: imageUrlList,
                imageNames: imageName
            });
        });
    };

    var GalleryRecycle = function (req, res) {
        console.log('Papelera de reciclaje ejecutandose');
        imageUrlListRecycle=[];
        s3.listObjects({Bucket: "papelerademo"}, function (err, data) {
            if(data) {
                var bucketContents = data.Contents;
                for (var i = 0; i < bucketContents.length; i++) {
                        var urlParams = {Bucket: "papelerademo", Key: bucketContents[i].Key};
                        var url = s3.getSignedUrl('getObject', urlParams);
                        imageUrlListRecycle[i] = url;  
                        imageName[i]=bucketContents[i].Key;
                        console.log(imageUrlListRecycle);     
                }
            }
            res.render('galleryRecycle', {
                title: title,
                imageUrls: imageUrlListRecycle,
                imageNames: imageName
            });
        });
    };

    var delGralleryImages =  async function(req, res){
        namedel = req.body.name_asset;
        id = req.params.id;
        id_asset = req.body.id_asset;
        console.log(req.body);
        console.log(req.params);
        await s3function.copyItem(`trash${id}`,`project${id}`,namedel);
        await s3function.deleteItem(`project${id}`,namedel);
        await request.put({url:`http://localhost:4000/Assets/${id}`, form:{status: "false", id_asset: id_asset}}, function optionalCallback(err, httpResponse, body) {
        if (err) {
            return console.error('delete failed:', err);
        }
        console.log('Update successful!:', body);
        });
        res.redirect('/gallery');
    }

    var delDocTrash = function(req, res){
        namedel = req.body.nameKey;
        console.log(namedel);
        s3function.deleteItem("papelerademo",namedel);
        res.redirect('/recyclebin');
    }

    var crearproyecto = async function(req,res){
        request.post({url:'http://localhost:4000/New-Project', form:{name_project: req.body.name_project, description: req.body.description}}).promise()
        .then(async function (body) {
            nameproject = body;
            console.log('El id del proyecto es' +nameproject)
            await s3function.createBucket('project'+nameproject);
            await s3function.createBucket('trash'+nameproject);
            //Crear registro del proyecto de la dB
            res.send("peticion realizada");
        })
        .catch(function (err) {
            // Request failed due to technical reasons...
        });

    }
    
    var validate_login = function(req,res){

    }

    var createUser = function(req,res){
        console.log(req.body.mail)
        request.post({url:'http://localhost:4000/New-User', form:{mail: req.body.mail}}).promise();
    }

    var deleteProject = async function(req, res){
        request.post({url:'http://localhost:4000/Del-Project', form:{id: req.params.id}}).promise()
        .then(async function (body) {
            console.log(req);
            var data = await s3function.listDocs(`project${req.params.id}`);
            for(var i=0; i < data.length; i++){
                console.log(data[i].Key)
                s3function.deleteItem(`project${req.params.id}`, `${data[i].Key}`);
            }
            var data2 = await s3function.listDocs(`trash${req.params.id}`);
            for(var i=0; i < data2.length; i++){
                console.log(data2[i].Key)
                s3function.deleteItem(`trash${req.params.id}`, `${data2[i].Key}`);
            }
            s3function.deleteBucket(`project${req.params.id}`);
            s3function.deleteBucket(`trash${req.params.id}`);
        })
        .catch(function (err) {
            // Request failed due to technical reasons...
        });
    }

    return {
        getGalleryImages: getGalleryImages,
        upload: upload,
        uploadFile, uploadFile,
        delGralleryImages, delGralleryImages,
        downGralleryImages, downGralleryImages,
        GalleryRecycle, GalleryRecycle,
        delDocTrash, delDocTrash,
        crearproyecto, crearproyecto,
        pruebadesc, pruebadesc,
        pruebafile, pruebafile,
        restoreFile, restoreFile,
        deleteDocTrash, deleteDocTrash,
        createUser, createUser,
        validate_login,validate_login,
        deleteProject, deleteProject

    };
};

module.exports = galleryController;
