'use strict';

var util = require('util');
var path = require('path');
var fs = require('fs');
var moment = require('moment');
var Bot = require('slackbots');

var STANDUP_CHANNEL = 'general';
var STANDUP_REMINDER_TIME = 1800000; // must be provided in milliseconds

var StandBot = function Constructor(settings) {

    this.settings = settings;
    this.settings.name = this.settings.name || 'standymcstandsalot';
    this.user = null;

    this.repliedUsers = [];

}

util.inherits(StandBot, Bot);

StandBot.prototype.run = function () {
    StandBot.super_.call(this, this.settings);

    this.chatHistory = {};

    // Here we can set any information we need from the main application
    this.on('open', this._onOpen);
    this.on('message', this._handleMessage);

}

StandBot.prototype._onOpen = function() {

    console.log("On Open Called");
    var self = this;

    // Firstly Set the General Channel as the one we want to keep track of
    var channels = this.getChannels();
    this.generalChannel = channels._value.channels.find(function(chan){
        if (chan.name === STANDUP_CHANNEL) {
            return chan;
        }
    });

    // Secondly create an array of all the users
    var users = this.getUsers()._value.members.filter(function(user) {
        if (!(user.is_bot) && user.name !== 'slackbot') {
            return user;
        }
    });

    // Setup the Chat History for the users
    users.forEach(function(user) {
        self.chatHistory[user.id] = {
            username: user.name,
            todayStandup: ""
        };
    });

    self.started = true;
    self.welcome = false;
    console.log("On Open Finished");

    // Check off the standup business
    this._startStandup(this);
}

StandBot.prototype._handleMessage = function(message) {
    if (this._isChatMessage(message) &&
        this._isGeneralChannelMessage(message) &&
        this._isNotFromStandBot(message)) {
        if (this.chatHistory[message.user].todayStandup === "") {
            this.chatHistory[message.user].todayStandup = message.text;
        }
    }
}

StandBot.prototype._waitForReady = function(self) {
    console.log("Bot Not Ready, waiting...");
    setTimeout(self._checkSendMessages.bind(null, self), 10000);
}

StandBot.prototype._startStandup = function(self) {
    self.postMessageToChannel(STANDUP_CHANNEL, "Good Morning @channel! It's time for that daily stand up to let us know what you are doing today. Take your time, if you forget, I will relentlessly remind you! #botlyfe", {as_user: true});
    self.welcome = true;
    setTimeout(self._checkSendMessages.bind(null, self), STANDUP_REMINDER_TIME); // This will check every 30miuntes
}

StandBot.prototype._checkSendMessages = function(self) {

    // Firstly, check to make sure the app has started, the users are loaded and everything is working as expected
    if (!self.started) {
        self._waitForReady(self);
        return;
    }

    // Next, attempt to run the starting welcome message
    if (!self.welcome) {
        self._startStandup(self);
        return;
    }

    // Otherwise, start prompting people that haven't added anything yet.
    var usersToStillWork = [];

    Object.keys(self.chatHistory).forEach(function(key) {
        if (self.chatHistory[key].todayStandup === "") {
            usersToStillWork.push(self.chatHistory[key].username);
        }
    });

    if (usersToStillWork.length > 0) {
        self._requestStandUpFromUsers(self, usersToStillWork);
        setTimeout(self._checkSendMessages.bind(null, self), STANDUP_REMINDER_TIME);
    } else {
        var summary = "Today's Stand Up Is Complete, here is the run down!\n";
        Object.keys(self.chatHistory).forEach(function(key) {
            var userSum = self.chatHistory[key].username + ": " + self.chatHistory[key].todayStandup + "\n";
            summary += userSum;
        });
        self.postMessageToChannel(STANDUP_CHANNEL, summary, {as_user: true});

        // Setup the next standup!
        self._setupNextStandup(self);
    }

}

StandBot.prototype._requestStandUpFromUsers = function(self, usernameArray) {
    var message = "Hello, We are still awaiting messages from these lovely humans: ";
    usernameArray.forEach(function(username) {
        message = message + "@" + username + ": ";
    });
    self.postMessageToChannel(STANDUP_CHANNEL, message, {as_user: true});
}

StandBot.prototype._setupNextStandup = function(self) {

    // Reset all the standup variables
    self.welcome = false;

    self.chatHistory = {};
    // Secondly create an array of all the users
    var users = self.getUsers()._value.members.filter(function(user) {
        if (!(user.is_bot) && user.name !== 'slackbot') {
            return user;
        }
    });

    // Setup the Chat History for the users
    users.forEach(function(user) {
        self.chatHistory[user.id] = {
            username: user.name,
            todayStandup: ""
        };
    });

    var timeToNextStandup = self._calcTimeTillNextStandup();

    // Schedule the next start up
    console.log("The Next Stand Up Has Been Scheduled");
    setTimeout(self._startStandup.bind(null, self), timeToNextStandup);

}

StandBot.prototype._calcTimeTillNextStandup = function() {
    // Check if tomorrow is friday
    var nextDay = new moment().add(1, 'd');
    var nextStandup;
    // If the next day is Saturday, then we need to skip to monday
    if (nextDay.day() === 6) {
        nextStandup = new moment("10", "hh").add(72, "h");
    } else {
        nextStandup = new moment("10", "hh").add(24, "h");
    }
    var currentTime = new moment();
    var duration = moment.duration(nextStandup.diff(currentTime));
    return duration.asMilliseconds();
}


StandBot.prototype._isChatMessage = function(message) {
    return message.type === 'message' && Boolean(message.text);
}

StandBot.prototype._isGeneralChannelMessage = function(message) {
    return message.channel === this.generalChannel.id;
}

StandBot.prototype._isNotFromStandBot = function(message) {
    return message.user !== this.self.id;
}

module.exports = StandBot;