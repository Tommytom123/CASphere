//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
const actionMessages = {
    success:{
        pin: null,
        unpin: null,
        delete: 'Success',
        sendEmails: 'Emails sent'
    },
    error :{
        delete: 'There was an error',
        sendEmails: 'Error sending emails'
    }
}

/*
Project logic

All projects received go into a SET (Avoids duplicate objects, and allows tables/cards to act as pointers and live update all occurrences)
*/


/*
Eg project obj
description: "Test project"
endDate: "2018-07-25 00:00:00"
id: 29​
location: "In School"
maxParticipants: 8
ownerEmail: "huisdeveloper0@gmail.com"
ownerName: "Tom Brouwers"
ownerYear: "Y10"
startDate: "2018-07-22 00:00:00"
strand: "Activity"
title: "Proj New"
uploadedDate: "2024-09-02 12:16:57"
years: null,

pinned: true,
joined: true,
approved: true,
*/

// All the projects in the program
class ProjectSet{ // Not technically a set, really a separate object which stores all the projects, but mainly ensures that they aren't stored as duplicates
    constructor(accessLevel) {
        this.projectSet = {} // projectID : Project Object (Removes duplicates, thus acting as a set, whilst still being accessible based on a key)
        this.deletedProjectsStack = []
        this.admin = (accessLevel == 'admin')

        //Initializing the main display
        this.projectScroll = new ProjectScrollDisplay(this, 'projectScrollContainer', 'projSearchFrom')

        //Initializing the sidebar tables
        this.ownedProjectsTable = new ProjectsOwnedTable(this, 'ownedProjectsTable')
        this.joinedProjectsTable = new ProjectsJoinedTable(this, 'joinedProjectsTable')

        this.updateUndoDeleteBtn()
    }

    addProject(project){    
        if (project.id in this.projectSet){
            return this.projectSet[project.id]
        }else{
            this.projectSet[project.id] = new Project(this, project, this.admin)
            return this.projectSet[project.id]
        }
    }

    updateAllProjects(){ // Every 15 seconds sends a request to update all projects with their core "updatable details" eg. the number of participants so we don't get too many participants
        if (this.projectSet.length > 0) {
            var fieldsToUpdate = [""]
            var responseJson = fetchPostWrapper("/",{
                "fieldsToUpdate": fieldsToUpdate,
                "projectIdsToUpdate": Object.keys(this.projectSet)
            })
            /*
            responseJson = {
                updatedProjects: {
                    1:{
                        FIELD: value,
                        field: value
                    }
                }
            }
            */
            Object.keys(responseJson.updatedProjects).forEach((projectKey) => {
                Object.keys(responseJson.updatedProjects[projectKey]).forEach((field)=>{ // Update the old values with the new
                    this.projectSet[projectKey].projectDetails[field] = responseJson.updatedProjects[projectKey][field]
                })
                this.projectSet[projectKey].updateAllProjectInstances() // Refresh all the respective views
            })
        }
    }

    async undoDelete(){
        console.log("Undoing delete")
        var project = this.projectSet[this.deletedProjectsStack.pop()]
        var response = await project.projectAction('unDelete')
        if (response){
            showAlert('success', `Undid delete of: ${project.projectDetails.title}`)
        } else {
            showAlert('danger', `Failed to undo delete of: ${project.projectDetails.title}`)
            this.deletedProjectsStack.push(project.projectDetails.id)
        }
        this.updateUndoDeleteBtn()
    }

    updateUndoDeleteBtn(){
        var undoDeleteBtn = document.getElementById("undoDeleteBtn")
        if (this.deletedProjectsStack.length == 0){
            undoDeleteBtn.hidden = true               
        } else {
            undoDeleteBtn.hidden = false
        }
    }

}

