const mysql = require('mysql');
const express = require('express');
var nodemailer = require("nodemailer");
var app = express();

const bodyparser = require('body-parser');

app.use(bodyparser.json());

//cors policy for getting access to all kind of requests
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})

//mail server setup
var smtpTransport = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
        user: "biswaghoshctest@gmail.com",
        pass: "Test@123"
    }
});


// db coneection
var mysqlconnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cgsdbrest'
});

mysqlconnection.connect((err) => {
    if (!err) {
        console.log('connection successfully done.... ');
    } else {
        console.log('db connection failed  :' + JSON.stringify(err, undefined, 2));
    }
});


app.listen(3000, () => console.log('Express server running in : 3000'));

// create new user i.e. register
app.post('/createnewUser', (req, res) => {
    var user = req.body;
    mysqlconnection.query("select * from user where email=?", [user.email], (err, result, fields) => {
        if (!err) {
            //checked for email existance
            if (result.length > 0) {
                res.send({
                    "code": 204,
                    "success": "Email arleady exist please use some other email to register."

                });
            } else {
                mysqlconnection.query("insert into user(username,password,email) values(?,?,?)", [user.username, user.password, user.email], (err, rows, fields) => {
                    if (!err)
                        res.send({
                            "code": 200,
                            "success": "successfully register..."

                        });
                    else
                        res.send({
                            "code": err.code,
                            "success": "Unable to create user"
                        });
                })
            }

        }
    })

});

//login api goes here
app.post('/login', (req, res) => {
    var email = req.body.email;
    var password = req.body.password;
    mysqlconnection.query("select * from user where email=?", [email], (err, result, fields) => {
        if (!err) {
            if (result.length > 0) {
                if (result[0].password == password) {
                    res.send({
                        "code": 200,
                        "success": "Login Sussessfully..."

                    });
                } else {
                    res.send({
                        "code": 204,
                        "success": "Password does not match..please register to get"
                    });
                }
            } else {
                res.send({
                    "code": 204,
                    "success": "Email id does not exist..please register to get"
                });
            }
        }
        else {
            res.send({
                "code": err.code,
                "success": "Unable to login"
            });
        }

    })
});

// forgot password goes here

app.post('/forgotpassword', (req, res) => {
    var email = req.body.email;
    console.log('enter ' + email);
    mysqlconnection.query('select * from user where email=?', [email], (err, result, fields) => {
        if (result.length > 0) {//checking mailid is existing or not
            var mailOptions = {
                to: email,
                subject: "Reset your password",
                text: "This for your reset password..\n" +
                "http://localhost:4200/resetpassword/" + email
            }
            smtpTransport.sendMail(mailOptions, function (error, response) {

                if (error) {
                    res.end("error");
                } else {
                    console.log('mail sent ');
                    mysqlconnection.query('update user set 	forgotstatus=1 where email=?', [email], (err, result, fields) => {
                        if (err) {
                            res.send(err);
                        } else {
                            res.send({
                                "code": 200,
                                "success": "Mail has been sent to " + email + ", please Check out."
                            });

                        }

                    })

                }
            });


        } else {
            res.send({
                "code": 204,
                "success": "Sorry you are not our user yet. please do register"
            });
        }
    })
});


//reset password
app.post('/resetPassword', (req, res) => {
    var password = req.body.password;
    var email = req.body.email;
    console.log(password);
    //checked that that email and reuest status available
    mysqlconnection.query('select * from user where email=? and forgotstatus=1', [email], (err, result, fields) => {
        if (result.length > 0) {
            mysqlconnection.query('update user set password=?, forgotstatus=0 where email=? and forgotstatus=1',[password,email], (err, result, fields) => {
                if (err) {
                    res.send({
                        "code": err.code,
                        "success": "Failed to reset password."
                    });
                } else {
                    res.send({
                        "code": 200,
                        "success": "Password reset succesfully.."
                    });
                }
            })


        } else {
            res.send({
                "code": 204,
                "success": "sorry you cannot reset password"
            });
        }
    })
});