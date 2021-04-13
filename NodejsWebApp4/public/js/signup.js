const mailField = document.getElementById('emailaddress');
const passwordField = document.getElementById('password');
const displayNameField = document.getElementById('displayName');
//const phonenumber = document.getElementById("phonenumber");
const photoField = document.getElementById('photo');
const labels = document.getElementsByTagName('label');
const signUp = document.getElementById('signUp');
const failureModal = document.querySelector('.failure');
const feedbackMessage = document.querySelector('.feedbackMessage');

const auth = firebase.auth();
//auth.languageCode = 'fr_FR'; //Sending verification emails only in french

//Sends verification emails in the same language as the language used in the
//user's device
auth.useDeviceLanguage();

//Function wrapping all the signup parts including the email verification email
//triggered once the user clicks on the signup button
const signUpFunction = () => {
    const email = mailField.value;
    const password = passwordField.value;
    //const pnumber = phonenumber.value;
    const name = displayNameField.value;


    //Built in firebase function responsible for signing up a user
    auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
        console.log('Signed Up Successfully !');
        var user = firebase.auth().currentUser; // Get current user
        user.updateProfile({
            displayName: name,
            //phoneNumber: pnumber
        }).then(function () {
            sendVerificationEmail();
        }).catch(function (error) {
            // An error happened.
        });

    })
    .catch(error => {
        console.error(error);
    })
}

//Function called right after the signUpWithEmailAndPassword to send verification emails
const sendVerificationEmail = () => {
    //Built in firebase function responsible for sending the verification email
    auth.currentUser.sendEmailVerification()
    .then(() => {
        console.log('Verification Email Sent Successfully !');
        window.location.assign('../profile');
    })
    .catch(error => {
        console.error(error);
    })
}

signUp.addEventListener('click', signUpFunction);

//Animations


displayNameField.addEventListener('focus', () => {
    labels.item(0).className = "focused-field";
});

displayNameField.addEventListener('blur', () => {
    if (!displayNameField.value)
        labels.item(0).className = "unfocused-field";
});

mailField.addEventListener('focus', () => {
    labels.item(1).className = "focused-field";
});

mailField.addEventListener('blur', () => {
    if (!mailField.value)
        labels.item(1).className = "unfocused-field";
});
/*
phoneNumberField.addEventListener('focus', () => {
    labels.item(2).className = "focused-field";
});

phoneNumberField.addEventListener('blur', () => {
    if (!mailField.value)
        labels.item(2).className = "unfocused-field";
});*/

passwordField.addEventListener('focus', () => {
    labels.item(2).className = "focused-field";
});

passwordField.addEventListener('blur', () => {
    if (!passwordField.value)
        labels.item(2).className = "unfocused-field";
});