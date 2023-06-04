// importing modules and requirements
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const {password_hidden, auth} = require('./hiddenvars');

app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended: true}))

app.set('view engine', "ejs")

// Mongo DB connection stuffs
const { MongoClient, ServerApiVersion } = require('mongodb');
const { callbackPromise } = require('nodemailer/lib/shared');
var password = password_hidden;
const uri = `mongodb+srv://authapp:${password}@authcluster.hwijynr.mongodb.net`;
const client = new MongoClient(uri);

// Email info for sending emails
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: auth
  });
  

  
// Mongo DB functions 

async function find_mail(user_mail) {
    try {
    const database = client.db('Authentication');
    const users = database.collection('auth_users');
    // Query for specified user"
    const query = user_mail;
    var user = await users.findOne(query)
    return user
    
} catch (error){
    console.error(error);
    throw error
}}

async function add_code(user_mail, code) {
    const database = client.db('Authentication');
    const users = database.collection('auth_users');
    // Changing user code
    var filter = user_mail;
    var options = { upsert: false};
    var updateDoc = {
        $set: {
            code: `${code}`
        }
    };
    await users.updateOne(filter, updateDoc, options)
}

async function verify_code(user_mail, code) {
    try {
        const database = client.db('Authentication');
        const users = database.collection('auth_users');
        // Query for specified user"
        const query = user_mail;
        const user = await users.findOne(query);
        var code_valid = true;
        if (user.code == code) {
            return code_valid;
        }
        else {
            return code_valid = false;
        }
    } catch (error) {
        console.error(error);
        throw error
    }}


//Setting up website 


app.get("/", (req, res) => {

    res.render("auth_page_login");
})

app.get('/error', (req, res) => {
    res.render("error");
})

app.get('/welcome', (req, res) => {
    res.render('welcome');
})

app.get('/wrong_code', (req, res) => {
    res.render('wrong_code')
})

app.post('/confirming', (req, res) => {
    var data = req.body;
    var temp_mail = data.email;
    var mail = { email : temp_mail.toLowerCase() };

    setTimeout(confirmation, 1000);
    async function confirmation()  {
        try {    
         const user = await find_mail(mail);
            if (user == null){
                console.log('USER IS NULL');
                res.redirect('/error');
            }
            else {
                if (user.email == mail.email){
                    var code = Math.floor(100000 + Math.random() * 900000);
                    add_code(mail, code);
                    var email_to_verify = encodeURIComponent(mail.email);
                    res.redirect(`/confirmation?info=${email_to_verify}`);
                    var mailOptions = {
                        from: 'testobot5553@gmail.com',
                        to: `${mail.email}`,
                        subject: 'Your secret code for authentication!',
                        text: `Here is you're secret code for authentication, don't share it with anyone: ${code}`
                      };
                    transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                            console.log(error);
                        } 
                        else {
                            console.log('Email send:' + info.response);
                        }
                    });
                }
                else {res.redirect('/error')};
            }
        } catch (error){
            console.error(error);
        }
    }
})

app.get('/confirmation', (req, res) => {
    const email = req.query.info;
    res.render("auth_page_confirmation",{
        email: email
    });

    
    
    
})

app.post('/confirmation', (req, res) => {
    var data = req.body;
    var code = `${data.code1}${data.code2}${data.code3}${data.code4}${data.code5}${data.code6}`;
    var data_mail = data.email
    var email = { email : data_mail}
    async function is_code_true() {
        try{
        var is_code_valid = await verify_code(email, code);
        if (is_code_valid == true) {
            res.redirect('/welcome');
        }
        else {
            res.redirect('/wrong_code');
        }
        } catch (error) {
            console.log(error);
        } 
    }
    is_code_true()
})

app.post('/resend_code', (req, res) => {
    var mail = req.body;
    var code = Math.floor(100000 + Math.random() * 900000);
    add_code(mail, code);
    var email_to_verify = encodeURIComponent(mail.email);
    res.redirect(`/confirmation?info=${email_to_verify}`);
    var mailOptions = {
        from: 'testobot5553@gmail.com',
        to: `${mail.email}`,
        subject: 'Your secret code for authentication!',
        text: `Here is you're secret code for authentication, don't share it with anyone: ${code}`
        };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } 
        else {
            console.log('Email send:' + info.response);
        }
    });
})

// initializing site

app.listen('3000', () => {
    console.log('Starting up site');
})