// A single project item
class ProjectCardVisualization{ // The same project can be shown in multiple locations at once, but we want them to be linked together.
    constructor(baseProjectObj){
        this.baseProjectObj = baseProjectObj

        // Initializing core HTML
        this.projectDiv = document.createElement('div');

        this.projectDiv.classList.add("card", "project-card", "mt-2", "mb-2", this.baseProjectObj.projectDetails.strand.toLowerCase())
        var joinOrApproveDelBtn = this.baseProjectObj.parentSet.admin ? `
            <div class="d-flex justify-content-between"> 
                <button type="button" class="btn btn-danger ms-2 proj-admin-btn proj-delete-btn">Delete</button> 
                <button type="button" class="btn btn-primary me-2 proj-admin-btn proj-approve-btn">Approve</button>
            </div>
        ` : `
            <button type="button" class="btn btn-primary w-100 proj-join-btn">Join Project</button>
            `

        this.projectDiv.innerHTML = `
            <div class="card-body container">
                <div class="row">
                <div class="col-8">
                    <h5 class="card-title">
                    <div class="d-flex project-heading mb-1">
                        <i class="fa-solid fa-circle-check proj-approved-icon me-3" ${this.baseProjectObj.projectDetails.approved ? "hidden" : ""}></i>
                        <span class="">${this.baseProjectObj.projectDetails.title}</span>

                        <i class="fa-solid ms-auto fa-thumbtack proj-pin-btn"></i>
                        ${this.baseProjectObj.parentSet.admin ? `<i class="fa-solid  px-2 ${this.baseProjectObj.projectDetails.emailSent ? 'fa-envelope-circle-check' : 'fa-envelope'} proj-email-btn"></i>` : ''}
                    </div>
                    
                    <hr class="proj-line-break">
                    <div class="d-flex justify-content-start project-subheading mt-1">
                        <h6 class="student-name">${this.baseProjectObj.projectDetails.ownerName}</h6>
                        <h6 class="mx-2">-</h6>
                        <h6 class="student-year">${this.baseProjectObj.projectDetails.ownerYear}</h6>
                        <h6 class="mx-2">-</h6>
                        <h6 class="student-email">${this.baseProjectObj.projectDetails.ownerEmail}</h6>
                    </div>
                    </h5>
                    <div class="proj-card-left-content">
                        <p class="card-text ">
                        ${this.baseProjectObj.projectDetails.description}
                        </p>
                        
                        <div class="proj-card-left-footer">

                            <div class="d-flex mb-3 project-subheading">
                                <div class="p-2 proj-bottom-info-txt">Spots available: ${this.baseProjectObj.projectDetails.maxParticipants-this.baseProjectObj.projectDetails.participantCount} | ${this.baseProjectObj.projectDetails.maxParticipants} Total Spots | For years: ${formatArrayToStr(this.baseProjectObj.projectDetails.years, true)}</div>
                                <div class="ms-auto p-2">Created: ${this.baseProjectObj.projectDetails.uploadedDate.split(' ')[0]}</div>

                            </div>
                            <div class="progress mb-3" role="progressbar" aria-label="Participant Count Bar" aria-valuemin="0" aria-valuemax="100">
                                <div class="progress-bar progress-bar-striped progress-bar-animated project-member-bar" ></div>
                            </div>
                            <h6 >
                            
                            </h6>
                        </div>
                    </div>    
                </div>
                <div class="col-4">
                    <img class="border border-dark-subtle rounded mb-1" src="/_general_static/static/uploads/img/projects/${this.baseProjectObj.projectDetails.img}" width="100%" height="120px">
                    <div class="d-flex mb-2">
                        <div class="project-subheading" style="min-width: 120px;">
                            <p>
                                Start date: ${this.baseProjectObj.projectDetails.startDate.split(' ')[0]} <br>
                                End date: ${this.baseProjectObj.projectDetails.endDate.split(' ')[0]}
                            </p>
                        </div>
                        <div class="ms-3 d-flex project-location-row">
                            <i class="fa-regular fa-map mt-2 project-location-map" style="font-size: 25px;"></i>
                            <h6 class="ms-2 me-4 mt-1">${this.baseProjectObj.projectDetails.location}</h6>
                            
                        </div>
                    </div>
                    ${joinOrApproveDelBtn}
                </div>
                </div>
            </div>
            `
            // Setting up specific pointers to important elements in ^ html\
            this.projPinBtn = this.projectDiv.getElementsByClassName(`proj-pin-btn`)[0]
            this.projDeleteBtn = this.projectDiv.getElementsByClassName(`proj-delete-btn`)[0]
            this.projApproveBtn = this.projectDiv.getElementsByClassName(`proj-approve-btn`)[0]
            this.projJoinBtn = this.projectDiv.getElementsByClassName(`proj-join-btn`)[0]
            this.projApprovedIcon = this.projectDiv.getElementsByClassName(`proj-approved-icon`)[0]
            this.projectMemberBar = this.projectDiv.getElementsByClassName("project-member-bar")[0]
            this.projBottomInfoTxt = this.projectDiv.getElementsByClassName("proj-bottom-info-txt")[0]
            this.emailProjectsBtn = this.projectDiv.getElementsByClassName("proj-email-btn")[0]

            // Setting up eventlistners
            this.projPinBtn.addEventListener("click", ()=>{
                this.baseProjectObj.projectAction(this.baseProjectObj.projectDetails.pinned ? 'unpin' : 'pin') // Has a {key:value pair of the new value for  this.projectDetails}
            })
            
            this.emailProjectsBtn.addEventListener("click", async ()=>{
                if (this.baseProjectObj.projectDetails.emailSent != true){
                    var response = await this.baseProjectObj.projectAction("sendEmails")
                    if (response) {
                        this.emailProjectsBtn.classList.remove('fa-envelope')
                        this.emailProjectsBtn.classList.add('fa-envelope-circle-check')
                    }
                }
            })

            if (this.baseProjectObj.parentSet.admin){
                this.projApproveBtn.addEventListener("click", ()=>{
                    console.log('approve')
                    this.baseProjectObj.projectAction(this.baseProjectObj.projectDetails.approved == true ? 'unapprove' : 'approve')
                    })
                this.projDeleteBtn.addEventListener("click", async()=>{
                    var response = await this.baseProjectObj.projectAction('delete')
                    if (response) {
                        this.baseProjectObj.parentSet.deletedProjectsStack.push(this.baseProjectObj.projectDetails.id)
                        this.baseProjectObj.parentSet.updateUndoDeleteBtn()
                    }
                })
            }else{
                this.projJoinBtn.addEventListener("click", ()=>{
                    this.baseProjectObj.projectAction(this.baseProjectObj.projectDetails.joined ? 'leave' : 'join')
                })
            }
            this.updateInstance()
    }

