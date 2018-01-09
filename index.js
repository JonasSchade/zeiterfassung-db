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
  db.run("INSERT into PROJECT(ID,Name,Manager) VALUES (?,?,?)", [req.params.id, req.body.Name,req.body.Manager]);

  res.status(200).end();
});

app.post('/api/user/', (req, res) => {
  db.run("INSERT into USER(Firstname,Lastname,LocationID,DepartmentID) VALUES (?,?,?,?)", [req.body.Firstname, req.body.Lastname,req.body.LocationID, req.body.DepartmentID]);

  res.status(200).end();
});

app.post('/api/department/', (req, res) => {
  db.run("INSERT into DEPARTMENT(ID,Name,Manager) VALUES (?,?,?)", [req.params.id, req.body.Name,req.body.Manager]);

  res.status(200).end();
});


app.listen(3000, function (){console.log("Port:3000")});
