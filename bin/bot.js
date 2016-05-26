'use strict';

var StandBot = require('../lib/standbot');

var token = process.env.BOT_API_KEY || 'xoxb-45589412551-v9QEhgQTBLYP9I2QVAYJrKwU';
var name = process.env.BOT_NAME;

var standbot = new StandBot({
    token: token,
    name: name
});

standbot.run();
