const { data } = require('../sockets/sockets');
const recordFinderMiddleware = async (req, res, next) => {
    const room = req.headers.room;
    try {
        const record = data.find((datas) => room === datas.room);
        console.log(room)
        req.record = { record };
        next();
    } catch (error) {

    }
}

module.exports = recordFinderMiddleware;
