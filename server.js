require('dotenv').config()
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const querystring = require("querystring");
const { createProxyMiddleware } = require("http-proxy-middleware");
const dateFns = require('date-fns');
const { differenceInDays } = require('date-fns');
const bodyParser = require('body-parser')

const connectDB = require('./db')
const User = require('./model') 

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

// app.use(cors())

// Set up a proxy for the HTTP API
app.get("/api/request", async (req, res, next) => {
  // Extract parameters from the original request
  const { phone } = req.query;
  let phone_;

  // Check if the original value contains a space
  if (phone.includes(" ")) {
    // Replace spaces with '+'
    phone_ = phone.replace(/ /g, "+");
  } else {
    phone_ = phone;
  }
  // Forward the request to the HTTP API with parameters
  try{
    const response = await axios.get(
      `http://binxai.tekcify.com:4000/request?phone=${phone_}`,
    );
    console.log(response.data);
    res.json(response.data);

  } catch (error){
    console.log(error);
    console.log("check:", error.response.data);
    res.json(error.response.data);
  }
  

  // createProxyMiddleware({
  //   target: `http://binxai.tekcify.com:4000/request?phone=${phone_}`,
  //   changeOrigin: true,
  // })(req, res, next);
});

app.get("/api/verify", async (req, res, next) => {
  // Extract parameters from the original request
  const { phone, subscription, code } = req.query;
  console.log(req.query);
  console.log(
    `http://binxai.tekcify.com:4000/verify?phone=${phone}&subscription=${subscription}&code=${code}`,
  );
  try {
    const response = await axios.get(
      `http://binxai.tekcify.com:4000/verify?phone=${phone}&subscription=${subscription}&code=${code}`,
    );
    console.log("checkssss");

    console.log(response.data);
    res.json(response.data);
  } catch (error) {
    console.log(error);
    console.log("check:", error.response.data);
    res.json(error.response.data);
  }

  // Forward the request to the HTTP API with parameters
  // createProxyMiddleware({
  //   target: `http://binxai.tekcify.com:4000/verify?phone=${phone_}&subscription=${subPlan}&code=${code}`,
  //   changeOrigin: true,
  // })(req, res, next);
});

// middlewares
const convert_date = (today) => {
  // let today = new Date();
  let dd = String(today.getDate()).padStart(2, '0');
  let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  let yyyy = today.getFullYear();

  today = yyyy + '-' + mm + '-' + dd;

  return today
}

function add30Days(givenDate, no_of_days) {
  let addedDate = dateFns.addDays(givenDate, no_of_days);
  return addedDate;
 }



// function to check if the given date is within 30 days before the specific date
function isWithin30DaysBefore(givenDate, specificDate) {
 // check if the given date is before the specific date
 if (dateFns.isBefore(givenDate, specificDate)) {
    // calculate the difference in days between the given date and the specific date
    let diffInDays = dateFns.differenceInDays(specificDate, givenDate);

    // check if the difference is within 30 days
    if (diffInDays <= 30) {
      return true;
    }
 }

 return false;
}

function howManyDaysPast(currentDate, pastDate){

    let numberOfDays = differenceInDays(currentDate, pastDate);

    return numberOfDays
}

app.post('/api/users', async (req, res) => {
  const {email, subscription, phone } = req.body
  console.log(req.body)

  //get expiry dagte
  let today = new Date();
  const date_30 = add30Days(today, 30)
  const date = convert_date(date_30)
  const date2 = convert_date(today)

  let phone_ = phone.replace('+', '');
  console.log(phone_)

  const user = await User.create({
    email, subscription, phone_number:phone_,
    expiry_dae: date,
    date_paid: date2
  })

  res.json({
    status: 201,
    success: true
  })

})

