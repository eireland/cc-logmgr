var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var date = new Date();
;
var query_date = date.getDate() - 2;

app.use(bodyParser.urlencoded({extended: false}));

const {Pool, Client} = require('pg');
const connectionString = process.env.DATABASE_URL;

console.log(connectionString);

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function (request, response) {
  response.render('pages/index');
});

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});

app.post('/db', function (request, response) {

  const pool = new Pool({
    connectionString: connectionString,
  });

  var m = Date.now() + 72 * 3600 * 1000;//Return all logs with date less the 3 days from now.
  var d = new Date(m);
  var query_date = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  console.log(query_date);

  var application = request.body.application;
  var num_records = 100; //default num records if user does not enter a num records

  if (request.body.num_records != '' && request.body.num_records != null) {
    num_records = request.body.num_records;
  }

  var query_string = "SELECT time, application, session, username, activity, event, event_value, parameters FROM logs WHERE application='" + application + "' and time<'" + query_date + "' order by time desc limit " + num_records;
  console.log("Query string is: " + query_string);

  pool.query(query_string, function (err, result) {
    if (err) {
      console.error(err);
      response.send("Error " + err);
    }
    else
    {
      console.log(JSON.stringify(result, null, ' '));
      response.render('pages/db', {results: result.rows});
    }

    pool.end
  });
});

