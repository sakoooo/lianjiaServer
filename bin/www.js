var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var demoRouter = require("../routes/demo");
var houseRouter = require("../routes/house");

//设置中间件读取请求中json数据
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//调用router中间件
app.use("/", houseRouter);
app.use("/", demoRouter);

var server = app.listen(8090, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log("应用实例，访问地址为 http://%s:%s", host, port);
});