app.get('/api/get_amount', async (req, res) => {

  // api url only for premium subscriotion payments
    const {phone, plan} = req.query
    const phone_ = phone.trim()
    console.log(phone_)
    
    console.log(req.query)
    if(!phone || !plan){
      return res.json({
        status: 404,
        amount: -20,
        failed: true,
        message: "phone field and plan filled must not be empty"
      })
    }
    if(plan != "Premium"){
      return res.json({
        status: 404,
        amount: -20,
        failed: true,
        message: "Only Premium plans allowed"
      })
    }

    const user = await User.find({phone_number: phone.trim(), subscription: "Basic"}).sort("-createdAt")
    
    if(user.length <= 0){
      return res.json({
        status: 404,
        failed: false,
        amount: 600000//use normal amount
      })
    }

    let user_subscription = {}
    for(const i of user){
        //check and get the user subscription that is not expired
        let date_ = new Date(); // today's date
        const date = convert_date(date_)
        let givenDate = new Date(date);
        let specificDate = new Date(i.expiry_dae);
        const isWithin = isWithin30DaysBefore(givenDate, specificDate)
        if(isWithin == true){
          user_subscription = i
          break
        }
    }

    if(Object.keys(user_subscription).length === 0){
      // if no undergoing user subscription found
      return res.json({
        status: 404,
        failed: false,
        amount: 600000//use normal amount
      })
    }

    //upgrade to premium and chaneg amount
    let date_ = new Date()
    let currentDate_ = convert_date(date_)
    let currentDate = new Date(currentDate_);
    let pastDate = new Date(user_subscription.date_paid)

    const no_days_used = howManyDaysPast(currentDate, pastDate)
    console.log(no_days_used)
    // calculate amount used from 3k
    const amount_used_up = 100 * no_days_used
    const amount_left_Basic = 3000-amount_used_up
    const amount_to_pay_Premium = 6000 - amount_left_Basic
    const total_Amount = amount_to_pay_Premium

    res.json({
      status: 200,
      amount: total_Amount * 100, //in kobo
      failed: false,
    })
    
})



app.get('/api/confirm', async (req, res) => {

  // api url only for premium subscriotion payments
    const {phone, plan} = req.query
    const phone_ = phone.trim()
    console.log(phone_)
    console.log(phone_)

    
    console.log(req.query)
    if(!phone || !plan){
      return res.json({
        status: 404,
        failed: true,
        message: "phone field and plan filled must not be empty"
      })
    }

    const user_basic = await User.find({phone_number: phone.trim(), subscription: "Basic"}).sort("-createdAt")
    const user_premium = await User.find({phone_number: phone.trim(), subscription: "Premium"}).sort("-createdAt")


    let user_subscription_basic = {}
    for(const i of user_basic){
        //check and get the user subscription that is not expired
        let date_ = new Date(); // today's date
        const date = convert_date(date_)
        let givenDate = new Date(date);
        let specificDate = new Date(i.expiry_dae);
        const isWithin = isWithin30DaysBefore(givenDate, specificDate)
        if(isWithin == true){
          user_subscription_basic = i
          break
        }
    }

    let user_subscription_premium = {}

    for(const i of user_premium){
      //check and get the user subscription that is not expired
      let date_ = new Date(); // today's date
      const date = convert_date(date_)
      let givenDate = new Date(date);
      let specificDate = new Date(i.expiry_dae);
      const isWithin = isWithin30DaysBefore(givenDate, specificDate)
      if(isWithin == true){
        user_subscription_premium = i
        break
      }
    }

    let paid = false
    let otp;

    if(plan == "Basic"){
      if(Object.keys(user_subscription_basic).length > 0 || Object.keys(user_subscription_premium).length > 0){
        paid = true
      }
      if(Object.keys(user_subscription_basic).length > 0){
        otp = user_subscription_basic.otp
      } else {
        otp = true
      }
      if(Object.keys(user_subscription_premium).length > 0){
        otp = true
      }
    }

    if(plan == "Premium"){
      if(Object.keys(user_subscription_premium).length > 0){
        paid = true
      }
      if(Object.keys(user_subscription_premium).length > 0){
        otp = user_subscription_premium.otp
      } else {
        otp = true
      }
    }
    

    res.json({
      status: 200,
      failed: false,
      paid: paid,
      otp: otp
    })
    
})


app.post('/api/set_otp', async ( req, res) => {
  const {phone, plan} = req.body


  let phone_ = phone.replace('+', '');
  console.log(phone_)

  const user = await User.find({phone_number: phone_, subscription: plan})

  let user_subscription = {}
  for(const i of user){
      //check and get the user subscription that is not expired
      let date_ = new Date(); // today's date
      const date = convert_date(date_)
      let givenDate = new Date(date);
      let specificDate = new Date(i.expiry_dae);
      const isWithin = isWithin30DaysBefore(givenDate, specificDate)
      if(isWithin == true){
        user_subscription = i
        break
      }
  }

  const id = user_subscription._id

  const set_otp = await User.findOneAndUpdate({_id: id}, {otp: true})

  res.json({
    status: 200,
    message: "Otp Successfully Sent"
  })

})

const port = 3001;
app.listen(port, async () => {
  //connect DB
  await connectDB()
  console.log(`Server is running on port ${port}\n\nhttp://localhost:${port}`);
});



