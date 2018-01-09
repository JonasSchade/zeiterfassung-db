const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const app = express();
const bp = require('body-parser');
app.use(bp.json());

// open the database
let db = new sqlite3.Database('./db/zeiterfassung.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the Chronos database.');
});

//add 'Access-Control-Allow-Origin'-ResponseHeader to every get request
app.get('/*',function(req,res,next){
    res.header('Access-Control-Allow-Origin', '*');
    next();
});


/********************************************************************
    GET All Entries
 *******************************************************************/
app.get("/api/project", (req,res) => {
  db.all('select * from PROJECT', [], (err, result) =>{
    res.send(result);

    res.status(200).end();
  });
});

app.get("/api/user", (req,res) => {
  db.all('select * from USER', [], (err, result) =>{
    res.send(result);

    res.status(200).end();
  });
});

app.get("/api/department", (req,res) => {
  db.all('select * from DEPARTMENT', [], (err, result) =>{
    res.send(result);

    res.status(200).end();
  });
});


/********************************************************************
    GET Single Entry
 *******************************************************************/
app.get("/api/project/:id", (req,res) => {
  db.all('select * from PROJECT where ID=?', [req.params.id], (err, result) =>{
    if (result.length > 0) {
      res.send(result[0]);
      res.status(200).end();
    } else {
      //no project with given id found
      res.status(404).end();
    }
  });
});

app.get("/api/user/:id", (req,res) => {
  db.all('select * from USER where ID=?', [req.params.id], (err, result) =>{
    if (result.length > 0) {
      res.send(result[0]);
      res.status(200).end();
    } else {
      //no user with given id found
      res.status(404).end();
    }
  });
});

app.get("/api/department/:id", (req,res) => {
  db.all('select * from DEPARTMENT where ID=?', [req.params.id], (err, result) =>{
    if (result.length > 0) {
      res.send(result[0]);
      res.status(200).end();
    } else {
      //no department with given id found
      res.status(404).end();
    }
  });
});


/********************************************************************
    POST Requests
 *******************************************************************/
app.post('/api/project/', (req, res) => {
  if (req.body.name == null ||  req.body.manager == null || req.body.description == null) {
    console.log("");
    console.log("Bad POST Request to /api/project/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("INSERT into PROJECT(name,manager,description) VALUES (?,?,?)", [req.body.name, req.body.manager, req.body.description]);

    res.status(200).end();
  }
});

app.post('/api/user/', (req, res) => {
  if (req.body.firstname == null ||  req.body.lastname == null || req.body.departmentid == null) {
    console.log("");
    console.log("Bad POST Request to /api/user/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("INSERT into USER(firstname,lastname,departmentid) VALUES (?,?,?)", [req.body.firstname, req.body.lastname, req.body.departmentid]);

    res.status(200).end();
  }
});

app.post('/api/department/', (req, res) => {
  if (req.body.name == null ||  req.body.manager == null) {
    console.log("");
    console.log("Bad POST Request to /api/department/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("INSERT into DEPARTMENT(name,manager) VALUES (?,?)", [req.body.name,req.body.manager]);

    res.status(200).end();
  }
});

app.listen(3000, function (){console.log("Port:3000")});
