
// ==================== 方法1：使用$type操作符 ====================
// 这是最常用和推荐的方法
db.collection.find({
    "customEndTime": { $type: "string" }
});

// 或者使用BSON类型编号（string类型编号为2）
db.collection.find({
    "customEndTime": { $type: 2 }
});

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