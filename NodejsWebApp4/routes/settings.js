// JavaScript source code
const path = require('path');
const express = require('express');
const router = express.Router();
const { admin } = require('./firebaseConfig.js');

//database reference
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

router.get('/settings', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'settings.html'));
});

//function to delete user
router.post('/deleteUser', async (request, response) => {
    //get client request info
    const userId = request.body.userId;

    //delete user
    admin.auth().deleteUser(userId).then(() => {
        deleteUserInfo(userId); //delete user info from the database
        //send response to client
        response.json({
            status: "success"
        });
    }).catch((error) => {
        console.log('Error deleting user:', error);
    });
});

//function to delete user info from the database
async function deleteUserInfo(userId) {
    //get user info from the database
    var snapshot = await db.ref('users/' + userId).once('value');
    var userInfo = snapshot.val();

    //if user has an active request, delete it
    if (userInfo.activeRequest != null) {
        //delete active request and change provider's status back to "available"
    }

    //delete any notification tokens for this specific user
    //get tokens from the database
    var snapshot = await db.ref('tokens').once('value');
    var tokens = snapshot.val();
    if (tokens != null) {//if there are tokens
        var keys = Object.keys(tokens);
        for (var i = 0; i < keys.length; i++) { //check each token's user id
            var k = keys[i];
            if (userId == tokens[k].uid) //if IDs match, delete token
                await db.ref('tokens/' + k).remove();
        }
    }

    //delete all of the user's previous requests
    await db.ref('previousRequests/' + userId).remove();

    //delete user information
    await db.ref('users/' + userId).remove();
}

module.exports = router;
