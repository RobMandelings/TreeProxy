const path = require("path");

module.exports = {
    moduleNameMapper: {
        '^@pt/(.*)$': path.resolve(__dirname, './src/assets/js/proxy_tree/$1'),
        '^@/(.*)$': path.resolve(__dirname, './src/assets/js/$1')
    },
    transform: {
        "^.+\\.jsx?$": "babel-jest"
    }
}