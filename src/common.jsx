export function writeToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        console.log('Text copied to clipboard successfully!');
    }).catch(function(err) {
        console.error('Could not copy text: ', err);
    });
};