    updateInstance() { // Updates card based on the baseProjectObj details (Which is shared between all visualizations). This only updates the VISUAL ELEMENTS -> Not if it should be appended/removed from other tables
        // Instances that show for both student/admin
        this.projectMemberBar.setAttribute('style',`width: ${Math.floor((this.baseProjectObj.projectDetails.participantCount*100)/this.baseProjectObj.projectDetails.maxParticipants)}%`);
        this.projBottomInfoTxt.innerHTML = `Spots available: ${this.baseProjectObj.projectDetails.maxParticipants-this.baseProjectObj.projectDetails.participantCount}/${this.baseProjectObj.projectDetails.maxParticipants} | For years: ${formatArrayToStr(this.baseProjectObj.projectDetails.years, true)}`
        
        if (this.baseProjectObj.projectDetails.deleted){
            this.projectDiv.hidden = true
        } else {
            this.projectDiv.hidden = false
        }

        if (this.baseProjectObj.projectDetails.pinned){ // Pinned
            this.projPinBtn.classList.add('selected')
        } else {
            this.projPinBtn.classList.remove('selected')
        }
        
        if (this.baseProjectObj.projectDetails.approved){
            this.projApprovedIcon.hidden = false
        } else {
            this.projApprovedIcon.hidden = true
        }
        // Seperate instances specifically per user view
        if (this.baseProjectObj.parentSet.admin){ // Admin view

        } else { // Student view
            if (this.baseProjectObj.projectDetails.joined){ //project joined
                this.projJoinBtn.classList.remove('btn-primary')
                this.projJoinBtn.classList.add('btn-danger')
                this.projJoinBtn.innerHTML = 'LEAVE'

            } else {
                if (this.baseProjectObj.projectDetails.maxParticipants-this.baseProjectObj.projectDetails.participantCount == 0){ //Project must be full and not joined
                    this.projJoinBtn.innerHTML = "FULL"
                    this.projJoinBtn.disabled = true
                } else{ //project just joined
                    this.projJoinBtn.classList.add('btn-primary')
                    this.projJoinBtn.classList.remove('btn-danger')
                    this.projJoinBtn.innerHTML = 'JOIN'
                    this.projJoinBtn.disabled = false
                }

            }
        }
    }

