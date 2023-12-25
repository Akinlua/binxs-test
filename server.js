const express = require("express");
const axios = require('axios')
const cors = require('cors')
const querystring = require('querystring');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(express.static("public"));
// app.use(cors())

// Set up a proxy for the HTTP API
app.use('/api/request', async (req, res, next) => {
  // Extract parameters from the original request
  const { phone } = req.query;
  let phone_

  // Check if the original value contains a space
  if(phone.includes(' ')) {
    // Replace spaces with '+'
    phone_ = phone.replace(/ /g, '+');
  } else {
    phone_ = phone
  }
  // Forward the request to the HTTP API with parameters

  // const response = await axios.get(`http://binxai.tekcify.com:4000/request?phone=${phone_}`)
  // console.log(response.data)
  createProxyMiddleware({
    target: `http://binxai.tekcify.com:4000/request?phone=${phone_}`,
    changeOrigin: true,
  })(req, res, next);
});

app.use('/api/verify', (req, res, next) => {
  // Extract parameters from the original request
  const { phone, subPlan, code} = req.query;
  let phone_
  // Check if the original value contains a space
  if(phone.includes(' ')) {
    // Replace spaces with '+'
    phone_ = phone.replace(/ /g, '+');
  } else {

    phone_ = phone
  }

  // Forward the request to the HTTP API with parameters
  createProxyMiddleware({
    target: `http://binxai.tekcify.com:4000/verify?phone=${phone_}&subscription=${subPlan}&code=${code}`,
    changeOrigin: true,
  })(req, res, next);
});



const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}\n\nhttp://localhost:${port}`);
});