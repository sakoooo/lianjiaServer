var express = require("express");
var router = express.Router();
var bodyParser = require("body-parser");
var eventproxy = require("eventproxy"); //流程控制
var ep = eventproxy();
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";
// var url = "mongodb://127.0.0.1:27017/"; // 上传到阿里云改为127.0.0.1(不知道不改行不行)

// 创建 application/x-www-form-urlencoded 编码解析
var urlencodedParser = bodyParser.urlencoded({ extended: false });
// 各区块表名
const colNameArr = [
  "baiyun",
  "conghua",
  "haizhu",
  "huadou",
  "huangpugz",
  "liwan",
  "nansha",
  "panyu",
  "tianhe",
  "yuexiu",
  "zengcheng"
];
// 各区块表名
const colName="houses";//表名

// 统计不同种类标签的数量
function Classify(data) {
  var resArr = [];
  if (!data) return false;
  var nameContainer = {}; // 针对键name进行归类的容器
  data.forEach(i => {
    i.forEach(item => {
      nameContainer[item._id] = nameContainer[item._id] || [];
      nameContainer[item._id].push(item);
    });
  });
  // 统计不同种类标签的数量
  var keyName = Object.keys(nameContainer);
  keyName.forEach(nameItem => {
    let count = 0;
    nameContainer[nameItem].forEach(item => {
      count += item.count; // 条目计算总数
    });
    resArr.push({ item: nameItem, count: count });
  });
  return resArr;
}
/****爬虫服务器后台接口*****/

/****home页面操作*****/
/**获取概览数据**/
router.post("/home/searchOverviewData", urlencodedParser, function(req, res) {
  console.log("获取概览数据");
  //请求成功
  if (req.body) {
    // 连接数据库
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("lianjiaSpider"); //数据库名
        dbo
          .collection(colName)
          .aggregate([{ $group: { _id: null, count: { $sum: 1 } } }])
          .toArray(function(err, result) {
            if (err) throw err;
            ep.emit("getHouseNum", result);
          });
          dbo
            .collection(colName)
            .aggregate([
              { $match: { unitPrice: { $ne: NaN } } },
              { $group: { _id: null, count: { $avg: "$unitPrice" } } }
            ])
            .toArray(function(err, result) {
              if (err) throw err;
              ep.emit("getUnitPrice", result);
            });
          dbo
            .collection(colName)
            .aggregate([
              { $match: { listedPrice: { $ne: NaN } } },
              { $group: { _id: null, count: { $avg: "$listedPrice" } } }
            ])
            .toArray(function(err, result) {
              if (err) throw err;
              ep.emit("getListedPrice", result);
            });
          dbo
            .collection(colName)
            .aggregate([
              { $match: { totalPrice: { $ne: NaN } } },
              { $group: { _id: null, count: { $avg: "$totalPrice" } } }
            ])
            .toArray(function(err, result) {
              if (err) throw err;
              ep.emit("getTotalPrice", result);
            });
        dbo
        .collection(colName)
        .aggregate([
          { $group: { _id: null, count: { $avg: "$size" } } }
        ])
        .toArray(function(err, result) {
          if (err) throw err;
          ep.emit("getAvgSize", result);
          db.close();
        });
      dbo
        .collection(colName)
        .aggregate([
          { $group: { _id: null, count: { $avg: "$dealPeriod" } } }
        ])
        .toArray(function(err, result) {
          if (err) throw err;
          ep.emit("getDealPeriod", result);
          db.close();
        });
    });
    ep.all("getHouseNum","getUnitPrice","getListedPrice","getTotalPrice","getAvgSize","getDealPeriod",  function(data1, data2, data3, data4, data5, data6) {
      res.send({
        data: {
          houseNum: data1[0].count ? data1[0].count : null, //房源数量(int)
            avgUnitPrice: data2[0].count ? data2[0].count : null, //平均单价(float)
            avgListedPrice: data3[0].count ? data3[0].count : null, //平均挂牌总价(float)
            avgTotalPrice: data4[0].count ? data4[0].count : null, //平均成交总价(float)
            avgSize: data5[0].count ? data5[0].count : null,
            avgDealPeriod: data6[0].count ? data6[0].count : null,
        },
        errorCode: "0", //0表示成功
        errorMsg: ""
      });
    });
  }
  //请求失败
  else {
    res.send({
      data: {},
      errorCode: "1", //0表示成功
      errorMsg: "请求失败"
    });
  }
});

