import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    if (request.method === 'POST') {
        // Добавление нового отзыва
        try {
            const { courseId, author, text } = request.body;

            // Простая валидация
            if (!courseId || !author || !text) {
                return response.status(400).json({ message: 'Все поля обязательны.' });
            }
            if (author.length > 50 || text.length > 1000) {
                 return response.status(400).json({ message: 'Слишком длинный текст.' });
            }

            const newReview = {
                id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                author,
                text,
                timestamp: new Date().toISOString(),
            };

            // Добавляем отзыв в список для данного курса
            // lpush добавляет элемент в начало списка
            await kv.lpush(`reviews:${courseId}`, newReview);

            return response.status(201).json(newReview);

        } catch (error) {
            console.error('POST Error:', error);
            return response.status(500).json({ message: 'Внутренняя ошибка сервера.' });
        }
    } else if (request.method === 'GET') {
        // Получение отзывов для курса
        try {
            const { courseId } = request.query;
            if (!courseId) {
                return response.status(400).json({ message: 'Не указан ID курса.' });
            }

            // Получаем все отзывы для данного курса (от 0 до -1 означает "все")
            const reviews = await kv.lrange(`reviews:${courseId}`, 0, -1);
            
            return response.status(200).json(reviews);

        } catch (error) {
            console.error('GET Error:', error);
            return response.status(500).json({ message: 'Внутренняя ошибка сервера.' });
        }
    } else {
        // Обработка других методов
        response.setHeader('Allow', ['GET', 'POST']);
        return response.status(405).end(`Method ${request.method} Not Allowed`);
    }
}