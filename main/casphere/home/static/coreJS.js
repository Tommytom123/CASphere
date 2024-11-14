// Initiializing global variables

// Config options
const globalAllowedYearGroups = ["Y9","Y10","Y11","Y12","Y13"]
const errorStatusList = [500,401]

// General global variables used
var globalUserObj = {}
var GLOBAL_PROJECT_SET = {}

// HELPER FUNCTIONS

async function fetchPostWrapper(path, body = {}){
    var response = await fetch(path, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
      });
    if (errorStatusList.includes(response.status)){
      return response.status
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

function loadYearGroup(){
  $("#dropDownYearGroup").html(`Year: ${globalUserObj["yearGroup"]}`)
}

function showYearSelectPopup(){
  if (!globalAllowedYearGroups.includes(globalUserObj["yearGroup"])){ // If the user has not already selected a yeargroup force the selection
    document.getElementById("selectedYearCloseBtn").hidden = true
    document.getElementById("selectYearModal").setAttribute('data-bs-backdrop','static');
    $("#selectedYearDropdown").val("")
  } else { // Else make it optional
    document.getElementById("selectedYearCloseBtn").hidden = false
    document.getElementById("selectYearModal").removeAttribute('data-bs-backdrop');
    $("#selectedYearDropdown").val(globalUserObj["yearGroup"])
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
  if (globalUserObj["yearGroup"] != newYearGroup) {
    var response = await fetchPostWrapper("/assignYearGroup", {'newYearGroup': newYearGroup})
    if (response){
      globalUserObj["yearGroup"] = newYearGroup
      GLOBAL_PROJECT_SET.projectScroll.onSearch()
      loadYearGroup()
    } else {
      console.log("An error occurred")
      return 
    }
  }
  $("#selectYearModal").modal('hide')
}

async function loadSidebar(){
  /*
  // [[html tableID, endpoint], []...
  [["#ownedProjectsTable","/getUserOwnedProjects"],["#joinedProjectsTable", "/getUserJoinedProjects"]].forEach(async (sidebar)=>{
    var responseObj = await fetchPostWrapper(sidebar[1])
    if (errorStatusList.includes(responseObj)){
      $(sidebar[0]).html = `<tr>INTERNAL SERVER ERROR<tr>`
        allProjectsRead = true
        return
    } if (responseObj.projects.length == 0){ // All projects have been read
      $(sidebar[0]).html = `<tr>No owned Projects<tr>`
    } else {
        responseObj.projects.forEach((project, idx) => {
            let proj = new Project(project)
            $(sidebar[0]).append(proj.loadTableHTML(this.admin))
        })
    }  
  })
  */
}


// ------------------------------------------

// -- Function called on initial page load --
async function initPageOnLoad(){
  
  globalUserObj = await getUserObj()
  if (globalUserObj["accessLevel"] == "student" && !globalAllowedYearGroups.includes(globalUserObj["yearGroup"])){ // Not required to assign yeargroup to admin
    showYearSelectPopup()
  } else {
    loadYearGroup()
  }

  onLoadValidators()

  switch (globalUserObj["accessLevel"]){
    case 'admin':
      console.log('Show admin page')
      document.getElementById("admin-nav-link").hidden = false
    default: // Ie: student or other
      document.getElementById("admin-nav-link").hidden = true
  }


  GLOBAL_PROJECT_SET = new ProjectSet(globalUserObj["accessLevel"])



}

// Load the page
window.onload = initPageOnLoad