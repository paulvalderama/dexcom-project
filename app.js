const express = require("express");
const session = require("express-session");
const grant = require("grant").express();
const fetch = require('node-fetch');

const app = express();


app.use(session({ secret: "grant" }));

app.use(express.static("./"));

// mount grant
app.use(
  grant({
    //origin where client server can be reached
    //login navigating to Redirect URI origin + "/connect/dexcom/callback"
    defaults: {
      origin: "https://dexcom-project1.herokuapp.com",
    },
    //authorization parameters for dexcom api, using DEXCOM_CLIENT_ID / DEXCOM_SECRET
    dexcom: {
      authorize_url: "https://sandbox-api.dexcom.com/v2/oauth2/login",
      access_url: "https://sandbox-api.dexcom.com/v2/oauth2/token",
      oauth: 2,
      key: process.env.DEXCOM_CLIENT_ID,
      secret: process.env.DEXCOM_SECRET,
      scope: ["offline_access"],
    },
  })
);

app.get("/", (req, res) => {

    // res.json(process.env)
    
    //retrieve accesstoken
    const accessToken = req.query.access_token;
    
    //redirect if accesstoken invalid
    if(!accessToken){
        return res.redirect('/connect/dexcom')
    } 
    
    //fetch sandboxapi, with 2 weeks of data 2/1/22 - 2/14/222
    fetch('https://sandbox-api.dexcom.com/v2/users/self/egvs?startDate=2022-02-01T00:00:00&endDate=2022-02-14T23:59:00', {
        method: "GET",
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    }).then(r => r.json())
    .then(data => {        
        
        //count of how many times egv was calculated
        let count = data.egvs.length;
        
        //array of egv values each day
        let valueArray = data.egvs.map(x => parseInt(x.value))

        //egv total for start to end date
        let total = valueArray.reduce((sum, a) => sum + a, 0)

        //mean of egv between start to end date
        let mean = total / count;

        //GMI Glucose Management Indicator Formula
        let gmi = (3.31 + .02392 * mean)

        //GMI Rounded to two digits
        let gmiRounded = gmi.toFixed(2)

        
        res.send(`<h1>GMI for last 14 days : ${gmiRounded}</h1>`)
    })
    .catch((error) => {
        console.log(error)
    })
});
    
const port = process.env.PORT || 4000;

app.listen(port);

// https://dexcom-project1.herokuapp.com/connect/dexcom

