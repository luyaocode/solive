module.exports = {
    // 其他配置
    resolve: {
        fallback: {
            "process": require.resolve("process/browser")
        }
    }
};