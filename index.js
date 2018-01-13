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

//add 'Access-Control-Allow-Origin'-ResponseHeader to every every request
app.use('/*',function(req,res,next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
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

app.get("/api/user_role/:userid", (req,res) => {
  db.all('select * from user_role where ID=?', [req.params.userid], (err, result) =>{
    if (result.length > 0) {
      res.send(result[0]);
      res.status(200).end();
    } else {
      //no role with given id found
      res.status(404).end();
    }
  });
});

app.get("/api/user_project/:userid", (req,res) => {
  db.all('select * from user_project where ID=?', [req.params.userid], (err, result) =>{
    if (result.length > 0) {
      res.send(result[0]);
      res.status(200).end();
    } else {
      //no project with given id found
      res.status(404).end();
    }
  });
});

app.get("/api/time/:userid", (req,res) => {
  db.all('select * from time where ID=?', [req.params.userid], (err, result) =>{
    if (result.length > 0) {
      res.send(result[0]);
      res.status(200).end();
    } else {
      //no times with given id found
      res.status(404).end();
    }
  });
});

app.get("/api/project_time/:userid", (req,res) => {
  db.all('select * from time where ID=?', [req.params.userid, req.params.date, req.params.projectid], (err, result) =>{
    if (result.length > 0) {
      res.send(result[0]);
      res.status(200).end();
    } else {
      //no projectttimes with given id found
      res.status(404).end();
    }
  });
});

app.get("/api/logdata/:userid", (req,res) => {
  db.all('select * from logdata where ID=?', [req.params.userid], (err, result) =>{
    if (result.length > 0) {
      res.send(result[0]);
      res.status(200).end();
    } else {
      //no logdata with given id found
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
/*
  Missing POST requests: logdata, user_project, user_role, time, project_time
*/

/********************************************************************
    PUT Requests
 *******************************************************************/
app.put('/api/project/:id', (req, res) => {
  if (req.body.name == null ||  req.body.manager == null || req.body.description == null) {
    console.log("");
    console.log("Bad PUT Request to /api/project/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("UPDATE project SET name=?, manager=?, description=? WHERE id=?", [req.body.name, req.body.manager, req.body.description, req.params.id]);

    res.status(200).end();
  }
});

app.put('/api/user/:id', (req, res) => {
  if (req.body.firstname == null ||  req.body.lastname == null || req.body.departmentid == null) {
    console.log("");
    console.log("Bad PUT Request to /api/user/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("UPDATE user SET firstname=?, lastname=?, departmentid=? WHERE id=?", [req.body.firstname, req.body.lastname, req.body.departmentid, req.params.id]);

    res.status(200).end();
  }
});

app.put('/api/department/:id', (req, res) => {
  if (req.body.name == null ||  req.body.manager == null) {
    console.log("");
    console.log("Bad PUT Request to /api/department/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("UPDATE department SET name=?,manager=? WHERE id=?", [req.body.name,req.body.manager, req.params.id]);

    res.status(200).end();
  }
});

/*
  Missing PUT requests: ltogdata, user_project, user_role, time, project_time
*/

/********************************************************************
    DELETE Requests
 *******************************************************************/
app.delete('/api/project/:id', (req, res) => {
  db.run("DELETE FROM user WHERE id=?", [req.params.id]);

  res.status(200).end();
});

app.delete('/api/user/:id', (req, res) => {
  db.run("DELETE FROM user WHERE id=?", [req.params.id]);

  res.status(200).end();
});

app.delete('/api/department/:id', (req, res) => {
  db.run("DELETE FROM department WHERE id=?", [req.params.id]);

  res.status(200).end();
});

/*
  Missing DELETE requests: ltogdata, user_project, user_role, time, project_time
*/

app.listen(3000, function (){console.log("Port:3000")});
