//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes

class Project {
    constructor(projectDetailsJson){
        this.projectDiv = document.createElement('div');
        this.projectDetails = projectDetailsJson

    }

    loadHTML(admin = false){
        this.projectDiv.classList.add("card", "project-card", "mt-2", "mb-2", this.projectDetails.strand.toLowerCase())
        this.projectDiv.innerHTML = `
            <div class="card-body container">
                <div class="row">
                <div class="col-8">
                    <h5 class="card-title">
                    <div class="d-flex justify-content-between project-heading mb-1">
                        <span class="">${this.projectDetails.title}</span>
                        <i class="fa-solid fa-thumbtack pin-project"></i>
                    </div>
                    
                    <hr class="proj-line-break">
                    <div class="d-flex justify-content-start project-subheading mt-1">
                        <h6 class="student-name">${this.projectDetails.ownerName}</h6>
                        <h6 class="mx-2">-</h6>
                        <h6 class="student-year">${this.projectDetails.ownerYear}</h6>
                        <h6 class="mx-2">-</h6>
                        <h6 class="student-email">${this.projectDetails.ownerEmail}</h6>
                    </div>
                    </h5>
                    <div class="proj-card-left-content">
                        <p class="card-text ">
                        ${this.projectDetails.description}
                        </p>
                        <h6 class="proj-card-left-footer">
                        Created: ${this.projectDetails.uploadedDate}
                        </h6>
                    </div>    
                </div>
                <div class="col-4">
                    <img class="border border-dark-subtle rounded mb-1" src="https://ralfvanveen.com/wp-content/uploads/2021/06/Placeholder-_-Begrippenlijst.svg" width="100%" height="120px">
                    <p>
                        Start date: ${this.projectDetails.startDate} <br>
                        End date: ${this.projectDetails.endDate}
                    </p>
                    ${admin ? '<div class="d-flex justify-content-between"> <button type="button" class="btn btn-danger ms-2 proj-admin-btn">Approve</button> <button type="button" class="btn btn-primary me-2 proj-admin-btn">Delete</button></div>' : '<button type="button" class="btn btn-primary w-100">Join Project</button>'}
                </div>
                </div>
            </div>
            `
            return this.projectDiv
           
    }

    removeFromPage() {
        this.projectDiv.remove()
    }
}






class ProjectStack{
    constructor(accessLevel) {
        this.projectStack = []
        this.admin = accessLevel == 'admin'
        this.allProjectsRead = false // Boolean representing if all projects have been read

        this.projectStackDiv = document.createElement('div');
        this.projectStackDiv.id = "projectsStackCol"
        this.projectStackDiv.classList.add("d-flex","flex-column","align-items-center")

        this.projectStackTerminatorDiv = document.createElement('div');
        this.projectStackTerminatorDiv.id = "projectStackTerminator"
        this.projectStackTerminatorDiv.classList.add("d-flex","flex-column","align-items-center")
        this.loadProjectStackTerminator()

        $("#projectStackContainer").append(this.projectStackDiv)
        $("#projectStackContainer").append(this.projectStackTerminatorDiv)

        //Scrolling logic
        this.prevLowestScrollPos = 0 //Based on scrollTop
        this.scrollToTopBtnShown = false
        this.toggleScrollToTopBtn()

        $("#projectStackContainer").on("scroll", async (event) => {
            // Pixels to scroll till bottom of page
            var scrollBottom = event.currentTarget.scrollHeight - event.currentTarget.clientHeight - event.currentTarget.scrollTop
            this.prevLowestScrollPos = event.currentTarget.scrollTop > this.prevLowestScrollPos ? event.currentTarget.scrollTop : this.prevLowestScrollPos
            if (this.scrollToTopBtnShown == false && (this.prevLowestScrollPos - event.currentTarget.scrollTop > 1000)){ // User significantly scrolling up, display scroll back to top btn
                this.toggleScrollToTopBtn()
            } else if(this.scrollToTopBtnShown == true && (this.prevLowestScrollPos - event.currentTarget.scrollTop < 700)){
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
        $("#projectStackContainer").animate({scrollTop:0}, 500, ()=>{
            this.prevLowestScrollPos = 0
            this.toggleScrollToTopBtn()
        }) // https://api.jquery.com/animate/
        
    }

    loadProjectStackTerminator() {
        if(this.allProjectsRead){
            this.projectStackTerminatorDiv.innerHTML = `All projects have been loaded <button class="btn btn-primary" onclick="globalProjectStack.scrollToTop()">scroll to top</button>`
        } else {
            this.projectStackTerminatorDiv.innerHTML = `<div id="placeholderCard" class="card project-card mt-2" aria-hidden="true">
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
                                                        <button class="btn btn-primary" onclick="globalProjectStack.fetchNewProjects()">Add projects</button>`
        }
    }

    async fetchNewProjects(){
        if(!this.allProjectsRead){
            var params = {
                "after": this.projectStack.length
            }
            var responseObj = await fetchPostWrapper("/getProjects", params)
            //console.log(responseObj)
            if (responseObj.projects.length == 0){ // All projects have been read
                this.allProjectsRead = true
                this.loadProjectStackTerminator()
            } else {
                responseObj.projects.forEach((project, idx) => {
                    let proj = new Project(project)
                    this.projectStack.push(proj)
                    this.projectStackDiv.append(proj.loadHTML(this.admin))
                })
            }
        }
    }

    async removeAllProjects(){
        while (this.projectStack.length > 0){
            proj = this.projectStack.pop()
            proj.removeFromPage()
        }
    }
}