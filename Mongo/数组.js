// MongoDB数组字段查询方法大全
// 脚本用途：演示MongoDB中各种数组字段的查询操作
// 操作说明：包含基础查询、聚合操作、数组元素匹配等各种场景

// ==================== 1. 基础数组查询 ====================

// 1.1 查询数组中包含指定元素
db.collection.find({
    "tags": "javascript"  // 查询tags数组中包含"javascript"的文档
});

// 1.2 查询数组中包含多个指定元素（$in操作符）
db.collection.find({
    "tags": {
        $in: ["javascript", "mongodb", "nodejs"]  // 查询tags数组中包含任一指定值的文档
    }
});

// 1.3 查询数组完全匹配
db.collection.find({
    "tags": ["javascript", "mongodb"]  // 精确匹配数组内容和顺序
});

// 1.4 查询数组中所有元素都匹配（$all操作符）
db.collection.find({
    "tags": {
        $all: ["javascript", "mongodb"]  // 数组必须包含所有指定元素，顺序无关
    }
});

// ==================== 2. 数组长度查询 ====================

// 2.1 查询指定长度的数组
db.collection.find({
    "tags": {
        $size: 3  // 查询tags数组长度为3的文档
    }
});

// 2.2 查询数组长度范围（使用$expr和$size）
db.collection.find({
    $expr: {
        $and: [
            { $gte: [{ $size: "$tags" }, 2] },  // 数组长度大于等于2
            { $lte: [{ $size: "$tags" }, 5] }   // 数组长度小于等于5
        ]
    }
});

// ==================== 3. 数组位置查询 ====================

// 3.1 查询数组指定位置的元素
db.collection.find({
    "tags.0": "javascript"  // 查询tags数组第一个元素为"javascript"的文档
});

// 3.2 查询数组指定位置范围的元素
db.collection.find({
    "tags.1": { $in: ["mongodb", "nodejs"] }  // 查询tags数组第二个元素匹配指定值的文档
});

// ==================== 4. 数组对象查询 ====================

// 4.1 查询数组中包含指定对象字段
db.collection.find({
    "products.name": "iPhone"  // 查询products数组中任一对象的name字段为"iPhone"的文档
});

// 4.2 使用$elemMatch查询数组中的对象
db.collection.find({
    "products": {
        $elemMatch: {
            "name": "iPhone",
            "price": { $lt: 1000 }  // 查询products数组中同时满足name为"iPhone"且price小于1000的对象
        }
    }
});

// 4.3 查询嵌套数组对象的多个条件
db.collection.find({
    "orders": {
        $elemMatch: {
            "status": "completed",
            "items.category": "electronics",
            "total": { $gte: 500 }
        }
    }
});

// ==================== 5. 数组聚合查询 ====================

// 5.1 统计数组元素数量
db.collection.aggregate([
    {
        $project: {
            "name": 1,
            "tagCount": { $size: "$tags" }  // 计算每个文档的tags数组长度
        }
    }
]);

// 5.2 展开数组进行统计（$unwind）
db.collection.aggregate([
    { $unwind: "$tags" },  // 展开tags数组
    {
        $group: {
            "_id": "$tags",
            "count": { $sum: 1 }  // 统计每个tag的出现次数
        }
    },
    { $sort: { "count": -1 } }  // 按计数降序排列
]);

// 5.3 数组去重统计
db.collection.aggregate([
    {
        $group: {
            "_id": null,
            "uniqueTags": { $addToSet: "$tags" }  // 收集所有唯一的tags数组
        }
    },
    {
        $project: {
            "uniqueTagCount": { $size: "$uniqueTags" }  // 计算唯一tags的数量
        }
    }
]);

// 5.4 数组元素去重后统计
db.collection.aggregate([
    { $unwind: "$tags" },
    {
        $group: {
            "_id": null,
            "uniqueTags": { $addToSet: "$tags" }  // 去重收集所有tag
        }
    },
    {
        $project: {
            "uniqueTagCount": { $size: "$uniqueTags" }
        }
    }
]);

// ==================== 6. 数组修改操作 ====================

// 6.1 向数组添加元素（$push）
db.collection.updateOne(
    { "_id": ObjectId("...") },
    {
        $push: {
            "tags": "newTag"  // 向tags数组添加新元素
        }
    }
);

// 6.2 向数组添加多个元素（$push with $each）
db.collection.updateOne(
    { "_id": ObjectId("...") },
    {
        $push: {
            "tags": {
                $each: ["tag1", "tag2", "tag3"]  // 批量添加多个元素
            }
        }
    }
);

// 6.3 向数组添加元素（避免重复，$addToSet）
db.collection.updateOne(
    { "_id": ObjectId("...") },
    {
        $addToSet: {
            "tags": "uniqueTag"  // 只有当元素不存在时才添加
        }
    }
);

// 6.4 从数组移除元素（$pull）
db.collection.updateOne(
    { "_id": ObjectId("...") },
    {
        $pull: {
            "tags": "removeTag"  // 移除指定元素
        }
    }
);

// 6.5 移除数组中的多个元素（$pullAll）
db.collection.updateOne(
    { "_id": ObjectId("...") },
    {
        $pullAll: {
            "tags": ["tag1", "tag2"]  // 移除多个指定元素
        }
    }
);
