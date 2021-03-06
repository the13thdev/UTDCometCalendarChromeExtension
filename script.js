var app = angular.module('calendarApp',[]);

var server_url_data="https://utd-comet-cal-data-fetcher.herokuapp.com/data";
var server_url_eventData="https://utd-comet-cal-data-fetcher.herokuapp.com/eventData";
/*var server_url_data="http://localhost:5000/data"
var server_url_eventData="http://localhost:5000/eventData";*/

var time_at_utd = moment().tz("US/Central");
console.log("day= "+time_at_utd.date()+", month="+(time_at_utd.month()+1)+", year="+time_at_utd.year());

//Angular Calendar Controller
app.controller('calendarController', function($scope,$http,$sce){

  $scope.calendar_data={};

  //to keep track of when request gets comepleted
  $scope.request_completed=false;

  //to render html content
  $scope.renderHtmlContent = function(html_code){
    //console.log("..asked to render html");
    return $sce.trustAsHtml(html_code);
  };

  //Code to be executed on document.ready()
  angular.element(document).ready(function(){
    //console.log("document ready, angular working");

    chrome.storage.local.get(function(items){

      //console.log("chrome storage log");
      //console.log(items);

      if(items.calendar_data &&
        items.calendar_data.date.day===time_at_utd.date() &&
        items.calendar_data.date.month===(time_at_utd.month()+1) &&
        items.calendar_data.date.year===time_at_utd.year())
      {
        //data alread exists
        console.log("Data already exists");
        //using $scope.apply() to update angular bindings
        $scope.$apply(function(){
          $scope.calendar_data=items.calendar_data;
          $scope.request_completed=true;
          $scope.request_successful=true;
          checkIfDataComplete();
        });
      }
      else {
        //data does not exist in local storage
        fetchData();
      }
    });
  });

  function fetchData(){

    printLogToStorage("data does not exist, fetching data from server (from main extension).");
    //Getting Calendar Data from server
    $http({
      method: 'GET',
      url: server_url_data
    }).then(function successCallback(response) {
        //when data successfully fetched
        printLogToStorage("Calendar Data successfully fetched");
        //console.log(response);
        $scope.calendar_data.date=response.data.date;
        $scope.calendar_data.events=response.data.events;
        //fetching details data for each of the events
        $scope.calendar_data.events.forEach(function(element){
          $http({
            method: 'GET',
            url: server_url_eventData+"?event_id="+element.id
          }).then(function successCallback(response){
            element.details={location:response.data.location, description_html:response.data.description_html, contact_html: response.data.contact_html}
            //updating chrome local storage data to include current_event_details
            chrome.storage.local.set({calendar_data: $scope.calendar_data});
          }, function errorCallback(response){
            console.log("Error fetching details for following element");
            console.log(element);
          });
        });
        chrome.storage.local.set({calendar_data: $scope.calendar_data});
        //console.log($scope.calendar_data);
        $scope.request_completed=true;
        $scope.request_successful=true;
      }, function errorCallback(response) {
        //when data could not be fetched
        printLogToStorage("Could Not fetch calendar data, error occured!");
        console.log(response);
        $scope.request_completed=true;
        $scope.request_successful=false;
      });
  }

  $scope.getMonthName= function(month_num)  {
    var month_name;
    switch(month_num)
    {
      case 1:
      month_name="Jan";
      break;
      case 2:
      month_name="Feb";
      break;
      case 3:
      month_name="Mar";
      break;
      case 4:
      month_name="Apr";
      break;
      case 5:
      month_name="May";
      break;
      case 6:
      month_name="Jun";
      break;
      case 7:
      month_name="Jul";
      break;
      case 8:
      month_name="Aug";
      break;
      case 9:
      month_name="Sep";
      break;
      case 10:
      month_name="Oct";
      break;
      case 11:
      month_name="Nov";
      break;
      case 12:
      month_name="Dec";
      break;
    }
    return month_name;
  };

  /*
    To log information to chrome local storage.
  */
  function printLogToStorage(data){
    //console.log(data);
    chrome.storage.local.get(function(items){
      //console.log(items);
      if(typeof items.storage_log !== 'undefined') {
        //console.log("storage log exists");
        //console.log(items.storage_log);
        chrome.storage.local.set({storage_log: items.storage_log+"\nsc.js "+(new Date())+": "+data});
      }
      else {
        //console.log("storage log does not exist");
        chrome.storage.local.set({storage_log: (new Date())+"sc.js : "+data});
      }
    });
  };

  function checkIfDataComplete(){
    for (i = 0; i < $scope.calendar_data.events.length ; i++){
      if(typeof $scope.calendar_data.events[i].details === 'undefined')
      {
        fetchData();
        break;
      }

    }
  };

});
