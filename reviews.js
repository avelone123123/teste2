import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { courseId } = req.query;
        try {
            const reviews = await redis.lrange(`reviews:${courseId}`, 0, -1);
            const parsedReviews = reviews.map(review => JSON.parse(review));
            res.status(200).json(parsedReviews);
        } catch (error) {
            res.status(500).json({ error: 'Ошибка получения отзывов: ' + error.message });
        }
    } else if (req.method === 'POST') {
        const { courseId, author, text } = req.body;
        if (!courseId || !author || !text) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }
        const review = { author, text, timestamp: new Date().toISOString() };
        try {
            await redis.lpush(`reviews:${courseId}`, JSON.stringify(review));
            res.status(201).json(review);
        } catch (error) {
            res.status(500).json({ error: 'Ошибка сохранения отзыва: ' + error.message });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: `Метод ${req.method} не поддерживается` });
    }
}