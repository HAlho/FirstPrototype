const mailField = document.getElementById('mail');
const labels = document.getElementsByTagName('label');
const resetPassword = document.getElementById('resetPassword');
const auth = firebase.auth();

const resetPasswordFunction = () => {
    const email = mailField.value;

    auth.sendPasswordResetEmail(email)
        .then(() => {
            console.log("sent");
        })
        .catch(error => {
            cosole.error(error);
        })
}


resetPassword.addEventListener('click', resetPasswordFunction);


//When reset button is clicked, a confirmation pop up is displayed
document.getElementById("resetPassword").addEventListener('click', () => {
    document.getElementById("dimContent").classList.add("dimVisible"); //dim screen
    document.getElementById("mail").value =" "; // clear the text field
    //display confirmation message
    setTimeout(function () {
        document.getElementById("PopUp").style.display = "block"; //show window
    }, 250);

 
});


//when any window prompt's cancel button is clicked
function cancel() {
    var prompts = document.getElementsByClassName("windowPrompt"); //gete all window prompts
    for (var i = 0; i < prompts.length; i++) prompts[i].style.display = 'none'; //hide all window prompts
    document.getElementById("dimContent").classList.remove("dimVisible"); //brighten screen
}