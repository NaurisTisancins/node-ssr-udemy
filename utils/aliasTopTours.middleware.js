exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '2';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingAverage, summary,difficulty';
    next();
};//aliasTopTours - query params