import * as $protobuf from "protobufjs";
import Long = require("long");
/** Properties of a MSG2. */
export interface IMSG2 {

    /** MSG2 type */
    type?: (number|null);

    /** MSG2 msg */
    msg?: (string|null);
}

/** Represents a MSG2. */
export class MSG2 implements IMSG2 {

    /**
     * Constructs a new MSG2.
     * @param [properties] Properties to set
     */
    constructor(properties?: IMSG2);

    /** MSG2 type. */
    public type: number;

    /** MSG2 msg. */
    public msg: string;

    /**
     * Creates a new MSG2 instance using the specified properties.
     * @param [properties] Properties to set
     * @returns MSG2 instance
     */
    public static create(properties?: IMSG2): MSG2;

    /**
     * Encodes the specified MSG2 message. Does not implicitly {@link MSG2.verify|verify} messages.
     * @param message MSG2 message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IMSG2, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified MSG2 message, length delimited. Does not implicitly {@link MSG2.verify|verify} messages.
     * @param message MSG2 message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IMSG2, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a MSG2 message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns MSG2
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): MSG2;

    /**
     * Decodes a MSG2 message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns MSG2
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): MSG2;

    /**
     * Verifies a MSG2 message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a MSG2 message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns MSG2
     */
    public static fromObject(object: { [k: string]: any }): MSG2;

    /**
     * Creates a plain object from a MSG2 message. Also converts values to other types if specified.
     * @param message MSG2
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: MSG2, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this MSG2 to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for MSG2
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a UserLogin. */
export interface IUserLogin {

    /** UserLogin uid */
    uid?: (number|null);

    /** UserLogin channel */
    channel?: (number|null);
}

/** Represents a UserLogin. */
export class UserLogin implements IUserLogin {

    /**
     * Constructs a new UserLogin.
     * @param [properties] Properties to set
     */
    constructor(properties?: IUserLogin);

    /** UserLogin uid. */
    public uid: number;

    /** UserLogin channel. */
    public channel: number;

    /**
     * Creates a new UserLogin instance using the specified properties.
     * @param [properties] Properties to set
     * @returns UserLogin instance
     */
    public static create(properties?: IUserLogin): UserLogin;

    /**
     * Encodes the specified UserLogin message. Does not implicitly {@link UserLogin.verify|verify} messages.
     * @param message UserLogin message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IUserLogin, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified UserLogin message, length delimited. Does not implicitly {@link UserLogin.verify|verify} messages.
     * @param message UserLogin message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IUserLogin, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a UserLogin message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns UserLogin
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): UserLogin;

    /**
     * Decodes a UserLogin message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns UserLogin
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): UserLogin;

    /**
     * Verifies a UserLogin message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a UserLogin message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns UserLogin
     */
    public static fromObject(object: { [k: string]: any }): UserLogin;

    /**
     * Creates a plain object from a UserLogin message. Also converts values to other types if specified.
     * @param message UserLogin
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: UserLogin, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this UserLogin to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for UserLogin
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}

/** Properties of a HeartData. */
export interface IHeartData {

    /** HeartData Data */
    Data?: (number|null);
}

/** Represents a HeartData. */
export class HeartData implements IHeartData {

    /**
     * Constructs a new HeartData.
     * @param [properties] Properties to set
     */
    constructor(properties?: IHeartData);

    /** HeartData Data. */
    public Data: number;

    /**
     * Creates a new HeartData instance using the specified properties.
     * @param [properties] Properties to set
     * @returns HeartData instance
     */
    public static create(properties?: IHeartData): HeartData;

    /**
     * Encodes the specified HeartData message. Does not implicitly {@link HeartData.verify|verify} messages.
     * @param message HeartData message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IHeartData, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified HeartData message, length delimited. Does not implicitly {@link HeartData.verify|verify} messages.
     * @param message HeartData message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IHeartData, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a HeartData message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns HeartData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): HeartData;

    /**
     * Decodes a HeartData message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns HeartData
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): HeartData;

    /**
     * Verifies a HeartData message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a HeartData message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns HeartData
     */
    public static fromObject(object: { [k: string]: any }): HeartData;

    /**
     * Creates a plain object from a HeartData message. Also converts values to other types if specified.
     * @param message HeartData
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: HeartData, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this HeartData to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for HeartData
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
}
