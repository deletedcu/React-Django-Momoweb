var firebase = require('firebase/app');
require('firebase/messaging');
var config = require('./fcmconfig');
import Promise from 'promise-polyfill';
import 'whatwg-fetch'
import Cookies from 'universal-cookie';

if (!window.Promise) {
  window.Promise = Promise;
}

const cookies = new Cookies();

class MomoWebPush {
    constructor(config) {
        this.config = config;
        firebase.initializeApp(config);
        this.messaging = firebase.messaging();
        this.messaging.onMessage(function(payload) {
            console.log("Message received. ", payload);
        });
    }

    showToken(currentToken) {
        console.log('showToken', currentToken);
    }

  // Send the Instance ID token your application server, so that it can:
  // - send messages back to this app
  // - subscribe/unsubscribe the token from topics
  sendTokenToServer(currentToken) {
    var self = this;
    if (!this.isTokenSentToServer()) {
      console.log('Sending token to server...');
      fetch(
        '/device/gcm/', {
            'method': 'POST',
            'body': JSON.stringify({
                registration_id: currentToken,
                cloud_message_type: "FCM"
            }),
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': cookies.get('csrftoken')
            },
            credentials: 'same-origin'
        }).then(function(resp) {
            if (resp.status >= 200 && resp.status < 300) {
                return resp.json();
            } else {
                var error = new Error(resp.statusText)
                error.response = resp;
                throw error
            }
      }).then(function(data) {
        self.setTokenSentToServer(true);
      }).catch(function(error) {
        console.log('request failed', error)
      });

    } else {
      console.log('Token already sent to server so won\'t send it again ' +
          'unless it changes');
    }
  }
  isTokenSentToServer() {
    return false;
    //return window.localStorage.getItem('sentToServer') == 1;
  }
  setTokenSentToServer(sent) {
    window.localStorage.setItem('sentToServer', sent ? 1 : 0);
  }


 requestPermission() {
    console.log('Requesting permission...');
    var self = this;
    this.messaging.requestPermission()
    .then(function() {
        console.info('req perms clb', arguments);
      console.log('Notification permission granted.');
      // TODO(developer): Retrieve an Instance ID token for use with FCM.
      // [START_EXCLUDE]
      // In many cases once an app has been granted notification permission, it
      // should update its UI reflecting this.
      self.sync_token();
      // [END_EXCLUDE]
    })
    .catch(function(err) {
      console.log('Unable to get permission to notify.', err);
    });
  }


  sync_token() {
    var self = this;
    this.messaging.getToken()
    .then(function(currentToken) {
      if (currentToken) {
        self.sendTokenToServer(currentToken);
      } else {
        self.requestPermission();
        // Show permission request.
        console.log('No Instance ID token available. Request permission to generate one.');
        self.setTokenSentToServer(false);
      }
    })
    .catch(function(err) {
      console.log('An error occurred while retrieving token. ', err);
      self.showToken('Error retrieving Instance ID token. ', err);
      self.setTokenSentToServer(false);
    });
  }
}
let wp = new MomoWebPush(config);
wp.sync_token();

module.exports = MomoWebPush;