/**获取饼图数据**/
router.post("/home/searchDonutData", urlencodedParser, function(req, res) {
  console.log("获取饼图数据", req.body.type);
  //请求成功
  if (req.body && req.body.type && req.body.type >= 1 && req.body.type <= 7) {
    // 连接数据库
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("lianjiaSpider"); //数据库名
      switch (req.body.type) {
         //5按电梯
         case 5:
         dbo
           .collection(colName)
           .aggregate([
             {
               $match: {
                elevator: { $ne: NaN }
               }
             },
             { $group: { _id: "$elevator", count: { $sum: 1 } },
             
            },
            { $project:{item:"$_id",count:1,_id:0}}
           ])
           .toArray(function(err, result) {
             if (err) throw err;
             res.send({
              data: {
                filterData: result[0] ? result : null
              },
              errorCode: "0", //0表示成功
              errorMsg: ""
            });
            db.close();
           });
       break;
       //6按朝向
       case 6:
       dbo
         .collection(colName)
         .aggregate([
           {
             $match: {
              toward: { $ne: NaN }
             }
           },
           { $group: { _id: "$toward", count: { $sum: 1 } },
           
          },
          { $project:{item:"$_id",count:1,_id:0}}
         ])
         .toArray(function(err, result) {
           if (err) throw err;
           res.send({
            data: {
              filterData: result[0] ? result : null
            },
            errorCode: "0", //0表示成功
            errorMsg: ""
          });
          db.close();
         });
     break;
     //7按装修
     case 7:
     dbo
       .collection(colName)
       .aggregate([
         {
           $match: {
            decoration: { $ne: NaN }
           }
         },
         { $group: { _id: "$decoration", count: { $sum: 1 } },
         
        },
        { $project:{item:"$_id",count:1,_id:0}}
       ])
       .toArray(function(err, result) {
         if (err) throw err;
         res.send({
          data: {
            filterData: result[0] ? result : null
          },
          errorCode: "0", //0表示成功
          errorMsg: ""
        });
        db.close();
       });
   break;
     default:
     dbo
     .collection(colName)
     .aggregate([
       {
         $match: {
          elevator: { $ne: NaN }
         }
       },
       { $group: { _id: "$elevator", count: { $sum: 1 } },
       
      },
      { $project:{item:"$_id",count:1,_id:0}}
     ])
     .toArray(function(err, result) {
       if (err) throw err;
       res.send({
        data: {
          filterData: result[0] ? result : null
        },
        errorCode: "0", //0表示成功
        errorMsg: ""
      });
      db.close();
     });
      }
    });
  }
  //请求失败
  else {
    res.send({
      data: {},
      errorCode: "1", //0表示成功
      errorMsg: "请求失败"
    });
  }
});

/**获取矩形树图数据**/
router.post("/home/searchTreemapData", urlencodedParser, function(req, res) {
  console.log("获取矩形树图数据");
  //请求成功
  if (req.body) {
    // 连接数据库
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("lianjiaSpider"); //数据库名
        dbo
          .collection(colName)
          .aggregate([
            { $match: { unitPrice: { $ne: NaN } } },
            { $group: { _id: "$position", count: { $avg: "$unitPrice" } } },
            {$project:{name:"$_id",value:"$count",_id:0}}
          ])
          .toArray(function(err, result) {
            if (err) throw err;
            ep.emit("getTreemapData", result);
          });
      db.close();
    });
    ep.after("getTreemapData", 1, function(data) {
      res.send({
        data: {
          filterData: {
            name: "root",
            children: data[0]?data[0]:[]
          }
        },
        errorCode: "0", //0表示成功
        errorMsg: ""
      });
    });
  }
  //请求失败
  else {
    res.send({
      data: {},
      errorCode: "1", //0表示成功
      errorMsg: "请求失败"
    });
  }
});

