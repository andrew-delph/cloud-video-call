// source: proto/rabbitmq.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global =
    (typeof globalThis !== 'undefined' && globalThis) ||
    (typeof window !== 'undefined' && window) ||
    (typeof global !== 'undefined' && global) ||
    (typeof self !== 'undefined' && self) ||
    (function () { return this; }).call(null) ||
    Function('return this')();

goog.exportSymbol('proto.rabbitmq.MatchMessage', null, global);
goog.exportSymbol('proto.rabbitmq.MatchmakerMessage', null, global);
goog.exportSymbol('proto.rabbitmq.ReadyMessage', null, global);
goog.exportSymbol('proto.rabbitmq.UserSocketMessage', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.rabbitmq.MatchmakerMessage = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.rabbitmq.MatchmakerMessage, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.rabbitmq.MatchmakerMessage.displayName = 'proto.rabbitmq.MatchmakerMessage';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.rabbitmq.ReadyMessage = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.rabbitmq.ReadyMessage, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.rabbitmq.ReadyMessage.displayName = 'proto.rabbitmq.ReadyMessage';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.rabbitmq.MatchMessage = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.rabbitmq.MatchMessage, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.rabbitmq.MatchMessage.displayName = 'proto.rabbitmq.MatchMessage';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.rabbitmq.UserSocketMessage = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.rabbitmq.UserSocketMessage, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.rabbitmq.UserSocketMessage.displayName = 'proto.rabbitmq.UserSocketMessage';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.rabbitmq.MatchmakerMessage.prototype.toObject = function(opt_includeInstance) {
  return proto.rabbitmq.MatchmakerMessage.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.rabbitmq.MatchmakerMessage} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rabbitmq.MatchmakerMessage.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    cooldownAttempts: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.rabbitmq.MatchmakerMessage}
 */
proto.rabbitmq.MatchmakerMessage.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.rabbitmq.MatchmakerMessage;
  return proto.rabbitmq.MatchmakerMessage.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.rabbitmq.MatchmakerMessage} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.rabbitmq.MatchmakerMessage}
 */
proto.rabbitmq.MatchmakerMessage.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setCooldownAttempts(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.rabbitmq.MatchmakerMessage.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.rabbitmq.MatchmakerMessage.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.rabbitmq.MatchmakerMessage} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rabbitmq.MatchmakerMessage.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getCooldownAttempts();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.rabbitmq.MatchmakerMessage.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.rabbitmq.MatchmakerMessage} returns this
 */
proto.rabbitmq.MatchmakerMessage.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int32 cooldown_attempts = 2;
 * @return {number}
 */
proto.rabbitmq.MatchmakerMessage.prototype.getCooldownAttempts = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.rabbitmq.MatchmakerMessage} returns this
 */
proto.rabbitmq.MatchmakerMessage.prototype.setCooldownAttempts = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.rabbitmq.ReadyMessage.prototype.toObject = function(opt_includeInstance) {
  return proto.rabbitmq.ReadyMessage.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.rabbitmq.ReadyMessage} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rabbitmq.ReadyMessage.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    priority: jspb.Message.getFloatingPointFieldWithDefault(msg, 2, 0.0),
    cooldownAttempts: jspb.Message.getFieldWithDefault(msg, 3, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.rabbitmq.ReadyMessage}
 */
proto.rabbitmq.ReadyMessage.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.rabbitmq.ReadyMessage;
  return proto.rabbitmq.ReadyMessage.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.rabbitmq.ReadyMessage} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.rabbitmq.ReadyMessage}
 */
proto.rabbitmq.ReadyMessage.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setPriority(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setCooldownAttempts(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.rabbitmq.ReadyMessage.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.rabbitmq.ReadyMessage.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.rabbitmq.ReadyMessage} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rabbitmq.ReadyMessage.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPriority();
  if (f !== 0.0) {
    writer.writeDouble(
      2,
      f
    );
  }
  f = message.getCooldownAttempts();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.rabbitmq.ReadyMessage.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.rabbitmq.ReadyMessage} returns this
 */
proto.rabbitmq.ReadyMessage.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional double priority = 2;
 * @return {number}
 */
proto.rabbitmq.ReadyMessage.prototype.getPriority = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 2, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.rabbitmq.ReadyMessage} returns this
 */
proto.rabbitmq.ReadyMessage.prototype.setPriority = function(value) {
  return jspb.Message.setProto3FloatField(this, 2, value);
};


