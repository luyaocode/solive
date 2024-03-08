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