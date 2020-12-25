const mailField = document.getElementById('emailaddress');
const passwordField = document.getElementById('password');
const displayNameField = document.getElementById('displayName');
const phonenumber = document.getElementById("phonenumber");
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
    const pnumber = phonenumber.value;
    const name = displayNameField.value;


    //Built in firebase function responsible for signing up a user
    auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
        console.log('Signed Up Successfully !');
        sendVerificationEmail();
    })
    .catch(error => {
        console.error(error);
    })

    //////SIGN UP (firebase::auth::user)
    var db = firebase.database(); // Get a reference to the database service
    var user = firebase.auth().currentUser; // Get current user

    if (user) {
        //get the user info from html doc fields
       
   

        //store user information in firebase::auth::user
        user.display_name = name;
        user.email = email;
        user.phone_number = pnumber;
        var userId = user.uid;

        //get uid and make a new node/child(?) in db 'users'
        db.ref('users/' + userId).set({ phoneNumber: pnumber });

    } else {
        // No user is signed in.
    }

  ///////Sign up (firebase::database instead)
	//db.ref('users/' + userId ).set({
  //  name = name;
  //  emailAddress = emailaddress;
  //  phoneNumber = phonenumber;
  //});



}

//Function called right after the signUpWithEmailAndPassword to send verification emails
const sendVerificationEmail = () => {
    //Built in firebase function responsible for sending the verification email
    auth.currentUser.sendEmailVerification()
    .then(() => {
        console.log('Verification Email Sent Successfully !');
        //redirecting the user to the profile page once everything is done correctly
        window.location.assign('../profile');
    })
    .catch(error => {
        console.error(error);
    })
}

signUp.addEventListener('click', signUpFunction);

//Animations
mailField.addEventListener('focus', () => {
    labels.item(0).className = "focused-field";
});

passwordField.addEventListener('focus', () => {
    labels.item(1).className = "focused-field";
});

mailField.addEventListener('blur', () => {
    if(!mailField.value)
        labels.item(0).className = "unfocused-field";
});

passwordField.addEventListener('blur', () => {
    if(!passwordField.value)
        labels.item(1).className = "unfocused-field";
});

