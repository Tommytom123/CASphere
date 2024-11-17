// -- Functions to validate the inputs in the forms, and further actions --

// Called on load of page
function onLoadValidators(){
    // Event Listener for the email toggle btn
    document.getElementById("receiveEmailsToggle").onchange = () => onEmailSettingsUpdate()
    
    // Onclick event for the undo delete btn
    document.getElementById("undoDeleteBtn").onclick = () => GLOBAL_PROJECT_SET.undoDelete()

    // Event listener to change the text 
    const participantSlider = document.querySelector("#maxParticipantsSlider");
    const participantNumField = document.querySelector("#maxParticipantsInput");
    participantSlider.addEventListener("input", (event) => {
        participantNumField.value = event.target.value;
    });
    
    //Prevent the default submit system of forms so they pass through their respective submit functions without redirecting the page
    var forms = document.querySelectorAll('form');
    for (var i = 0; i < forms.length; i++) {
        forms[i].addEventListener('submit', (event) => {
            event.preventDefault();
            switch (event.currentTarget.id) {
                case "addProjectForm":
                    addProjectSubmit(event.currentTarget)
                    break
                //for more forms add more switch cases
            }   
        });
    }
    
}

function allYearGroupAddOnClick(state){
    if (state == true){ // Select disable the all other fields
        for (let i = 0; i<6; i++){
            $(`#yearGroupCheckbox_${i}`).attr("onclick","return false")
            $(`#yearGroupCheckbox_${i}`).addClass("read-only-checkbox")
            $(`#yearGroupCheckbox_${i}`).prop('checked', true)
        }
    } else { // Unselect and enable all fields
        for (let i = 0; i<6; i++){
            $(`#yearGroupCheckbox_${i}`).attr("onclick","")
            $(`#yearGroupCheckbox_${i}`).removeClass("read-only-checkbox")
        }
    }
}


//Check if the description is not too short or too long
function projectDescriptionOnChange(val){

}

//Check if the description is not too short or too long
function projectTitleOnChange(val){
    
}