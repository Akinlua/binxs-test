publicKey = "pk_test_c720d983a1e01efbbe84667533e75c04271c0a22";
live = "pk_live_4da031073850b87031bc9783119a7d35362cbb69";

let amount = 300000;
const urlParams = new URLSearchParams(window.location.search);
const plan = urlParams.get("plan")?.toLowerCase() || "basic";
const pls = document.getElementById("plan_show");
var sentOtp = false;
btn = document.getElementById("continueBtn");
subPlan = "Basic";
btnText = "Continue";
hasPaid = false;

const cookieName = "hasSubscribed";
const cookieName2 = "sub_number";
const cookieName3 = "hasSubscribedTruly";
const cookies = document.cookie.split(";");

let cookieValue = null;
let subNumber = null;
let hasSubscribedTruly = null;
for (let i = 0; i < cookies.length; i++) {
  const cookie = cookies[i].trim();
  if (cookie.startsWith("hasSubscribed=")) {
    cookieValue = cookie.substring(cookieName.length + 1);
    break;
  }
}
for (let i = 0; i < cookies.length; i++) {
  const cookie = cookies[i].trim();
  if (cookie.startsWith("sub_number=")) {
    subNumber = cookie.substring(cookieName2.length + 1);
    break;
  }
}
for (let i = 0; i < cookies.length; i++) {
  const cookie = cookies[i].trim();
  if (cookie.startsWith("hasSubscribedTruly=")) {
    hasSubscribedTruly = cookie.substring(cookieName3.length + 1);
    break;
  }
}

switch (plan) {
  case "basic":
    amount = 300000;
    pls.innerHTML = "You have chosen a basic plan";
    subPlan = "Basic";
    break;
  case "premium":
    amount = 500000;
    pls.innerHTML = "You have chosen a premium premium plan";
    subPlan = "Premium";
    break;
  default:
    amount = 300000;
    pls.innerHTML = "You have chosen a basic plan";
    subPlan = "Basic";
    break;
}

