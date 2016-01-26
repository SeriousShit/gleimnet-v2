'use strict';

const Boom = require('boom');
const Joi = require('joi');
const AuthPlugin = require('../auth');


const internals = {};


internals.applyRoutes = function (server, next) {

    const User = server.plugins['hapi-mongo-models'].User;
    const Conversation = server.plugins['hapi-mongo-models'].Conversation;

    server.route({
        method: 'GET',
        path: '/timeline',
        config: {
            auth: {
                strategy: 'simple',
            },
            validate: {
            },
            pre: [
            ]
        },
        handler: function (request, reply) {
            User.pagedFind(query, fields, sort, limit, page, (err, results) => {
                if (err) {
                    return reply(err);
                }
                reply(results);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/timeline/{username}',
        config: {
            auth: {
                strategy: 'simple'
            },
            pre: [
            ]
        },
        handler: function (request, reply) {

            User.findById(request.params.id, (err, user) => {
                if (err) {
                    return reply(err);
                }
                if (!user) {
                    return reply(Boom.notFound('Document not found.'));
                }
                reply(user);
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/users/my',
        config: {
            auth: {
                strategy: 'simple'
            }
        },
        handler: function (request, reply) {

            const id = request.auth.credentials.user._id.toString();
            const fields = User.fieldsAdapter('username email roles');
            User.findById(id, fields, (err, user) => {
                if (err) {
                    return reply(err);
                }
                if (!user) {
                    return reply(Boom.notFound('Document not found. That is strange.'));
                }

                reply(user);
            });
        }
    });


    server.route({
        method: 'POST',
        path: '/users',
        config: {
            auth: {
                strategy: 'simple'
            },
            validate: {
                payload: {
                    username: Joi.string().token().lowercase().required(),
                    password: Joi.string().required(),
                    email: Joi.string().email().lowercase().required()
                }
            },
            pre: [
                {
                    assign: 'usernameCheck',
                    method: function (request, reply) {
                        const conditions = {
                            username: request.payload.username
                        };
                        User.findOne(conditions, (err, user) => {
                            if (err) {
                                return reply(err);
                            }
                            if (user) {
                                return reply(Boom.conflict('Username already in use.'));
                            }
                            reply(true);
                        });
                    }
                }
            ]
        },
        handler: function (request, reply) {
            const username = request.payload.username;
            const password = request.payload.password;
            User.create(username, password, (err, user) => {
                if (err) {
                    return reply(err);
                }
                reply(user);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/users/{id}',
        config: {
            auth: {
                strategy: 'simple'
            },
            validate: {
                payload: {
                    isActive: Joi.boolean().required(),
                    username: Joi.string().token().lowercase().required(),
                    email: Joi.string().email().lowercase().required()
                }
            },
            pre: [{
                assign: 'usernameCheck',
                method: function (request, reply) {

                    const conditions = {
                        username: request.payload.username,
                        _id: { $ne: User._idClass(request.params.id) }
                    };

                    User.findOne(conditions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (user) {
                            return reply(Boom.conflict('Username already in use.'));
                        }

                        reply(true);
                    });
                }
            }, {
                assign: 'emailCheck',
                method: function (request, reply) {

                    const conditions = {
                        email: request.payload.email,
                        _id: { $ne: User._idClass(request.params.id) }
                    };

                    User.findOne(conditions, (err, user) => {

                        if (err) {
                            return reply(err);
                        }

                        if (user) {
                            return reply(Boom.conflict('Email already in use.'));
                        }

                        reply(true);
                    });
                }
            }
            ]
        },
        handler: function (request, reply) {
            const id = request.params.id;
            const update = {
                $set: {
                    isActive: request.payload.isActive,
                    username: request.payload.username,
                    email: request.payload.email
                }
            };
            User.findByIdAndUpdate(id, update, (err, user) => {
                if (err) {
                    return reply(err);
                }
                if (!user) {
                    return reply(Boom.notFound('Document not found.'));
                }
                reply(user);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/users/my',
        config: {
            auth: {
                strategy: 'simple'
            },
            validate: {
                payload: {
                    username: Joi.string().token().lowercase().required(),
                    email: Joi.string().email().lowercase().required()
                }
            },
            pre: [{
                assign: 'usernameCheck',
                method: function (request, reply) {
                    const conditions = {
                        username: request.payload.username,
                        _id: { $ne: request.auth.credentials.user._id }
                    };
                    User.findOne(conditions, (err, user) => {
                        if (err) {
                            return reply(err);
                        }
                        if (user) {
                            return reply(Boom.conflict('Username already in use.'));
                        }
                        reply(true);
                    });
                }
            }, {
                assign: 'emailCheck',
                method: function (request, reply) {
                    const conditions = {
                        email: request.payload.email,
                        _id: { $ne: request.auth.credentials.user._id }
                    };
                    User.findOne(conditions, (err, user) => {
                        if (err) {
                            return reply(err);
                        }
                        if (user) {
                            return reply(Boom.conflict('Email already in use.'));
                        }
                        reply(true);
                    });
                }
            }]
        },
        handler: function (request, reply) {
            const id = request.auth.credentials.user._id.toString();
            const update = {
                $set: {
                    username: request.payload.username,
                    email: request.payload.email
                }
            };
            const findOptions = {
                fields: User.fieldsAdapter('username email roles')
            };
            User.findByIdAndUpdate(id, update, findOptions, (err, user) => {
                if (err) {
                    return reply(err);
                }
                reply(user);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/users/{id}/password',
        config: {
            auth: {
                strategy: 'simple'
            },
            validate: {
                payload: {
                    password: Joi.string().required()
                }
            },
            pre: [
                {
                    assign: 'password',
                    method: function (request, reply) {

                        User.generatePasswordHash(request.payload.password, (err, hash) => {

                            if (err) {
                                return reply(err);
                            }

                            reply(hash);
                        });
                    }
                }
            ]
        },
        handler: function (request, reply) {

            const id = request.params.id;
            const update = {
                $set: {
                    password: request.pre.password.hash
                }
            };
            User.findByIdAndUpdate(id, update, (err, user) => {
                if (err) {
                    return reply(err);
                }
                reply(user);
            });
        }
    });


    server.route({
        method: 'PUT',
        path: '/users/my/password',
        config: {
            auth: {
                strategy: 'simple'
            },
            validate: {
                payload: {
                    password: Joi.string().required()
                }
            },
            pre: [{
                assign: 'password',
                method: function (request, reply) {

                    User.generatePasswordHash(request.payload.password, (err, hash) => {

                        if (err) {
                            return reply(err);
                        }

                        reply(hash);
                    });
                }
            }]
        },
        handler: function (request, reply) {

            const id = request.auth.credentials.user._id.toString();
            const update = {
                $set: {
                    password: request.pre.password.hash
                }
            };
            const findOptions = {
                fields: User.fieldsAdapter('username email')
            };

            User.findByIdAndUpdate(id, update, findOptions, (err, user) => {

                if (err) {
                    return reply(err);
                }

                reply(user);
            });
        }
    });


    server.route({
        method: 'DELETE',
        path: '/users/{id}',
        config: {
            auth: {
                strategy: 'simple'
            },
            pre: [

            ]
        },
        handler: function (request, reply) {

            User.findByIdAndDelete(request.params.id, (err, user) => {
                if (err) {
                    return reply(err);
                }
                if (!user) {
                    return reply(Boom.notFound('Document not found.'));
                }
                reply({ message: 'Success.' });
            });
        }
    });
    next();
};


exports.register = function (server, options, next) {
    server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);
    next();
};


exports.register.attributes = {
    name: 'timeline'
};
