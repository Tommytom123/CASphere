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

All projects recieved go into a SET (Avoids duplicate objects, and allows tables/cards to act as pointers and live update all occurences)
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
                console.log(`Pin: ${this.baseProjectObj.projectDetails.title}, ${this.baseProjectObj.projectDetails.id}`)
                console.log(this.baseProjectObj.projectDetails.pinned)
                this.baseProjectObj.projectAction(this.baseProjectObj.projectDetails.pinned ? 'unpin' : 'pin') // Has a {key:value pair of the new value for  this.projectDetails}
            })
            
            if (this.showAsAdmin){
                this.projApproveBtn.addEventListener("click", ()=>{console.log(`Approve: ${this.baseProjectObj.projectDetails.title}, ${this.projectDetails.id}`)})
                this.projDeleteBtn.addEventListener("click", ()=>{console.log(`delete: ${this.baseProjectObj.projectDetails.title}, ${this.projectDetails.id}`)})
            }else{
                this.projJoinBtn.addEventListener("click", ()=>{
                    console.log(`Join: ${this.baseProjectObj.projectDetails.title}, ${this.baseProjectObj.projectDetails.id}`)
                    this.baseProjectObj.projectAction(this.baseProjectObj.projectDetails.joined ? 'leave' : 'join')
                })
            }
    }

    updateInstance() { // Updates card based on the baseProjectObj details (Which is shared between all visualizations)
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
            $("#showProjectModalBody").empty().append(this.getCardDiv('modal'))
        })

    }

    loadHTML(){
        return this.rowElement
    }
    
    removeFromPage() {
        this.rowElement.remove()
    }
}

class Project {
    constructor(projectDetailsJson, admin = false){
        this.projectDetails = projectDetailsJson
        this.showAsAdmin = admin
        this.activeVisualizations = {} // Dictionary of all the visualizations
    }

    /*
    loadTableHTML(){
        this.projectTableDiv = document.createElement('tr');
        this.projectTableDiv.innerHTML = `<td class="col1">${this.projectDetails.title}</td>
                                        <td class="col2">${formatDateTimeToDate(this.projectDetails.startDate)}</td>
                                        <td class="col3"><a class="show-project-modal-li">Info</a></td>`

        this.projectTableDiv.getElementsByClassName(`show-project-modal-li`)[0].addEventListener("click", ()=>{
            $("#showProjectModal").modal('show');
            $("#showProjectModalBody").empty().append(this.getCardDiv('modal'))
        })
        
        return this.projectTableDiv
    }*/

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
            return this.activeVisualizations[id].projectDiv
        }else{ // Visualization doesn't already exist -> create it, and return div
            this.activeVisualizations[id] = new  ProjectTableRowVisualization(this)
            return this.activeVisualizations[id].loadHTML()
        }
    }

    updateAllVisualizations(){
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
            this.updateAllVisualizations()
            var responseMsg = responseJson.success ? actionMessages.success[action] : actionMessages.error[action]
            if (responseMsg) { // Not null or undefined/ it exists
                showAlert(responseJson.success? '': '', responseMsg)
            }
        }
    }
    
}

// All the projects in the program
class ProjectSet{ // Not technically a set, really a seperate object which stores all the projects, but mainly ensures that they aren't stored as duplicates
    constructor(accessLevel) {
        this.projectSet = {1:'Appple'} // projectID : Project Object (Removes duplicates, thus acting as a set, whilst still being accessible based on a key)
        this.admin = (accessLevel == 'admin')
    }

    addProject(project){    
        if (project.id in this.projectSet){
            return this.projectSet[project.id]
        }else{
            this.projectSet[project.id] = new Project(project, this.admin)
            return this.projectSet[project.id]
        }
    }
}

// "Extentions" from ProjectSet. Not really extensions, but take core projectSet data

class ProjectScrollDisplay{
    constructor(projectSet, containerId){
        this.projectSet = projectSet  // Since the project set is passed as an object, it works as a pointer to the projectSet object. Any changes made will thus reflect in the original object instance
        this.loadedProjectIds = new Set() // This is an array of the project keys (referencing projectSet) which are loaded to show for this specific display
        this.containerId = containerId
        
        this.scrollDiv = document.createElement('div');
        this.scrollDiv.id = "projectsScrollBody"
        this.scrollDiv.classList.add("d-flex","flex-column","align-items-center")

        this.scrollDivTerminatorDiv = document.createElement('div');
        this.scrollDivTerminatorDiv.id = "ProjectsScrollTerminator"
        this.scrollDivTerminatorDiv.classList.add("d-flex","flex-column","align-items-center")
        //this.loadscrollDivTerminator()

        $(`#${this.containerId}`).append(this.scrollDiv)
        $(`#${this.containerId}`).append(this.scrollDivTerminatorDiv)

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

    loadscrollDivTerminator() {
    }

    async removeAllProjects(){
    }
    
    async fetchNewProjects(){
        var params = {
            "after": this.loadedProjectIds.length
        }
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
            this.loadscrollDivTerminator()
        } else { */
        responseObj.projects.forEach((project) => {
            let projObj = new Project(project, this.admin)
            this.loadedProjectIds.add(project.id)
            this.projectSet.projectSet[project.id] = projObj // Adds new entry to key/value mapping if doesn't exist - otherwise overwrites old one
            this.scrollDiv.append(projObj.getCardDiv('scrollDisplay'))
        })
        //}
        
    }
}


class ProjectTable{
    constructor(projectSet, tableContainerId){
        this.projectSet = projectSet  // Since the project set is passed as an object, it works as a pointer to the projectSet object. Any changes made will thus reflect in the original object instance
        //this.loadedProjectIds = new Set() // This is an set of the project keys (referencing projectSet) which are loaded to show for this specific display
        this.tableContainer = document.getElementById(tableContainerId)
    }

