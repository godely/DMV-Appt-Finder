'use strict';

const Browser = require("zombie");
const fs = require('fs');
const async = require('async');
const config = require('./config.js');

const REGEX_PAT = /The first available appointment for this office is on: (.*)If you want to search for another date or time/;

function checkLocation(location, idx, next) {
  let browser = new Browser({
    waitDuration: 30*1000
  });
  if (idx > 0) {
    console.log("<------------------------>");
  }
  console.log("Trying <" + location[1] + ">");
  browser.visit(config.url, (err) => {
    if (err) {
      console.log(err)
      return next()
    }
    browser.select("officeId",location[0]);
    browser.check("taskCID")
    browser.choose("numberItems","2")
    browser.fill("firstName",config.firstName)
    browser.fill("lastName",config.lastName)
    browser.fill("telArea",config.tel[0])
    browser.fill("telPrefix",config.tel[1])
    browser.fill("telSuffix",config.tel[2])
    browser.pressButton('input[value="Continue"]', function(err) {
      if (browser.text("title") != 'Appointment') {
        console.log("Will try again later.")
        return next();
      }
      try {
        console.log(REGEX_PAT.exec(browser.text())[1]);
      } catch (e) {
        console.log('Not available.');
      }
      return next();
    });
  });
}

function loopThroughWithTimer(waitInterval, callback) {
  async.forEachOfSeries(config.locations, (loc, idx, cb) => {
    checkLocation(loc, idx, cb);
  }, (err) => {
    setTimeout(callback, waitInterval);
  });
}

async.forever(
  (next) => {
    loopThroughWithTimer(config.intervalMinutes * 60 * 1000, next);
  },
  (err) => {
    console.log(err);
  },
)
