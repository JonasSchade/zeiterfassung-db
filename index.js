const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const app = express();
const bp = require('body-parser');
const jwt = require('jsonwebtoken');
const jwtMiddleware = require('express-jwt');
const moment = require('moment');

const superSuperSecret = "superSuperSecret";

app.use(bp.json());

// open the database
let db = new sqlite3.Database('./db/zeiterfassung.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the Chronos database.');
});

app.use('/*',(req,res,next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH')
    next();
});



app.post("/api/token", (req,res) => {
  if (req.body.username == null ||  req.body.pw == null) {
    console.log("");
    console.log("Bad POST Request to /api/token");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.get("select * from logdata where username=? and password=?", [req.body.username, req.body.pw], (err, result) => {
      if (result == null) {
        res.send({"success": false});
        res.status(404).end();
        return;
      }

      db.get("SELECT user.admin, logdata.username, p.counter as pcounter, d.counter as dcounter, user.firstname, user.lastname from (select count(*) as counter FROM project where project.manager=?) as p, (SELECT count(*) as counter FROM department where department.manager=?) as d, user, logdata where user.id=? and logdata.userid = ?", [result.userid, result.userid, result.userid, result.userid], (err, result2) => {
        var payload = {
          admin: (result2.admin == 1),
          projectmanager: (result2.pcounter != 0),
          departmentmanager: (result2.dcounter != 0),
          id: result.userid,
          userdisplayname: (result2.firstname + " " + result2.lastname),
          username: (result2.username)
        };

        var token = jwt.sign(payload, superSuperSecret, {
          expiresIn: "30m"
        });

        res.send({"success": true, "token": token});
        res.status(200).end();
      });
    });
  }
});

app.get("/api/authenticate", (req,res) => {

  if (req.get("Authorization") == null) {
    res.send({loggedin: false});
    res.status(200).end();
    return;
  }

  var token = req.get("Authorization").replace(/(B|b)earer( )*/i,"");

  try {
    var decoded = jwt.verify(token, superSuperSecret);
    decoded.loggedin = true;
    res.send(decoded);
  } catch(err) {
    res.send({loggedin: false});
  }

  res.status(200).end();
});

app.put('/api/changepassword', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  if (req.body.userid == null ||  req.body.username == null ||  req.body.password_new == null ||  req.body.password_old == null) {
    console.log("");
    console.log("Bad PUT Request to /api/changepassword/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.get("select * from logdata where username=? and password=?", [req.body.username, req.body.password_old], (err, result) => {
      if (result == null) {
        res.send({"success": false});
        res.status(404).end();
        return;
      };
      db.run("UPDATE logdata SET username=?,password=?  WHERE userid=?", [req.body.username, req.body.password_new, req.body.userid]);
      res.status(200).end();
    });
  }
});


/********************************************************************************************
  api/user
 *******************************************************************************************/
//returns all users
app.get("/api/user", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.all("select l.username as username, us.* from logdata as l, (select u.*, d.name from user as u, (select 'Keine Abteilung' as name, null as id union all select d.name, d.id from department as d) as d where u.departmentid=d.id or (u.departmentid is null and d.id is null)) as us WHERE l.userid = us.id", [], (err, result) =>{
    res.send(result);

    res.status(200).end();
  });
});

//returns single user (by id)
app.get("/api/user/:id", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.all("select l.username as username, us.* FROM logdata as l, (select u.*, d.name from user as u, (select 'Keine Abteilung' as name, null as id union all select d.name, d.id from department as d) as d where u.id=? and (u.departmentid=d.id or (u.departmentid is null and d.id is null))) as us WHERE l.userid = us.id", [req.params.id], (err, result) =>{
    if (result.length > 0) {
      res.send(result[0]);
      res.status(200).end();
    } else {
      //no user with given id found
      res.status(404).end();
    }
  });
});

//posts single user
app.post('/api/user/', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  if (req.body.firstname == null ||  req.body.lastname == null ||  req.body.admin == null) {
    console.log("");
    console.log("Bad POST Request to /api/user/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    if (req.body.department == null) {
      db.run("INSERT into USER(firstname,lastname,admin) VALUES (?,?,?)", [req.body.firstname, req.body.lastname, req.body.admin], () => {
        db.get("SELECT max(id) as id from USER", [], (err, result) =>{
          res.send(result);
          res.status(200).end();
        });
      });
    } else {
      db.run("INSERT into USER(firstname,lastname,departmentid,admin) VALUES (?,?,?,?)", [req.body.firstname, req.body.lastname, req.body.department, req.body.admin], () => {
        db.get("SELECT max(id) as id from USER", [], (err, result) =>{
          res.send(result);
          res.status(200).end();
        });
      });
    }
  }
});

