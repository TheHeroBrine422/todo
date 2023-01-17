const fs = require('fs')
const { Pool } = require('pg')
const express = require('express')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

settings = JSON.parse(fs.readFileSync("Settings.json", 'utf8'))

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const pool = new Pool(settings.DBCreds)

errors = {
    100: "Invalid Parameters",
    101: "Invalid Authorization",
    102: "DB Error",
}

paramRegex = {
    "sid": /[0-9]*/,
    "stoken": /[a-zA-Z0-9]{64}/,
    "email": /[a-z]*@bentonvillek12.org/,
    "license_plate": /[A-Z0-9]{1,7}/,
    "access": /[0-3]{1}/,
    "note": /[^]*/,
    "rid": /[0-9]*/,
    "credential": /^[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*\.[A-Za-z0-9-_]*/,
    "g_csrf_token": /[0-9a-f]{16}/,
    "emails": /[a-z@0-9.\[\]\",]*/,
    "range": /\[[0-9]*,[0-9]*\]/,
    "day": /[0-9]{1,2}-[0-9]{1,2}-20[0-9]{2}/,
    "schid": /[0-9]*/,
    "name": /[a-zA-Z 0-9]*/,
    "section": /[AP]M/,
    "number": /[0-9]{1,3}/
}

function checkParams(res, params, paramList) {
    if (Object.keys(params).length != paramList.length) {
        res.status(400).send(error(100))
        return false;
    }
    for (var i = 0; i < paramList.length; i++) {
        if (params[paramList[i]] == null || params[paramList[i]] == "" || params[paramList[i]].match(paramRegex[paramList[i]]) == null || params[paramList[i]].match(paramRegex[paramList[i]])[0] != params[paramList[i]]) {
            res.status(400).send(error(100))
            return false;
        }
    }
    return true;
}

function verifyToken(res, token, callback) {
    if (Object.keys(db.tokens).indexOf(token) > -1) {
        if (db.tokens[token].time+settings.tokenDuration > Date.now()) {
            callback(db.tokens[token].email)
        }
    }
}

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");

    if (settings.debug) {
        console.log(new Date().toString()+" "+req.method+" "+req.originalUrl)
        if (Object.keys(req.body).length > 0) {
            console.log("req.body: " + JSON.stringify(req.body))
        }
        if (Object.keys(req.query).length > 0) {
            console.log("req.query: " + JSON.stringify(req.query))
        }
    }{}
    next();
});

app.post('/authentication/register', (req, res) => { // frontend
    if (checkParams(res, req.body, ["email", "password"])) {
        if (Object.keys(db.logins).indexOf(req.body.email) < 0) {
            bcrypt.hash(crypto.createHash("sha512").update(req.body.password).digest('hex'), settings.saltRounds, (err, hash) => {
                db.logins[req.body.email] = hash
                db.data[req.body.email] = {}
            })
            res.send(generateToken(req.body.email))
        } else {
            res.send("Email in use")
        }
    }
});

app.post('/authentication/login', (req, res) => { // frontend
    if (checkParams(res, req.body, ["email", "password"])) {
        if (Object.keys(db.logins).indexOf(req.body.email) > -1) {
            bcrypt.compare(crypto.createHash("sha512").update(req.body.password).digest('hex'), db.logins[req.body.email], function(err, result) {
                if (result) {
                    res.send(generateToken(req.body.email))
                } else {
                    res.send("Incorrect Password or Email")
                }
            });
        } else {
            res.send("Incorrect Password or Email")
        }
    }
});