    loadHTML(){// Update card states then returns the div
        this.updateInstance()
        return this.projectDiv
    }
    
    removeFromPage() {
        this.projectDiv.remove()
    }

    delete(){
        this.projectDiv.remove()
        delete this.projectDiv
        delete this
    }
}

class ProjectTableRowVisualization{ // The same project can be shown in multiple locations at once, but we want them to be linked together.
    constructor(baseProjectObj){
        this.baseProjectObj = baseProjectObj

        // Initializing core HTML
        this.rowElement = document.createElement('tr');
        this.rowElement.innerHTML = `<td class="col1">${this.baseProjectObj.projectDetails.title}</td>
                                        <td class="col2">${formatDateTimeToDate(this.baseProjectObj.projectDetails.startDate)}</td>
                                        <td class="col3"><a class="show-project-modal-li">Info</a></td>`

        this.rowElement.getElementsByClassName(`show-project-modal-li`)[0].addEventListener("click", ()=>{
            $("#showProjectModal").modal('show');
            $("#showProjectModalBody").empty().append(this.baseProjectObj.getCardDiv('showProjectModalBody')) 
        }) //formatDateTimeToDate(this.baseProjectObj.projectDetails.startDate)

    }

    updateInstance(){ // Currently does nothing, but is here if a feature gets added which requires this to be updated upon its instance changing
        return null
    }

    loadHTML(){
        return this.rowElement
    }
    
    removeFromPage() {
        this.rowElement.remove()
    }

    delete(){
        this.rowElement.remove()
        delete this.rowElement
        delete this
    }
}

class Project {
    constructor(parentSet, projectDetailsJson){
        this.parentSet = parentSet
        this.projectDetails = projectDetailsJson
        this.activeVisualizations = {} // Dictionary of all the visualizations. Its key is referencing to the container the project is displayed in (Since in the individual container there cant be any duplicate elements)
    }

    // Visualization based functions
    getCardDiv(id){
        if (id in this.activeVisualizations){ // visuali
            return this.activeVisualizations[id].projectDiv
        }else{ // Visualization doesn't already exist -> create it, and return div
            this.activeVisualizations[id] = new ProjectCardVisualization(this)
            return this.activeVisualizations[id].loadHTML()
        }
    }

    getTableElement(id){
        if (id in this.activeVisualizations){ // visuali
            return this.activeVisualizations[id].rowElement
        }else{ // Visualization doesn't already exist -> create it, and return div
            this.activeVisualizations[id] = new ProjectTableRowVisualization(this)
            return this.activeVisualizations[id].loadHTML()
        }
    }

    removeVisualization(id){
        this.activeVisualizations[id].delete()
        delete this.activeVisualizations[id]
    }

    updateAllProjectInstances(){
        if (this.projectDetails.joined == true){
            this.parentSet.joinedProjectsTable.addToTable(this)
        } else {
            this.parentSet.joinedProjectsTable.removeFromTable(this)
        } 

        // Update its visual elements
        Object.values(this.activeVisualizations).forEach((visualizationObj)=>{
            visualizationObj.updateInstance()
        })
    }

