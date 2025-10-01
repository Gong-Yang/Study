// MongoDB查询customEndTime是string类型的所有数据

// ==================== 方法1：使用$type操作符 ====================
// 这是最常用和推荐的方法
db.collection.find({
    "customEndTime": { $type: "string" }
});

// 或者使用BSON类型编号（string类型编号为2）
db.collection.find({
    "customEndTime": { $type: 2 }
});

// ==================== 方法2：使用$exists和$not与$type结合 ====================
// 查询customEndTime字段存在且为string类型
db.collection.find({
    "customEndTime": {
        $exists: true,
        $type: "string"
    }
});

// ==================== 方法3：使用聚合管道 ====================
// 适用于需要更复杂条件筛选的场景
db.collection.aggregate([
    {
        $match: {
            "customEndTime": { $type: "string" }
        }
    }
]);

// ==================== 方法4：排除其他类型 ====================
// 查询customEndTime不是其他类型（如Date、Number等）
db.collection.find({
    "customEndTime": {
        $not: { $type: ["date", "number", "bool", "null"] }
    }
});

// ==================== 方法5：结合其他条件的复合查询 ====================
// 查询customEndTime是string类型且不为空字符串
db.collection.find({
    "customEndTime": {
        $type: "string",
        $ne: ""  // 不等于空字符串
    }
});

// ==================== 方法6：使用正则表达式验证字符串格式 ====================
// 查询customEndTime是string类型且符合特定格式（如日期格式）
db.collection.find({
    "customEndTime": {
        $type: "string",
        $regex: /^\d{4}-\d{2}-\d{2}.*$/  // 匹配YYYY-MM-DD开头的字符串
    }
});

// ==================== 方法7：统计string类型的customEndTime数量 ====================
db.collection.countDocuments({
    "customEndTime": { $type: "string" }
});

// ==================== 方法8：查看数据类型分布 ====================
// 使用聚合管道分析customEndTime字段的数据类型分布
db.collection.aggregate([
    {
        $group: {
            "_id": { $type: "$customEndTime" },
            "count": { $sum: 1 }
        }
    },
    {
        $sort: { "count": -1 }
    }
]);

// ==================== 常用的BSON类型对照表 ====================
/*
1 = double (数字)
2 = string (字符串)
3 = object (对象)
4 = array (数组)
5 = binData (二进制数据)
6 = undefined (未定义) - 已弃用
7 = objectId (ObjectId)
8 = bool (布尔值)
9 = date (日期)
10 = null (空值)
11 = regex (正则表达式)
13 = javascript (JavaScript代码)
16 = int (32位整数)
17 = timestamp (时间戳)
18 = long (64位整数)
19 = decimal (十进制数)
*/