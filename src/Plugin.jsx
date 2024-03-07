import Toastify from 'toastify-js';
import 'toastify-js/src/toastify.css';

export function showNotification(message, duration = 2000, theme = 'dark') {
    Toastify({
        text: message,
        duration: duration,
        gravity: 'top',
        position: 'center',
        style: {
            background: theme === 'dark' ? 'black' : 'white',
            color: theme === 'dark' ? 'white' : 'black',
        },
    }).showToast();
}