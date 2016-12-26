var app = angular.module('calendarApp', []);

var server_url="https://utd-comet-cal-data-fetcher.herokuapp.com/data";
//server_url="http://localhost:5000/data"

var now = new Date();
//getting current_date_time in UTC
var current_date_time = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
//To make current_date_time match the current date time in dallas.
current_date_time.setHours(current_date_time.getHours()-6);

console.log(current_date_time.getDate()+", "+(current_date_time.getMonth()+1)+", "+ current_date_time.getFullYear());


//Angular Calendar Controller
app.controller('calendarController', function($scope,$http){

  $scope.calendar_data={};

  //Code to be executed on document.ready()
  angular.element(document).ready(function(){
    console.log("document ready, angular working");

    chrome.storage.local.get(function(items){

      console.log("chrome storage log");
      console.log(items);

      if(items.calendar_data &&
        items.calendar_data.date.day===current_date_time.getDate() &&
        items.calendar_data.date.month===(current_date_time.getMonth()+1) &&
        items.calendar_data.date.year===current_date_time.getFullYear())
      {
        //data alread exists
        console.log("Data already exists");
        //using $scope.apply() to update angular bindings
        $scope.$apply(function(){
          $scope.calendar_data=items.calendar_data;
        });
      }
      else {
        //data does not exist in local storage
        console.log("data does not exist, fetching data from server");
        //Getting Calendar Data from server
        $http({
          method: 'GET',
          url: server_url
        }).then(function successCallback(response) {
            //when data successfully fetched
            console.log("Calendar Data successfully fetched");
            console.log(response);
            $scope.calendar_data.date=response.data.date;
            $scope.calendar_data.events=response.data.events;
            chrome.storage.local.set({calendar_data: $scope.calendar_data});
            console.log($scope.calendar_data);
          }, function errorCallback(response) {
            //when data could not be fetched
            console.log("Could Not fetch calendar data, error occured!");
            console.log(response);
          });
      }


    });

  });

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

});
