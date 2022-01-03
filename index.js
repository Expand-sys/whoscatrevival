const express = require("express");
const path = require("path");
const bb = require("express-busboy");
const multer = require("multer");
const tf = require("@tensorflow/tfjs-node");
const mobilenet = require("@tensorflow-models/mobilenet");
const fs = require("fs");
const jpeg = require("jpeg-js");

//init app
const app = express();

bb.extend(app, {
  upload: true,
  path: "./public/uploads/",
  allowedPath: /./
});

var temp;
async function catdetector(imagePath) {
  const image = fs.readFileSync(imagePath.toString());
  const decodedImage = tf.node.decodeImage(image, 3);

  const model = await mobilenet.load({
    version: 2,
    alpha: 1.0
  });
  const predictions = await model.classify(decodedImage);
  return predictions;
}

const storage = multer.diskStorage({
  destination: function(req, res, cb) {
    cb(null, "./public/uploads/");
  },
  filename: function(req, file, cb) {
    cb(null, "asdf" + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function(req, file, cb) {
    checkFileType(file, cb);
  }
}).single("file");

function move(oldPath, newPath, callback) {
  fs.rename(oldPath, newPath, function(err) {
    if (err) {
      if (err.code === "EXDEV") {
        copy();
      } else {
        callback(err);
      }
      return;
    }
    callback();
  });

  function copy() {
    var readStream = fs.createReadStream(oldPath);
    var writeStream = fs.createWriteStream(newPath);

    readStream.on("error", callback);
    writeStream.on("error", callback);

    readStream.on("close", function() {
      fs.unlink(oldPath, callback.toString());
    });

    readStream.pipe(writeStream);
  }
}

app.post("/upload", upload, function(req, res) {
  var id = req.params.id;
  var dir = req.files.upload;
  var filecheck = req.files.file;
  var notdetected = 0;
  const detection = new Promise((resolve, reject) => {
    if (
      filecheck.mimetype == "image/png" ||
      filecheck.mimetype == "image/jpg" ||
      filecheck.mimetype == "image/jpeg"
    ) {
      const data = catdetector(req.files.file.file);
      resolve(data);
    } else resolve(null);
  });

  if (filecheck == undefined) {
    res.redirect("/");
  } else {
    var ext = path.parse(req.files.file.filename).ext;
    detection.then(result => {
      var string;
      for (const i in result) {
        string += JSON.stringify(result[i]);
      }
      if (result == null) {
        fs.rmdir(
          "./public/uploads/" + req.files.file.uuid,
          { recursive: true },
          function(err) {
            if (err) {
              console.log(err);
              //punchsand
            }
          }
        );
        res.redirect("/nottodaybatman");
      } else if (string.indexOf("cat") != -1) {
        move(
          req.files.file.file,
          "public/uploads/cats/" + Date.now() + ext,
          function(err) {
            if (err) {
              console.log(err);
            }
          }
        );
        fs.rmdir(
          "./public/uploads/" + req.files.file.uuid,
          { recursive: true },
          function(err) {
            if (err) {
              console.log(err);
              //punchsand
            }
          }
        );
        res.redirect("/minebitch");
      } else {
        console.log("fail");
        move(
          req.files.file.file,
          "public/uploads/bin/" + Date.now() + ext,
          function(err) {
            if (err) {
              console.log(err);
            }
          }
        );
        fs.rmdir(
          "./public/uploads/" + req.files.file.uuid,
          { recursive: true },
          function(err) {
            if (err) {
              console.log(err);
              //punchsand
            }
          }
        );
        res.redirect("/notacat");
      }
    });
  }
});

// load view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//set public folder
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
  res.render("index");
});
app.get("/cats", function(req, res) {
  const catsfolder = "./public/uploads/cats/";

  res.render("cats", {
    images: fs.readdirSync(catsfolder.toString())
  });
});
app.get("/bin", function(req, res) {
  const catsfolder = "./public/uploads/bin/";

  res.render("bin", {
    images: fs.readdirSync(catsfolder.toString())
  });
});

app.get("/minebitch", function(req, res) {
  res.render("minebitch");
});
app.get("/notacat", function(req, res) {
  res.render("notacat");
});

app.listen(3000, "0.0.0.0", function() {
  console.log("Server started on port 3000...");
});
