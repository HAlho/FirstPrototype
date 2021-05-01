const displayNameField = document.getElementById('displayName'); //name's input field
const emailField = document.getElementById('emailaddress'); //email's input field 
const passwordField = document.getElementById('password'); //password's input field
const eye = document.getElementById("eye");
const eyeSlash = document.getElementById("eyeSlash");
const alert = document.getElementById("alert"); //show any errors with signing up

//firebase.auth().useDeviceLanguage(); //sends verification emails in the same language as the language used in the user's device
passwordField.addEventListener('input', () => {
    if (passwordField.value == '' || passwordField.value == null) {
        eye.style.display = "none";
        eyeSlash.style.display = "none";
    } else if (passwordField.type == 'password')
        eye.style.display = "inline-block";
    else eyeSlash.style.display = "inline-block";
});

eye.addEventListener('click', () => {
    passwordField.type = "text";
    eye.style.display = "none";
    eyeSlash.style.display = "inline-block";
});

eyeSlash.addEventListener('click', () => {
    passwordField.type = "password";
    eyeSlash.style.display = "none";
    eye.style.display = "inline-block";
});

//sign up button event listener
document.getElementById('signup').addEventListener('click', async () => { //user wants to sign up
    //get user inputs
    const email = emailField.value; //get email
    const password = passwordField.value; //get password
    const name = displayNameField.value; //get name


    //clear any previous errors
    displayNameField.style.border = "none";
    emailField.style.border = "none";
    passwordField.style.border = "none";
    alert.innerHTML = '';

    //check for any errors
    if (checkEmptyFields()) return; //check if any field is empty
    if (!validateName(name)) return; //check if name is valid
    if (!validateEmail(email)) return; //check if email is valid
    if (!checkPassword(password)) return; //check if password is strong

    //all inputs are valid

    //check if the email is banend
    const sdata = { email };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/checkBanned', options);
    const json = await response.json();
    const banned = json.banned;

    //if user banned, display message and return
    if (banned) {
        document.getElementById("dimContent").classList.add("dimVisible"); //dim screen
        //display banned message
        setTimeout(function () {
            document.getElementById("messagePrompt").style.display = "block"; //show window
        }, 300);

        return;
    } else { //user is not banned
        //built in firebase function responsible for signing up a user
        firebase.auth().createUserWithEmailAndPassword(email, password) //attempt to create an account
            .then(() => { //account was created successfully
                var user = firebase.auth().currentUser; //get current user
                user.updateProfile({ //save the user's name
                    displayName: name
                }).then(function () {
                    document.getElementById("dimContent").classList.add("dimVisible"); //dim screen
                    //display confirmation message
                    setTimeout(function () {
                        document.getElementById("PopUp").style.display = "block"; //show window
                    }, 300);

                    sendVerificationEmail(); //send verification email to the user
                }).catch(function (error) { //error saving the user's name
                    console.error(error);
                });
            }).catch(error => { //error creating account
                alert.innerHTML = error.message; //display error message
            })
    }
});

//close message if the user clicked 'ok' shown on prompt
function closeMessage() {
    document.getElementById("messagePrompt").style.display = "none";
    document.getElementById("dimContent").classList.remove("dimVisible");
}

//function called right after the signUpWithEmailAndPassword to send verification emails
const sendVerificationEmail = () => {
    //built in firebase function responsible for sending the verification email
    firebase.auth().currentUser.sendEmailVerification() //send verification email with firebase
        .then(() => { //email was sent successfully
            saveUser();
        }).catch(error => { //error sending verification email
            console.error(error);
        })
}

//save new user
async function saveUser() {
    var userId = firebase.auth().currentUser.uid; //get current user ID

    //send user ID to the server
    const sdata = { userId };
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sdata)
    };
    const response = await fetch('/saveUser', options);
    const json = await response.json();

    window.location.replace('../registerCar'); //forward user to the main page
}

//check for any empty fields
function checkEmptyFields() {
    //get user's inputs
    const email = emailField.value;
    const password = passwordField.value;
    const name = displayNameField.value;

    var empty = false; //set true if there's at least one empty field

    //check if the user left the name field empty
    if (name == '' || name == null) { //user did not input an name
        displayNameField.style.border = "1px solid red"; //make input field's borders red to alert user
        empty = true;
    }

    //check if the user left the email field empty
    if (email == '' || email == null) { //user did not input an email
        emailField.style.border = "1px solid red"; //make input field's borders red to alert user
        empty = true;
    }
    //check if the user left the email field empty
    if (password == '' || password == null) { //user did not input a password
        passwordField.style.border = "1px solid red"; //make input field's borders red to alert user
        empty = true;
    }

    return empty; //true if there's at least one empty field
}

//function to validate email
function validateEmail(email) {
    //check email length
    if (email.length > 320) { //email is too long
        displayNameField.style.border = "1px solid red"; //make input field's borders red to alert user
        alert.innerHTML = "Email is too long!"; //display error message
        return false;
    }

    //email format should follow something@something.something... 
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; //email regex. source: https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
    if (!re.test(String(email).toLowerCase())){ //if email is not valid
        emailField.style.border = "1px solid red"; //make input field's borders red to alert user
        alert.innerHTML = 'Invalid email address!'; //display error message
        return false;
    }

    return true; //email is valid
}

function validateName(name) {
    //check name length
    if (name.length < 3) { //if inputted name is too short
        displayNameField.style.border = "1px solid red"; //make input field's borders red to alert user
        alert.innerHTML = "Name is too short!"; //display error message
        return false;
    }

    if (name.length > 50) { //if inputted name is too long
        displayNameField.style.border = "1px solid red"; //make input field's borders red to alert user
        alert.innerHTML = "Name is too long!"; //display error message
        return false;
    }
     
    //check for invalid characters (valid name includes whitespaces and letters)
    const re = /^[A-Za-z\s]+$/;
    if (!re.test(name)) { //if name contains invalid characters
        displayNameField.style.border = "1px solid red"; //make input field's borders red to alert user
        alert.innerHTML = 'Name contains invalid characters!'; //display error message
        return false;
    }

    return true; //name is valid
}


function checkPassword(password) {
    //check password length
    if (password.length < 8) { //password is short
        alert.innerHTML = "Password should have at least 8 characters!"; //display error message
        return false;
    }

    if (password.length > 128) { //password is long
        alert.innerHTML = "Password is too long!"; //display error message
        return false;
    }

    //check if password is strong
    if (!password.match(/[a-z]+/) || !password.match(/[A-Z]+/) || !password.match(/[0-9]+/) || !password.match(/[$@#&!]+/)) {
        alert.innerHTML = "Password must contain at least one number, special character, uppercase and lowercase letter"; //display error message
        return false;
    }

    return true; //password is strong
}