    // Core events
    async projectAction(action){
        var responseJson = await fetchPostWrapper('/projectAction', {
            action: action, 
            projectId: this.projectDetails.id
        })
        // If an error, the responseJson will be an error int. Else it will be an key/value pair with the new values
        console.log(responseJson)
        if (responseJson){ 
            Object.keys(responseJson).forEach((key)=>{ // Update the old values with the new
                this.projectDetails[key] = responseJson[key]
            })
            this.updateAllProjectInstances()
            var responseMsg = actionMessages.success[action]
            if (responseMsg) { // Not null or undefined/ it exists
                showAlert('success', responseMsg)
            }
            return true
        }
        var responseMsg = actionMessages.error[action]
        if (responseMsg) { // Not null or undefined/ it exists
            showAlert('danger', responseMsg)
        }
        return false
    }
    
}

// "Extensions" from ProjectSet. Not really extensions, but take core projectSet data
class ProjectScrollDisplay{
    constructor(projectSet, containerId, searchFormId){
        this.projectSet = projectSet  // Since the project set is passed as an object, it works as a pointer to the projectSet object. Any changes made will thus reflect in the original object instance
        this.loadedProjectIds = new Set() // This is an array of the project keys (referencing projectSet) which are loaded to show for this specific display
        this.containerId = containerId
        this.searchForm = document.getElementById(searchFormId)
        
        this.scrollDiv = document.createElement('div');
        this.scrollDiv.id = "projectsScrollBody"
        this.scrollDiv.classList.add("d-flex","flex-column","align-items-center")

        this.scrollDivTerminatorDiv = document.createElement('div');
        this.scrollDivTerminatorDiv.id = "ProjectsScrollTerminator"
        this.scrollDivTerminatorDiv.classList.add("d-flex","flex-column","align-items-center")
        this.loadScrollDivTerminator()

        $(`#${this.containerId}`).append(this.scrollDiv)
        $(`#${this.containerId}`).append(this.scrollDivTerminatorDiv)

        // Initialize searching form
        this.searchForm.reset() //reset and clear all values

        var searchBtn = this.searchForm.querySelector('button[type=submit]');
        console.log(searchBtn)
        searchBtn.addEventListener("click",(event)=>{
            this.onSearch() // Since run in an arrow function, this does not reference to the element which is clicked, instead the object            //event.preventDefault()
            event.preventDefault()
        })

        //Scrolling logic
        this.prevLowestScrollPos = 0 //Based on scrollTop
        this.scrollToTopBtnShown = false
        $("#scrollToTopBtn").hide()

        $(`#${this.containerId}`).on("scroll", async (event) => {
            // Pixels to scroll till bottom of page
            var scrollBottom = event.currentTarget.scrollHeight - event.currentTarget.clientHeight - event.currentTarget.scrollTop
            this.prevLowestScrollPos = event.currentTarget.scrollTop > this.prevLowestScrollPos ? event.currentTarget.scrollTop : this.prevLowestScrollPos
            if (this.scrollToTopBtnShown == false && (this.prevLowestScrollPos - event.currentTarget.scrollTop > 1000)){ // User significantly scrolling up, display scroll back to top btn
                this.toggleScrollToTopBtn()
            } else if(this.scrollToTopBtnShown == true && (this.prevLowestScrollPos - event.currentTarget.scrollTop < 700)){
                this.toggleScrollToTopBtn()
            } else if(this.scrollToTopBtnShown == true && event.currentTarget.scrollTop < 500){ // If close to top, don't show scroll btn
                this.toggleScrollToTopBtn()
            }

            if (scrollBottom < 200) { // The placeholder loading proj is in view and thus new projects must be added to the stack
                await this.fetchNewProjects()
            }
        });

        $("#scrollToTopBtn").on("click", (event)=>{
            this.scrollToTop()
        })
        
        
        // Load the first batch of objects
        this.readyToLoadProjects = true
        //this.fetchNewProjects()
    }

