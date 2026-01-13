'use strict';
const express = require('express');
const path = require('path');
const nodeAesCmac = require('node-aes-cmac').aesCmac;

const app = express();
const router = express.Router();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

router.get('/', function(req, res) {
    var uid = req.query.U != null ? req.query.U : "N/A";
    var tf = req.query.TF != null ? req.query.TF : "N/A";
    var ts = req.query.TS != null ? req.query.TS : "N/A";
    var rlc = (req.query.RLC != null) ? req.query.RLC : ((req.query.SAC != null) ? req.query.SAC : "N/A");
    var tfStatus;
    var rlcStatus;
    var cmac;

    console.log(uid);
    console.log(tf);
    console.log(ts);
    console.log(rlc);
    console.log(req.query);

    if ((uid != null && uid.length != 0 && uid.length == 14) &&
    (tf != null && tf.length != 0 && tf.length == 2) &&
    (ts != null && ts.length != 0 && ts.length == 8) &&
    (rlc != null && rlc.length != 0 && rlc.length == 32)) {

        var bufferKey = Buffer.from(('FFFF' + uid + uid), 'hex');
        var bufferMessage = Buffer.from((ts + uid + (Buffer.from(tf).toString('hex'))), 'hex');
        var options = {returnAsBuffer: true};
        cmac = nodeAesCmac(bufferKey, bufferMessage, options).toString('hex');

        if (cmac.toUpperCase() === rlc) {
            rlcStatus = "Correct";

            if ( tf === '00' ) {
                tfStatus = 'SEALED';
            } else {
                tfStatus = 'OPENED';
            }
        } else {
            rlcStatus = "Incorrect";
        }
        
        res.render("index", {
            Uid: uid,
            Key: bufferKey.toString('hex').toUpperCase(),
            TemporaryFlag: tf,
            TimeStamp: parseInt(ts.toString('hex'), 16),
            TFStatus: tfStatus,
            RLC_s: cmac.toUpperCase(),
            RLC: rlc,
            RLC_status: rlcStatus
        });
    } else {
        res.render("index", {
            Uid: "N/A",
            Key: "N/A",
            TemporaryFlag: "N/A",
            TimeStamp: "N/A",
            TFStatus: "N/A",
            RLC_s: "N/A",
            RLC: "N/A",
            RLC_status: "N/A"
        });
    }
});

app.use("/", router);

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

app.set('port', process.env.PORT || 8080);

app.listen(app.get('port'));