/**获取堆叠条形图数据**/
router.post("/home/searchStackedData", urlencodedParser, function(req, res) {
  console.log("获取堆叠条形图数据");
  //请求成功
  if (req.body) {
    // 连接数据库
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("lianjiaSpider"); //数据库名
      for (let i in colNameArr) {
        const temObj = {};
        temObj.state = colNameArr[i];
        // <=100w
        dbo
          .collection(colName)
          .aggregate([
            {
              $match: {
                totalPrice: { $ne: NaN, $lte: 100 },
                position:colNameArr[i]
              }
            },
            { $group: { _id: null, count: { $sum: 1 } } }
          ])
          .toArray(function(err, result) {
            if (err) throw err;
            temObj.lowwerThan100w = result[0] ? result[0].count : 0;
          });
        //100-150w
        dbo
          .collection(colName)
          .aggregate([
            {
              $match: {
                totalPrice: { $gt: 100, $lte: 150 },
                position:colNameArr[i]
              }
            },
            { $group: { _id: null, count: { $sum: 1 } } }
          ])
          .toArray(function(err, result) {
            if (err) throw err;
            temObj.between100_150w = result[0] ? result[0].count : 0;
          });
        // 150-200w
        dbo
          .collection(colName)
          .aggregate([
            {
              $match: {
                totalPrice: { $gt: 150, $lte: 200 },
                position:colNameArr[i]
              }
            },
            { $group: { _id: null, count: { $sum: 1 } } }
          ])
          .toArray(function(err, result) {
            if (err) throw err;
            temObj.between150_200w = result[0] ? result[0].count : 0;
          });
        //200-250w
        dbo
          .collection(colName)
          .aggregate([
            {
              $match: {
                totalPrice: { $gt: 200, $lte: 250 },
                position:colNameArr[i]
              }
            },
            { $group: { _id: null, count: { $sum: 1 } } }
          ])
          .toArray(function(err, result) {
            if (err) throw err;
            temObj.between200_250w = result[0] ? result[0].count : 0;
          });
        //250-300w
        dbo
          .collection(colName)
          .aggregate([
            {
              $match: {
                totalPrice: { $gt: 250, $lte: 300 },
                position:colNameArr[i]
              }
            },
            { $group: { _id: null, count: { $sum: 1 } } }
          ])
          .toArray(function(err, result) {
            if (err) throw err;
            temObj.between250_300w = result[0] ? result[0].count : 0;
          });
        //>=300w
        dbo
          .collection(colName)
          .aggregate([
            {
              $match: {
                totalPrice: { $ne: NaN, $gte: 300 },
                position:colNameArr[i]
              }
            },
            { $group: { _id: null, count: { $sum: 1 } } }
          ])
          .toArray(function(err, result) {
            if (err) throw err;
            temObj.higherThan300w = result[0] ? result[0].count : 0;
            ep.emit("getStackedData", temObj);
          });
      }
      db.close();
    });
    ep.after("getStackedData", colNameArr.length, function(data) {
      res.send({
        data: {
          filterData: data.map(item => {
            var obj = {
              State: item.state,
              "<100万": item.lowwerThan100w,
              "100-150万": item.between100_150w,
              "150-200万": item.between150_200w,
              "200-250万": item.between200_250w,
              "250-300万": item.between250_300w,
              ">300万": item.higherThan300w
            };
            return obj;
          })
        },
        errorCode: "0", //0表示成功
        errorMsg: ""
      });
    });
  }
  //请求失败
  else {
    res.send({
      data: {},
      errorCode: "1", //0表示成功
      errorMsg: "请求失败"
    });
  }
});

