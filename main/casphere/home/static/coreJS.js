// Initiializing global variables

// Config options
const globalAllowedYearGroups = ["Y9","Y10","Y11","Y12","Y13"]
const errorStatusList = [500,401]

// General global variables used
var globalUserObj = {}
var globalProjectStack = null


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

  switch (globalUserObj["accessLvel"]){
    case 'admin':
      console.log('Show admin page')
    default: // Ie: student or other
  }

  /*
  // Getting projects
  loadSidebar()
  globalProjectStack = new ProjectStack(globalUserObj["accessLevel"])
  globalProjectStack.fetchNewProjects()
  */
  const mainProjectSet = new ProjectSet(globalUserObj["accessLvel"])
  const projectScroll = new ProjectScrollDisplay(mainProjectSet, 'projectScrollContainer')
  
  const ownedProjectsTable = new ProjectsOwnedTable(mainProjectSet, 'ownedProjectsTable')
  const joinedProjectsTable = new ProjectsJoinedTable(mainProjectSet, 'joinedProjectsTable')


}

// Load the page
window.onload = initPageOnLoad