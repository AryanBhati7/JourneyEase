const express = require("express");
const app = express();
const path = require("path");
const port = 8080;
const methodOverride = require("method-override")
const ejsMate = require("ejs-mate")
const favicon = require("serve-favicon")


app.use(favicon(path.join(__dirname, 'public', '/assets/favicon.ico')))
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));


app.get('/',(req,res)=>{
    res.render("pages/home.ejs");
})

app.get('/about', (req,res)=>{
res.send('About Page')
})

app.get('/blog', (req,res)=>{
res.send('Blog Paage')
})

app.get('/login', (req,res)=>{
    res.send('Login Page')
})

app.get('/signup', (req,res)=>{
    res.send('Signup page')
})



app.listen(port, ()=>{
    console.log(`Server Running at ${port}`);
})