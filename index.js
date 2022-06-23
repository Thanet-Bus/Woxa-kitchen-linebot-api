const https = require("https");
const express = require("express");
const middleware = require("@line/bot-sdk").middleware;
const JSONParseError = require("@line/bot-sdk").JSONParseError;
const SignatureValidationFailed =
  require("@line/bot-sdk").SignatureValidationFailed;

const app = express();
const port = process.env.PORT || 4000;
const cors = require("cors");

const config = {
  channelAccessToken:
    "VGiLhUm7XgQc1PTql/7G3Hmtb6dcuH4qsIjujHuXRuNzNfKYcvY9Y/LUVtSDLedp7uX9ItH8FvGwRmqwjRLKPU1ts3z1b1oE6qRrLDh/zJQvVGAdHvS6nbVgmfY2NwA1r+nKspZRomAMbhDaY15h6QdB04t89/1O/w1cDnyilFU=",
  channelSecret: "bff52c61db6e0894bfeda1147f2366ed",
};

let TOKEN =
  "VGiLhUm7XgQc1PTql/7G3Hmtb6dcuH4qsIjujHuXRuNzNfKYcvY9Y/LUVtSDLedp7uX9ItH8FvGwRmqwjRLKPU1ts3z1b1oE6qRrLDh/zJQvVGAdHvS6nbVgmfY2NwA1r+nKspZRomAMbhDaY15h6QdB04t89/1O/w1cDnyilFU=";

app.use("/reject-order" || "/finished-order", express.json());

// differnt port request each other
const corsOptions = {
  origin: ["http://localhost:3000", "https://woxa-food-order.herokuapp.com"],
  credentials: true,
};
app.use(cors(corsOptions));

app.get("/", function (req, res) {
  res.send("Linebot API");
});

//reject user order
app.post("/reject-order", function (req, res) {
  let dataString;
  dataString = JSON.stringify({
    to: req.body.id,
    messages: [
      {
        type: "text",
        text: "ตอนนี้ไม่มีเมนู " + req.body.order + " สั่งเมนูใหม่ได้นะ",
      },
    ],
  });
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + TOKEN,
  };
  const webhookOptions = {
    hostname: "api.line.me",
    path: "/v2/bot/message/push",
    method: "POST",
    headers: headers,
    body: dataString,
  };

  // Define request
  const request = https.request(webhookOptions, (res) => {
    res.on("data", (d) => {
      process.stdout.write(d);
    });
  });

  // Handle error
  request.on("error", (err) => {
    console.error(err);
  });

  // Send data
  request.write(dataString);
  request.end();
  res.send("sent message");
});

// Send message to user who ordered
app.post("/finished-order", function (req, res) {
  let dataString;
  dataString = JSON.stringify({
    to: req.body.id,
    messages: [
      {
        type: "text",
        text: req.body.order + "ที่สั่งเสร็จแล้วนะ",
      },
    ],
  });
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + TOKEN,
  };
  const webhookOptions = {
    hostname: "api.line.me",
    path: "/v2/bot/message/push",
    method: "POST",
    headers: headers,
    body: dataString,
  };

  // Define request
  const request = https.request(webhookOptions, (res) => {
    res.on("data", (d) => {
      process.stdout.write(d);
    });
  });

  // Handle error
  request.on("error", (err) => {
    console.error(err);
  });

  // Send data
  request.write(dataString);
  request.end();
  res.send("sent message");
});

app.use("/webhook", middleware(config));

// Waiting user response to send reply message
app.post("/webhook", function (req, res) {
  res.send("HTTP POST request sent to the webhook URL!");
  if (req.body.events[0].type === "message") {
    // Message data, must be stringified
    let userId = req.body.events[0].source.userId;
    console.log(req.body.events[0]);
    var dataString;
    if (
      req.body.events[0].message.type === "text" &&
      req.body.events[0].message.text === "ขอดูเมนูอาหาร"
    ) {
      dataString = JSON.stringify({
        replyToken: req.body.events[0].replyToken,
        messages: [
          {
            type: "text",
            text: "นี่เลย!!! เมนูของร้านเรา",
          },
          {
            type: "image",
            //TODO: find menu image url
            originalContentUrl:
              "https://i.postimg.cc/Nj9kPtkF/received-987379918437359.jpg",
            previewImageUrl:
              "https://i.postimg.cc/Nj9kPtkF/received-987379918437359.jpg",
          },
        ],
      });
    } else {
      dataString = JSON.stringify({
        replyToken: req.body.events[0].replyToken,
        messages: [
          {
            type: "text",
            text: "ถ้าอยากสั่งข้าวกดปุ่มสั่งอาหารด้านล่างเลยครับ หรือถ้าอยากจะดูเมนูก่อนก็กดดูเมนูได้เลยนะ",
          },
        ],
      });
    }
    // Request header
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + TOKEN,
    };

    // Options to pass into the request
    const webhookOptions = {
      hostname: "api.line.me",
      path: "/v2/bot/message/reply",
      method: "POST",
      headers: headers,
      body: dataString,
    };

    // Define request
    const request = https.request(webhookOptions, (res) => {
      res.on("data", (d) => {
        process.stdout.write(d);
      });
    });

    // Handle error
    request.on("error", (err) => {
      console.error(err);
    });

    // Send data
    request.write(dataString);
    request.end();
  }
});

app.use((err, res, next) => {
  if (err instanceof SignatureValidationFailed) {
    res.status(401).send(err.signature);
    return;
  } else if (err instanceof JSONParseError) {
    res.status(400).send(err.raw);
    return;
  }
  next(err); // will throw default 500
});

console.log("webhook is running");
app.listen(port);