/**获取折线图数据 **/
router.post("/home/searchLineChartData", urlencodedParser, function(req, res) {
  console.log("获取折线图数据");
  //请求成功
  if (req.body) {
    // 连接数据库
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("lianjiaSpider"); //数据库名
        dbo
          .collection(colName)
          .aggregate([
            { $project: { new_time_stamp: { $substr: ["$dealDate", 0, 7] } } },
            { $group: { _id: "$new_time_stamp", count: { $sum: 1 } } },
            {$project:{item:"$_id",count:1,_id:0}}
          ])
          .toArray(function(err, result) {
            if (err) throw err;
            ep.emit("getLineChartData", result);
          });
      db.close();
    });
    ep.after("getLineChartData", 1, function(data) {
      res.send({
        data: {
          filterData: data[0]?data[0]:[]
        },
        errorCode: "0", //0表示成功
        errorMsg: ""
      });
    });
  }
  //请求失败
  else {
    res.send({
      data: {},
      errorCode: "1", //0表示成功
      errorMsg: "请求失败"
    });
  }
});

/**获取房价（总价）随面积变化趋势数据 **/
router.post("/home/searchCurvedLineChartData", urlencodedParser, function(req, res) {
  console.log("获取房价（总价）随面积变化趋势数据");
  //请求成功
  if (req.body) {
    // 连接数据库
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("lianjiaSpider"); //数据库名
        dbo
          .collection(colName)
          .aggregate([
            {
              $match: {
                totalPrice: { $ne: NaN },
                size: { $ne: NaN }
              }
            },
            { $project: { item: "$size", count: "$totalPrice" } }
          ])
          .limit(1000)
          .toArray(function(err, result) {
            if (err) throw err;
            ep.emit("getCurvedLineChartData", result);
          });
      // db.close();
    });
    ep.after("getCurvedLineChartData", 1, function(data) {
      res.send({
        data: {
          filterData: data[0]?data[0]:[]
        },
        errorCode: "0", //0表示成功
        errorMsg: ""
      });
    });
  }
  //请求失败
  else {
    res.send({
      data: {},
      errorCode: "1", //0表示成功
      errorMsg: "请求失败"
    });
  }
});


/****测试用 home页面获取饼图数据的分解接口 ****/
/**获取饼图数据-房源数量**/
router.post("/home/searchDonutData1", urlencodedParser, function(req, res) {
  console.log("获取饼图数据", req.body.type);
  //请求成功
  if (req.body && req.body.type && req.body.type >= 1 && req.body.type <= 4) {
    // 连接数据库
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("lianjiaSpider"); //数据库名
      switch (req.body.type) {
        // 1按地区房源数量
        case 1:
            dbo
              .collection(colName)
              .aggregate([{ 
                $group: { _id: "$position", count: { $sum: 1 } }
             },
              { $project:{item:"$_id",count:1,_id:0}}])
              .toArray(function(err, result) {
                if (err) throw err;
                ep.emit("getDonutData1", result);
              });
          db.close();
          break;
        default:
            ep.emit("getDonutData1", []);
      }
    });
    ep.after("getDonutData1", 1, function(data) {
      res.send({
        data: {
          filterData: data[0]?data[0]:[]
        },
        errorCode: "0", //0表示成功
        errorMsg: ""
      });
    });
  }
  //请求失败
  else {
    res.send({
      data: {},
      errorCode: "1", //0表示成功
      errorMsg: "请求失败"
    });
  }
});

/**获取饼图数据-户型**/
router.post("/home/searchDonutData2", urlencodedParser, function(req, res) {
  console.log("获取饼图数据", req.body.type);
  //请求成功
  if (req.body && req.body.type && req.body.type >= 1 && req.body.type <= 4) {
    // 连接数据库
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("lianjiaSpider"); //数据库名
      switch (req.body.type) {
        //2按户型
        case 2:
            dbo
              .collection(colName)
              .aggregate([
                {
                  $match: {
                    name: { $ne: NaN },
                    layout: { $regex: /\d室\d厅/ }
                  }
                },
                { $group: { _id: "$layout", count: { $sum: 1 } },
                
               },
               { $project:{item:"$_id",count:1,_id:0}}
              ])
              .toArray(function(err, result) {
                if (err) throw err;
                ep.emit("getDonutData2", result);
              });
          db.close();
          break;
        default:
            ep.emit("getDonutData2", []);
      }
    });
    ep.after("getDonutData2", 1, function(data) {
      res.send({
        data: {
          filterData: data[0]?data[0]:[]
        },
        errorCode: "0", //0表示成功
        errorMsg: ""
      });
    });
  }
  //请求失败
  else {
    res.send({
      data: {},
      errorCode: "1", //0表示成功
      errorMsg: "请求失败"
    });
  }
});

