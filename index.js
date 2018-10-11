var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var date = new Date();

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

  function parseJSON(message_str){
    var join_string='',
        parameters_string='',
        filter_string = "(",
        key='' ,
        list='',
        list_arr=[];
    var message;
    console.log("in parseQuery. Message is: "+message_str);
    
    //This was the code needed to get values that was buried in a blob. Just saving in case I have to reuse for some other variable
    //join_sql =  "INNER JOIN ( "
    //join_sql << "   VALUES "
    //join_sql << "       ('" << clean_item_list.join("'), ('") << "') "
    //join_sql << "   ) vals(v) ON "
    //join_sql << "( #{hstore_columns} -> '#{clean_key}' ) = v"
    //SELECT time, application, session, username, activity, event, event_value, parameters FROM logs INNER JOIN (VALUES("https://learn.concord.org/dataservice/external_activity_data/19507da6-8c48-4de9-8a02-0686248b396d"),("https://learn.concord.org/dataservice/external_activity_data/b7894aad-9529-49a3-b530-81c3108f08d4"),("https://learn.concord.org/dataservice/external_activity_data/86248b91-b047-4e12-bdec-6cb9190f553b")) vals(v) ON (parameter || extras->'run_remote_endpoint') = v WHERE application='GeniStarDev' and time<'2017-12-15' order by time desc limit 1

    message = JSON.parse(message_str);
    console.log("filter is: "+ message.filter[0]);

    key = message.filter[0].key;
    list_arr = message.filter[0].list;
    console.log("key is: " +key);

    for (var i=0;i<list_arr.length;i++){
      //list = list + "('"+list_arr[i]+"'),";
      parameters_string = "run_remote_endpoint='"+list_arr[i]+"'";
      if (i==list_arr.length-1) {
        filter_string = filter_string + parameters_string;}
      else {
        filter_string = filter_string + parameters_string + " or ";}
    }

    //list = list.slice(0,-1);//takes out last comma from the list
    //console.log("list_arr is: "+list_arr);

    //join_string = "INNER JOIN (VALUES" + list + ") vals(v) ON (parameters || extras->'" + key + "') = v ";
    //return join_string;
    //parameters_string = "(parameters->'"+key+"'='"+ //need to list out each value
    filter_string = filter_string + ")"; //add the final close parenthesis
    console.log("filter_string is: "+filter_string);
    return filter_string
  }

  const pool = new Pool({
    connectionString: connectionString,
  });

  var m = Date.now() + 72 * 3600 * 1000;//Return all logs with date less the 3 days from now.
  var d = new Date(m);
  var query_end_date = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  console.log(query_end_date);
  var query_start_date = null;
  var activity_name = null;
  var event_name = null;
  var session_id = null;
  var run_remote_endpoint=null;
  var json_query = null;
  var temp_table_join = null;
  var parsed_json='';

  var application = request.body.application;
  var num_records = 250; //default num records if user does not enter a num records

  if (request.body.num_records != '' && request.body.num_records != null) {
    num_records = request.body.num_records;
  }

  if (request.body.end_date != '' && request.body.end_date != null) {
    query_end_date = request.body.end_date;
  }

  if (request.body.start_date != '' && request.body.start_date != null) {
    query_start_date = request.body.start_date;
  }

  if (request.body.activity_name != '' && request.body.activity_name != null) {
    activity_name = request.body.activity_name;
  }

  if (request.body.event_name != '' && request.body.event_name != null) {
    event_name = request.body.event_name;
  }

  if (request.body.session_id != '' && request.body.session_id != null) {
    session_id = request.body.session_id;
  }
  if (request.body.run_remote_endpoint != '' && request.body.run_remote_endpoint != null) {
        run_remote_endpoint = request.body.run_remote_endpoint;
  }
  if (request.body.json_query != '' && request.body.json_query != null) {
    json_query = request.body.json_query;
    //temp_table_join = parseJSON(json_query);
    parsed_json = parseJSON(json_query);
  }


  var query_string = "SELECT time, application, session, username, activity, event, event_value, run_remote_endpoint, parameters FROM logs ";

  if (json_query !=null) {
    //query_string = query_string + temp_table_join + "WHERE application='" + application + "'";
    query_string = query_string + "WHERE application='" + application + "'" + " and " + parsed_json;
  }
  else {
    query_string = query_string + "WHERE application='" + application + "'";
  }
// select distinct activity from logs where application not like 'Unknown%' and activity like '%Untitled%' order by activity desc;
  if (activity_name != null) {
    query_string = query_string + " and activity like '%" + activity_name +"%'"
  }
  if (event_name != null) {
    query_string = query_string + " and event like '%" + event_name +"%'"
  }
  if (session_id != null) {
    query_string = query_string + " and session like '%" + session_id +"%'"
  }
  if (run_remote_endpoint != null) {
        // query_string = query_string + " and run_remote_endpoint like '%" + run_remote_endpoint +"%'"
      query_string = query_string + " and run_remote_endpoint='" + run_remote_endpoint +"'"

  }
  if (query_start_date!= null){
    query_string = query_string + " and time>'" + query_start_date + "'";
  }
  if (num_records=="all") {
      query_string = query_string  + " and time<'" + query_end_date + "' order by time desc;";
  } else {
      query_string = query_string + " and time<'" + query_end_date + "' order by time desc limit " + num_records + ";";
  }
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

