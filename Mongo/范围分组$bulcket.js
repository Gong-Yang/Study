// bucket和bucketAuto 是 MongoDB 聚合管道中用于数据分组的两个重要阶段操作符，它们都能将文档划分到不同的区间（称为“桶”），但工作方式和适用场景有所不同。
// 语法结构​​：

// {
//   $bucket: {
//     groupBy: <expression>,    // 分组的依据字段或表达式
//     boundaries: [ <lowerbound1>, <lowerbound2>, ... ], // 手动定义的边界值数组
//     default: <literal>,       // 可选，用于存放不属于任何指定边界文档的桶的标识
//     output: {                 // 可选，指定每个桶的输出字段
//       <output1>: { <accumulator expression> },
//       ...
//     }
//   }
// }

db.artwork.aggregate([
  {
    $bucket: {
      groupBy: "$price",
      boundaries: [0, 200, 400],//将艺术品按价格分成三个区间：[0, 200)、[200, 400)以及一个“其他”类别（用于容纳价格大于等于400或没有价格的文档）
      default: "Other",
      output: {
        "count": { $sum: 1 },
        "averagePrice": { $avg: "$price" },
        "titles": { $push: "$title" }
      }
    }
  }
])




// {
//   $bucketAuto: {
//     groupBy: <expression>,     // 分组的依据字段或表达式
//     buckets: <number>,         // 期望的桶的数量
//     output: {                  // 可选，指定每个桶的输出字段
//       <output1>: { <accumulator expression> },
//       ...
//     },
//     granularity: <string>      // 可选，指定边界计算的偏好序列（如 "R20", "E6", "1-2-5"）
//   }
// }

db.artwork.aggregate([
  {
    $bucketAuto: {
      groupBy: "$year",
      buckets: 3,
      output: {
        "count": { $sum: 1 },
        "years": { $push: "$year" }
      }
    }
  }
])