/**获取饼图数据-价格**/
router.post("/home/searchDonutData3", urlencodedParser, function(req, res) {
  console.log("获取饼图数据", req.body.type);
  //请求成功
  if (req.body && req.body.type && req.body.type >= 1 && req.body.type <= 4) {
    // 连接数据库
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("lianjiaSpider"); //数据库名
      switch (req.body.type) {
        //3按价格区间
        case 3:
          for (let i in colNameArr) {
            const temArr = [];
            // <=100w
            dbo
              .collection(colName)
              .aggregate([
                {
                  $match: {
                    totalPrice: { $ne: NaN, $lte: 100 },
                    position:colNameArr[i]
                  }
                },
                { $group: { _id: null, count: { $sum: 1 } } }
              ])
              .toArray(function(err, result) {
                if (err) throw err;
                if (result[0]) result[0]._id = "100万以下";
                temArr.push(
                  result[0] ? result[0] : { _id: "100万以下", count: 0 }
                );
              });
            //100-150w
            dbo
              .collection(colName)
              .aggregate([
                {
                  $match: {
                    totalPrice: { $gt: 100, $lte: 150 },
                    position:colNameArr[i]
                  }
                },
                { $group: { _id: null, count: { $sum: 1 } } }
              ])
              .toArray(function(err, result) {
                if (err) throw err;
                if (result[0]) result[0]._id = "100万-150万";
                temArr.push(
                  result[0] ? result[0] : { _id: "100万-150万", count: 0 }
                );
              });
            // 150-200w
            dbo
              .collection(colName)
              .aggregate([
                {
                  $match: {
                    totalPrice: { $gt: 150, $lte: 200 },
                    position:colNameArr[i]
                  }
                },
                { $group: { _id: null, count: { $sum: 1 } } }
              ])
              .toArray(function(err, result) {
                if (err) throw err;
                if (result[0]) result[0]._id = "150万-200万";
                temArr.push(
                  result[0] ? result[0] : { _id: "150万-200万", count: 0 }
                );
              });
            //200-250w
            dbo
              .collection(colName)
              .aggregate([
                {
                  $match: {
                    totalPrice: { $gt: 200, $lte: 250 },
                    position:colNameArr[i]
                  }
                },
                { $group: { _id: null, count: { $sum: 1 } } }
              ])
              .toArray(function(err, result) {
                if (err) throw err;
                if (result[0]) result[0]._id = "200万-250万";
                temArr.push(
                  result[0] ? result[0] : { _id: "200万-250万", count: 0 }
                );
              });
            //250-300w
            dbo
              .collection(colName)
              .aggregate([
                {
                  $match: {
                    totalPrice: { $gt: 250, $lte: 300 },
                    position:colNameArr[i]
                  }
                },
                { $group: { _id: null, count: { $sum: 1 } } }
              ])
              .toArray(function(err, result) {
                if (err) throw err;
                if (result[0]) result[0]._id = "250万-300万";
                temArr.push(
                  result[0] ? result[0] : { _id: "250万-300万", count: 0 }
                );
              });
            //>=300w
            dbo
              .collection(colName)
              .aggregate([
                {
                  $match: {
                    totalPrice: { $ne: NaN, $gte: 300 },
                    position:colNameArr[i]
                  }
                },
                { $group: { _id: null, count: { $sum: 1 } } }
              ])
              .toArray(function(err, result) {
                if (err) throw err;
                if (result[0]) result[0]._id = "大于300万";
                temArr.push(
                  result[0] ? result[0] : { _id: "大于300万", count: 0 }
                );
                ep.emit("getDonutData3", temArr);
              });
          }
          db.close();
          break;
        default:
          for (let i = 0; i < colNameArr.length; i++) {
            ep.emit("getDonutData3", []);
          }
      }
    });
    ep.after("getDonutData3", colNameArr.length, function(data) {
      var resArr = []; //最终数据
      if (req.body.type !== 2 && req.body.type !== 3 && req.body.type !== 4) {
        resArr = data.slice();
      } else {
        resArr = Classify(data);
      }
      res.send({
        data: {
          filterData: resArr
        },
        errorCode: "0", //0表示成功
        errorMsg: ""
      });
    });
  }
  //请求失败
  else {
    res.send({
      data: {},
      errorCode: "1", //0表示成功
      errorMsg: "请求失败"
    });
  }
});