    toggleScrollToTopBtn(){
        this.scrollToTopBtnShown = !this.scrollToTopBtnShown //Toggle var
        if (this.scrollToTopBtnShown){
            $("#scrollToTopBtn").show()
            $("#scrollToTopBtn").animate({opacity: 0.78}, 500)
        } else {
            $("#scrollToTopBtn").animate({opacity: 0}, 500, ()=>{
                $("#scrollToTopBtn").hide()
            })
            
        }
    }

    scrollToTop() {
        $("#scrollDivContainer").animate({scrollTop:0}, 500, ()=>{
            this.prevLowestScrollPos = 0
            this.toggleScrollToTopBtn()
        }) // https://api.jquery.com/animate/
        
    }

    loadScrollDivTerminator(type) {
        switch (type){
            case "ERROR":
                this.scrollDivTerminatorDiv.innerHTML = `INTERNAL SERVER ERROR`
                break
            case "allRead":
                this.scrollDivTerminatorDiv.innerHTML = `
                <div class="d-flex justify-content-center text-center mt-3 mb-5">
                    All Projects loaded
                </div>
                `
                break
            case "noneRead":
                this.scrollDivTerminatorDiv.innerHTML = `
                <div class="d-flex justify-content-center text-center mt-3 mb-5">
                    No projects match the search criteria
                </div>
                `
                break
            default:
                this.scrollDivTerminatorDiv.innerHTML = `
                <div class="d-flex justify-content-center my-4">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                `
        }
    }

    clearAllProjects(){ // Removes all objects in this display, and 
        this.loadedProjectIds.forEach((projId) =>{
            this.projectSet.projectSet[projId].removeVisualization(this.containerId)     
        })
        this.loadedProjectIds.clear()
        $("#scrollToTopBtn").hide()
        this.readyToLoadProjects = true
    }
    
    async fetchNewProjects(){
        if (this.readyToLoadProjects){
            this.readyToLoadProjects = false
            
            var params = {
                "after": this.loadedProjectIds.size,
                "yearGroup": GLOBAL_USER_OBJ.yearGroup
            }
            Object.assign(params, this.getSearchFormValues())
            var responseObj = await fetchPostWrapper("/getProjects", params)
            console.log(responseObj)
            if (errorStatusList.includes(responseObj)){
                this.allProjectsRead = true
                this.loadScrollDivTerminator("ERROR")
                return
            } else if  (responseObj.projects.length == 0 && this.loadedProjectIds.size == 0) {
                this.allProjectsRead = true
                this.loadScrollDivTerminator("noneRead")
            } else if (responseObj.projects.length < 8 ){ // All projects have been read. This value is < the max value set serverside, or what is to be passed as the "limit": val in `params`
                this.allProjectsRead = true
                this.loadScrollDivTerminator("allRead")
            }
            responseObj.projects.forEach((project) => {
                this.loadedProjectIds.add(project.id)
                var projObj = this.projectSet.addProject(project) // Adds new entry to key/value mapping if doesn't exist - otherwise overwrites old one
                this.scrollDiv.append(projObj.getCardDiv(this.containerId))
            })

            this.readyToLoadProjects = true
            
        }
    }

    onSearch(){
        this.clearAllProjects()
        //console.log(this.searchForm.querySelector('input[name="searchPinnedCheckbox"]').checked)
        this.fetchNewProjects()
    }

    getSearchFormValues(){
        return {
            "searchTerm": this.searchForm.querySelector('input[name="searchProjectTitle"]').value,
            "afterDate": undefined, //searchForm.querySelector('button[type=submit]'),
            "beforeDate": undefined, //searchForm.querySelector('button[type=submit]'),
            "onlyApproved": this.searchForm.querySelector('input[name="searchApprovedCheckbox"]').checked,
            "onlyPinned": this.searchForm.querySelector('input[name="searchPinnedCheckbox"]').checked
        }
    }
}