//updates given user
app.put('/api/user/:id', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  if (req.params.id == null || req.body.firstname == null ||  req.body.lastname == null || req.body.admin == null) {
    console.log("");
    console.log("Bad PUT Request to /api/user/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("UPDATE user SET firstname=?, lastname=?, departmentid=?, admin=? WHERE id=?", [req.body.firstname, req.body.lastname, req.body.departmentid, req.body.admin, req.params.id]);

    res.status(200).end();
  }
});

//deletes given user
app.delete('/api/user/:id', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.run("DELETE FROM logdata WHERE userid=?", [req.params.id], () => {
    db.run("DELETE FROM user WHERE id=?", [req.params.id]);
    res.status(200).end();
  });
});

/********************************************************************************************
  api/project
 *******************************************************************************************/
//returns all projects
app.get("/api/project", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.all('select project.*, user.firstname, user.lastname from project, user where project.manager=user.id', [], (err, result) =>{
    res.send(result);

    res.status(200).end();
  });
});

//returns single project (by id)
app.get("/api/project/:id", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
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

//posts single project
app.post('/api/project/', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  if (req.body.name == null ||  req.body.manager == null || req.body.description == null) {
    console.log("");
    console.log("Bad POST Request to /api/project/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("INSERT into PROJECT(name,manager,description) VALUES (?,?,?)", [req.body.name, req.body.manager, req.body.description], () => {
      db.get("SELECT max(id) as id FROM PROJECT", [], (err,result) => {
        res.send(result);
        res.status(200).end();
      });
    });
  }
});

//updates given project
app.put('/api/project/:id', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  if (req.params.id == null || req.body.name == null ||  req.body.manager == null || req.body.description == null) {
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

//deletes given project
app.delete('/api/project/:id', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.run("DELETE FROM project WHERE id=?", [req.params.id]);
  db.run("DELETE FROM user_project WHERE projectid=?", [req.params.id]);
  res.status(200).end();
});

/********************************************************************************************
  api/department
 *******************************************************************************************/
//returns all departments
app.get("/api/department", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
 db.all('select department.*, user.firstname, user.lastname from department, user where department.manager=user.id', [], (err, result) =>{
   res.send(result);

   res.status(200).end();
 });
});

//returns single department (by id)
app.get("/api/department/:id", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
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

//posts single department
app.post('/api/department/', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  if (req.body.name == null ||  req.body.manager == null) {
    console.log("");
    console.log("Bad POST Request to /api/department/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("INSERT into DEPARTMENT(name,manager) VALUES (?,?)", [req.body.name,req.body.manager], () => {
      db.get("SELECT max(id) as id from DEPARTMENT", [], (err, result) =>{
        res.send(result);
        res.status(200).end();
      });
    });
  }
});

//updates given department
app.put('/api/department/:id', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  if (req.params.id == null ||req.body.name == null ||  req.body.manager == null) {
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

//deletes given department
app.delete('/api/department/:id', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.run("DELETE FROM department WHERE id=?", [req.params.id]);
  db.run("UPDATE user SET departmentid=? WHERE departmentid=?", [null, req.params.id]);

  res.status(200).end();
});


/********************************************************************************************
  user - project relations
 *******************************************************************************************/

 //returns all projects where given user is manager
 app.get("/api/projects_of_manager/:managerid", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.all('select project.*, user.firstname, user.lastname from project, user where user.id=project.manager and project.manager=?', [req.params.managerid], (err, result) =>{
  if(result.length > 0){
    res.send(result);
    res.status(200).end();
  } else {
    res.status(404).end();
  }
  });
});

