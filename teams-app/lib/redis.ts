import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URI!)

redis.on("error", (err) => {
    console.log("Redis error", err)
})

export default redis