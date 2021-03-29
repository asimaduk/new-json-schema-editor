var express = require('express');
var app = express();
var multer = require('multer')
var cors = require('cors');
var path = require('path')
var fs = require('fs');
var bodyParser = require('body-parser')
var app = express()
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))
app.use(cors());
app.use(express.static('files'));

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname,"../","files"))
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname )
    }
})

var upload = multer({ storage: storage }).single('file')

app.post('/upload',function(req, res) {

    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json(err)
        } else if (err) {
            return res.status(500).json(err)
        }
        return res.status(200).send(req.file)

    })

});

app.get('/getFile/:fileName',(req,res)=>{
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '../',`files/${fileName}`);
    fs.readFile(filePath, (err, data) => {
        res.header("Content-Type",'application/json');
        const json = JSON.parse(data.toString())
        res.json(json);
    });
})

app.post('/saveFile',(req,res)=>{
    const {fileName,content} = req.body;
    const filePath = path.join(__dirname, '../',`files/new-${fileName}`);
    fs.writeFile(filePath, JSON.stringify(content), function (err) {
        if (err) return console.log(err);
       res.send({success:true}).status(200);
    });
})

app.listen(8000, function() {
    console.log('App running on port 8000');
});