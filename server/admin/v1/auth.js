'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
const JWT = require('jsonwebtoken');
const Config = require('../../../config/secret');

const internals = {};

internals.apply = function (server, next) {
    const Admin = server.plugins['hapi-mongo-models'].Admin;
    const prefix = server.realm.modifiers.route.prefix;
    const cache = server.cache({
        segment: 'adminsessions',
        expiresIn: 3 * 24 * 60 * 60 * 1000
    });

    // validate function for auth
    var validate = function (decoded, request, callback) {
        cache.get(decoded._id,(err, value, cached, log) => {
            if(err) {
                return callback(null, false);
            }
            if(!cached) {
                return callback(null, false);
            }
            return callback(null, true);
        });
    };

    const sign = function(userid, callback) {

        // use private claims
        var payload = {
            _id: userid
        };

        const token = JWT.sign(payload, Config.get('/secret'),{ algorithm: 'HS256'});

        cache.set(userid, {token}, null, (err) => {
            if (err) {
                return callback(err);
            }
            return callback(null, token);
        });
    };

    server.auth.strategy('admin', 'jwt',
        {
            key: Config.get('/secret'),
            validateFunc: validate,
            verifyOptions: {
                algorithms: ['HS256']
            }
        }
    );

    server.route({
        method: 'POST',
        path: '/auth',
        config: {
            tags: ['api'],
            auth: {
                mode: 'try',
                strategy: 'admin'
            },
            validate: {
                payload: {
                    username: Joi.string().lowercase().required(),
                    password: Joi.string().required()
                }
            },
            pre: [{
                assign: 'user',
                method: function (request, reply) {
                    const username = request.payload.username;
                    const password = request.payload.password;
                    Admin.findByCredentials(username, password, (err, user) => {
                        if (err) {
                            return reply(err);
                        }
                        return reply(user);
                    });
                }
            }, {
                assign: 'token',
                method: function (request, reply) {
                    sign(request.pre.user._id.toString(), (err, token) => {
                        if (err) {
                            return reply(err);
                        }
                        return reply(token);
                    });
                }
            }]
        },
        handler: function (request, reply) {
            return reply(request.pre.token)
        }
    });
    server.route({
        method: 'DELETE',
        path: '/logout',
        config: {
            tags: ['api'],
            auth: {
                mode: 'try',
                strategy: 'admin'
            }
        },
        handler: function (request, reply) {
            const id = request.auth.credentials._id;
            cache.drop(id, (err) => {
                if (err) {
                    return reply(err);
                }
                return reply({ message: 'Success.' });
            });
        }
    });

    next();
};


exports.register = function (server, options, next) {
    server.dependency(['hapi-mongo-models','hapi-auth-jwt2'], internals.apply);
    next();
};

exports.register.attributes = {
    name: 'adminAuth'
};