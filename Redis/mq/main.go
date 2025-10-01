// main.go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
)

// Message 消息结构体
type Message struct {
	ID        string                 `json:"id"`
	Data      map[string]interface{} `json:"data"`
	Timestamp int64                  `json:"timestamp"`
	Retry     int                    `json:"retry"`
}

// RedisQueue Redis消息队列
type RedisQueue struct {
	client    *redis.Client
	queueName string
	ctx       context.Context
}

// NewRedisQueue 创建新的Redis队列
func NewRedisQueue(client *redis.Client, queueName string) *RedisQueue {
	return &RedisQueue{
		client:    client,
		queueName: queueName,
		ctx:       context.Background(),
	}
}

// Producer 生产者
func (rq *RedisQueue) Producer(message Message) error {
	// 序列化消息
	messageJSON, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("序列化消息失败: %v", err)
	}

	// 推送到Redis列表
	err = rq.client.LPush(rq.ctx, rq.queueName, messageJSON).Err()
	if err != nil {
		return fmt.Errorf("推送消息到队列失败: %v", err)
	}

	log.Printf("消息已发送: %s", message.ID)
	return nil
}

// Consumer 消费者
func (rq *RedisQueue) Consumer(handler func(Message) error) error {
	for {
		// 阻塞式弹出消息
		result, err := rq.client.BRPop(rq.ctx, 0, rq.queueName).Result()
		if err != nil {
			log.Printf("从队列获取消息失败: %v", err)
			continue
		}

		// 解析消息
		var message Message
		err = json.Unmarshal([]byte(result[1]), &message)
		if err != nil {
			log.Printf("反序列化消息失败: %v", err)
			continue
		}

		log.Printf("收到消息: %s", message.ID)

		// 处理消息
		err = handler(message)
		if err != nil {
			log.Printf("处理消息失败: %v", err)

			// 重试机制
			if message.Retry < 3 {
				message.Retry++
				rq.Producer(message) // 重新放入队列
				log.Printf("消息重试: %s (第%d次)", message.ID, message.Retry)
			} else {
				log.Printf("消息处理失败，已达到最大重试次数: %s", message.ID)
				// 可以将失败的消息放入死信队列
				rq.moveToDeadLetter(message)
			}
		} else {
			log.Printf("消息处理成功: %s", message.ID)
		}
	}
}

// moveToDeadLetter 移动到死信队列
func (rq *RedisQueue) moveToDeadLetter(message Message) {
	deadLetterQueue := rq.queueName + ":dead"
	messageJSON, _ := json.Marshal(message)
	rq.client.LPush(rq.ctx, deadLetterQueue, messageJSON)
	log.Printf("消息移动到死信队列: %s", message.ID)
}

// DelayedConsumer 延迟消费者（使用Redis Sorted Set实现延迟队列）
func (rq *RedisQueue) DelayedConsumer(delaySeconds int, handler func(Message) error) error {
	delayedQueueName := rq.queueName + ":delayed"

	for {
		// 获取当前时间戳
		now := time.Now().Unix()

		// 从延迟队列中获取到期的消息
		results, err := rq.client.ZRangeByScoreWithScores(rq.ctx, delayedQueueName, &redis.ZRangeBy{
			Min:   "0",
			Max:   fmt.Sprintf("%d", now),
			Count: 1,
		}).Result()

		if err != nil {
			log.Printf("获取延迟消息失败: %v", err)
			time.Sleep(1 * time.Second)
			continue
		}

		if len(results) == 0 {
			time.Sleep(1 * time.Second)
			continue
		}

		// 获取消息并从延迟队列中删除
		messageStr := results[0].Member.(string)
		removed, err := rq.client.ZRem(rq.ctx, delayedQueueName, messageStr).Result()
		if err != nil || removed == 0 {
			continue // 可能被其他消费者处理了
		}

		// 解析并处理消息
		var message Message
		err = json.Unmarshal([]byte(messageStr), &message)
		if err != nil {
			log.Printf("反序列化延迟消息失败: %v", err)
			continue
		}

		log.Printf("处理延迟消息: %s", message.ID)
		err = handler(message)
		if err != nil {
			log.Printf("处理延迟消息失败: %v", err)
		}
	}
}

// ProducerDelayed 生产延迟消息
func (rq *RedisQueue) ProducerDelayed(message Message, delaySeconds int) error {
	delayedQueueName := rq.queueName + ":delayed"
	executeTime := time.Now().Unix() + int64(delaySeconds)

	messageJSON, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("序列化延迟消息失败: %v", err)
	}

	err = rq.client.ZAdd(rq.ctx, delayedQueueName, &redis.Z{
		Score:  float64(executeTime),
		Member: messageJSON,
	}).Err()

	if err != nil {
		return fmt.Errorf("添加延迟消息失败: %v", err)
	}

	log.Printf("延迟消息已发送: %s (延迟%d秒)", message.ID, delaySeconds)
	return nil
}

// GetQueueLength 获取队列长度
func (rq *RedisQueue) GetQueueLength() (int64, error) {
	return rq.client.LLen(rq.ctx, rq.queueName).Result()
}

func main() {
	// 连接Redis
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // 如果有密码
		DB:       0,  // 使用默认数据库
	})

	// 测试连接
	_, err := rdb.Ping(context.Background()).Result()
	if err != nil {
		log.Fatal("连接Redis失败:", err)
	}

	// 创建队列
	queue := NewRedisQueue(rdb, "task_queue")

	// 启动消费者（在goroutine中）
	go func() {
		log.Println("启动消费者...")
		queue.Consumer(func(message Message) error {
			// 模拟处理消息
			log.Printf("处理消息: %+v", message)
			time.Sleep(2 * time.Second) // 模拟处理时间

			// 模拟一些消息处理失败
			if message.Data["fail"] == true {
				return fmt.Errorf("模拟处理失败")
			}
			return nil
		})
	}()

	// 启动延迟消费者
	go func() {
		log.Println("启动延迟消费者...")
		queue.DelayedConsumer(0, func(message Message) error {
			log.Printf("处理延迟消息: %+v", message)
			return nil
		})
	}()

	// 生产一些测试消息
	for i := 0; i < 5; i++ {
		message := Message{
			ID:        fmt.Sprintf("msg_%d", i),
			Data:      map[string]interface{}{"content": fmt.Sprintf("消息内容 %d", i), "fail": i == 2},
			Timestamp: time.Now().Unix(),
			Retry:     0,
		}

		if i%2 == 0 {
			// 发送普通消息
			queue.Producer(message)
		} else {
			// 发送延迟消息
			queue.ProducerDelayed(message, 10) // 延迟10秒
		}

		time.Sleep(1 * time.Second)
	}

	// 监控队列状态
	go func() {
		for {
			length, _ := queue.GetQueueLength()
			log.Printf("当前队列长度: %d", length)
			time.Sleep(5 * time.Second)
		}
	}()

	// 保持程序运行
	select {}
}