/**获取饼图数据-面积**/
router.post("/home/searchDonutData4", urlencodedParser, function(req, res) {
  console.log("获取饼图数据", req.body.type);
  //请求成功
  if (req.body && req.body.type && req.body.type >= 1 && req.body.type <= 4) {
    // 连接数据库
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("lianjiaSpider"); //数据库名
      switch (req.body.type) {
        //4按面积
        case 4:
          for (let i in colNameArr) {
            const temArr = [];
            // <=40
            dbo
              .collection(colName)
              .aggregate([
                {
                  $match: {
                    size: { $ne: NaN, $lte: 40 },
                    position:colNameArr[i]
                  }
                },
                { $group: { _id: null, count: { $sum: 1 } } },
                
              ])
              .toArray(function(err, result) {
                if (err) throw err;
                if (result[0]) result[0]._id = "40平以下";
                temArr.push(
                  result[0] ? result[0] : { _id: "40平以下", count: 0 }
                );
              });
            //40-60
            dbo
              .collection(colName)
              .aggregate([
                {
                  $match: {
                    size: { $gt: 40, $lte: 60 },
                    position:colNameArr[i]
                  }
                },
                { $group: { _id: null, count: { $sum: 1 } } }
              ])
              .toArray(function(err, result) {
                if (err) throw err;
                if (result[0]) result[0]._id = "40平-60平";
                temArr.push(
                  result[0] ? result[0] : { _id: "40平-60平", count: 0 }
                );
              });
            // 60-80
            dbo
              .collection(colName)
              .aggregate([
                {
                  $match: {
                    size: { $gt: 60, $lte: 80 },
                    position:colNameArr[i]
                  }
                },
                { $group: { _id: null, count: { $sum: 1 } } }
              ])
              .toArray(function(err, result) {
                if (err) throw err;
                if (result[0]) result[0]._id = "60平-80平";
                temArr.push(
                  result[0] ? result[0] : { _id: "60平-80平", count: 0 }
                );
              });
            //80-100
            dbo
              .collection(colName)
              .aggregate([
                {
                  $match: {
                    size: { $gt: 80, $lte: 100 },
                    position:colNameArr[i]
                  }
                },
                { $group: { _id: null, count: { $sum: 1 } } }
              ])
              .toArray(function(err, result) {
                if (err) throw err;
                if (result[0]) result[0]._id = "80平-100平";
                temArr.push(
                  result[0] ? result[0] : { _id: "80平-100平", count: 0 }
                );
              });
            //100-120
            dbo
              .collection(colName)
              .aggregate([
                {
                  $match: {
                    size: { $gt: 100, $lte: 120 },
                    position:colNameArr[i]
                  }
                },
                { $group: { _id: null, count: { $sum: 1 } } }
              ])
              .toArray(function(err, result) {
                if (err) throw err;
                if (result[0]) result[0]._id = "100平-120平";
                temArr.push(
                  result[0] ? result[0] : { _id: "100平-120平", count: 0 }
                );
              });
            //>=120
            dbo
              .collection(colName)
              .aggregate([
                {
                  $match: {
                    size: { $ne: NaN, $gte: 120 },
                    position:colNameArr[i]
                  }
                },
                { $group: { _id: null, count: { $sum: 1 } } }
              ])
              .toArray(function(err, result) {
                if (err) throw err;
                if (result[0]) result[0]._id = "大于120平";
                temArr.push(
                  result[0] ? result[0] : { _id: "大于120平", count: 0 }
                );
                ep.emit("getDonutData4", temArr);
              });
          }
          db.close();
          break;
        default:
          for (let i = 0; i < colNameArr.length; i++) {
            ep.emit("getDonutData4", []);
          }
      }
    });
    ep.after("getDonutData4", colNameArr.length, function(data) {
      var resArr = []; //最终数据
      if (req.body.type !== 2 && req.body.type !== 3 && req.body.type !== 4) {
        resArr = data.slice();
      } else {
        resArr = Classify(data);
      }
      res.send({
        data: {
          filterData: resArr
        },
        errorCode: "0", //0表示成功
        errorMsg: ""
      });
    });
  }
  //请求失败
  else {
    res.send({
      data: {},
      errorCode: "1", //0表示成功
      errorMsg: "请求失败"
    });
  }
});

