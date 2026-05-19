'use strict';
const express = require('express');
const path = require('path');

const nodeAesCmac = require('node-aes-cmac').aesCmac;
const crypto = require('crypto');
const { time } = require('console');

const app = express();
const router = express.Router();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

router.get('/', function (req, res) {
    var tagUid = req.query.U;
    var tagTf = req.query.TF;
    var tagTs = req.query.TS;
    var tagSac = (req.query.RLC != null) ? req.query.RLC : req.query.SAC;
    var isOcb = false;
    var title;
    var timeStampDec;
    var keyDefault;

    // Check Calculation mode and set default key
    if (tagUid != null && tagUid.length == 14) {
        if (tagUid.substring(4, 6) == "10" || tagUid.substring(4, 6) == "20") {
            isOcb = true;
        } else {
            isOcb = false;
        }
        keyDefault = 'FFFF' + tagUid + tagUid;
    }

    // Calculate Timestamp in Decimal
    if (tagTs != null && tagTs.length == 8) {
        timeStampDec = parseInt(tagTs.toString('hex'), 16);
        timeStampDec = Number.isNaN(timeStampDec) ? "N/A" : timeStampDec;
    }

    if (tagUid != null && tagTf != null && tagTs != null && tagSac != null) {

        if (tagUid.length == 14 && tagTf.length == 2 && tagTs.length == 8 && (tagSac.length == 32 || tagSac.length == 90)) {
            if (isOcb) {
                // Calculate OCB mode
                title = "SIC43S1(OCB) Demonstration";
                var bufferKey = Buffer.from(keyDefault, 'hex');
                var bufferIv = Buffer.from(tagTs, 'hex');
                var tempFlag_s;
                var uid_s;
                var tempFlagStatus;
                var uidStatus;

                const decipher = crypto.createDecipheriv('aes-128-ocb', bufferKey, bufferIv, {
                    authTagLength: 4
                });
                decipher.setAuthTag(Buffer.from(tagSac.substring(82), 'hex'));
                let decrypted = decipher.update(tagSac.substring(0, 82), 'hex');
                let userData = decrypted.toString('hex');

                try {
                    let plaintext = decipher.final('hex');

                    uid_s = plaintext.substring(0, 14);
                    tempFlag_s = Buffer.from(plaintext.substring(14), 'hex').toString('utf8');

                    if (tagUid.toUpperCase() === uid_s.toUpperCase()) {
                        uidStatus = "Correct";
                    } else {
                        uidStatus = "Incorrect";
                    }

                    if (tagTf.toUpperCase() === tempFlag_s.toUpperCase()) {
                        tempFlagStatus = "Correct";
                    } else {
                        tempFlagStatus = "Incorrect";
                    }

                } catch {
                    uid_s = "N/A";
                    tempFlag_s = "N/A";
                    uidStatus = "Incorrect";
                    tempFlagStatus = "Incorrect";
                }

                res.render("index", {
                    Title: title,
                    IsOcb: isOcb,
                    Uid: tagUid,
                    Key: keyDefault,
                    SAC: tagSac,
                    TimeStamp: timeStampDec,
                    UserData_s: userData.toUpperCase(),
                    Uid_s: uid_s.toUpperCase(),
                    TemporaryFlag: tagTf,
                    TemporaryFlag_s: tempFlag_s,
                    Uid_status: uidStatus,
                    TemporaryFlag_status: tempFlagStatus,
                });

                return;
            } else {
                // Calculate CMAC mode
                title = "SIC43S1(CMAC) Demonstration";
                var bufferKey = Buffer.from(keyDefault, 'hex');
                var bufferMessage = Buffer.from(tagTs + tagUid + Buffer.from(tagTf).toString('hex'), 'hex');
                var options = { returnAsBuffer: true };

                tagSac = tagSac.substring(0, 32);

                var cmac = nodeAesCmac(bufferKey, bufferMessage, options).toString('hex');
                var sacStatus;

                if (cmac.toUpperCase() === tagSac.toUpperCase()) {
                    sacStatus = "Correct";
                } else {
                    sacStatus = "Incorrect";
                }
                res.render(
                    "index", {
                    Title: title,
                    IsOcb: isOcb,
                    Uid: tagUid,
                    Key: keyDefault,
                    TemporaryFlag: tagTf,
                    TimeStamp: timeStampDec,
                    SAC: tagSac,
                    SAC_s: cmac.toUpperCase(),
                    SAC_status: sacStatus
                }
                );
                return;
            }

        } else {
            title = "Input Parameters are not in correct format";
        }
    } else {
        title = "Input Parameters are empty";
    }

    res.render("index", {
        Title: title,
        TimeStamp: timeStampDec,
        IsOcb: isOcb,
        Uid: tagUid ?? "N/A",
        Key: keyDefault ?? "N/A",
        TemporaryFlag: tagTf ?? "N/A",
        TimeStamp: timeStampDec ?? "N/A",
        SAC: tagSac ?? "N/A",
        SAC_s: "N/A",
        SAC_status: "N/A"
    });


    // var tfStatus;
    // var rlcStatus;
    // var cmac;

    // // For test
    // const keyTest = Buffer.from('FFFF394A20000D69E6394A20000D69E6', 'hex');
    // const ivTest = Buffer.from('000019F8', 'hex');

    // console.log('check1');

    // const decipher = crypto.createDecipheriv('aes-128-ocb', keyTest, ivTest, {
    //     authTagLength: 4
    // });
    // console.log('check2');

    // // Attach the authentication tag before calling update/final
    // decipher.setAuthTag(Buffer.from('C884AE9B', 'hex'));
    // console.log('check3');


    // let decrypted = decipher.update('3D37F7355999EDA846453A3F1FAD0741BE71B6FED04FB35D8B2C1929FFF0AA97C6E0EAA47413CB6B95', 'hex');
    // console.log(decrypted.toString('hex'));

    // console.log(decipher.final('hex'))

    // let output = decrypted.toString('hex');
    // console.log(output);

    // //

    // if ((uid != null && uid.length != 0 && uid.length == 14) &&
    //     (tf != null && tf.length != 0 && tf.length == 2) &&
    //     (ts != null && ts.length != 0 && ts.length == 8) &&
    //     (rlc != null && rlc.length != 0 && rlc.length == 32)) {

    //     var bufferKey = Buffer.from(('FFFF' + uid + uid), 'hex');
    //     var bufferMessage = Buffer.from((ts + uid + (Buffer.from(tf).toString('hex'))), 'hex');
    //     var options = { returnAsBuffer: true };
    //     cmac = nodeAesCmac(bufferKey, bufferMessage, options).toString('hex');

    //     if (cmac.toUpperCase() === rlc) {
    //         rlcStatus = "Correct";

    //         if (tf === '00') {
    //             tfStatus = 'N/A';
    //         } else {
    //             tfStatus = 'N/A';
    //         }
    //     } else {
    //         rlcStatus = "Incorrect";
    //     }

    //     res.render("index", {
    //         Uid: uid,
    //         Key: bufferKey.toString('hex').toUpperCase(),
    //         TemporaryFlag: tf,
    //         TimeStamp: parseInt(ts.toString('hex'), 16),
    //         TFStatus: tfStatus,
    //         RLC_s: cmac.toUpperCase(),
    //         RLC: rlc,
    //         RLC_status: rlcStatus
    //     });
    // } else {
    //     res.render("index", {
    //         Uid: "N/A",
    //         Key: "N/A",
    //         TemporaryFlag: "N/A",
    //         TimeStamp: "N/A",
    //         TFStatus: "N/A",
    //         RLC_s: "N/A",
    //         RLC: "N/A",
    //         RLC_status: "N/A"
    //     });
    // }
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
