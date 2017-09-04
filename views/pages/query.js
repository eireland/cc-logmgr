/**
 * Created by evangelineireland on 9/3/17.
 */

$(document).ready(function (){

  function getQuery () {
    console.log("In getQuery");
    var query = $('#query_field').val();
    console.log("Query is: "+query);
    return query;
  }

  function fetchQueryResults (){
    console.log("In fetchQueryResults");
    var dbURL = "postgres://ucbntqpfheglgv:p9ug7dvqnqgsm4cg8libj974t1h@ec2-54-225-80-108.compute-1.amazonaws.com:5442/d4u8rvpga9gus0";
    $.ajax({
      url: dbURL,
      type: "GET",
      success: buildTable,
      error: function (xhr){
        alert(xhr.status);
      }
    })
  }

  function buildTable (response){
    console.log("Response to query is: "+ JSON.stringify(response, null, ' '));
  }
}