//returns all users of given project
app.get("/api/project_users/:projectid", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
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

//links all given users to given project id
app.post('/api/project_users/:projectid', jwtMiddleware({secret: superSuperSecret}), (req,res) => {

  if (! (req.body instanceof Array)) {
    req.body = [req.body];
  }

  for (var i = 0; i < req.body.length; i++) {
    var el = req.body[i]
    if (el.id == null) {
      console.log("");
      console.log("Bad POST Request to /api/project_users/");
      console.log("Request Body:");
      console.log(req.body);
      console.log("Element (Index "+ i+"):");
      console.log(el)
      console.log("");

      res.status(400).end();
    } else {
      db.run("INSERT into user_project(userid, projectid) VALUES (?,?)", [el.id, req.params.projectid]);

    }
  };

  res.status(200).end();
});

//this will add users to a specific project but will also every other user from the given project
app.put('/api/project_users/:projectid', jwtMiddleware({secret: superSuperSecret}), (req,res) => {

  if (! (req.body instanceof Array)) {
    req.body = [req.body];
  }

  db.run("DELETE FROM user_project WHERE projectid=?", [req.params.projectid], () => {
    for (var i = 0; i < req.body.length; i++) {
      var el = req.body[i]
      if (el.id == null) {
        console.log("");
        console.log("Bad POST Request to /api/project_users/");
        console.log("Request Body:");
        console.log(req.body);
        console.log("Element (Index "+ i+"):");
        console.log(el)
        console.log("");

        res.status(400).end();
      } else {
        db.run("INSERT into user_project(userid, projectid) VALUES (?,?)", [el.id, req.params.projectid]);

      }
    };
  });


  res.status(200).end();
});

//retuns all projects of given user
app.get("/api/user_projects/:userid", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
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

//links all given prjects to given user id
app.post('/api/user_projects/:userid', jwtMiddleware({secret: superSuperSecret}), (req,res) => {

  if (! (req.body instanceof Array)) {
    req.body = [req.body];
  }

  for (var i = 0; i < req.body.length; i++) {
    var el = req.body[i]
    if (el.id == null) {
      console.log("");
      console.log("Bad POST Request to /api/user_projects/");
      console.log("Request Body:");
      console.log(req.body);
      console.log("Element (Index "+ i+"):");
      console.log(el)
      console.log("");

      res.status(400).end();
    } else {
      db.run("INSERT into user_project(userid, projectid) VALUES (?,?)", [parseInt(req.params.userid), el.id]);
    }
  };

  res.status(200).end();
});

//links all given projects to given user id but deletes all other links to the user
app.put('/api/user_projects/:userid', jwtMiddleware({secret: superSuperSecret}), (req,res) => {

  if (! (req.body instanceof Array)) {
    req.body = [req.body];
  }

  db.run("DELETE FROM user_project WHERE userid=?", [parseInt(req.params.userid)], () => {
    for (var i = 0; i < req.body.length; i++) {
      var el = req.body[i]
      if (el.id == null) {
        console.log("");
        console.log("Bad POST Request to /api/user_projects/");
        console.log("Request Body:");
        console.log(req.body);
        console.log("Element (Index "+ i+"):");
        console.log(el)
        console.log("");

        res.status(400).end();
      } else {
        db.run("INSERT into user_project(userid, projectid) VALUES (?,?)", [parseInt(req.params.userid), el.id]);
      }
    };

    res.status(200).end();
  });
});


/********************************************************************************************
  other enpoints
 *******************************************************************************************/
//NOT USED?
/*Not single Entries*/
app.get("/api/time/:userid", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
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

app.get("/api/time_of_year/:userid/:year", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  var year = parseInt(req.params.year);
  if(isNaN(year)) {
    res.status(404).end();
    return;
  }
  var query = "select sum(duration) as sum from project_time where userid=? and date like '"+year+"%'";
  db.all(query, [req.params.userid], (err, result) =>{
    if (result.length > 0) {
      res.send(result[0]);
      res.status(200).end();
    } else {
      //no times with given userid found
      res.status(404).end();
    }
  });
});

app.get("/api/times/:userid/:date", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.all('select * from time where userid=? and date=?', [req.params.userid, req.params.date], (err, result) =>{
    if (result.length > 0) {
      res.send(result);
      res.status(200).end();
    } else {
      //no times with given userid found
      res.send(null);
      //res.status(404).end();
    }
  });
});

//NOT USED?
app.get("/api/project_time/:userid", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.all('select * from project_time where userid=?', [req.params.userid], (err, result) =>{
    if (result.length > 0) {
      res.send(result);
      res.status(200).end();
    } else {
      //no projecttimes with given userid found
        res.send(0);
        res.status(200).end();
    }
  });
});

//returns all users frim given department
app.get("/api/department_users/:departmentid", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.all('SELECT * from user where user.departmentid=?', [req.params.departmentid], (err, result) =>{
    if (result.length > 0) {
      res.send(result);
      res.status(200).end();
    } else {
      //no users with given departmentid found
      res.status(404).end();
    }
  });
});


//get time worked on one project on a date by userid
app.get("/api/project_time/:userid/:date/:projectid", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.all('select project_time.date, project_time.duration, project_time.userid, project.name  from project_time, project where project_time.userid=? and project_time.date=? and project_time.projectid=? and project_time.projectid=project.id', [req.params.userid, req.params.date, req.params.projectid], (err, result) =>{
    if (result.length > 0) {
      res.send(result);
      res.status(200).end();
    } else {
      //no projecttimes with given userid, date and projectid found
      res.send([{duration: 0.0}]);
      res.status(200).end();
    }
  });
});

//NOT USED?
//get sum of worked hours for a project
app.get("/api/time_by_project/:projectid", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.all('select sum(duration) from project_time where project_time.projectid=?', [req.params.projectid], (err, result) =>{
    if (result.length > 0) {
      res.send(result);
      res.status(200).end();
    } else {
      //no projecttimes with given userid, date and projectid found
      res.status(404).end();
    }
  });
});

