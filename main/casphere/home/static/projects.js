//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes
const actionMessages = {
    success:{
        pin: null,
        unpin: null,
    },
    error :{

    }
}

/*
Project logic

All projects recieved go into a SET (Avoids duplicate objects, and allows tables/cards to act as pointers and live update all occurrences)
*/


/*
Eg project obj
description: "Test project"
endDate: "2018-07-25 00:00:00"
id: 29​
location: "inSchool"
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
        this.admin = (accessLevel == 'admin')

        //Initializing the main display
        this.projectScroll = new ProjectScrollDisplay(this, 'projectScrollContainer', 'searchProjectsButton')

        //Initializing the sidebar tables
        this.ownedProjectsTable = new ProjectsOwnedTable(this, 'ownedProjectsTable')
        this.joinedProjectsTable = new ProjectsJoinedTable(this, 'joinedProjectsTable')
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
}

// A single project item
class ProjectCardVisualization{ // The same project can be shown in multiple locations at once, but we want them to be linked together.
    constructor(baseProjectObj){
        this.baseProjectObj = baseProjectObj

        // Initializing core HTML
        this.projectDiv = document.createElement('div');

        this.projectDiv.classList.add("card", "project-card", "mt-2", "mb-2", this.baseProjectObj.projectDetails.strand.toLowerCase())
        var joinOrApproveDelBtn = this.baseProjectObj.showAsAdmin ? '<div class="d-flex justify-content-between"> <button type="button" class="btn btn-danger ms-2 proj-admin-btn proj-delete-btn">Delete</button> <button type="button" class="btn btn-primary me-2 proj-admin-btn proj-approve-btn">Approve</button></div>' : '<button type="button" class="btn btn-primary w-100 proj-join-btn">Join Project</button>'
        
        this.projectDiv.innerHTML = `
            <div class="card-body container">
                <div class="row">
                <div class="col-8">
                    <h5 class="card-title">
                    <div class="d-flex justify-content-between project-heading mb-1">
                        <span class="">${this.baseProjectObj.projectDetails.title}</span>
                        <i class="fa-solid fa-thumbtack proj-pin-btn"></i>
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
                        <h6 class="proj-card-left-footer">
                        Created: ${this.baseProjectObj.projectDetails.uploadedDate}
                        </h6>
                    </div>    
                </div>
                <div class="col-4">
                    <img class="border border-dark-subtle rounded mb-1" src="https://ralfvanveen.com/wp-content/uploads/2021/06/Placeholder-_-Begrippenlijst.svg" width="100%" height="120px">
                    <p>
                        Start date: ${this.baseProjectObj.projectDetails.startDate} <br>
                        End date: ${this.baseProjectObj.projectDetails.endDate}
                    </p>
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


            // Setting up eventlistners
            this.projPinBtn.addEventListener("click", ()=>{
                this.baseProjectObj.projectAction(this.baseProjectObj.projectDetails.pinned ? 'unpin' : 'pin') // Has a {key:value pair of the new value for  this.projectDetails}
            })
            
            if (this.showAsAdmin){
                this.projApproveBtn.addEventListener("click", ()=>{console.log(`Approve: ${this.baseProjectObj.projectDetails.title}, ${this.projectDetails.id}`)})
                this.projDeleteBtn.addEventListener("click", ()=>{console.log(`delete: ${this.baseProjectObj.projectDetails.title}, ${this.projectDetails.id}`)})
            }else{
                this.projJoinBtn.addEventListener("click", ()=>{
                    this.baseProjectObj.projectAction(this.baseProjectObj.projectDetails.joined ? 'leave' : 'join')
                })
            }
    }

    updateInstance() { // Updates card based on the baseProjectObj details (Which is shared between all visualizations). This only updates the VISUAL ELEMENTS -> Not if it should be appended/removed from other tables
        if (this.baseProjectObj.projectDetails.pinned){ // Pinned
            this.projPinBtn.classList.add('selected')
        } else {
            this.projPinBtn.classList.remove('selected')
        }
        if (this.baseProjectObj.showAsAdmin){ // Admin

        } else { // Student
            if (this.baseProjectObj.projectDetails.joined){
                this.projJoinBtn.classList.remove('btn-primary')
                this.projJoinBtn.classList.add('btn-danger')
                this.projJoinBtn.innerHTML = 'LEAVE'


            } else {
                this.projJoinBtn.classList.add('btn-primary')
                this.projJoinBtn.classList.remove('btn-danger')
                this.projJoinBtn.innerHTML = 'JOIN'

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
    constructor(parentSet, projectDetailsJson, admin = false){
        this.parentSet = parentSet
        this.projectDetails = projectDetailsJson
        this.showAsAdmin = admin
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
        if (!errorStatusList.includes(responseJson)){ 
            Object.keys(responseJson).forEach((key)=>{ // Update the old values with the new
                this.projectDetails[key] = responseJson[key]
            })
            this.updateAllProjectInstances()
            var responseMsg = responseJson.success ? actionMessages.success[action] : actionMessages.error[action]
            if (responseMsg) { // Not null or undefined/ it exists
                showAlert(responseJson.success? '': '', responseMsg)
            }
        }
    }
    
}

// "Extensions" from ProjectSet. Not really extensions, but take core projectSet data
class ProjectScrollDisplay{
    constructor(projectSet, containerId, searchBtnId){
        this.projectSet = projectSet  // Since the project set is passed as an object, it works as a pointer to the projectSet object. Any changes made will thus reflect in the original object instance
        this.loadedProjectIds = new Set() // This is an array of the project keys (referencing projectSet) which are loaded to show for this specific display
        this.containerId = containerId
        this.searchBtnId = searchBtnId
        
        this.scrollDiv = document.createElement('div');
        this.scrollDiv.id = "projectsScrollBody"
        this.scrollDiv.classList.add("d-flex","flex-column","align-items-center")

        this.scrollDivTerminatorDiv = document.createElement('div');
        this.scrollDivTerminatorDiv.id = "ProjectsScrollTerminator"
        this.scrollDivTerminatorDiv.classList.add("d-flex","flex-column","align-items-center")
        //this.loadScrollDivTerminator()

        $(`#${this.containerId}`).append(this.scrollDiv)
        $(`#${this.containerId}`).append(this.scrollDivTerminatorDiv)

        // Initialize searching btn
        $(`#${this.searchBtnId}`).on("click",(event)=>{
            this.onSearch()
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
        this.fetchNewProjects()
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

    loadScrollDivTerminator() {
    }

    clearAllProjects(){ // Removes all objects in this display, and 
        this.loadedProjectIds.forEach((projId) =>{
            this.projectSet.projectSet[projId].removeVisualization(this.containerId)     
        })
        this.loadedProjectIds.clear()
    }
    
    async fetchNewProjects(searchParams = {}){
        console.log(this.loadedProjectIds.size)
        var params = {
            "after": this.loadedProjectIds.size
        }
        Object.assign(params,searchParams)

        var responseObj = await fetchPostWrapper("/getProjects", params)
        console.log(responseObj)
        /*
        if (errorStatusList.includes(responseObj)){
            this.scrollDivTerminatorDiv.innerHTML = `INTERNAL SERVER ERROR`
            this.allProjectsRead = true
            return
        }

        if (responseObj.projects.length == 0){ // All projects have been read
            this.allProjectsRead = true
            this.loadScrollDivTerminator()
        } else { */
        responseObj.projects.forEach((project) => {
            this.loadedProjectIds.add(project.id)
            var projObj = this.projectSet.addProject(project) // Adds new entry to key/value mapping if doesn't exist - otherwise overwrites old one
            this.scrollDiv.append(projObj.getCardDiv(this.containerId))
        })
        //this.scrollDiv.append('test')
        //}
        
    }

    onSearch(){
        this.clearAllProjects()
        this.fetchNewProjects({
            "searchTerm": 'Title',
            "afterDate": undefined, 
            "beforeDate": undefined,
            "onlApproved": false,
            "userPinned": false
        })
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
        if (sameValStartIdx != null){
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
            this.tableContainer.append(projObj.getTableElement(this.tableContainerId))  
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
            this.tableContainer.append(projObj.getTableElement(this.tableContainerId))  
        })
    }
}
