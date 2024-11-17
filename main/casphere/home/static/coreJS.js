// Initiializing global variables

// Config options
const GLOBAL_ALLOWED_YEARS = ["Y9","Y10","Y11","Y12","Y13"]
const errorStatusList = [500,401]

// General global variables used
var GLOBAL_USER_OBJ = {}
var GLOBAL_PROJECT_SET = {}

// HELPER FUNCTIONS

async function fetchPostWrapper(path, body = {}){
    var response = await fetch(path, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
      });
    if (errorStatusList.includes(response.status)){
      return false //response.status
    }
    return await response.json() 
}

async function fetchPostWrapperForm(path, form){
  var response = await fetch(path, {
      method: "POST",

      body: form
    });
  return response.status
}

function formatDateTimeToDate(dateString) { // Removes the trailing time returned by the SQL date
  return dateString.slice(0,10)
}

function parseIsoDate(dateStr){ //Year-Month-Day
  var splitDateStr = dateStr.split("-");
  try{
    if (splitDateStr[0].length != 4 || splitDateStr[1].length != 2 || splitDateStr[2].length != 2){
      return false
    }
  }catch{false}
  return new Date(parseInt(splitDateStr[0], 10), parseInt(splitDateStr[1], 10) - 1, parseInt(splitDateStr[2], 10));
}

// Facilitates strings, dates 
function isGreaterThan(a,b){
  if (parseIsoDate(a) && parseIsoDate(b)){
    return parseIsoDate(a) > parseIsoDate(b)
  } 
  return a > b
}

// Converts array to be formatted (and sorted if specified (smallest to biggest)) to be displayed. Sort only works based on integer values after the 0th idx
function formatArrayToStr(arr, sort=false){
  if (arr.length == 1){
    return arr[0]
  }
  if (sort){
    for (var x = 0; x < arr.length-1; x++){
      var minIdx = x
      for (var i = x+1; i < arr.length; i++){
        if (Number(arr[i].slice(1))<Number(arr[x].slice(1))){ // There is an edge case this handles to enable 'Y9' < 'Y10' = True
          minIdx = i
        }
      }
      var temp = arr[x]
      arr[x] = arr[minIdx]
      arr[minIdx] = temp
    }
  }
  return arr.slice(0,-1).join(', ') + ' and ' + arr[arr.length-1]
}

async function getUserObj(){
  return await fetchPostWrapper("/getUserObj")
}

// -- Adding Projects --

function addProjectShowForm(){
  $('#addProjectForm').trigger("reset");
  
  //Setting the start date input min/max values
  $("#addProjectModal").modal('show');
}

async function addProjectSubmit(form){
  const formData = new FormData(form);
  
  formData.append('projImg', document)
  console.log(formData)
  var responseStatus = await fetchPostWrapperForm("/submitProject", formData)
  switch (responseStatus){
    case 200:
      // Hide modal, show popup saying success, reload page
      showAlert("success", "Success")
      $("#addProjectModal").modal('hide');
      break
    case 401:
      showAlert("danger", "Not authorized")
    case 500:
      showAlert("danger", "There was an internal error, please report the issue and try again")
  }
}

// -- Setting/changing the user's year group --

function updateWithNewYear(){
  $("#dropDownYearGroup").html(`Year: ${GLOBAL_USER_OBJ["yearGroup"]}`)
  GLOBAL_PROJECT_SET.projectScroll.onSearch()
}

function showYearSelectPopup(){
  if (!GLOBAL_ALLOWED_YEARS.includes(GLOBAL_USER_OBJ["yearGroup"])){ // If the user has not already selected a yeargroup force the selection
    document.getElementById("selectedYearCloseBtn").hidden = true
    document.getElementById("selectYearModal").setAttribute('data-bs-backdrop','static');
    $("#selectedYearDropdown").val("")
  } else { // Else make it optional
    document.getElementById("selectedYearCloseBtn").hidden = false
    document.getElementById("selectYearModal").removeAttribute('data-bs-backdrop');
    $("#selectedYearDropdown").val(GLOBAL_USER_OBJ["yearGroup"])
  }
  $("#selectYearModal").modal('show')
}

async function onYearSelectConfirm(){
  var newYearGroup = document.getElementById("selectedYearDropdown").value
  console.log(newYearGroup)
  //No value selected
  if (newYearGroup == ''){ 
    console.log("Please Select your year group")
    return
  }
  //Change the year group if the value is different
  if (GLOBAL_USER_OBJ["yearGroup"] != newYearGroup) {
    var response = await fetchPostWrapper("/assignYearGroup", {'newYearGroup': newYearGroup})
    if (response){
      GLOBAL_USER_OBJ["yearGroup"] = newYearGroup
      showAlert('success','Successfully updated year group')
      updateWithNewYear()
    } else {
      console.log("An error occurred")
      showAlert('danger','Failed to update year group')
      return 
    }
  }
  $("#selectYearModal").modal('hide')
}

// Updating email opt in status

async function onEmailSettingsUpdate(){
  var emailToggle = document.getElementById("receiveEmailsToggle")
  var response = await fetchPostWrapper("/updateEmail", {'newEmailState': emailToggle.checked})
  if (response){
    showAlert('success',emailToggle.checked ? 'You can now receive CAS opportunity emails' : 'You will not receive any more CAS opportunity emails')
  } else {
    emailToggle.checked = false
    showAlert('danger','Failed to update email state')
  }
}




// ------------------------------------------

// -- Function called on initial page load --
async function initPageOnLoad(){
  //Initalize the non default Bootstrap elements
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

  //Main page
  GLOBAL_USER_OBJ = await getUserObj()
  GLOBAL_PROJECT_SET = new ProjectSet(GLOBAL_USER_OBJ["accessLevel"])
  onLoadValidators()

  switch (GLOBAL_USER_OBJ["accessLevel"]){
    case 'admin':
      console.log('Show admin page')
      document.getElementById("admin-nav-link").hidden = false
    default: // Ie: student or other
      document.getElementById("admin-nav-link").hidden = true
      if (!GLOBAL_ALLOWED_YEARS.includes(GLOBAL_USER_OBJ["yearGroup"])) {
        showYearSelectPopup()
      } else {
        updateWithNewYear()
      }
  }


  



}

// Load the page
window.onload = initPageOnLoad