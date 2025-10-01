// ==================== MongoDB $facet 聚合操作符详解 ====================
// $facet允许在单个聚合阶段中并行执行多个子管道


// ==================== $facet 的重要特性和限制 ====================
/*
特性：
1. 并行执行：所有子管道并行运行，提高性能
2. 独立性：每个子管道都从相同的输入文档开始
3. 灵活性：可以在每个子管道中使用任何聚合操作符

限制：
1. 内存限制：每个子管道受到100MB内存限制
2. 不能使用$out：子管道中不能使用$out操作符
3. 不能使用$facet：子管道中不能嵌套使用$facet
4. 结果结构：输出总是一个包含指定字段的文档
*/

// ==================== 性能优化建议 ====================
/*
1. 预过滤：在$facet之前使用$match减少处理的文档数量
2. 避免复杂计算：将复杂计算移到$facet之外或使用$addFields预处理
*/

// ==================== 基础语法 ====================
/*
{
  $facet: {
    <facet_name_1>: [<pipeline_1>],
    <facet_name_2>: [<pipeline_2>],
    ...
    <facet_name_N>: [<pipeline_N>]
  }
}
*/

// ==================== 示例数据集 ====================
// 假设我们有一个商品集合
/*
商品数据结构：
{
  _id: ObjectId,
  name: "商品名称",
  category: "分类",
  price: 数字,
  rating: 数字(1-5),
  stock: 数字,
  createDate: Date,
  tags: ["标签1", "标签2"]
}
*/

// ==================== 示例1：基础多维度统计 ====================
db.products.aggregate([
  {
    $facet: {
      // 子管道1：按分类统计商品数量
      "categoryStats": [
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ],
      
      // 子管道2：价格区间分析
      "priceRanges": [
        {
          $bucket: {
            groupBy: "$price",
            boundaries: [0, 100, 500, 1000, 5000],
            default: "5000+",
            output: {
              count: { $sum: 1 },
              avgPrice: { $avg: "$price" }
            }
          }
        }
      ],
      
      // 子管道3：评分统计
      "ratingStats": [
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            maxRating: { $max: "$rating" },
            minRating: { $min: "$rating" },
            totalProducts: { $sum: 1 }
          }
        }
      ]
    }
  }
]);

// ==================== 示例2：分页和总数统计 ====================
// 这是$facet最常见的用途之一：同时获取分页数据和总数
db.products.aggregate([
  // 预过滤条件
  { $match: { category: "电子产品" } },
  
  {
    $facet: {
      // 分页数据
      "data": [
        { $skip: 0 },    // 跳过前N条
        { $limit: 10 },  // 限制返回条数
        { $sort: { createDate: -1 } }
      ],
      
      // 总数统计
      "totalCount": [
        { $count: "total" }
      ]
    }
  },
  { $project: { data: 1, totalCount: { $arrayElemAt: ["$totalCount", 0] } } }
]);
