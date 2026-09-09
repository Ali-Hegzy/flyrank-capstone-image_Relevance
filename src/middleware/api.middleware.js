const {embeddingSchema, reviewSchema} = require('../schema/schema');

const suggestValidate = (req, res, next) => {
    const result = embeddingSchema.safeParse({text : req.body.text});

    if(!result.success){
        return res.status(400).json({
            error : "Validation Failed",
            details : result.error.message,
        });
    }

    req.body = result.data;
    next();
}

const reviewValidate = (req, res, next) => {
    const result = reviewSchema.safeParse(req.body);

    if(!result.success){
        return res.status(400).json({
            error : "Validation Failed",
            details : result.error.message,
        });
    }

    req.body = result.data;
    next();
}

module.exports = { suggestValidate, reviewValidate };