/**
 * optional int32 cooldown_attempts = 3;
 * @return {number}
 */
proto.rabbitmq.ReadyMessage.prototype.getCooldownAttempts = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.rabbitmq.ReadyMessage} returns this
 */
proto.rabbitmq.ReadyMessage.prototype.setCooldownAttempts = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.rabbitmq.MatchMessage.prototype.toObject = function(opt_includeInstance) {
  return proto.rabbitmq.MatchMessage.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.rabbitmq.MatchMessage} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rabbitmq.MatchMessage.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId1: jspb.Message.getFieldWithDefault(msg, 1, ""),
    userId2: jspb.Message.getFieldWithDefault(msg, 2, ""),
    score: jspb.Message.getFloatingPointFieldWithDefault(msg, 3, 0.0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.rabbitmq.MatchMessage}
 */
proto.rabbitmq.MatchMessage.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.rabbitmq.MatchMessage;
  return proto.rabbitmq.MatchMessage.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.rabbitmq.MatchMessage} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.rabbitmq.MatchMessage}
 */
proto.rabbitmq.MatchMessage.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId1(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId2(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readDouble());
      msg.setScore(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.rabbitmq.MatchMessage.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.rabbitmq.MatchMessage.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.rabbitmq.MatchMessage} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rabbitmq.MatchMessage.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId1();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getUserId2();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getScore();
  if (f !== 0.0) {
    writer.writeDouble(
      3,
      f
    );
  }
};


/**
 * optional string user_id1 = 1;
 * @return {string}
 */
proto.rabbitmq.MatchMessage.prototype.getUserId1 = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.rabbitmq.MatchMessage} returns this
 */
proto.rabbitmq.MatchMessage.prototype.setUserId1 = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string user_id2 = 2;
 * @return {string}
 */
proto.rabbitmq.MatchMessage.prototype.getUserId2 = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.rabbitmq.MatchMessage} returns this
 */
proto.rabbitmq.MatchMessage.prototype.setUserId2 = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional double score = 3;
 * @return {number}
 */
proto.rabbitmq.MatchMessage.prototype.getScore = function() {
  return /** @type {number} */ (jspb.Message.getFloatingPointFieldWithDefault(this, 3, 0.0));
};


/**
 * @param {number} value
 * @return {!proto.rabbitmq.MatchMessage} returns this
 */
proto.rabbitmq.MatchMessage.prototype.setScore = function(value) {
  return jspb.Message.setProto3FloatField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.rabbitmq.UserSocketMessage.prototype.toObject = function(opt_includeInstance) {
  return proto.rabbitmq.UserSocketMessage.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.rabbitmq.UserSocketMessage} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rabbitmq.UserSocketMessage.toObject = function(includeInstance, msg) {
  var f, obj = {
    userId: jspb.Message.getFieldWithDefault(msg, 1, ""),
    eventName: jspb.Message.getFieldWithDefault(msg, 2, ""),
    jsonData: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.rabbitmq.UserSocketMessage}
 */
proto.rabbitmq.UserSocketMessage.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.rabbitmq.UserSocketMessage;
  return proto.rabbitmq.UserSocketMessage.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.rabbitmq.UserSocketMessage} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.rabbitmq.UserSocketMessage}
 */
proto.rabbitmq.UserSocketMessage.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setEventName(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setJsonData(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.rabbitmq.UserSocketMessage.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.rabbitmq.UserSocketMessage.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.rabbitmq.UserSocketMessage} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.rabbitmq.UserSocketMessage.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getEventName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getJsonData();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string user_id = 1;
 * @return {string}
 */
proto.rabbitmq.UserSocketMessage.prototype.getUserId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.rabbitmq.UserSocketMessage} returns this
 */
proto.rabbitmq.UserSocketMessage.prototype.setUserId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string event_name = 2;
 * @return {string}
 */
proto.rabbitmq.UserSocketMessage.prototype.getEventName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.rabbitmq.UserSocketMessage} returns this
 */
proto.rabbitmq.UserSocketMessage.prototype.setEventName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string json_data = 3;
 * @return {string}
 */
proto.rabbitmq.UserSocketMessage.prototype.getJsonData = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.rabbitmq.UserSocketMessage} returns this
 */
proto.rabbitmq.UserSocketMessage.prototype.setJsonData = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


goog.object.extend(exports, proto.rabbitmq);
