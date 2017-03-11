var server_url_data="https://utd-comet-cal-data-fetcher.herokuapp.com/data";
var server_url_eventData="https://utd-comet-cal-data-fetcher.herokuapp.com/eventData";
/*var server_url_data="http://localhost:5000/data"
var server_url_eventData="http://localhost:5000/eventData";*/

var now = new Date();
//getting current_date_time in UTC
var current_date_time = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
//To make current_date_time match the current date time in dallas.
current_date_time.setHours(current_date_time.getHours()-6);

console.log("Background page...");

chrome.runtime.onInstalled.addListener(function(details){
  printLogToStorage("onInstalled listener called.");
  fetchCalendarData();
  //setting alarm time for 00:01 for the next day
  var alarm_time = new Date(current_date_time.getTime());
  alarm_time.setHours(24,1,0,0);
  //printLogToStorage("Alarm Time set for "+alarm_time);
  chrome.alarms.create("AlarmFetchData", {when:alarm_time.getTime(), periodInMinutes: 24*60});
});

chrome.alarms.onAlarm.addListener(function(alarm){
  printLogToStorage("Alarm Fired");
  chrome.storage.local.get(function(items){
    if(items.calendar_data &&
      items.calendar_data.date.day===current_date_time.getDate() &&
      items.calendar_data.date.month===(current_date_time.getMonth()+1) &&
      items.calendar_data.date.year===current_date_time.getFullYear())
    {
      //data alread exists
      printLogToStorage("Data already exists");
    }
    else {
      //data does not exist in local storage
      fetchCalendarData();
    }
  });
});

function fetchCalendarData(){

      printLogToStorage("fetching calendar data from server");

      var xmlHttp = new XMLHttpRequest();
          xmlHttp.onreadystatechange = function() {
              if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {

                printLogToStorage("Main Data successfuly fetched.");

                var cal_data=JSON.parse(xmlHttp.responseText);
                //console.log(cal_data);
                chrome.storage.local.set({calendar_data: cal_data});

                cal_data.events.forEach(function(element){

                  var xmlHttp2 = new XMLHttpRequest();
                      xmlHttp2.onreadystatechange = function() {
                          if (xmlHttp2.readyState == 4 && xmlHttp2.status == 200) {
                            var event_data=JSON.parse(xmlHttp2.responseText);
                            //console.log(event_data);
                            element.details={location:event_data.location, description_html:event_data.description_html, contact_html: event_data.contact_html}
                            chrome.storage.local.set({calendar_data: cal_data});
                          }
                      }
                      xmlHttp2.open("GET", server_url_eventData+"?event_id="+element.id, true); // true for asynchronous
                      xmlHttp2.send(null);
                });

              } else if(xmlHttp.readyState == 4){
                printLogToStorage("Main data could not be fetched successfuly, setting an alarm 2 minutes from now to try again.");
                chrome.alarms.create("AlarmFetchData", {delayInMinutes: 2});
              }
          }
          xmlHttp.open("GET", server_url_data, true); // true for asynchronous
          xmlHttp.send(null);
};


/*
  To log information to chrome local storage as the background evet page is not always active, it loads and unloads when needed.
*/
function printLogToStorage(data){
  console.log(data);
  chrome.storage.local.get(function(items){
    console.log(items);
    if(typeof items.storage_log !== 'undefined') {
      console.log("storage log exists");
      console.log(items.storage_log);
      chrome.storage.local.set({storage_log: items.storage_log+"\nbg.js "+(new Date())+": "+data});
    }
    else {
      console.log("storage log does not exist");
      chrome.storage.local.set({storage_log: (new Date())+"bg.js : "+data});
    }
  });
};
