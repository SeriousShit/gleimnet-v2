'use strict';
const Joi = require('joi');
const Async = require('async');
const ObjectAssign = require('object-assign');
const BaseModel = require('hapi-mongo-models').BaseModel;
const Message = require('./message');
const User = require('./user');

const Conversation = BaseModel.extend({
    constructor: function (attrs) {
        ObjectAssign(this, attrs);
    },
    addMessage: function(userId, message, callback) {
        const self = this;
        Async.auto({
            updateConveration: [function (done, results) {
                const unread = self.authors.filter(item => item._id.toString() !== userId);
                const pushmessages = {
                    _id: BaseModel._idClass(message._id)
                };
                const pushauthor = {
                    _id: BaseModel._idClass(userId)
                };
                const query = {
                    $set: {
                        timeUpdated: message.timeCreated,
                        unread: unread
                    },
                    $push: {
                        messages: {
                            $each: [pushmessages],
                            $position: 0
                        }
                    },
                    $addToSet: {
                        authors: {
                            $each: [pushauthor]
                        }
                    }
                };
                Conversation.findByIdAndUpdate(self._id,query,{safe: true, upsert: true, new: true, multi: true},done);
            }]
        }, (err, results) => {
            if (err) {
                return callback(err);
            }
            callback(null, results.updateConveration);
        });
    },
    read: function(userId, callback) {
        const self = this;
        Async.auto({
            updateConveration: [function (done, results) {
                const pullauthor = {
                    _id: BaseModel._idClass(userId)
                };
                const query = {
                    $pull: {
                        unread: pullauthor
                    }
                };
                Conversation.findByIdAndUpdate(self._id,query,{safe: true, new: true, multi: true},done);
            }]
        }, (err, results) => {
            if (err) {
                return callback(err);
            }
            callback(null, results.updateConveration);
        });
    }
});

Conversation._collection = 'conversations';

Conversation.schema = Joi.object().keys({
    _id: Joi.object(),
    timeCreated: Joi.date().required(),
    timeUpdated: Joi.date().required(),
    authors: Joi.array().items(Joi.object().keys({
        _id: Joi.string().length(24).hex().required()
    })).required(),
    unread: Joi.array().items(Joi.object().keys({
        _id: Joi.string().length(24).hex().required()
    })).required(),
    messages: Joi.array().items(Joi.object().keys({
        _id: Joi.string().length(24).hex()
    })).required()
});

Conversation.indexes = [
    { key: { timeUpdated: 1 } }
];

Conversation.create = function (userIds, callback) {
    const self = this;
    const authors = userIds.map(function (item){return {_id: self._idClass(item)} });
    const document = {
        timeCreated: new Date(),
        timeUpdated: new Date(),
        messages: [],
        unread: [],
        authors: authors
    };
    self.insertOne(document, (err, docs) => {
        if (err) {
            return callback(err);
        }
        callback(null, docs[0]);
    });
};

Conversation.findAllConversationsByUserId = function (userId, callback) {
    const self = this;
    Async.auto({
        conversations: function (done) {
            const query = {
                authors: { $elemMatch:{id: mongo.ObjectId(userId)}}
            };
            self.find(query, done);
        }
    }, (err, results) => {
        if (err) {
            return callback(err);
        }
        return callback(null, results.conversations);
    });
};

Conversation.findByIdAndPaged = function (id, limit, page, callback) {
    const find = { _id: this._idClass(id) };
    const filter = { _id: this._idClass(id) };

    const self = this;
    const output = {
        _id: undefined,
        timeCreated: undefined,
        timeUpdated: undefined,
        messages: undefined,
        unread: undefined,
        pages: {
            current: page,
            prev: 0,
            hasPrev: false,
            next: 0,
            hasNext: false,
            total: 0
        },
        items: {
            limit: limit,
            begin: ((page * limit) - limit) + 1,
            end: page * limit,
            total: 0
        }
    };

    Async.auto({
        findById: function (results) {
            self.findById(id,results);
        },
        pagedMessages: ['findById',(done, results) => {
            const pMessages = results.findById.messages.slice((output.items.begin-1),output.items.end).map(function (item){return self._idClass(item._id) });
            const query = {
                '_id': {
                    $in: pMessages
                }
            };
            const sort = self.sortAdapter('-timeCreated');
            const options = {
                sort: sort
            };
            Message.find(query, options,done);
        }]
    }, (err, results) => {

        if (err) {
            return callback(err);
        }
        output._id = results.findById._id;
        output.timeCreated = results.findById.timeCreated;
        output.timeUpdated = results.findById.timeUpdated;
        output.authors = results.findById.authors;
        output.unread = results.findById.unread;

        output.messages = results.pagedMessages;
        output.items.total = results.findById.messages.length;

        // paging calculations
        output.pages.total = Math.ceil(output.items.total / limit);
        output.pages.next = output.pages.current + 1;
        output.pages.hasNext = output.pages.next <= output.pages.total;
        output.pages.prev = output.pages.current - 1;
        output.pages.hasPrev = output.pages.prev !== 0;
        if (output.items.begin > output.items.total) {
            output.items.begin = output.items.total;
        }
        if (output.items.end > output.items.total) {
            output.items.end = output.items.total;
        }

        callback(null, output);
    });
};
module.exports = Conversation;