function payWithPaystack(email, phone, amount, name, plan) {
  var handler = PaystackPop.setup({
    key: publicKey,
    email: email,
    amount: amount,
    currency: "NGN",
    ref: "" + Math.floor(Math.random() * 1000000000 + 1),
    callback: function (response) {
      const currentDate = new Date();
      const options = { day: "numeric", month: "short", year: "numeric" };
      const formattedDate = currentDate.toLocaleDateString("en-US", options);

      console.log(response);

      Swal.fire({
        icon: "success",
        title: "Payment complete!",
        text: "Reference: " + response.reference,
      }).then((value) => {
        hasPaid = true;
        btn.disabled = true;
        btnText = "Please wait...";
        btn.innerHTML = btnText;
        document.cookie =
          "hasSubscribed=true; expires=" +
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString() +
          "; path=/";
        document.cookie =
          "sub_number=" +
          phone +
          "; expires=" +
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString() +
          "; path=/";
        // const apiUrl = `http://binxai.tekcify.com:4000/request?phone=${phone}`;
        const apiUrl = `/api/request?phone=${phone}`;


        // Make a GET request to the API
        fetch(apiUrl)
          .then((response) => response.json())
          .then((data) => {
            console.log(data)
            if (data.successful === "Open Your WhatsApp!") {
              document.getElementById("otp-div").classList.remove("d-none");

              Swal.fire({
                icon: "success",
                title: "Code Sent",
                text: "OTP code have been sent to your whatsapp!",
              }).then((value) => {
                btn.disabled = false;
                btnText = "Continue";
                btn.innerHTML = btnText;
                sentOtp = true;
              });
            } else if (data.cooldown) {
              Swal.fire({
                icon: "info",
                title: "Cooldown",
                text: data.cooldown,
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "Invalid Whatsapp Number",
                text: "Oopps! Seems you provided an invalid WhatsApp number",
              }).then((value) => {
                btn.disabled = false;
                btnText = "Continue";
                btn.innerHTML = btnText;
                sentOtp = false;
              });
            }
            console.log(data);
          })
          .catch((error) => {
            // Handle any errors
            console.error(error);
          });
      });
    },
    onClose: function () {
      Swal.fire({
        icon: "error",
        title: "Transaction not completed!",
        text: "Window closed.",
      });
    },
  });
  handler.openIframe();
}
const phoneField = document.getElementById("phoneNumber");
phoneField.addEventListener("input", function (event) {
  const inputValue = event.target.value;
  const numericValue = inputValue.replace(/\D/g, "");

  event.target.value = numericValue;
});
// Add event listener to the form submit event
document
  .getElementById("paymentForm")
  .addEventListener("submit", function (event) {
    const fname = document.getElementById("firstName").value;
    const lname = document.getElementById("lastName").value;
    const name = fname + " " + lname;
    const email = document.getElementById("email").value;
    const phone = document
      .getElementById("phoneNumber")
      .value.replace(/^0+/, "");
    const countryCode = document.getElementById("countryCode").value;
    const otp = document.getElementById("otp-div");
    const otpValue = document.getElementById("otp").value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      fname.trim() !== "" &&
      lname.trim() !== "" &&
      phone.trim() !== "" &&
      emailRegex.test(email)
    ) {
      // Display the OTP input field
      event.preventDefault();

      const phoneNumber = countryCode + phone.trim();
      if (
        cookieValue == "true" &&
        (subNumber == phoneNumber) & (hasSubscribedTruly == "true")
      ) {
        Swal.fire({
          icon: "info",
          title: "Duplicate Subscription",
          text: "Seems this number has been subscribed already, please try different number!",
        });
      } else {
        if (!hasPaid && subNumber != phoneNumber) {
          payWithPaystack(email, phoneNumber, amount, plan);
        }
      }
      if (
        (hasPaid && subNumber != phoneNumber) ||
        (hasPaid && !hasSubscribedTruly)
      ) {
        if (!sentOtp) {
          btn.disabled = true;
          btnText = "Please wait...";
          btn.innerHTML = btnText;
          document.cookie =
            "hasSubscribed=true; expires=" +
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString() +
            "; path=/";
          document.cookie =
            "sub_number=" +
            phone +
            "; expires=" +
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString() +
            "; path=/";
          // const apiUrl = `http://binxai.tekcify.com:4000/request?phone=${phone}`;
          const apiUrl = `/api/request?phone=${phone}`;


          // Make a GET request to the API
          fetch(apiUrl)
            .then((response) => response.json())
            .then((data) => {
            console.log(data)
            
              if (data.successful === "Open Your WhatsApp!") {
                document.getElementById("otp-div").classList.remove("d-none");

                Swal.fire({
                  icon: "success",
                  title: "Code Sent",
                  text: "OTP code have been sent to your whatsapp!",
                }).then((value) => {
                  btn.disabled = false;
                  btnText = "Continue";
                  btn.innerHTML = btnText;
                  sentOtp = true;
                });
              } else if (data.cooldown) {
                Swal.fire({
                  icon: "info",
                  title: "Cooldown",
                  text: data.cooldown,
                });
              } else {
                Swal.fire({
                  icon: "error",
                  title: "Invalid Whatsapp Number",
                  text: "Oopps! Seems you provided an invalid WhatsApp number",
                }).then((value) => {
                  btn.disabled = false;
                  btnText = "Continue";
                  btn.innerHTML = btnText;
                  sentOtp = false;
                });
              }
              console.log(data);
            })
            .catch((error) => {
              // Handle any errors
              console.error(error);
            });
        }
      } else if (
        hasPaid &&
        subNumber == phoneNumber &&
        hasSubscribedTruly == "true"
      ) {
        Swal.fire({
          icon: "info",
          title: "Duplicate Subscription",
          text: "Seems this number has been subscribed already, please try different number!",
        });
      }
    }
  });

btn.addEventListener("click", () => {
  const otpValue = document.getElementById("otp").value;
  const phone = document.getElementById("phoneNumber").value.replace(/^0+/, "");
  const countryCode = document.getElementById("countryCode").value;
  const phoneNumber = countryCode.replace("+", "") + phone.trim();
  if (sentOtp) {
    if (otpValue.length < 6) {
      Swal.fire({
        icon: "error",
        title: "Invalid or Expired Code",
        text: "The OTP code is invalid or has expired. Please check again",
      });
    } else {
      // const apiUrl = `http://binxai.tekcify.com:4000/verify?phone=${phoneNumber}&subscription=${subPlan}&code=${otpValue.trim()}`;
      const apiUrl = `/api/verify?phone=${phoneNumber}&subscription=${subPlan}&code=${otpValue.trim()}`;


      fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
          console.log(data)

          if (data.failed === "Invalid or Expired Code") {
            Swal.fire({
              icon: "error",
              title: "Invalid or Expired Code",
              text: "The OTP code is invalid or has expired.",
            });
          } else if (data.successful.startsWith("Congratulations")) {
            Swal.fire({
              icon: "info",
              title: "Congratulations 🎊",
              text: `You are now registered as ${subPlan} user.`,
            }).then((value) => {
              document.cookie =
                "hasSubscribedTruly=true; expires=" +
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString() +
                "; path=/";
              window.location.href =
                "https://wa.me/2349057642334?text=Hello%20Binx%20AI";
            });
          }
          console.log(data);
        })
        .catch((error) => {
          // Handle any errors
          console.error(error);
        });
    }
  }
});
