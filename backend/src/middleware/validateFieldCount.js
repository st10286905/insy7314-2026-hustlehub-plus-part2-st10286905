const rejectUnknownFields = (allowedFields) => {
    return (req, res, next) => {
        const unknownFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));
        if (unknownFields.length > 0) {
            return res.status(400).json({ 
                error: {
                    code: 'UNKNOWN_FIELDS',
                    message: `Request contains unsupported fields`,
                    details: unknownFields.map((field) => ({
                        field,
                        message: `Field "${field}" is not allowed`,
                    })),
                }
            });
        }
        next();
    };
};