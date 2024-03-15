import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

export function showNotification(message, duration = 2000, theme = 'dark', gravity = 'top', position = 'center') {
    Toastify({
        text: message,
        duration: duration,
        gravity: gravity,
        position: position,
        style: {
            background: theme === 'dark' ? 'black' : 'white',
            color: theme === 'dark' ? 'white' : 'black',
        },
    }).showToast();
}

export const formatDate = (timestamp) => {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Shanghai',
    };
    const formatter = new Intl.DateTimeFormat('zh-CN', options);
    const formattedDate = formatter.format(timestamp) + ' (GMT+08:00) 中国标准时间 - 北京';
    return formattedDate;
};