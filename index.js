const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const app = express();
const bp = require('body-parser');
app.use(bp.json());
/*
// open the database
let db = new sqlite3.Database('./db/chinook.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the chinook database.');
});
*/

//anfrage auf /api/projekte > gibt alle projekte zurück
app.get("/api/projekte/", (req,res) => {

  //zugriff auf DB
  var data = {"Mitarbeitername": "Hans Dampf"}; //hier kommt alles rein, was im body der response stehen soll


  res.send(data);
  res.status(200).end();
});

app.post('/api/projekte', (req, res) => {

  console.log(req.body);
  res.send('POST request to homepage');
  res.status(200).end();
});


/*
app.get('/api/projekte/', (req, res) => {
	db.query('select * from projekte')
		.then((result) => {
			console.log(result)
			res.json(result[0]).end()
		})
		.catch((err) => {
			console.log(err)
			res.status(400).send(err).end()
		})
})

app.get('/api/projekte/:id', function (req, res) {
	db.query('select * from projekte where id=?', [req.params.id])
		.then((result) => {
			console.log(result)
			if (result[0].length > 0) res.json(result[0]).end()
			else res.status(404).end()
		})
		.catch((err) => {
			console.log(err)
			res.status(404).end()
		})
})

app.delete('/api/projekte/:id', function (req, res) {
	db.query('delete from projekte where id=?', [req.params.id])
		.then((result) => {
			console.log(result)
			res.status(204).end()
		})
		.catch((err) => {
			console.log(err)
			res.status(404).end()
		})
})

app.post('/api/projekte/', (req, res) => {
	db.query('insert into projekte (id, name) values (?, ?)', [req.body.id, req.body.name])
		.then((result) => {
			console.log(result)
			res.status(201).json(req.body).end()
		})
		.catch((err) => {
			console.log(err)
			res.status(400).send(err).end()
		})
});
*/



app.listen(3000, function (){console.log("Port:3000")});



/*

db.serialize(() => {
  db.each(`SELECT PlaylistId as id,
                  Name as name
           FROM playlists`, (err, row) => {
    if (err) {
      console.error(err.message);
    }
    console.log(row.id + "\t" + row.name);
  });
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Close the database connection.');
});
*/
