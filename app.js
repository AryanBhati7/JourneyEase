const express = require("express");
const app = express();
const path = require("path");
const port = 8080;
const methodOverride = require("method-override")
const ejsMate = require("ejs-mate")
const favicon = require("serve-favicon")
const session = require("express-session");
const mongoose = require("mongoose");
const Blog = require("./models/blog.models");

const MongoStore = require("connect-mongo");

const MONGO_URL = "mongodb+srv://arjun12345bhandari:D4igTLqjmffPe9oN@cluster3.iolho9r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster3";




app.use(favicon(path.join(__dirname, 'public', '/assets/favicon.ico')))
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));

main().then(() =>{
    console.log("DB connected");
  }).catch((err) => {
    console.log(err);
  });
  
async function main(){
    await mongoose.connect(MONGO_URL);
}

const store = MongoStore.create({
    mongoUrl: MONGO_URL,
    crypto: {
      secret: "qwertyuioplkjhgfdsazxcvbnm",
    },
    touchAfter: 24 * 3600,
  });

  store.on("error", () => {
    console.log("Error in MONGO SESSION STORE", err);
  });
  

  const sessionOption = {
    store,
    secret: "asdefrelkoeurjvbbshdgterkcv",
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  };
  
  app.use(session(sessionOption));

//   const newBlog = new Blog({
//     images: [
//         { url: 'https://images.pexels.com/photos/20567522/pexels-photo-20567522/free-photo-of-an-aerial-view-of-the-lake-and-mountains.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load', 
//         filename: 'image_1.jpg'
//      },
//         { url: 'https://images.pexels.com/photos/20567522/pexels-photo-20567522/free-photo-of-an-aerial-view-of-the-lake-and-mountains.jpeg?auto=compress&cs=tinysrgb&w=600&lazy=load',
//          filename: 'image_2.jpg'
//          }
//     ],
//     destination: 'Destination',
//     state: 'State',
//     country: 'Country',
//     budget: 1000,
//     experience: 'Experience'
// });

// newBlog.save()
//     .then(savedBlog => {
//         console.log('Blog post saved successfully:', savedBlog);
//     })
//     .catch(err => {
//         console.error('Error saving blog post:', err);
//     });






app.get('/',(req,res)=>{
    res.render("pages/home.ejs");
})

app.get('/about', (req,res)=>{
res.render('pages/about.ejs')
})

app.get('/blog', (req,res)=>{
res.render('pages/blog.ejs')
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