class ProjectTable{
    constructor(projectSet, tableContainerId){
        this.projectSet = projectSet  // Since the project set is passed as an object, it works as a pointer to the projectSet object. Any changes made will thus reflect in the original object instance
        this.tableContainerId = tableContainerId
        this.tableContainer = document.getElementById(tableContainerId)
    }


    // Recursive func which returns the child element which the new element needs to be inserted BEFORE (null if inserted at end of element) based upon the sorting columns. Multiple columns can be passed in array of idx
    // Range is a 2 long array with the start and end indexes of which children to sort between. Used by the recursive call for the next column to search upon
    getSortedInsertLoc(elementToInsert, columnIdx, range = undefined){ 
        //Checking range is correct type and setting default val
        if (range == undefined) {range = [0, this.tableContainer.children.length]}
        if (range[0] < 0) {range[0] = 0}
        if (range[1] >= this.tableContainer.children.length) {range[1] = this.tableContainer.children.length}

        var sameValStartIdx = null

        // Insert Before item that is greater than it (In respective col)
        for (var i = range[0]; i < range[1]; i++){
            // Depending if there needs to be a second sort upon another column, we store the range idx for when the column has the same val
            if (isGreaterThan(this.tableContainer.children[i].children[columnIdx[0]].innerHTML, elementToInsert.children[columnIdx[0]].innerHTML)){
                if (columnIdx.length == 1){ // No other column to sort upon
                    return this.tableContainer.children[i]
                } else{
                    if (sameValStartIdx != null){
                        columnIdx.shift()
                        return this.getSortedInsertLoc(elementToInsert, columnIdx, [sameValStartIdx, i])
                    } else {
                        return this.tableContainer.children[i]
                    }
                } 
            }
            if (this.tableContainer.children[i].children[columnIdx[0]].innerHTML == elementToInsert.children[columnIdx[0]].innerHTML && sameValStartIdx == null){sameValStartIdx = i}
        }
        if (columnIdx.length == 1){
            return this.tableContainer.children[range[1]]
        } else if (sameValStartIdx != null){
            columnIdx.shift()
            return this.getSortedInsertLoc(elementToInsert, columnIdx, [sameValStartIdx, range[1]])
        } else {
            return this.tableContainer.children[range[1]] === undefined ? null : this.tableContainer.children[range[1]]
        }
    }

    addToTable(projObj, columnSortIdx = [1,0]){ // ColumnSortIdx is a queue
        var tableElement = projObj.getTableElement(this.tableContainerId)
        // Find where to place the new element (Since the table is sorted by date)
        var insertBeforeElement = this.getSortedInsertLoc(tableElement, columnSortIdx)

        this.tableContainer.insertBefore(tableElement, insertBeforeElement)
    }

    removeFromTable(projObj){
        var tableElement = projObj.getTableElement(this.tableContainerId)
        tableElement.remove()
    }
}

// Extensions from projectTable

class ProjectsOwnedTable extends ProjectTable{
    constructor(projectSet,containerId){
        super(projectSet,containerId)
        this.fetchAllOwnedProjects()
    }

    async fetchAllOwnedProjects(){
        var params = {
        }
        var responseObj = await fetchPostWrapper("/getUserOwnedProjects", params)
        console.log(responseObj)
        responseObj.projects.forEach((project) => {
            var projObj = this.projectSet.addProject(project)
            this.addToTable(projObj)  
        })
        //}
        
    }
}

class ProjectsJoinedTable extends ProjectTable{
    constructor(projectSet,containerId){
        super(projectSet,containerId)
        this.fetchAllJoinedProjects()
    }

    async fetchAllJoinedProjects(){
        var params = {
        }
        var responseObj = await fetchPostWrapper("/getUserJoinedProjects", params)
        console.log(responseObj)
        responseObj.projects.forEach((project) => {
            var projObj = this.projectSet.addProject(project)
            this.addToTable(projObj)    
        })
    }
}