//NOT USED?
//get sum by user for one project
app.get("/api/time_by_user_project/:projectid/:userid", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.all('select sum(duration) from project_time where project_time.projectid=? and project_time.userid=? ', [req.params.projectid, req.params.userid], (err, result) =>{
    if (result.length > 0) {
      res.send(result);
      res.status(200).end();
    } else {
      //no projecttimes with given userid, date and projectid found
      res.status(404).end();
    }
  });
});

//NOT USED?
//get sum on a day by the userid
app.get("/api/time_by_user_date/:userid/:date", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.all('SELECT time.*, d.sum from time join (select sum(duration) as sum, userid, date from project_time where userid=? and date=?) as d on d.userid=time.userid and d.date=time.date', [req.params.userid, req.params.date], (err, result) =>{
    if (result.length > 0) {
      res.send(result[0]);
      res.status(200).end();
    } else {
      //no projecttimes with given userid, date and projectid found
      res.send({sum: 0});
      res.status(200).end();
    }
  });
});

//duration of time worked on that specific day
app.get("/api/time_worked_day/:userid/:date", jwtMiddleware({secret: superSuperSecret}), (req,res) => {

  if (req.params.userid == null || req.params.date == null) {
    console.log("");
    console.log("Bad POST Request to /api/time_worked_day/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
    return;
  }

  db.all('SELECT * from time where userid=? and date=?', [req.params.userid, req.params.date], (err, result) =>{
    console.log(result);
    if (result.length > 0) {
      var come = moment(result[0].comming_time);
      var leave = moment(result[0].leaving_time);
      var dur = moment.duration(leave - come);

      //subtract pause
      dur = dur.subtract(result[0].pause,"hours");

      //add travel time
      dur = dur.add(result[0].pause * 0.5,"hours");


      var format = "";

      if (dur.hours() > 0) {
        format = format + dur.hours() + "h";
      };

      if (dur.minutes() > 0) {
        if (format != "") {
          format = format + " ";
        }
        format = format + dur.minutes() + "min";
      };
      res.send({"sum": dur.asMilliseconds(), "sumFormatted": format});
      res.status(200).end();
    } else {
      //no projecttimes with given userid, date and projectid found
      res.send({sum: 0, sumFormatted: format});
      res.status(200).end();
    }
  });
});

//NOT USED?
//get sum of worked hours of userid
app.get("/api/time_by_date_project/:projectid/:date", jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  db.all('select sum(duration) from project_time where project_time.projectid=? and project_time.date=?', [req.params.projectid, req.params.date], (err, result) =>{
    if (result.length > 0) {
      res.send(result);
      res.status(200).end();
    } else {
      //no projecttimes with given userid, date and projectid found
      res.status(404).end();
    }
  });
});



//posts logdata fpr given user
app.post('/api/logdata/:userid', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  if (req.body.username == null ||  req.body.password == null) {
    console.log("");
    console.log("Bad POST Request to /api/logdata/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("INSERT into logdata(userid, username, password) VALUES (?,?,?)", [req.params.userid, req.body.username, req.body.password]);

    res.status(200).end();
  }
});

//links all given users to given department id but deletes all links other links to the department
app.put('/api/department_users/:departmentid', jwtMiddleware({secret: superSuperSecret}), (req,res) => {

  if (! (req.body instanceof Array)) {
    req.body = [req.body];
  }

  db.run("UPDATE user SET departmentid=? WHERE departmentid=?", [null, req.params.departmentid], () => {
    for(var i = 0; i<req.body.length; i++){
      if (req.params.departmentid == null || req.body[i].id == null) {
        console.log("");
        console.log("Bad PUT Request to /api/department_users/");
        console.log("Request Body:");
        console.log(req.body);
        console.log("");

        res.status(400).end();
      } else {

        db.run("UPDATE user SET departmentid=? WHERE id=?", [req.params.departmentid, req.body[i].id]);
        res.status(200).end();
      }
    }
  });
});

//NOT USED?
app.post('/api/time/', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
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

//NOT USED?
app.post('/api/project_time/', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
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



//NOT USED?
app.put('/api/logdata/:userid', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
  if (req.params.userid == null ||req.body.userid == null ||  req.body.username == null ||  req.body.password == null) {
    console.log("");
    console.log("Bad PUT Request to /api/logdata/");
    console.log("Request Body:");
    console.log(req.body);
    console.log("");

    res.status(400).end();
  } else {
    db.run("UPDATE logdata SET username=?,password=?  WHERE userid=?", [req.body.username, req.body.password, req.params.userid]);

    res.status(200).end();
  }
});

//NOT USED?
app.put('/api/time/:userid/:date', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
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

//NOT USED?
app.put('/api/project_time/:userid/:date/:projectid', jwtMiddleware({secret: superSuperSecret}), (req,res) => {
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

app.listen(3000, () => {console.log("Port:3000")});
