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
  db.all('select project.*, user.firstname, user.lastname from project, user where project.manager=user.id', [], (err, result) =>{
    res.send(result);

    res.status(200).end();
  });
});

app.get("/api/user", (req,res) => {
  db.all('select user.*, department.name from user, department where user.departmentid=department.id', [], (err, result) =>{
    res.send(result);

    res.status(200).end();
  });
});

app.get("/api/department", (req,res) => {
  db.all('select department.*, user.firstname, user.lastname from department, user where department.manager=user.id', [], (err, result) =>{
    res.send(result);

    res.status(200).end();
  });
});
/********************************************************************
    GET Single Entry
 *******************************************************************/
app.get("/api/project/:id", (req,res) => {
  db.all('select project.*, user.firstname, user.lastname from project, user where project.ID=? and project.manager=user.id', [req.params.id], (err, result) =>{
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
  db.all('select user.*, department.name from user,department where user.id=? and user.departmentid=department.id', [req.params.id], (err, result) =>{
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
  db.all('select department.*, user.firstname, user.lastname from department, user where department.id=? and department.manager=user.id', [req.params.id], (err, result) =>{
    if (result.length > 0) {
      res.send(result[0]);
      res.status(200).end();
    } else {
      //no department with given id found
      res.status(404).end();
    }
  });
});

app.get("/api/logdata/:userid", (req,res) => {
  db.all('select * from logdata where userid=?', [req.params.userid], (err, result) =>{
    if (result.length > 0) {
      res.send(result[0]);
      res.status(200).end();
    } else {
      //no logdata with given userid found
      res.status(404).end();
    }
  });
});
/********************************************************************
    GET Multiple Entries by parameter
 *******************************************************************/
app.get("/api/user_role/:userid", (req,res) => {
  db.all('select * from user_role where userid=?', [req.params.userid], (err, result) =>{
    if (result.length > 0) {
      res.send(result);
      res.status(200).end();
    } else {
      //no role with given userid found
      res.status(404).end();
    }
  });
});

app.get("/api/user_project/:userid", (req,res) => {
  db.all('select PROJECT.* from PROJECT LEFT JOIN user_project ON PROJECT.ID = user_project.projectid WHERE user_project.userid=?', [req.params.userid], (err, result) =>{
    if (result.length > 0) {
      res.send(result);
      res.status(200).end();
    } else {
      //no project with given userid found
      res.send([]);
      res.status(200).end();
    }
  });
});
/*Not single Entries*/
app.get("/api/project_users/:projectid", (req,res) => {
  db.all('select USER.* from USER LEFT JOIN user_project ON USER.ID = user_project.userid WHERE user_project.projectid=?', [req.params.projectid], (err, result) =>{
    if (result.length > 0) {
      res.send(result);
      res.status(200).end();
    } else {
      //no user with given id found
      res.send([]);
      res.status(200).end();
    }
  });
});
/*Not single Entries*/
app.get("/api/time/:userid", (req,res) => {
  db.all('select * from time where userid=?', [req.params.userid], (err, result) =>{
    if (result.length > 0) {
      res.send(result);
      res.status(200).end();
    } else {
      //no times with given userid found
      res.status(404).end();
    }
  });
});

app.get("/api/project_time/:userid", (req,res) => {
  db.all('select * from project_time where userid=?', [req.params.userid], (err, result) =>{
    if (result.length > 0) {
      res.send(result);
      res.status(200).end();
    } else {
      //no projecttimes with given userid found
      res.status(404).end();
    }
  });
});

/********************************************************************
    complex GET Requests
 *******************************************************************/
 app.get("/api/project_time/:userid/:date/:projectid", (req,res) => {
   db.all('select project_time.date, project_time.duration, project_time.userid, project.name  from project_time, project where project_time.userid=? and project_time.date=? and project_time.projectid=? and project_time.projectid=project.id', [req.params.userid, req.params.date, req.params.projectid], (err, result) =>{
     if (result.length > 0) {
       res.send(result);
       res.status(200).end();
     } else {
       //no projecttimes with given userid, date and projectid found
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

app.post('/api/logdata/', (req, res) => {
  if (req.body.userid == null ||  req.body.username == null ||  req.body.password == null) {
    console.log("");
    console.log("Bad POST Request to /api/logdata/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("INSERT into logdata(userid, username, password) VALUES (?,?,?)", [req.body.userid, req.body.username, req.body.password]);

    res.status(200).end();
  }
});

app.post('/api/user_project/', (req, res) => {
  if (req.body.userid == null ||  req.body.projectid == null) {
    console.log("");
    console.log("Bad POST Request to /api/user_project/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("INSERT into user_project(userid, projectid) VALUES (?,?)", [req.body.userid, req.body.projectid]);

    res.status(200).end();
  }
});

app.post('/api/user_role/', (req, res) => {
  if (req.body.userid == null ||  req.body.roleid == null) {
    console.log("");
    console.log("Bad POST Request to /api/user_role/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("INSERT into user_role(userid, roleid) VALUES (?,?)", [req.body.userid, req.body.roleid]);

    res.status(200).end();
  }
});

app.post('/api/time/', (req, res) => {
  if (req.body.date == null ||  req.body.comming_time == null ||  req.body.leaving_time == null ||  req.body.pause == null ||  req.body.travel == null ||  req.body.userid == null) {
    console.log("");
    console.log("Bad POST Request to /api/time/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("INSERT into time(date, comming_time, leaving_time, pause, travel, userid) VALUES (?,?,?,?,?,?)", [req.body.date, req.body.comming_time, req.body.leaving_time, req.body.pause, req.body.travel, req.body.userid]);

    res.status(200).end();
  }
});

app.post('/api/project_time/', (req, res) => {
  if (req.body.date == null ||  req.body.userid == null ||  req.body.projectid == null ||  req.body.duration == null) {
    console.log("");
    console.log("Bad POST Request to /api/project_time/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("INSERT into project_time(date, userid, projectid, duration) VALUES (?,?,?,?)", [req.body.date, req.body.userid, req.body.projectid, req.body.duration]);

    res.status(200).end();
  }
});

/********************************************************************
    PUT Requests
 *******************************************************************/
app.put('/api/project/:id', (req, res) => {
  if (req.param.id == null ||req.body.name == null ||  req.body.manager == null || req.body.description == null) {
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
  if (req.param.id == null ||req.body.firstname == null ||  req.body.lastname == null || req.body.departmentid == null) {
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
  if (req.param.id == null ||req.body.name == null ||  req.body.manager == null) {
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

app.put('/api/logdata/:userid', (req, res) => {
  if (req.param.userid == null ||req.body.userid == null ||  req.body.username == null ||  req.body.password == null) {
    console.log("");
    console.log("Bad PUT Request to /api/logdata/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("UPDATE logdata SET username=?,password=?  WHERE userid=?", [req.body.username, req.params.password, req.param.userid]);

    res.status(200).end();
  }
});

app.put('/api/user_project/:userid', (req, res) => {
  if (req.param.userid == null || req.body.userid == null ||  req.body.projectid == null) {
    console.log("");
    console.log("Bad PUT Request to /api/user_project/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("UPDATE user_project SET projectid=?  WHERE userid=?", [req.body.projectid, req.params.userid]);

    res.status(200).end();
  }
});

app.put('/api/user_role/:userid', (req, res) => {
  if (req.param.userid == null || req.body.name == null ||  req.body.manager == null) {
    console.log("");
    console.log("Bad PUT Request to /api/user_role/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("UPDATE user_role SET roleid=?  WHERE userid=?", [req.body.roleid, req.params.userid]);

    res.status(200).end();
  }
});

app.put('/api/time/:userid/:date', (req, res) => {
  if (req.param.userid == null || req.param.date == null || req.body.name == null ||  req.body.manager == null) {
    console.log("");
    console.log("Bad PUT Request to /api/user_role/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("UPDATE time SET comming_time=?, leaving_time=?, pause, travel  WHERE userid=? and date=?", [req.body.comming_time, req.body.leaving_time, req.body.pause, req.body.travel, req.params.userid, req.params.date]);

    res.status(200).end();
  }
});

app.put('/api/project_time/:userid/:date/:projectid', (req, res) => {
  if (req.param.userid == null || req.param.date == null || req.param.projectid == null || req.body.name == null ||  req.body.manager == null) {
    console.log("");
    console.log("Bad PUT Request to /api/project_time/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("UPDATE project_time SET duration  WHERE userid=? and date=? and projectid=?", [req.body.duration, req.params.userid, req.params.date, req.params.projectid]);

    res.status(200).end();
  }
});

/********************************************************************
    DELETE Requests
 *******************************************************************/
app.delete('/api/project/:id', (req, res) => {
  db.run("DELETE FROM project WHERE id=?", [req.params.id]);
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

app.delete('/api/logdata/:userid', (req, res) => {
  db.run("DELETE FROM logdata WHERE userid=?", [req.params.userid]);

  res.status(200).end();
});

app.delete('/api/user_project/:userid', (req, res) => {
  db.run("DELETE FROM user_project WHERE userid=?", [req.params.userid]);

  res.status(200).end();
});

app.delete('/api/user_role/:userid/:roleid', (req, res) => {
  db.run("DELETE FROM user_role WHERE userid=? and roleid=?", [req.params.userid, req.params.roleid]);

  res.status(200).end();
});

app.listen(3000, function (){console.log("Port:3000")});
