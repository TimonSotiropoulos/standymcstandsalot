'use strict';

var StandBot = require('../lib/standbot');
var config = require('../config');

var token = process.env.BOT_API_KEY || config.api_token;
var name = process.env.BOT_NAME;

var standbot = new StandBot({
    token: token,
    name: name
});

standbot.run();
