// config.go
package main

import (
	"os"
)

// Config 配置结构体
type Config struct {
	RedisAddr     string
	RedisPassword string
	RedisDB       int
	QueueName     string
	MaxRetry      int
}

// NewConfig 创建默认配置
func NewConfig() *Config {
	return &Config{
		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       0,
		QueueName:     getEnv("QUEUE_NAME", "default_queue"),
		MaxRetry:      3,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