/**获取装修与平均单价关系图数据**/
router.post("/home/searchDecorPriceData", urlencodedParser, function(
  req,
  res
) {
  console.log("获取装修与平均成交价关系图数据");
  //请求成功
  if (req.body) {
    // 连接数据库
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("lianjiaSpider"); //数据库名
      dbo
        .collection(colName)
        .aggregate([
          {
            $match: {
              unitPrice: { $ne: NaN }
            }
          },
          {$group:{_id:"$decoration",count:{$avg:"$unitPrice"}}},
          { $project: { item: "$_id", count:1,_id:0 } }
        ])
        .toArray(function(err, result) {
          if (err) throw err;
          ep.emit("getDecorPriceData", result);
        });
    });
    ep.all("getDecorPriceData", function(data1) {
      res.send({
        data: {
          filterData: data1[0] ? data1 : null
        },
        errorCode: "0", //0表示成功
        errorMsg: ""
      });
    });
  }
  //请求失败
  else {
    res.send({
      data: {},
      errorCode: "1", //0表示成功
      errorMsg: "请求失败"
    });
  }
});

/**获取装修与价格箱型图数据**/
router.post("/home/searchDecorBoxData", urlencodedParser, function(
  req,
  res
) {
  console.log("获取装修与价格箱型图数据");
  //请求成功
  if (req.body) {
    // 连接数据库
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("lianjiaSpider"); //数据库名
      dbo
        .collection(colName)
        .aggregate([
          {
            $match: {
              unitPrice: { $ne: NaN,$ne: 0 }
            }
          },
          {$group:{_id:"$decoration",low:{$min:"$unitPrice"},high:{$max:"$unitPrice"},array:{$push:"$unitPrice"}}},
          { $project: { x:"$_id",low: 1, high:1 ,array:1,_id:0} },
        ])
        .toArray(function(err, result) {
          if (err) throw err;
          const temArr=result.map(item=>({
            x:item.x,
            low:item.low,
            high:item.high,
            q3:item.array.sort()[parseInt(item.array.length/4*3)],
            q1:item.array.sort()[parseInt(item.array.length/4)],
            median:item.array.length%2===0? (item.array.sort()[parseInt(item.array.length/2)]+item.array.sort()[parseInt(item.array.length/2+1)])/2:item.array.sort()[parseInt((item.array.length+1)/2)]
          }));
          ep.emit("getDecorBoxData1", temArr);
        });
    });
    ep.all("getDecorBoxData1", function(data) {
      res.send({
        data: {
          filterData: data[0] ? data : null
        },
        errorCode: "0", //0表示成功
        errorMsg: ""
      });
    });
  }
  //请求失败
  else {
    res.send({
      data: {},
      errorCode: "1", //0表示成功
      errorMsg: "请求失败"
    });
  }
});

module.exports = router;
