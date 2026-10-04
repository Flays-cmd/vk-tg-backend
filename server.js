const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// Роут парсинга постов из публичного ТГ-канала
app.get('/api/posts/:channel', async (req, res) => {
    try {
        const channel = req.params.channel.replace('@', '');
        const url = `https://t.me/s/${channel}`;
        
        const { data: html } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            }
        });

        const $ = cheerio.load(html);
        const posts = [];

        $('.tgme_widget_message').each((i, el) => {
            const $post =$(el);

            // Текст поста
            const textHtml = $post.find('.tgme_widget_message_text').html() || '';

            // Картинки
            const images = [];
            $post.find('.tgme_widget_message_photo_wrap').each((_, photo) => {
                const style = $(photo).attr('style');
                const match = style ? style.match(/url\('(.*)'\)/) : null;
                if (match) images.push(match[1]);
            });

            // Аватар и имя
            const authorImg = $post.find('.tgme_widget_message_user_photo img').attr('src') || '';
            const authorName = $post.find('.tgme_widget_message_owner_name').text().trim() || channel;

            // Дата и просмотры
            const date = $post.find('.tgme_widget_message_date time').attr('datetime') || '';
            const views = $post.find('.tgme_widget_message_views').text().trim() || '0';

            if (textHtml || images.length > 0) {
                posts.push({
                    id: $post.attr('data-post') || Math.random().toString(),
                    channel,
                    authorName,
                    authorImg,
                    textHtml,
                    images,
                    date,
                    views
                });
            }
        });

        res.json({ success: true, channel, posts: posts.reverse() });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Канал не найден или приватный' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));