    //removeFromTable(projectId){
    //    this.loadedProjectIds.delete(projectId)
    //}
}

// Extentions from the projectTable

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
            //this.loadedProjectIds.push(project.id)
            this.tableContainer.append(projObj.getTableElement('ownedTable'))  
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
            //this.loadedProjectIds.add(project.id)
            this.tableContainer.append(projObj.getTableElement('joinedTable'))  
        })
    }
}


/*
class ProjectScrollDisplay{
    constructor(displayDivId){
        this.displayDivId = displayDivId
        this.allProjectsRead = false // Boolean representing if all projects have been read

        this.scrollDiv = document.createElement('div');
        this.scrollDiv.id = "projectsStackCol"
        this.scrollDiv.classList.add("d-flex","flex-column","align-items-center")

        this.scrollDivTerminatorDiv = document.createElement('div');
        this.scrollDivTerminatorDiv.id = "scrollDivTerminator"
        this.scrollDivTerminatorDiv.classList.add("d-flex","flex-column","align-items-center")
        this.loadscrollDivTerminator()

        $("#scrollDivContainer").append(this.scrollDiv)
        $("#scrollDivContainer").append(this.scrollDivTerminatorDiv)

        //Scrolling logic
        this.prevLowestScrollPos = 0 //Based on scrollTop
        this.scrollToTopBtnShown = false
        $("#scrollToTopBtn").hide()

        $("#scrollDivContainer").on("scroll", async (event) => {
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

    loadscrollDivTerminator() {
        if(this.allProjectsRead){
            this.scrollDivTerminatorDiv.innerHTML = `All projects have been loaded <button class="btn btn-primary" onclick="globalscrollDiv.scrollToTop()">scroll to top</button>`
        } else {
            this.scrollDivTerminatorDiv.innerHTML = `<div id="placeholderCard" class="card project-card mt-2" aria-hidden="true">
                                                            <div class="card-body">
                                                            <h5 class="card-title placeholder-glow">
                                                                <span class="placeholder col-6"></span>
                                                            </h5>
                                                            <p class="card-text placeholder-glow">
                                                                <span class="placeholder col-7"></span>
                                                                <span class="placeholder col-4"></span>
                                                                <span class="placeholder col-4"></span>
                                                                <span class="placeholder col-6"></span>
                                                                <span class="placeholder col-8"></span>
                                                            </p>
                                                            <a class="btn btn-primary disabled placeholder col-6" aria-disabled="true"></a>
                                                            </div>
                                                        </div>
                                                        <div class="m-2">
                                                            <div class="spinner-border m-4" role="status">
                                                            <span class="visually-hidden">Loading...</span>
                                                            </div>
                                                        </div>
                                                        <button class="btn btn-primary" onclick="globalscrollDiv.fetchNewProjects()">Add projects</button>`
        }
    }

    async removeAllProjects(){
        while (this.scrollDiv.length > 0){
            proj = this.scrollDiv.pop()
            proj.removeFromPage()
        }
    }
}
*/


/*
class ProjectsJoinedTable extends ProjectTable{
    async fetchNewProjects(){
        if(!this.allProjectsRead){
            var params = {
                "after": this.scrollDiv.length
            }
            var responseObj = await fetchPostWrapper("/getProjects", params)
            console.log(responseObj)
            if (errorStatusList.includes(responseObj)){
                this.scrollDivTerminatorDiv.innerHTML = `INTERNAL SERVER ERROR`
                this.allProjectsRead = true
                return
            }

            if (responseObj.projects.length == 0){ // All projects have been read
                this.allProjectsRead = true
                this.loadscrollDivTerminator()
            } else {
                responseObj.projects.forEach((project, idx) => {
                    let proj = new Project(project, this.admin)
                    this.scrollDiv.push(proj)
                    this.scrollDiv.append(proj.loadHTML())
                })
            }
        }
    }
}
*/