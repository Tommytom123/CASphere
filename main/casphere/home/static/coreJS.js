// Initiializing global variables

// Config options
const globalAllowedYearGroups = ["Y9","Y10","Y11","Y12","Y13"]
const errorStatusList = [500,401]

// General global variables used
var globalUserObj = {}
var globalProjectStack = null

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
  
async function getCoreValues(){
  //globalAllowedYearGroups // Is possible to get these values from a server call, but less resource intensive to hardcode -> INLINE WITH THE ALLOWED_YEAR_GROUPS serverside var
}

async function getUserObj(){
  return await fetchPostWrapper("/getUserObj")
}

// 

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

// ------------------------------------------

// -- Function called on initial page load --
async function initPageOnLoad(){
  
  globalUserObj = await getUserObj()
  if (globalUserObj["accessLevel"] == "student" && !globalAllowedYearGroups.includes(globalUserObj["yearGroup"])){ // Not required to assign yeargroup to admin
    showYearSelectPopup()
  } else {
    loadYearGroup()
  }
  getCoreValues()
  onLoadValidators()
  globalProjectStack = new ProjectStack(globalUserObj["accessLevel"])
  globalProjectStack.fetchNewProjects()
}


window.onload = initPageOnLoad