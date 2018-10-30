var firebase = require('firebase/app');
require('firebase/messaging');
var config = require('./fcmconfig');
firebase.initializeApp(config);
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
    console.log(' Received background message ', payload);
    // Customize notification here
    const notificationTitle = 'Background Message Title';
    const notificationOptions = {
        body: 'Background Message body.',
        icon: '../imgs/favicon-32x32.png'
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});
