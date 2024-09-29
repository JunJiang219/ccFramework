/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.MSG2 = (function() {

    /**
     * Properties of a MSG2.
     * @exports IMSG2
     * @interface IMSG2
     * @property {number|null} [type] MSG2 type
     * @property {string|null} [msg] MSG2 msg
     */

    /**
     * Constructs a new MSG2.
     * @exports MSG2
     * @classdesc Represents a MSG2.
     * @implements IMSG2
     * @constructor
     * @param {IMSG2=} [properties] Properties to set
     */
    function MSG2(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * MSG2 type.
     * @member {number} type
     * @memberof MSG2
     * @instance
     */
    MSG2.prototype.type = 0;

    /**
     * MSG2 msg.
     * @member {string} msg
     * @memberof MSG2
     * @instance
     */
    MSG2.prototype.msg = "";

    /**
     * Creates a new MSG2 instance using the specified properties.
     * @function create
     * @memberof MSG2
     * @static
     * @param {IMSG2=} [properties] Properties to set
     * @returns {MSG2} MSG2 instance
     */
    MSG2.create = function create(properties) {
        return new MSG2(properties);
    };

    /**
     * Encodes the specified MSG2 message. Does not implicitly {@link MSG2.verify|verify} messages.
     * @function encode
     * @memberof MSG2
     * @static
     * @param {IMSG2} message MSG2 message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MSG2.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.type);
        if (message.msg != null && Object.hasOwnProperty.call(message, "msg"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.msg);
        return writer;
    };

    /**
     * Encodes the specified MSG2 message, length delimited. Does not implicitly {@link MSG2.verify|verify} messages.
     * @function encodeDelimited
     * @memberof MSG2
     * @static
     * @param {IMSG2} message MSG2 message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MSG2.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a MSG2 message from the specified reader or buffer.
     * @function decode
     * @memberof MSG2
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {MSG2} MSG2
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MSG2.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.MSG2();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.type = reader.int32();
                    break;
                }
            case 2: {
                    message.msg = reader.string();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a MSG2 message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof MSG2
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {MSG2} MSG2
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MSG2.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a MSG2 message.
     * @function verify
     * @memberof MSG2
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    MSG2.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.type != null && message.hasOwnProperty("type"))
            if (!$util.isInteger(message.type))
                return "type: integer expected";
        if (message.msg != null && message.hasOwnProperty("msg"))
            if (!$util.isString(message.msg))
                return "msg: string expected";
        return null;
    };

    /**
     * Creates a MSG2 message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof MSG2
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {MSG2} MSG2
     */
    MSG2.fromObject = function fromObject(object) {
        if (object instanceof $root.MSG2)
            return object;
        var message = new $root.MSG2();
        if (object.type != null)
            message.type = object.type | 0;
        if (object.msg != null)
            message.msg = String(object.msg);
        return message;
    };

    /**
     * Creates a plain object from a MSG2 message. Also converts values to other types if specified.
     * @function toObject
     * @memberof MSG2
     * @static
     * @param {MSG2} message MSG2
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    MSG2.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.type = 0;
            object.msg = "";
        }
        if (message.type != null && message.hasOwnProperty("type"))
            object.type = message.type;
        if (message.msg != null && message.hasOwnProperty("msg"))
            object.msg = message.msg;
        return object;
    };

    /**
     * Converts this MSG2 to JSON.
     * @function toJSON
     * @memberof MSG2
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    MSG2.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for MSG2
     * @function getTypeUrl
     * @memberof MSG2
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    MSG2.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/MSG2";
    };

    return MSG2;
})();

$root.UserLogin = (function() {

    /**
     * Properties of a UserLogin.
     * @exports IUserLogin
     * @interface IUserLogin
     * @property {number|null} [uid] UserLogin uid
     * @property {number|null} [channel] UserLogin channel
     */

    /**
     * Constructs a new UserLogin.
     * @exports UserLogin
     * @classdesc Represents a UserLogin.
     * @implements IUserLogin
     * @constructor
     * @param {IUserLogin=} [properties] Properties to set
     */
    function UserLogin(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * UserLogin uid.
     * @member {number} uid
     * @memberof UserLogin
     * @instance
     */
    UserLogin.prototype.uid = 0;

    /**
     * UserLogin channel.
     * @member {number} channel
     * @memberof UserLogin
     * @instance
     */
    UserLogin.prototype.channel = 0;

    /**
     * Creates a new UserLogin instance using the specified properties.
     * @function create
     * @memberof UserLogin
     * @static
     * @param {IUserLogin=} [properties] Properties to set
     * @returns {UserLogin} UserLogin instance
     */
    UserLogin.create = function create(properties) {
        return new UserLogin(properties);
    };

    /**
     * Encodes the specified UserLogin message. Does not implicitly {@link UserLogin.verify|verify} messages.
     * @function encode
     * @memberof UserLogin
     * @static
     * @param {IUserLogin} message UserLogin message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UserLogin.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.uid);
        if (message.channel != null && Object.hasOwnProperty.call(message, "channel"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.channel);
        return writer;
    };

    /**
     * Encodes the specified UserLogin message, length delimited. Does not implicitly {@link UserLogin.verify|verify} messages.
     * @function encodeDelimited
     * @memberof UserLogin
     * @static
     * @param {IUserLogin} message UserLogin message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UserLogin.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a UserLogin message from the specified reader or buffer.
     * @function decode
     * @memberof UserLogin
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {UserLogin} UserLogin
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UserLogin.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.UserLogin();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.uid = reader.int32();
                    break;
                }
            case 2: {
                    message.channel = reader.int32();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a UserLogin message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof UserLogin
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {UserLogin} UserLogin
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UserLogin.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a UserLogin message.
     * @function verify
     * @memberof UserLogin
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    UserLogin.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.uid != null && message.hasOwnProperty("uid"))
            if (!$util.isInteger(message.uid))
                return "uid: integer expected";
        if (message.channel != null && message.hasOwnProperty("channel"))
            if (!$util.isInteger(message.channel))
                return "channel: integer expected";
        return null;
    };

    /**
     * Creates a UserLogin message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof UserLogin
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {UserLogin} UserLogin
     */
    UserLogin.fromObject = function fromObject(object) {
        if (object instanceof $root.UserLogin)
            return object;
        var message = new $root.UserLogin();
        if (object.uid != null)
            message.uid = object.uid | 0;
        if (object.channel != null)
            message.channel = object.channel | 0;
        return message;
    };

    /**
     * Creates a plain object from a UserLogin message. Also converts values to other types if specified.
     * @function toObject
     * @memberof UserLogin
     * @static
     * @param {UserLogin} message UserLogin
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    UserLogin.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults) {
            object.uid = 0;
            object.channel = 0;
        }
        if (message.uid != null && message.hasOwnProperty("uid"))
            object.uid = message.uid;
        if (message.channel != null && message.hasOwnProperty("channel"))
            object.channel = message.channel;
        return object;
    };

    /**
     * Converts this UserLogin to JSON.
     * @function toJSON
     * @memberof UserLogin
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    UserLogin.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for UserLogin
     * @function getTypeUrl
     * @memberof UserLogin
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    UserLogin.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/UserLogin";
    };

    return UserLogin;
})();

$root.HeartData = (function() {

    /**
     * Properties of a HeartData.
     * @exports IHeartData
     * @interface IHeartData
     * @property {number|null} [Data] HeartData Data
     */

    /**
     * Constructs a new HeartData.
     * @exports HeartData
     * @classdesc Represents a HeartData.
     * @implements IHeartData
     * @constructor
     * @param {IHeartData=} [properties] Properties to set
     */
    function HeartData(properties) {
        if (properties)
            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * HeartData Data.
     * @member {number} Data
     * @memberof HeartData
     * @instance
     */
    HeartData.prototype.Data = 0;

    /**
     * Creates a new HeartData instance using the specified properties.
     * @function create
     * @memberof HeartData
     * @static
     * @param {IHeartData=} [properties] Properties to set
     * @returns {HeartData} HeartData instance
     */
    HeartData.create = function create(properties) {
        return new HeartData(properties);
    };

    /**
     * Encodes the specified HeartData message. Does not implicitly {@link HeartData.verify|verify} messages.
     * @function encode
     * @memberof HeartData
     * @static
     * @param {IHeartData} message HeartData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    HeartData.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.Data != null && Object.hasOwnProperty.call(message, "Data"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.Data);
        return writer;
    };

    /**
     * Encodes the specified HeartData message, length delimited. Does not implicitly {@link HeartData.verify|verify} messages.
     * @function encodeDelimited
     * @memberof HeartData
     * @static
     * @param {IHeartData} message HeartData message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    HeartData.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a HeartData message from the specified reader or buffer.
     * @function decode
     * @memberof HeartData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {HeartData} HeartData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    HeartData.decode = function decode(reader, length) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        var end = length === undefined ? reader.len : reader.pos + length, message = new $root.HeartData();
        while (reader.pos < end) {
            var tag = reader.uint32();
            switch (tag >>> 3) {
            case 1: {
                    message.Data = reader.int32();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a HeartData message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof HeartData
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {HeartData} HeartData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    HeartData.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a HeartData message.
     * @function verify
     * @memberof HeartData
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    HeartData.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.Data != null && message.hasOwnProperty("Data"))
            if (!$util.isInteger(message.Data))
                return "Data: integer expected";
        return null;
    };

    /**
     * Creates a HeartData message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof HeartData
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {HeartData} HeartData
     */
    HeartData.fromObject = function fromObject(object) {
        if (object instanceof $root.HeartData)
            return object;
        var message = new $root.HeartData();
        if (object.Data != null)
            message.Data = object.Data | 0;
        return message;
    };

    /**
     * Creates a plain object from a HeartData message. Also converts values to other types if specified.
     * @function toObject
     * @memberof HeartData
     * @static
     * @param {HeartData} message HeartData
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    HeartData.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        var object = {};
        if (options.defaults)
            object.Data = 0;
        if (message.Data != null && message.hasOwnProperty("Data"))
            object.Data = message.Data;
        return object;
    };

    /**
     * Converts this HeartData to JSON.
     * @function toJSON
     * @memberof HeartData
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    HeartData.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for HeartData
     * @function getTypeUrl
     * @memberof HeartData
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    HeartData.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/HeartData";
    };

    return HeartData;
})();

module.exports = $root;
