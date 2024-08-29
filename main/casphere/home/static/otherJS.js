// Other smalller helper functions that might be useful to have



function showToast(title, body){
    var toast = document.getElementById('customToast')
    var toastObj = new bootstrap.Toast(toast)
    toastObj.show()
    document.getElementById('customToastTitle').innerHTML = title
    document.getElementById('customToastBody').innerHTML = body
}

function showAlert(type, innerHtml, displayTime = 3500){
    var alert = document.createElement("div")
    alert.classList.add("alert", `alert-${type}`, 'custom-alert', "translate-middle", "shadow", 'mt-2')
    alert.setAttribute("role",'alert')
    alert.innerHTML = innerHtml
    $("#alertContainer").append(alert) 
    setTimeout(()=>{ // After displayTime ms, start fading alert out
        alert.classList.add("custom-alert-fade")
        setTimeout(()=>{ //Anmimation complete, remove element from DOM
            alert.remove()
        }, 1000)
    }, displayTime)
}