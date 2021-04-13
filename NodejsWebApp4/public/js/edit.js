const displayNameField = document.getElementById('displayName');
const mailField = document.getElementById('mail');
//const phoneNumberField = document.getElementById('phoneNumber');

const passwordField = document.getElementById('password');

const labels = document.getElementsByTagName('label');


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
    if(!passwordField.value)
        labels.item(2).className = "unfocused-field";
});

labels.item(0).className = "focused-field";
labels.item(1).className = "focused-field";
labels.item(2).className = "focused-field";


// JavaScript source code
firebase.auth().onAuthStateChanged(async function (user) {
    if (user) {
        var user = firebase.auth().currentUser;
        var name = user.displayName;
        var email = user.email;
        //var phoneNumber = user.phoneNumber;


        displayNameField.value = name;
        mailField.value = email;
        //phoneNumberField.value = phoneNumber;

    } else window.location.assign('../');
});


document.getElementById("confirm").addEventListener("click", function () {
    let cont = confirm("Are you sure you want to save those changes?");
    if (cont == true) {
        var user = firebase.auth().currentUser;
        //user.updatePassword(passwordField.value);
        user.updateEmail(mailField.value);
        user.updateProfile({
            displayName: displayNameField.value,
            //phoneNumber: phoneNumberField.value
        }).then(function () {
            window.location.replace('../account');
        }).catch(function (error) {
            // An error happened.
        });
    }
});