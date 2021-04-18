// JavaScript source code
const path = require('path');

const express = require('express');

const router = express.Router();

const { admin } = require('./firebaseConfig.js');


// Get a database reference to our posts
var db = admin.database();

router.use(express.json({ limit: '1mb' }));

router.get('/settings', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../', 'views', 'settings.html'));
});

router.post('/deleteUser', async (request, response) => { //add to recieve that post(endpoint)
    const data = request.body;
    userId = data.userId;

    admin.auth().deleteUser(userId).then(() => {
        deleteUserInfo(userId);

        response.json({
            status: "success"
        });

    })
        .catch((error) => {
            console.log('Error deleting user:', error);
        });

});

async function deleteUserInfo(userId) {
    //delete 1.active requests      2. previousRequests/userId      3. tokens/tokenId/userId    4.users/userId
    var snapshot = await db.ref('users/' + userId).once('value');
    var userInfo = snapshot.val();

    //delete active requests
    if (userInfo.activeRequest != null) {
        //delete active request and change provider's status back to "available"
    }

    var snapshot = await db.ref('tokens').once('value');
    var tokens = snapshot.val();
    if (tokens != null) {
        var keys = Object.keys(tokens);
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (userId == tokens[k].uid)
                await db.ref('tokens/' + k).remove();
        }
    }

    await db.ref('previousRequests/' + userId).remove();
    await db.ref('users/' + userId).remove();
}

module.exports = router;
